<?php

namespace App\Http\Controllers;

use App\Http\Requests\PreviewCsvSchemaRequest;
use App\Http\Requests\StoreCsvSchemaRequest;
use App\Http\Requests\UpdateCsvSchemaRequest;
use App\Models\CsvSchema;
use App\Services\CsvReaderService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use Inertia\Inertia;
use Inertia\Response;
use App\Models\User;

class CsvSchemaController extends Controller
{
    use AuthorizesRequests;

    public function __construct(
        private CsvReaderService $csvReaderService
    ) {}

    /**
     * Display a listing of the user's CSV schemas.
     */
    public function index(): Response
    {
        /** @var User $user */
        $user = Auth::user();

        $schemas = $user->csvSchemas()->latest()->get();

        return Inertia::render('csv-schemas/index', [
            'schemas' => $schemas,
        ]);
    }

    /**
     * Show the form for creating a new CSV schema.
     */
    public function create(): Response
    {
        $this->authorize('create', CsvSchema::class);
        return Inertia::render('csv-schemas/create');
    }

    /**
     * Preview CSV file and return parsed data for column mapping.
     */
    public function preview(PreviewCsvSchemaRequest $request)
    {
        $this->authorize('create', CsvSchema::class);
        try {
            $file = $request->file('csv_file');
            $previewData = $this->csvReaderService->parseForPreview($file, 20);

            return Inertia::render('csv-schemas/create', [
                'preview' => $previewData,
            ]);
        } catch (\Exception $e) {
            return back()->withErrors([
                'csv_file' => 'Error reading CSV file: ' . $e->getMessage(),
            ]);
        }
    }

    /**
     * Store a newly created CSV schema.
     */
    public function store(StoreCsvSchemaRequest $request)
    {
        $this->authorize('create', CsvSchema::class);
        $validated = $request->validated();

        /** @var User $user */
        $user = Auth::user();
        $schema = $user->csvSchemas()->create($validated);

        try {
            $schema->validateSchema();
        } catch (ValidationException $e) {
            $schema->delete();
            throw $e;
        }

        return redirect()->route('csv-schemas.index')
            ->with('success', 'CSV schema created successfully.');
    }

    /**
     * Display the specified CSV schema.
     */
    public function show(CsvSchema $csvSchema): Response
    {
        $this->authorize('view', $csvSchema);

        return Inertia::render('csv-schemas/show', [
            'schema' => $csvSchema,
        ]);
    }

    /**
     * Show the form for editing the specified CSV schema.
     */
    public function edit(CsvSchema $csvSchema): Response
    {
        $this->authorize('update', $csvSchema);

        $availableColumns = [];
        for ($i = 1; $i <= 20; $i++) {
            $availableColumns[$i] = "Column $i";
        }

        $availableDateFormats = $this->csvReaderService->getSupportedDateFormats();

        return Inertia::render('csv-schemas/edit', [
            'schema' => $csvSchema,
            'available_columns' => $availableColumns,
            'available_date_formats' => array_keys($availableDateFormats),
        ]);
    }

    /**
     * Update the specified CSV schema.
     */
    public function update(UpdateCsvSchemaRequest $request, CsvSchema $csvSchema)
    {
        $this->authorize('update', $csvSchema);

        $validated = $request->validated();
        $csvSchema->update($validated);
        $csvSchema->validateSchema();

        return redirect()->route('csv-schemas.show', $csvSchema)
            ->with('success', 'CSV schema updated successfully.');
    }

    /**
     * Remove the specified CSV schema.
     */
    public function destroy(CsvSchema $csvSchema)
    {
        $this->authorize('delete', $csvSchema);

        $csvSchema->delete();

        return redirect()->route('csv-schemas.index')
            ->with('success', 'CSV schema deleted successfully.');
    }

    /**
     * Clone the specified CSV schema.
     */
    public function clone(CsvSchema $csvSchema)
    {
        $this->authorize('view', $csvSchema);

        $baseName = $csvSchema->name . ' (copy)';
        $uniqueName = $baseName;
        $counter = 1;

        /** @var User $user */
        $user = Auth::user();

        while ($user->csvSchemas()->where('name', $uniqueName)->exists()) {
            $counter++;
            $uniqueName = $csvSchema->name . ' (copy ' . $counter . ')';
        }

        $clonedSchema = $user->csvSchemas()->create([
            'name' => $uniqueName,
            'transaction_data_start' => $csvSchema->transaction_data_start,
            'date_column' => $csvSchema->date_column,
            'balance_column' => $csvSchema->balance_column,
            'amount_column' => $csvSchema->amount_column,
            'paid_in_column' => $csvSchema->paid_in_column,
            'paid_out_column' => $csvSchema->paid_out_column,
            'description_column' => $csvSchema->description_column,
            'date_format' => $csvSchema->date_format,
        ]);

        return redirect()->route('csv-schemas.show', $clonedSchema)
            ->with('success', 'CSV schema cloned successfully.');
    }
}
