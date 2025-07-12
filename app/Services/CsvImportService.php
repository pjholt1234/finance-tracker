<?php

namespace App\Services;

use App\Models\CsvSchema;
use App\Models\Import;
use App\Models\Transaction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CsvImportService
{
    /**
     * Import transactions from a CSV file using the specified schema.
     */
    public function importFromCsv(UploadedFile $file, CsvSchema $schema, int $userId): Import
    {
        // Create import record
        $import = Import::create([
            'user_id' => $userId,
            'csv_schema_id' => $schema->id,
            'filename' => $file->getClientOriginalName(),
            'status' => Import::STATUS_PENDING,
        ]);

        try {
            // Mark import as started
            $import->markAsStarted();

            // Parse CSV and import transactions
            $this->processImport($file, $schema, $import);

            // Mark as completed
            $import->markAsCompleted();
        } catch (\Exception $e) {
            // Mark as failed
            $import->markAsFailed($e->getMessage());
            Log::error('CSV Import failed', [
                'import_id' => $import->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }

        return $import;
    }

    /**
     * Process the import by parsing CSV and creating transactions.
     */
    private function processImport(UploadedFile $file, CsvSchema $schema, Import $import): void
    {
        // Read file content and detect encoding
        $fileContent = file_get_contents($file->getPathname());

        // Detect encoding and convert to UTF-8 if needed
        $encoding = mb_detect_encoding($fileContent, ['UTF-8', 'UTF-16', 'Windows-1252', 'ISO-8859-1'], true);

        if ($encoding && $encoding !== 'UTF-8') {
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', $encoding);
        } elseif (!$encoding) {
            // If encoding detection fails, try to convert from common encodings
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', 'Windows-1252');
        }

        // Create a temporary file with UTF-8 content
        $tempFile = tmpfile();
        fwrite($tempFile, $fileContent);
        rewind($tempFile);

        $rowNumber = 0;
        $processedRows = 0;
        $importedRows = 0;
        $duplicateRows = 0;

        try {
            while (($row = fgetcsv($tempFile)) !== false) {
                $rowNumber++;

                // Skip rows before transaction data starts
                if ($rowNumber < $schema->transaction_data_start) {
                    continue;
                }

                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Clean up any remaining encoding issues in individual cells
                $row = array_map(function ($cell) {
                    // Remove BOM if present
                    $cell = preg_replace('/^\x{FEFF}/u', '', $cell);
                    // Ensure valid UTF-8
                    return mb_convert_encoding($cell, 'UTF-8', 'UTF-8');
                }, $row);

                $processedRows++;

                try {
                    // Extract transaction data from row
                    $transactionData = $this->extractTransactionData($row, $schema);

                    // Generate unique hash
                    $uniqueHash = Transaction::generateUniqueHash(
                        $import->user_id,
                        $transactionData['date'],
                        $transactionData['balance'],
                        $transactionData['paid_in'],
                        $transactionData['paid_out']
                    );

                    // Check for duplicates
                    if (Transaction::existsByHash($uniqueHash)) {
                        $duplicateRows++;
                        continue;
                    }

                    // Create transaction
                    Transaction::create([
                        'user_id' => $import->user_id,
                        'import_id' => $import->id,
                        'date' => $transactionData['date'],
                        'balance' => $transactionData['balance'],
                        'paid_in' => $transactionData['paid_in'],
                        'paid_out' => $transactionData['paid_out'],
                        'description' => $transactionData['description'],
                        'unique_hash' => $uniqueHash,
                    ]);

                    $importedRows++;
                } catch (\Exception $e) {
                    Log::warning('Failed to process CSV row', [
                        'import_id' => $import->id,
                        'row_number' => $rowNumber,
                        'error' => $e->getMessage(),
                        'row_data' => $row
                    ]);
                    // Continue processing other rows
                }

                // Update progress periodically
                if ($processedRows % 100 === 0) {
                    $import->updateProgress($processedRows, $importedRows, $duplicateRows);
                }
            }

            // Update final totals
            $import->update([
                'total_rows' => $processedRows,
                'processed_rows' => $processedRows,
                'imported_rows' => $importedRows,
                'duplicate_rows' => $duplicateRows,
            ]);
        } finally {
            fclose($tempFile);
        }
    }

    /**
     * Extract transaction data from a CSV row using the schema.
     */
    private function extractTransactionData(array $row, CsvSchema $schema): array
    {
        // Convert 1-indexed column numbers to 0-indexed array positions
        $dateIndex = $schema->date_column - 1;
        $balanceIndex = $schema->balance_column - 1;
        $amountIndex = $schema->amount_column ? $schema->amount_column - 1 : null;
        $paidInIndex = $schema->paid_in_column ? $schema->paid_in_column - 1 : null;
        $paidOutIndex = $schema->paid_out_column ? $schema->paid_out_column - 1 : null;
        $descriptionIndex = $schema->description_column ? $schema->description_column - 1 : null;

        // Validate required columns exist
        if (!isset($row[$dateIndex]) || !isset($row[$balanceIndex])) {
            throw new \Exception('Required columns (date, balance) are missing from CSV row');
        }

        // Extract data
        $date = trim($row[$dateIndex]);
        $balance = trim($row[$balanceIndex]);
        $description = $descriptionIndex !== null && isset($row[$descriptionIndex])
            ? trim($row[$descriptionIndex])
            : null;

        // Handle amount columns
        $paidIn = null;
        $paidOut = null;

        if ($amountIndex !== null && isset($row[$amountIndex])) {
            // Single amount column - determine if it's paid in or out
            $amount = (float) trim($row[$amountIndex]);
            if ($amount >= 0) {
                $paidIn = (string) $amount;
            } else {
                $paidOut = (string) abs($amount);
            }
        } else {
            // Separate paid in/out columns
            if ($paidInIndex !== null && isset($row[$paidInIndex]) && trim($row[$paidInIndex]) !== '') {
                $paidIn = trim($row[$paidInIndex]);
            }
            if ($paidOutIndex !== null && isset($row[$paidOutIndex]) && trim($row[$paidOutIndex]) !== '') {
                $paidOut = trim($row[$paidOutIndex]);
            }
        }

        // Validate that we have some amount data
        if (empty($paidIn) && empty($paidOut)) {
            throw new \Exception('No amount data found in CSV row');
        }

        return [
            'date' => $date,
            'balance' => $balance,
            'paid_in' => $paidIn,
            'paid_out' => $paidOut,
            'description' => $description,
        ];
    }

    /**
     * Preview transactions from a CSV file without importing them.
     */
    public function previewTransactions(UploadedFile $file, CsvSchema $schema, int $userId): array
    {
        // Read file content and detect encoding
        $fileContent = file_get_contents($file->getPathname());

        // Detect encoding and convert to UTF-8 if needed
        $encoding = mb_detect_encoding($fileContent, ['UTF-8', 'UTF-16', 'Windows-1252', 'ISO-8859-1'], true);

        if ($encoding && $encoding !== 'UTF-8') {
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', $encoding);
        } elseif (!$encoding) {
            // If encoding detection fails, try to convert from common encodings
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', 'Windows-1252');
        }

        // Create a temporary file with UTF-8 content
        $tempFile = tmpfile();
        fwrite($tempFile, $fileContent);
        rewind($tempFile);

        $rowNumber = 0;
        $transactions = [];
        $errors = [];

        try {
            while (($row = fgetcsv($tempFile)) !== false) {
                $rowNumber++;

                // Skip rows before transaction data starts
                if ($rowNumber < $schema->transaction_data_start) {
                    continue;
                }

                // Skip empty rows
                if (empty(array_filter($row))) {
                    continue;
                }

                // Clean up any remaining encoding issues in individual cells
                $row = array_map(function ($cell) {
                    // Remove BOM if present
                    $cell = preg_replace('/^\x{FEFF}/u', '', $cell);
                    // Ensure valid UTF-8
                    return mb_convert_encoding($cell, 'UTF-8', 'UTF-8');
                }, $row);

                try {
                    // Extract transaction data from row
                    $transactionData = $this->extractTransactionData($row, $schema);

                    // Generate unique hash
                    $uniqueHash = Transaction::generateUniqueHash(
                        $userId,
                        $transactionData['date'],
                        $transactionData['balance'],
                        $transactionData['paid_in'],
                        $transactionData['paid_out']
                    );

                    // Check for duplicates
                    $isDuplicate = Transaction::existsByHash($uniqueHash);

                    $transactions[] = [
                        'row_number' => $rowNumber,
                        'date' => $transactionData['date'],
                        'balance' => $transactionData['balance'],
                        'paid_in' => $transactionData['paid_in'],
                        'paid_out' => $transactionData['paid_out'],
                        'description' => $transactionData['description'],
                        'reference' => '',
                        'unique_hash' => $uniqueHash,
                        'is_duplicate' => $isDuplicate,
                        'status' => $isDuplicate ? 'duplicate' : 'pending',
                        'tags' => [],
                    ];
                } catch (\Exception $e) {
                    $errors[] = [
                        'row_number' => $rowNumber,
                        'error' => $e->getMessage(),
                        'row_data' => $row
                    ];
                }
            }
        } finally {
            fclose($tempFile);
        }

        return [
            'transactions' => $transactions,
            'errors' => $errors,
            'total_rows' => count($transactions),
            'duplicate_count' => count(array_filter($transactions, fn($t) => $t['is_duplicate'])),
            'valid_count' => count(array_filter($transactions, fn($t) => !$t['is_duplicate'])),
        ];
    }

    /**
     * Import reviewed transactions.
     */
    public function importReviewedTransactions(array $transactions, CsvSchema $schema, int $userId, string $filename): Import
    {
        // Create import record
        $import = Import::create([
            'user_id' => $userId,
            'csv_schema_id' => $schema->id,
            'filename' => $filename,
            'status' => Import::STATUS_PENDING,
        ]);

        try {
            // Mark import as started
            $import->markAsStarted();

            $importedRows = 0;
            $duplicateRows = 0;

            // Filter transactions to only include approved ones
            $approvedTransactions = array_filter($transactions, fn($t) => $t['status'] === 'approved');

            foreach ($approvedTransactions as $transactionData) {
                // Skip duplicates
                if ($transactionData['is_duplicate']) {
                    $duplicateRows++;
                    continue;
                }

                // Create transaction
                $transaction = Transaction::create([
                    'user_id' => $userId,
                    'import_id' => $import->id,
                    'date' => $transactionData['date'],
                    'balance' => $transactionData['balance'],
                    'paid_in' => $transactionData['paid_in'],
                    'paid_out' => $transactionData['paid_out'],
                    'description' => $transactionData['description'],
                    'reference' => $transactionData['reference'] ?? null,
                    'unique_hash' => $transactionData['unique_hash'],
                ]);

                // Apply tags if any
                if (!empty($transactionData['tags'])) {
                    $tagIds = array_map(fn($tag) => $tag['id'], $transactionData['tags']);
                    $transaction->tags()->attach($tagIds, [
                        'auto_applied' => false,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ]);
                }

                $importedRows++;
            }

            // Update final totals
            $import->update([
                'total_rows' => count($transactions),
                'processed_rows' => count($transactions),
                'imported_rows' => $importedRows,
                'duplicate_rows' => $duplicateRows,
            ]);

            // Mark as completed
            $import->markAsCompleted();
        } catch (\Exception $e) {
            // Mark as failed
            $import->markAsFailed($e->getMessage());
            Log::error('CSV Import failed', [
                'import_id' => $import->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }

        return $import;
    }

    /**
     * Get import statistics.
     */
    public function getImportStats(Import $import): array
    {
        return [
            'total_rows' => $import->total_rows ?? 0,
            'processed_rows' => $import->processed_rows,
            'imported_rows' => $import->imported_rows,
            'duplicate_rows' => $import->duplicate_rows,
            'error_rows' => ($import->total_rows ?? $import->processed_rows) - $import->imported_rows - $import->duplicate_rows,
            'success_rate' => $import->processed_rows > 0
                ? round(($import->imported_rows / $import->processed_rows) * 100, 2)
                : 0,
        ];
    }
}
