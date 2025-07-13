<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Maatwebsite\Excel\Facades\Excel;
use Maatwebsite\Excel\HeadingRow;
use Maatwebsite\Excel\Imports\HeadingRowFormatter;
use PhpOffice\PhpSpreadsheet\Shared\Date;
use Illuminate\Support\Collection;

class CsvReaderService
{
    /**
     * Parse a CSV file and return preview data.
     *
     * @param UploadedFile $file
     * @param int $previewRows Maximum number of rows to return for preview
     * @return array
     */
    public function parseForPreview(UploadedFile $file, int $previewRows = 20): array
    {
        HeadingRowFormatter::default('none');

        try {
            $collection = $this->parseWithExcel($file);
        } catch (\Exception $e) {
            // If Excel fails, try manual CSV parsing with encoding detection
            return $this->fallbackCsvParsing($file, $previewRows);
        }

        if ($collection->isEmpty()) {
            throw new \Exception('The CSV file appears to be empty or invalid.');
        }

        $headers = $this->extractHeaders($collection);
        $dataRows = $this->extractDataRows($collection, $previewRows);
        $dateFormats = $this->detectDateFormats($dataRows, $headers);

        return $this->buildPreviewResult($headers, $dataRows, $collection, $dateFormats);
    }

    /**
     * Parse a full CSV file using a schema configuration.
     *
     * @param UploadedFile $file
     * @param array $schemaConfig
     * @return Collection
     */
    public function parseWithSchema(UploadedFile $file, array $schemaConfig): Collection
    {
        HeadingRowFormatter::default('none');

        $collection = $this->parseWithExcel($file);

        if ($collection->isEmpty()) {
            throw new \Exception('The CSV file appears to be empty or invalid.');
        }

        $headers = $this->extractRawHeaders($collection);
        $dataRows = $this->extractSchemaDataRows($collection, $schemaConfig);

        return $this->processSchemaRows($dataRows, $headers, $schemaConfig);
    }

    /**
     * Map a single CSV row to schema fields.
     *
     * @param array $row
     * @param array $headers
     * @param array $schema
     * @return array|null
     */
    private function mapRowToSchema(array $row, array $headers, array $schema): ?array
    {
        if ($this->isEmptyRow($row)) {
            return null;
        }

        $mapped = [];

        $mapped['date'] = $this->getColumnValue($row, $headers, $schema['date_column']);
        $mapped['balance'] = $this->getColumnValue($row, $headers, $schema['balance_column']);

        $this->mapAmountFields($mapped, $row, $headers, $schema);
        $this->mapOptionalFields($mapped, $row, $headers, $schema);

        return $mapped;
    }

    /**
     * Check if a row is empty.
     */
    private function isEmptyRow(array $row): bool
    {
        return empty(array_filter($row));
    }

    /**
     * Map amount fields based on schema configuration.
     */
    private function mapAmountFields(array &$mapped, array $row, array $headers, array $schema): void
    {
        if (!empty($schema['amount_column'])) {
            $mapped['amount'] = $this->getColumnValue($row, $headers, $schema['amount_column']);
        } else {
            $this->mapSeparateAmountFields($mapped, $row, $headers, $schema);
        }
    }

    /**
     * Map separate paid_in/paid_out fields.
     */
    private function mapSeparateAmountFields(array &$mapped, array $row, array $headers, array $schema): void
    {
        if (!empty($schema['paid_in_column'])) {
            $paidInValue = $this->getColumnValue($row, $headers, $schema['paid_in_column']);
            if (!empty($paidInValue)) {
                $mapped['paid_in'] = $paidInValue;
            }
        }

        if (!empty($schema['paid_out_column'])) {
            $paidOutValue = $this->getColumnValue($row, $headers, $schema['paid_out_column']);
            if (!empty($paidOutValue)) {
                $mapped['paid_out'] = $paidOutValue;
            }
        }
    }

    /**
     * Map optional fields like description.
     */
    private function mapOptionalFields(array &$mapped, array $row, array $headers, array $schema): void
    {
        if (!empty($schema['description_column'])) {
            $mapped['description'] = $this->getColumnValue($row, $headers, $schema['description_column']);
        }
    }

    /**
     * Get column value by column number (1-indexed).
     *
     * @param array $row
     * @param array $headers
     * @param int $columnNumber 1-indexed column number
     * @return string|null
     */
    private function getColumnValue(array $row, array $headers, int $columnNumber): ?string
    {
        // Convert to 0-based index
        $index = $columnNumber - 1;

        if (isset($row[$index])) {
            return (string) $row[$index];
        }

        return null;
    }

