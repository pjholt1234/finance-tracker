<?php

namespace App\Http\Controllers;

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
        $schemas = Auth::user()->csvSchemas()->latest()->get();

        return Inertia::render('transactions/import', [
            'schemas' => $schemas,
        ]);
    }

    /**
     * Store a new import.
     */
    public function store(Request $request)
    {
        $request->validate([
            'csv_file' => 'required|file|mimes:csv,txt|max:10240', // 10MB max
            'csv_schema_id' => 'required|exists:csv_schemas,id',
        ]);

        $schema = CsvSchema::findOrFail($request->csv_schema_id);
        $this->authorize('view', $schema);

        $file = $request->file('csv_file');

        try {
            // Preview transactions instead of importing directly
            $preview = $this->csvImportService->previewTransactions(
                $file,
                $schema,
                Auth::id()
            );

            // Store file temporarily for the review process
            $filename = $file->getClientOriginalName();
            $tempPath = $file->store('temp-imports', 'local');

            return Inertia::render('transactions/import-review', [
                'preview' => $preview,
                'schema' => $schema,
                'filename' => $filename,
                'temp_path' => $tempPath,
                'tags' => Auth::user()->tags()->orderBy('name')->get(),
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
    public function finalize(Request $request)
    {
        $request->validate([
            'transactions' => 'required|string',
            'schema_id' => 'required|exists:csv_schemas,id',
            'filename' => 'required|string',
            'temp_path' => 'required|string',
        ]);

        // Decode the JSON transactions data
        $transactions = json_decode($request->transactions, true);

        if (!$transactions || !is_array($transactions)) {
            return back()->withErrors(['transactions' => 'Invalid transactions data.']);
        }

        // Validate each transaction
        foreach ($transactions as $index => $transaction) {
            if (!isset($transaction['status']) || !in_array($transaction['status'], ['approved', 'discarded', 'pending', 'duplicate'])) {
                return back()->withErrors(['transactions' => "Invalid status for transaction {$index}."]);
            }

            if (!empty($transaction['tags'])) {
                foreach ($transaction['tags'] as $tag) {
                    if (!isset($tag['id']) || !is_numeric($tag['id'])) {
                        return back()->withErrors(['transactions' => "Invalid tag for transaction {$index}."]);
                    }
                }
            }
        }

        $schema = CsvSchema::findOrFail($request->schema_id);
        $this->authorize('view', $schema);

        // Verify all tags belong to the user
        $userTagIds = Auth::user()->tags()->pluck('id')->toArray();
        foreach ($transactions as $transaction) {
            if (!empty($transaction['tags'])) {
                foreach ($transaction['tags'] as $tag) {
                    if (!in_array($tag['id'], $userTagIds)) {
                        return back()->withErrors(['transactions' => 'Invalid tag selected.']);
                    }
                }
            }
        }

        try {
            $import = $this->csvImportService->importReviewedTransactions(
                $transactions,
                $schema,
                Auth::id(),
                $request->filename
            );

            // Clean up temporary file
            Storage::disk('local')->delete($request->temp_path);

            return redirect()->route('transaction-imports.show', $import)
                ->with('success', 'Transactions imported successfully.');
        } catch (\Exception $e) {
            Log::error('CSV Import finalization failed', [
                'user_id' => Auth::id(),
                'schema_id' => $schema->id,
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
        // Verify ownership
        if ($import->user_id !== Auth::id()) {
            abort(403);
        }

        $import->load(['csvSchema', 'transactions' => function ($query) {
            $query->latest()->limit(10); // Show latest 10 transactions as preview
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
        $imports = Auth::user()->imports()
            ->with('csvSchema')
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
        // Verify ownership
        if ($import->user_id !== Auth::id()) {
            abort(403);
        }

        // Delete all transactions from this import
        $import->transactions()->delete();

        // Delete the import record
        $import->delete();

        return redirect()->route('transaction-imports.index')
            ->with('success', 'Import and all associated transactions have been deleted.');
    }
}
