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
        // Set heading row formatter to return original values
        HeadingRowFormatter::default('none');
        
        // Read the CSV file
        $collection = Excel::toCollection(new CsvImport(), $file)->first();
        
        if ($collection->isEmpty()) {
            throw new \Exception('The CSV file appears to be empty or invalid.');
        }
        
        // Get headers from first row
        $headers = $collection->first()->toArray();
        
        // Get data rows (excluding header) and convert each row to array
        $dataRows = $collection->skip(1)->take($previewRows - 1)->map(function ($row) {
            return $row->toArray();
        })->values()->toArray(); // Add values() to reset array keys
        
        // Detect potential date formats in the data
        $dateFormats = $this->detectDateFormats($dataRows, $headers);
        
        return [
            'headers' => $headers,
            'rows' => $dataRows,
            'total_rows' => $collection->count() - 1, // Exclude header
            'detected_date_formats' => $dateFormats,
        ];
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
        // Set heading row formatter to return original values
        HeadingRowFormatter::default('none');
        
        // Read the CSV file
        $collection = Excel::toCollection(new CsvImport(), $file)->first();
        
        if ($collection->isEmpty()) {
            throw new \Exception('The CSV file appears to be empty or invalid.');
        }
        
        // Get headers
        $headers = $collection->first()->toArray();
        
        // Skip to transaction data start row
        $dataStartIndex = $schemaConfig['transaction_data_start'] - 1; // Convert to 0-based index
        $dataRows = $collection->skip($dataStartIndex);
        
        // Map columns according to schema
        return $dataRows->map(function ($row) use ($headers, $schemaConfig) {
            $rowArray = $row->toArray();
            return $this->mapRowToSchema($rowArray, $headers, $schemaConfig);
        })->filter(); // Remove empty rows
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
        // Skip empty rows
        if (empty(array_filter($row))) {
            return null;
        }
        
        $mapped = [];
        
        // Map required fields
        $mapped['date'] = $this->getColumnValue($row, $headers, $schema['date_column']);
        $mapped['balance'] = $this->getColumnValue($row, $headers, $schema['balance_column']);
        
        // Map amount fields
        if (!empty($schema['amount_column'])) {
            $mapped['amount'] = $this->getColumnValue($row, $headers, $schema['amount_column']);
        } else {
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
        
        // Map optional fields
        if (!empty($schema['description_column'])) {
            $mapped['description'] = $this->getColumnValue($row, $headers, $schema['description_column']);
        }
        
        return $mapped;
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
        $dateFormats = [
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

        $detectedFormats = [];

        // Look through first few rows to detect date patterns
        foreach (array_slice($csvData, 0, 5) as $row) {
            foreach ($row as $cell) {
                if (empty($cell)) continue;
                
                foreach ($dateFormats as $format => $description) {
                    if ($this->isValidDateFormat((string) $cell, $format)) {
                        $formatKey = $format;
                        if (!isset($detectedFormats[$formatKey])) {
                            $detectedFormats[$formatKey] = [
                                'format' => $format,
                                'description' => $description,
                                'example' => $cell,
                            ];
                        }
                    }
                }
            }
        }

        return array_values($detectedFormats);
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