    /**
     * Detect potential date formats in CSV data.
     *
     * @param array $csvData
     * @param array $headers
     * @return array
     */
    private function detectDateFormats(array $csvData, array $headers): array
    {
        $dateFormats = $this->getSupportedDateFormats();
        $detectedFormats = [];

        $this->analyzeDateFormats($csvData, $dateFormats, $detectedFormats);

        return array_values($detectedFormats);
    }

    /**
     * Get supported date formats with descriptions.
     */
    private function getSupportedDateFormats(): array
    {
        return [
            'Y-m-d' => 'YYYY-MM-DD (2024-01-15)',
            'd/m/Y' => 'DD/MM/YYYY (15/01/2024)',
            'm/d/Y' => 'MM/DD/YYYY (01/15/2024)',
            'd-m-Y' => 'DD-MM-YYYY (15-01-2024)',
            'm-d-Y' => 'MM-DD-YYYY (01-15-2024)',
            'Y/m/d' => 'YYYY/MM/DD (2024/01/15)',
            'd.m.Y' => 'DD.MM.YYYY (15.01.2024)',
            'j/n/Y' => 'D/M/YYYY (5/1/2024)',
            'j-n-Y' => 'D-M-YYYY (5-1-2024)',
        ];
    }

    /**
     * Analyze CSV data for date formats.
     */
    private function analyzeDateFormats(array $csvData, array $dateFormats, array &$detectedFormats): void
    {
        $sampleRows = array_slice($csvData, 0, 5);

        foreach ($sampleRows as $row) {
            $this->analyzeRowForDateFormats($row, $dateFormats, $detectedFormats);
        }
    }

    /**
     * Analyze a single row for date formats.
     */
    private function analyzeRowForDateFormats(array $row, array $dateFormats, array &$detectedFormats): void
    {
        foreach ($row as $cell) {
            if (empty($cell)) continue;

            $this->checkCellForDateFormats($cell, $dateFormats, $detectedFormats);
        }
    }

    /**
     * Check a single cell for date formats.
     */
    private function checkCellForDateFormats(string $cell, array $dateFormats, array &$detectedFormats): void
    {
        foreach ($dateFormats as $format => $description) {
            if ($this->isValidDateFormat((string) $cell, $format)) {
                $this->addDetectedFormat($format, $description, $cell, $detectedFormats);
            }
        }
    }

    /**
     * Add a detected date format to the results.
     */
    private function addDetectedFormat(string $format, string $description, string $cell, array &$detectedFormats): void
    {
        if (!isset($detectedFormats[$format])) {
            $detectedFormats[$format] = [
                'format' => $format,
                'description' => $description,
                'example' => $cell,
            ];
        }
    }

    /**
     * Check if a string matches a specific date format.
     *
     * @param string $dateString
     * @param string $format
     * @return bool
     */
    private function isValidDateFormat(string $dateString, string $format): bool
    {
        $dateString = trim($dateString);
        if (empty($dateString)) {
            return false;
        }

        $date = \DateTime::createFromFormat($format, $dateString);
        return $date && $date->format($format) === $dateString;
    }

    /**
     * Fallback CSV parsing with manual encoding detection.
     */
    private function fallbackCsvParsing(UploadedFile $file, int $previewRows): array
    {
        $fileContent = $this->prepareFileContent($file);
        $tempFile = $this->createTempFile($fileContent);

        $result = $this->parseCsvFile($tempFile, $previewRows);

        fclose($tempFile);

        return $result;
    }

    /**
     * Prepare file content with proper encoding.
     */
    private function prepareFileContent(UploadedFile $file): string
    {
        $fileContent = file_get_contents($file->getPathname());

        if (empty(trim($fileContent))) {
            throw new \Exception('The CSV file appears to be empty or invalid.');
        }

        return $this->convertToUtf8($fileContent);
    }

    /**
     * Convert file content to UTF-8 encoding.
     */
    private function convertToUtf8(string $fileContent): string
    {
        $encoding = mb_detect_encoding($fileContent, ['UTF-8', 'UTF-16', 'Windows-1252', 'ISO-8859-1'], true);

        if ($encoding && $encoding !== 'UTF-8') {
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', $encoding);
        } elseif (!$encoding) {
            // If encoding detection fails, try to convert from common encodings
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', 'Windows-1252');
        }

        return $fileContent;
    }

    /**
     * Create a temporary file for processing.
     */
    private function createTempFile(string $fileContent)
    {
        $tempFile = tmpfile();
        fwrite($tempFile, $fileContent);
        rewind($tempFile);
        return $tempFile;
    }

