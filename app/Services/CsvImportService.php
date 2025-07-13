<?php

namespace App\Services;

use App\Models\CsvSchema;
use App\Models\Import;
use App\Models\Transaction;
use App\Services\DateParsingService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class CsvImportService
{
    private DateParsingService $dateParsingService;

    public function __construct(DateParsingService $dateParsingService)
    {
        $this->dateParsingService = $dateParsingService;
    }

    /**
     * Import transactions from a CSV file using the specified schema.
     */
    public function importFromCsv(UploadedFile $file, CsvSchema $schema, int $userId, int $accountId): Import
    {
        // Create import record
        $import = Import::create([
            'user_id' => $userId,
            'account_id' => $accountId,
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

        // Remove BOM if present
        $fileContent = preg_replace('/^\x{FEFF}/u', '', $fileContent);

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
                    $transactionData = $this->extractTransactionData($row, $schema, $import->user_id);

                    // Generate unique hash
                    $uniqueHash = $transactionData['unique_hash'];

                    // Check for duplicates
                    if (Transaction::existsByHash($uniqueHash)) {
                        $duplicateRows++;
                        continue;
                    }

                    // Create transaction
                    Transaction::create([
                        'user_id' => $import->user_id,
                        'account_id' => $import->account_id,
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
                    Log::warning('Failed to process row', [
                        'import_id' => $import->id,
                        'row_number' => $rowNumber,
                        'error' => $e->getMessage(),
                        'row_data' => $row
                    ]);
                    // Continue processing other rows
                }
            }
        } finally {
            fclose($tempFile);
        }

        // Update import statistics
        $import->updateProgress($processedRows, $importedRows, $duplicateRows);
    }

    /**
     * Extract transaction data from a CSV row using the schema.
     */
    public function extractTransactionData(array $row, CsvSchema $schema, int $userId): array
    {
        $data = [];

        // Extract date and parse it
        $dateColumnIndex = $this->getColumnIndex($schema->date_column);
        $dateString = $row[$dateColumnIndex] ?? '';

        try {
            $data['date'] = $this->dateParsingService->parseDate($dateString, $schema->date_format);
        } catch (\Exception $e) {
            throw new \Exception("Invalid date format: {$dateString}");
        }

        // Extract balance and convert to pennies
        $balanceColumnIndex = $this->getColumnIndex($schema->balance_column);
        $balanceValue = $row[$balanceColumnIndex] ?? '';
        $data['balance'] = Transaction::currencyToPennies($balanceValue);

        // Extract amount fields and convert to pennies
        if (!empty($schema->amount_column)) {
            // Single amount column
            $amountColumnIndex = $this->getColumnIndex($schema->amount_column);
            $amount = $row[$amountColumnIndex] ?? '';

            $amountInPennies = Transaction::currencyToPennies($amount);

            if ($amountInPennies !== null) {
                if ($amountInPennies >= 0) {
                    $data['paid_in'] = $amountInPennies;
                    $data['paid_out'] = null;
                } else {
                    $data['paid_in'] = null;
                    $data['paid_out'] = abs($amountInPennies);
                }
            } else {
                $data['paid_in'] = null;
                $data['paid_out'] = null;
            }
        } else {
            // Separate paid in/out columns
            $data['paid_in'] = null;
            $data['paid_out'] = null;

            if (!empty($schema->paid_in_column)) {
                $paidInColumnIndex = $this->getColumnIndex($schema->paid_in_column);
                $paidInValue = $row[$paidInColumnIndex] ?? '';
                if (!empty($paidInValue)) {
                    $data['paid_in'] = Transaction::currencyToPennies($paidInValue);
                }
            }

            if (!empty($schema->paid_out_column)) {
                $paidOutColumnIndex = $this->getColumnIndex($schema->paid_out_column);
                $paidOutValue = $row[$paidOutColumnIndex] ?? '';
                if (!empty($paidOutValue)) {
                    $data['paid_out'] = Transaction::currencyToPennies($paidOutValue);
                }
            }
        }

        // Extract description
        $data['description'] = '';
        if (!empty($schema->description_column)) {
            $descriptionColumnIndex = $this->getColumnIndex($schema->description_column);
            $data['description'] = $row[$descriptionColumnIndex] ?? '';
        }

        // Generate unique hash
        $data['unique_hash'] = Transaction::generateUniqueHash(
            $userId,
            $data['date'],
            $data['balance'],
            $data['paid_in'],
            $data['paid_out']
        );

        return $data;
    }

    /**
     * Convert column reference to 0-based index.
     */
    private function getColumnIndex(string $columnRef): int
    {
        // If it's already a number, convert to 0-based index
        if (is_numeric($columnRef)) {
            return intval($columnRef) - 1;
        }

        // If it's a letter (A, B, C, etc.), convert to 0-based index
        return ord(strtoupper($columnRef)) - ord('A');
    }

    /**
     * Preview transactions from a CSV file without importing.
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

        // Remove BOM if present
        $fileContent = preg_replace('/^\x{FEFF}/u', '', $fileContent);

        // Create a temporary file with UTF-8 content
        $tempFile = tmpfile();
        fwrite($tempFile, $fileContent);
        rewind($tempFile);

        $rowNumber = 0;
        $transactions = [];
        $errors = [];
        $duplicateCount = 0;
        $validCount = 0;

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
                    $transactionData = $this->extractTransactionData($row, $schema, $userId);

                    // Generate unique hash
                    $uniqueHash = $transactionData['unique_hash'];

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

                    if ($isDuplicate) {
                        $duplicateCount++;
                    } else {
                        $validCount++;
                    }
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
            'total_rows' => count($transactions) + count($errors),
            'duplicate_count' => $duplicateCount,
            'valid_count' => $validCount,
        ];
    }

    /**
     * Import reviewed transactions.
     */
    public function importReviewedTransactions(array $transactions, CsvSchema $schema, string $filename, $user, int $accountId): Import
    {
        $userId = is_object($user) ? $user->id : $user;

        // Create import record
        $import = Import::create([
            'user_id' => $userId,
            'account_id' => $accountId,
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
                if (isset($transactionData['is_duplicate']) && $transactionData['is_duplicate']) {
                    $duplicateRows++;
                    continue;
                }

                // Double-check for duplicates in real-time (in case database state changed)
                if (Transaction::existsByHash($transactionData['unique_hash'])) {
                    $duplicateRows++;
                    continue;
                }

                try {
                    // Create transaction
                    $transaction = Transaction::create([
                        'user_id' => $userId,
                        'account_id' => $accountId,
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
                        $tagIds = array_column($transactionData['tags'], 'id');
                        $transaction->tags()->attach($tagIds);
                    }

                    $importedRows++;
                } catch (\Illuminate\Database\QueryException $e) {
                    // Handle unique constraint violations gracefully
                    if (str_contains($e->getMessage(), 'UNIQUE constraint failed: transactions.unique_hash')) {
                        Log::warning('Duplicate transaction detected during import', [
                            'unique_hash' => $transactionData['unique_hash'],
                            'import_id' => $import->id,
                        ]);
                        $duplicateRows++;
                        continue;
                    }

                    // Re-throw other database errors
                    throw $e;
                }
            }

            // Update import statistics
            $import->updateProgress(count($transactions), $importedRows, $duplicateRows);

            // Mark as completed
            $import->markAsCompleted();
        } catch (\Exception $e) {
            // Mark as failed
            $import->markAsFailed($e->getMessage());
            Log::error('CSV Import finalization failed', [
                'user_id' => $userId,
                'schema_id' => $schema->id,
                'account_id' => $accountId,
                'filename' => $filename,
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
        $totalRows = $import->total_rows ?? $import->processed_rows;
        $processedRows = $import->processed_rows;
        $importedRows = $import->imported_rows;
        $duplicateRows = $import->duplicate_rows;
        $errorRows = $totalRows - $processedRows;

        $successRate = $processedRows > 0 ? ($importedRows / $processedRows) * 100 : 0;

        return [
            'total_rows' => $totalRows,
            'processed_rows' => $processedRows,
            'imported_rows' => $importedRows,
            'duplicate_rows' => $duplicateRows,
            'error_rows' => $errorRows,
            'success_rate' => round($successRate, 1),
        ];
    }
}
