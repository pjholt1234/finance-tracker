<?php

namespace App\Services;

use App\Models\CsvSchema;
use App\Models\Import;
use App\Models\Transaction;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Log;

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
        $import = Import::create([
            'user_id' => $userId,
            'account_id' => $accountId,
            'csv_schema_id' => $schema->id,
            'filename' => $file->getClientOriginalName(),
            'status' => Import::STATUS_PENDING,
        ]);

        try {
            $import->markAsStarted();

            $this->processImport($file, $schema, $import);

            $import->markAsCompleted();
        } catch (\Exception $e) {
            $import->markAsFailed($e->getMessage());
            Log::error('CSV Import failed', [
                'import_id' => $import->id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }

        return $import;
    }

    /**
     * Process the import file and create transactions.
     */
    private function processImport(UploadedFile $file, CsvSchema $schema, Import $import): void
    {
        $fileContent = $this->prepareFileContent($file);
        $tempFile = $this->createTempFile($fileContent);

        $stats = $this->processCsvRows($tempFile, $schema, $import);

        fclose($tempFile);

        $import->updateProgress($stats['processed'], $stats['imported'], $stats['duplicates']);
    }

    /**
     * Prepare file content with proper encoding.
     */
    private function prepareFileContent(UploadedFile $file): string
    {
        $fileContent = file_get_contents($file->getPathname());

        $encoding = mb_detect_encoding($fileContent, ['UTF-8', 'UTF-16', 'Windows-1252', 'ISO-8859-1'], true);

        if ($encoding && $encoding !== 'UTF-8') {
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', $encoding);
        } elseif (! $encoding) {
            $fileContent = mb_convert_encoding($fileContent, 'UTF-8', 'Windows-1252');
        }

        return preg_replace('/^\x{FEFF}/u', '', $fileContent);
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
     * Process CSV rows and return statistics.
     */
    private function processCsvRows($tempFile, CsvSchema $schema, Import $import): array
    {
        $rowNumber = 0;
        $processedRows = 0;
        $importedRows = 0;
        $duplicateRows = 0;

        while (($row = fgetcsv($tempFile)) !== false) {
            $rowNumber++;

            if ($this->shouldSkipRow($rowNumber, $row, $schema)) {
                continue;
            }

            $processedRows++;
            $result = $this->processRow($row, $schema, $import, $rowNumber);

            if ($result === 'imported') {
                $importedRows++;
            } elseif ($result === 'duplicate') {
                $duplicateRows++;
            }
        }

        return [
            'processed' => $processedRows,
            'imported' => $importedRows,
            'duplicates' => $duplicateRows,
        ];
    }

    /**
     * Determine if a row should be skipped.
     */
    private function shouldSkipRow(int $rowNumber, array $row, CsvSchema $schema): bool
    {
        if ($rowNumber < $schema->transaction_data_start) {
            return true;
        }

        if (empty(array_filter($row))) {
            return true;
        }

        return false;
    }

    /**
     * Process a single CSV row.
     */
    private function processRow(array $row, CsvSchema $schema, Import $import, int $rowNumber): string
    {
        try {
            $cleanRow = $this->cleanRowData($row);
            $transactionData = $this->extractTransactionData($cleanRow, $schema, $import->user_id);

            if (Transaction::existsByHash($transactionData['unique_hash'])) {
                return 'duplicate';
            }

            $this->createTransaction($transactionData, $import);

            return 'imported';
        } catch (\Exception $e) {
            $this->logRowError($e, $import, $rowNumber, $row);

            return 'error';
        }
    }

    /**
     * Clean row data and ensure proper encoding.
     */
    private function cleanRowData(array $row): array
    {
        return array_map(function ($cell) {
            $cell = preg_replace('/^\x{FEFF}/u', '', $cell);

            return mb_convert_encoding($cell, 'UTF-8', 'UTF-8');
        }, $row);
    }

    /**
     * Create a transaction record.
     */
    private function createTransaction(array $transactionData, Import $import): void
    {
        Transaction::create([
            'user_id' => $import->user_id,
            'account_id' => $import->account_id,
            'import_id' => $import->id,
            'date' => $transactionData['date'],
            'balance' => $transactionData['balance'],
            'paid_in' => $transactionData['paid_in'],
            'paid_out' => $transactionData['paid_out'],
            'description' => $transactionData['description'],
            'unique_hash' => $transactionData['unique_hash'],
        ]);
    }

    /**
     * Log row processing errors.
     */
    private function logRowError(\Exception $e, Import $import, int $rowNumber, array $row): void
    {
        Log::warning('Failed to process row', [
            'import_id' => $import->id,
            'row_number' => $rowNumber,
            'error' => $e->getMessage(),
            'row_data' => $row,
        ]);
    }

    /**
     * Extract transaction data from a CSV row using the schema.
     */
    public function extractTransactionData(array $row, CsvSchema $schema, int $userId): array
    {
        $data = [];

        $data['date'] = $this->extractDate($row, $schema);
        $data['balance'] = $this->extractBalance($row, $schema);

        $amountData = $this->extractAmounts($row, $schema);
        $data['paid_in'] = $amountData['paid_in'];
        $data['paid_out'] = $amountData['paid_out'];

        $data['description'] = $this->extractDescription($row, $schema);

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
     * Extract and parse date from row.
     */
    private function extractDate(array $row, CsvSchema $schema): string
    {
        $dateColumnIndex = $this->getColumnIndex($schema->date_column);
        $dateString = $row[$dateColumnIndex] ?? '';

        try {
            return $this->dateParsingService->parseDate($dateString, $schema->date_format);
        } catch (\Exception $e) {
            throw new \Exception("Invalid date format: {$dateString}");
        }
    }

    /**
     * Extract balance from row and convert to pennies.
     */
    private function extractBalance(array $row, CsvSchema $schema): ?int
    {
        $balanceColumnIndex = $this->getColumnIndex($schema->balance_column);
        $balanceValue = $row[$balanceColumnIndex] ?? '';

        return Transaction::currencyToPennies($balanceValue);
    }

    /**
     * Extract amounts (paid_in/paid_out) from row.
     */
    private function extractAmounts(array $row, CsvSchema $schema): array
    {
        if (! empty($schema->amount_column)) {
            return $this->extractSingleAmount($row, $schema);
        } else {
            return $this->extractSeparateAmounts($row, $schema);
        }
    }

    /**
     * Extract amounts from a single amount column.
     */
    private function extractSingleAmount(array $row, CsvSchema $schema): array
    {
        $amountColumnIndex = $this->getColumnIndex($schema->amount_column);
        $amount = $row[$amountColumnIndex] ?? '';
        $amountInPennies = Transaction::currencyToPennies($amount);

        if ($amountInPennies !== null) {
            if ($amountInPennies >= 0) {
                return ['paid_in' => $amountInPennies, 'paid_out' => null];
            } else {
                return ['paid_in' => null, 'paid_out' => abs($amountInPennies)];
            }
        }

        return ['paid_in' => null, 'paid_out' => null];
    }

    /**
     * Extract amounts from separate paid_in/paid_out columns.
     */
    private function extractSeparateAmounts(array $row, CsvSchema $schema): array
    {
        $paidIn = null;
        $paidOut = null;

        if (! empty($schema->paid_in_column)) {
            $paidInColumnIndex = $this->getColumnIndex($schema->paid_in_column);
            $paidInValue = $row[$paidInColumnIndex] ?? '';
            if (! empty($paidInValue)) {
                $paidIn = Transaction::currencyToPennies($paidInValue);
            }
        }

        if (! empty($schema->paid_out_column)) {
            $paidOutColumnIndex = $this->getColumnIndex($schema->paid_out_column);
            $paidOutValue = $row[$paidOutColumnIndex] ?? '';
            if (! empty($paidOutValue)) {
                $paidOut = Transaction::currencyToPennies($paidOutValue);
            }
        }

        return ['paid_in' => $paidIn, 'paid_out' => $paidOut];
    }

    /**
     * Extract description from row.
     */
    private function extractDescription(array $row, CsvSchema $schema): string
    {
        if (empty($schema->description_column)) {
            return '';
        }

        $descriptionColumnIndex = $this->getColumnIndex($schema->description_column);

        return $row[$descriptionColumnIndex] ?? '';
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
        $fileContent = $this->prepareFileContent($file);
        $tempFile = $this->createTempFile($fileContent);

        $result = $this->processPreviewRows($tempFile, $schema, $userId);

        fclose($tempFile);

        return $result;
    }

    /**
     * Process rows for preview and return results.
     */
    private function processPreviewRows($tempFile, CsvSchema $schema, int $userId): array
    {
        $rowNumber = 0;
        $transactions = [];
        $errors = [];
        $duplicateCount = 0;
        $validCount = 0;

        while (($row = fgetcsv($tempFile)) !== false) {
            $rowNumber++;

            if ($this->shouldSkipRow($rowNumber, $row, $schema)) {
                continue;
            }

            $cleanRow = $this->cleanRowData($row);
            $result = $this->processPreviewRow($cleanRow, $schema, $userId, $rowNumber);

            if (isset($result['transaction'])) {
                $transactions[] = $result['transaction'];
                if ($result['transaction']['is_duplicate']) {
                    $duplicateCount++;
                } else {
                    $validCount++;
                }
            } elseif (isset($result['error'])) {
                $errors[] = $result['error'];
            }
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
     * Process a single row for preview.
     */
    private function processPreviewRow(array $row, CsvSchema $schema, int $userId, int $rowNumber): array
    {
        try {
            $transactionData = $this->extractTransactionData($row, $schema, $userId);
            $uniqueHash = $transactionData['unique_hash'];
            $isDuplicate = Transaction::existsByHash($uniqueHash);

            return [
                'transaction' => [
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
                ],
            ];
        } catch (\Exception $e) {
            return [
                'error' => [
                    'row_number' => $rowNumber,
                    'error' => $e->getMessage(),
                    'row_data' => $row,
                ],
            ];
        }
    }

    /**
     * Import reviewed transactions.
     */
    public function importReviewedTransactions(array $transactions, CsvSchema $schema, string $filename, $user, int $accountId): Import
    {
        $userId = is_object($user) ? $user->id : $user;

        $import = $this->createImportRecord($userId, $accountId, $schema, $filename);

        try {
            $import->markAsStarted();

            $stats = $this->processReviewedTransactions($transactions, $import, $userId, $accountId);

            $import->updateProgress(count($transactions), $stats['imported'], $stats['duplicates']);
            $import->markAsCompleted();
        } catch (\Exception $e) {
            $this->handleImportFailure($import, $e, $userId, $schema, $accountId, $filename);
            throw $e;
        }

        return $import;
    }

    /**
     * Create an import record.
     */
    private function createImportRecord(int $userId, int $accountId, CsvSchema $schema, string $filename): Import
    {
        return Import::create([
            'user_id' => $userId,
            'account_id' => $accountId,
            'csv_schema_id' => $schema->id,
            'filename' => $filename,
            'status' => Import::STATUS_PENDING,
        ]);
    }

    /**
     * Process reviewed transactions and return statistics.
     */
    private function processReviewedTransactions(array $transactions, Import $import, int $userId, int $accountId): array
    {
        $importedRows = 0;
        $duplicateRows = 0;

        $approvedTransactions = $this->filterApprovedTransactions($transactions);

        foreach ($approvedTransactions as $transactionData) {
            if ($this->isDuplicateTransaction($transactionData)) {
                $duplicateRows++;

                continue;
            }

            if ($this->createTransactionWithTags($transactionData, $import, $userId, $accountId)) {
                $importedRows++;
            } else {
                $duplicateRows++;
            }
        }

        return [
            'imported' => $importedRows,
            'duplicates' => $duplicateRows,
        ];
    }

    /**
     * Filter transactions to only include approved ones.
     */
    private function filterApprovedTransactions(array $transactions): array
    {
        return array_filter($transactions, fn ($t) => $t['status'] === 'approved');
    }

    /**
     * Check if a transaction is a duplicate.
     */
    private function isDuplicateTransaction(array $transactionData): bool
    {
        if (isset($transactionData['is_duplicate']) && $transactionData['is_duplicate']) {
            return true;
        }

        return Transaction::existsByHash($transactionData['unique_hash']);
    }

    /**
     * Create a transaction with tags and return success status.
     */
    private function createTransactionWithTags(array $transactionData, Import $import, int $userId, int $accountId): bool
    {
        try {
            $transaction = $this->createTransactionFromData($transactionData, $import, $userId, $accountId);
            $this->attachTagsToTransaction($transaction, $transactionData);

            return true;
        } catch (\Illuminate\Database\QueryException $e) {
            return $this->handleTransactionCreationError($e, $transactionData, $import);
        }
    }

    /**
     * Create a transaction from transaction data.
     */
    private function createTransactionFromData(array $transactionData, Import $import, int $userId, int $accountId): Transaction
    {
        return Transaction::create([
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
    }

    /**
     * Attach tags to a transaction if any exist.
     */
    private function attachTagsToTransaction(Transaction $transaction, array $transactionData): void
    {
        if (! empty($transactionData['tags'])) {
            $tagIds = array_column($transactionData['tags'], 'id');
            $transaction->tags()->attach($tagIds);
        }
    }

    /**
     * Handle transaction creation errors.
     */
    private function handleTransactionCreationError(\Illuminate\Database\QueryException $e, array $transactionData, Import $import): bool
    {
        if (str_contains($e->getMessage(), 'UNIQUE constraint failed: transactions.unique_hash')) {
            Log::warning('Duplicate transaction detected during import', [
                'unique_hash' => $transactionData['unique_hash'],
                'import_id' => $import->id,
            ]);

            return false;
        }

        throw $e;
    }

    /**
     * Handle import failure.
     */
    private function handleImportFailure(Import $import, \Exception $e, int $userId, CsvSchema $schema, int $accountId, string $filename): void
    {
        $import->markAsFailed($e->getMessage());
        Log::error('CSV Import finalization failed', [
            'user_id' => $userId,
            'schema_id' => $schema->id,
            'account_id' => $accountId,
            'filename' => $filename,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString(),
        ]);
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