    /**
     * Parse CSV file and return results.
     */
    private function parseCsvFile($tempFile, int $previewRows): array
    {
        $headers = [];
        $rows = [];
        $rowCount = 0;
        $totalRows = $this->countTotalRows($tempFile, $previewRows, $rowCount, $headers, $rows);

        $this->validateParsedData($headers, $rows);

        return $this->buildFallbackResult($headers, $rows, $totalRows);
    }

    /**
     * Count total rows and extract preview data.
     */
    private function countTotalRows($tempFile, int $previewRows, int &$rowCount, array &$headers, array &$rows): int
    {
        $totalRows = 0;

        while (($row = fgetcsv($tempFile)) !== false && $rowCount < $previewRows) {
            $cleanRow = array_map([$this, 'cleanCell'], $row);

            if ($rowCount === 0) {
                $headers = $cleanRow;
            } else {
                $rows[] = $cleanRow;
            }
            $rowCount++;
            $totalRows++;
        }

        // Count remaining rows
        while (fgetcsv($tempFile) !== false) {
            $totalRows++;
        }

        return $totalRows;
    }

    /**
     * Validate that we actually got data from the CSV.
     */
    private function validateParsedData(array $headers, array $rows): void
    {
        if (empty($headers) && empty($rows)) {
            throw new \Exception('The CSV file appears to be empty or invalid.');
        }
    }

    /**
     * Build fallback parsing result.
     */
    private function buildFallbackResult(array $headers, array $rows, int $totalRows): array
    {
        return [
            'headers' => $headers,
            'rows' => $rows,
            'total_rows' => $totalRows - 1, // Exclude header
            'detected_date_formats' => $this->detectDateFormats($rows, $headers),
        ];
    }

    /**
     * Clean a CSV cell value to ensure proper UTF-8 encoding.
     */
    private function cleanCell(string $cell): string
    {
        // Remove BOM if present
        $cell = preg_replace('/^\x{FEFF}/u', '', $cell);

        // Ensure valid UTF-8
        $cell = mb_convert_encoding($cell, 'UTF-8', 'UTF-8');

        // Remove any null bytes
        $cell = str_replace("\0", '', $cell);

        return trim($cell);
    }

    /**
     * Parse file using Excel library.
     */
    private function parseWithExcel(UploadedFile $file): \Illuminate\Support\Collection
    {
        return Excel::toCollection(new CsvImport(), $file)->first();
    }

    /**
     * Extract headers from collection.
     */
    private function extractHeaders(\Illuminate\Support\Collection $collection): array
    {
        return $collection->first()->map(function ($cell) {
            return $this->cleanCell((string) $cell);
        })->toArray();
    }

    /**
     * Extract data rows from collection.
     */
    private function extractDataRows(\Illuminate\Support\Collection $collection, int $previewRows): array
    {
        return $collection->skip(1)->take($previewRows - 1)->map(function ($row) {
            return $row->map(function ($cell) {
                return $this->cleanCell((string) $cell);
            })->toArray();
        })->values()->toArray();
    }

    /**
     * Build preview result array.
     */
    private function buildPreviewResult(array $headers, array $dataRows, \Illuminate\Support\Collection $collection, array $dateFormats): array
    {
        return [
            'headers' => $headers,
            'rows' => $dataRows,
            'total_rows' => $collection->count() - 1, // Exclude header
            'detected_date_formats' => $dateFormats,
        ];
    }

    /**
     * Extract raw headers from collection.
     */
    private function extractRawHeaders(\Illuminate\Support\Collection $collection): array
    {
        return $collection->first()->toArray();
    }

    /**
     * Extract data rows based on schema configuration.
     */
    private function extractSchemaDataRows(\Illuminate\Support\Collection $collection, array $schemaConfig): \Illuminate\Support\Collection
    {
        $dataStartIndex = $schemaConfig['transaction_data_start'] - 1;
        return $collection->skip($dataStartIndex);
    }

    /**
     * Process rows according to schema configuration.
     */
    private function processSchemaRows(\Illuminate\Support\Collection $dataRows, array $headers, array $schemaConfig): Collection
    {
        return $dataRows->map(function ($row) use ($headers, $schemaConfig) {
            $rowArray = $row->toArray();
            return $this->mapRowToSchema($rowArray, $headers, $schemaConfig);
        })->filter(); // Remove empty rows
    }
}

/**
 * Simple import class for Laravel Excel
 */
class CsvImport implements \Maatwebsite\Excel\Concerns\ToCollection
{
    public function collection(\Illuminate\Support\Collection $collection)
    {
        return $collection;
    }
}
