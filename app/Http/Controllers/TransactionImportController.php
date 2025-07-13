<?php

namespace App\Http\Controllers;

use App\Http\Requests\FinalizeTransactionImportRequest;
use App\Http\Requests\StoreTransactionImportRequest;
use App\Models\CsvSchema;
use App\Models\Import;
use App\Services\CsvImportService;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class TransactionImportController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private CsvImportService $csvImportService
    ) {}

    /**
     * Show the import form.
     */
    public function create(): Response
    {
        $this->authorize('create', Import::class);

        /** @var User $user */
        $user = Auth::user();
        $schemas = $user->csvSchemas()->latest()->get();
        $accounts = $user->accounts()->orderBy('name')->get();

        return Inertia::render('transactions/import', [
            'schemas' => $schemas,
            'accounts' => $accounts,
        ]);
    }

    /**
     * Store a new import.
     */
    public function store(StoreTransactionImportRequest $request)
    {
        $this->authorize('create', Import::class);
        $schema = CsvSchema::findOrFail($request->csv_schema_id);
        $this->authorize('view', $schema);

        /** @var User $user */
        $user = Auth::user();
        $account = $user->accounts()->findOrFail($request->account_id);

        $file = $request->file('csv_file');

        try {
            $preview = $this->csvImportService->previewTransactions(
                $file,
                $schema,
                Auth::id()
            );

            $filename = $file->getClientOriginalName();

            return Inertia::render('transactions/import-review', [
                'preview' => $preview,
                'schema' => $schema,
                'account' => $account,
                'filename' => $filename,
                'file_content' => base64_encode(file_get_contents($file->getRealPath())),
            ]);
        } catch (\InvalidArgumentException $e) {
            if (str_contains($e->getMessage(), 'UTF-8') || str_contains($e->getMessage(), 'encoding')) {
                return back()->withErrors([
                    'csv_file' => 'The CSV file contains invalid characters or encoding. Please save your CSV file as UTF-8 encoded or try converting it to a different format.'
                ])->withInput();
            }

            return back()->withErrors([
                'csv_file' => 'Invalid CSV file format: ' . $e->getMessage()
            ])->withInput();
        } catch (\Exception $e) {
            Log::error('CSV Preview failed', [
                'user_id' => Auth::id(),
                'schema_id' => $schema->id,
                'account_id' => $account->id,
                'filename' => $file->getClientOriginalName(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'csv_file' => 'Failed to preview CSV file. Please check the file format and try again.'
            ])->withInput();
        }
    }

    /**
     * Finalize the import after review.
     */
    public function finalize(FinalizeTransactionImportRequest $request)
    {
        $this->authorize('create', Import::class);
        $transactions = json_decode($request->transactions, true);

        $schema = CsvSchema::findOrFail($request->schema_id);
        $this->authorize('view', $schema);

        /** @var User $user */
        $user = Auth::user();
        $account = $user->accounts()->findOrFail($request->account_id);

        try {
            $import = $this->csvImportService->importReviewedTransactions(
                $transactions,
                $schema,
                $request->filename,
                Auth::id(),
                $account->id
            );

            return redirect()->route('transaction-imports.show', $import)
                ->with('success', 'Transactions imported successfully.');
        } catch (\Exception $e) {
            Log::error('CSV Import finalization failed', [
                'user_id' => Auth::id(),
                'schema_id' => $schema->id,
                'account_id' => $account->id,
                'filename' => $request->filename,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return back()->withErrors([
                'transactions' => 'Failed to import transactions. Please try again.'
            ]);
        }
    }

    /**
     * Show import results.
     */
    public function show(Import $import): Response
    {
        $this->authorize('view', $import);

        $import->load(['csvSchema', 'account', 'transactions' => function ($query) {
            $query->latest()->limit(10);
        }]);

        $stats = $this->csvImportService->getImportStats($import);

        return Inertia::render('transactions/import-results', [
            'import' => $import,
            'stats' => $stats,
        ]);
    }

    /**
     * List import history.
     */
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $imports = $user->imports()
            ->with(['csvSchema', 'account'])
            ->latest()
            ->paginate(20);

        return Inertia::render('transactions/import-history', [
            'imports' => $imports,
        ]);
    }

    /**
     * Delete an import and all its transactions.
     */
    public function destroy(Import $import)
    {
        $this->authorize('delete', $import);

        $import->transactions()->delete();
        $import->delete();

        return redirect()->route('transaction-imports.index')
            ->with('success', 'Import and all associated transactions have been deleted.');
    }
}
