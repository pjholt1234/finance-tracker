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
        $schemas = Auth::user()->csvSchemas()->latest()->get();

        return Inertia::render('csv-schemas/index', [
            'schemas' => $schemas,
        ]);
    }

    /**
     * Show the form for creating a new CSV schema.
     */
    public function create(): Response
    {
        return Inertia::render('csv-schemas/create');
    }

    /**
     * Preview CSV file and return parsed data for column mapping.
     */
    public function preview(PreviewCsvSchemaRequest $request)
    {
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
        $validated = $request->validated();

        $schema = Auth::user()->csvSchemas()->create($validated);

        // Validate the schema configuration
        try {
            $schema->validateSchema();
        } catch (ValidationException $e) {
            $schema->delete(); // Clean up if validation fails
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

        // Generate available columns (1-indexed to match our database schema)
        $availableColumns = [];
        for ($i = 1; $i <= 20; $i++) {
            $availableColumns[$i] = "Column $i";
        }

        // Available date formats
        $availableDateFormats = [
            'Y-m-d' => 'YYYY-MM-DD (2024-01-15)',
            'd/m/Y' => 'DD/MM/YYYY (15/01/2024)',
            'm/d/Y' => 'MM/DD/YYYY (01/15/2024)',
            'd-m-Y' => 'DD-MM-YYYY (15-01-2024)',
            'm-d-Y' => 'MM-DD-YYYY (01-15-2024)',
            'Y/m/d' => 'YYYY/MM/DD (2024/01/15)',
            'd.m.Y' => 'DD.MM.YYYY (15.01.2024)',
        ];

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

        // Validate the schema configuration
        try {
            $csvSchema->validateSchema();
        } catch (ValidationException $e) {
            throw $e;
        }

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

        // Generate a unique name for the cloned schema
        $baseName = $csvSchema->name . ' (copy)';
        $uniqueName = $baseName;
        $counter = 1;

        // Check if the name already exists and increment counter if needed
        while (Auth::user()->csvSchemas()->where('name', $uniqueName)->exists()) {
            $counter++;
            $uniqueName = $csvSchema->name . ' (copy ' . $counter . ')';
        }

        // Create a new schema with copied data
        $clonedSchema = Auth::user()->csvSchemas()->create([
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
