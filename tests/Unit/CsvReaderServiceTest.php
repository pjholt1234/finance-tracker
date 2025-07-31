<?php

namespace Tests\Unit;

use App\Services\CsvReaderService;
use Illuminate\Http\UploadedFile;
use Tests\TestCase;

class CsvReaderServiceTest extends TestCase
{
    private CsvReaderService $csvReaderService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->csvReaderService = new CsvReaderService;
    }

    public function test_can_parse_csv_for_preview(): void
    {
        // Create a test CSV file
        $csvContent = "Date,Description,Amount,Balance\n".
            "2024-01-01,Opening Balance,0.00,1000.00\n".
            "2024-01-02,Grocery Store,-45.67,954.33\n".
            "2024-01-03,Salary Deposit,2500.00,3454.33\n";

        $file = $this->createTempCsvFile($csvContent);

        $result = $this->csvReaderService->parseForPreview($file, 10);

        $this->assertArrayHasKey('headers', $result);
        $this->assertArrayHasKey('rows', $result);
        $this->assertArrayHasKey('total_rows', $result);
        $this->assertArrayHasKey('detected_date_formats', $result);

        $this->assertEquals(['Date', 'Description', 'Amount', 'Balance'], $result['headers']);
        $this->assertCount(3, $result['rows']); // 3 data rows
        $this->assertEquals(3, $result['total_rows']);
    }

    public function test_can_parse_csv_with_schema(): void
    {
        // Create a test CSV file
        $csvContent = "Date,Description,Amount,Balance\n".
            "2024-01-01,Opening Balance,0.00,1000.00\n".
            "2024-01-02,Grocery Store,-45.67,954.33\n";

        $file = $this->createTempCsvFile($csvContent);

        $schema = [
            'transaction_data_start' => 2,
            'date_column' => 1,
            'balance_column' => 4,
            'amount_column' => 3,
            'description_column' => 2,
        ];

        $result = $this->csvReaderService->parseWithSchema($file, $schema);

        $this->assertCount(2, $result);

        $firstRow = $result->first();
        $this->assertEquals('2024-01-01', $firstRow['date']);
        $this->assertEquals('Opening Balance', $firstRow['description']);
        $this->assertEquals('0', $firstRow['amount']);
        $this->assertEquals('1000', $firstRow['balance']);
    }

    public function test_can_parse_csv_with_separate_amount_columns(): void
    {
        // Create a test CSV file with separate paid in/out columns
        $csvContent = "Date,Description,Paid In,Paid Out,Balance\n".
            "2024-01-01,Opening Balance,1000.00,,1000.00\n".
            "2024-01-02,Grocery Store,,45.67,954.33\n";

        $file = $this->createTempCsvFile($csvContent);

        $schema = [
            'transaction_data_start' => 2,
            'date_column' => 1,
            'balance_column' => 5,
            'paid_in_column' => 3,
            'paid_out_column' => 4,
            'description_column' => 2,
        ];

        $result = $this->csvReaderService->parseWithSchema($file, $schema);

        $this->assertCount(2, $result);

        $firstRow = $result->first();
        $this->assertEquals('1000', $firstRow['paid_in']);
        $this->assertArrayNotHasKey('paid_out', $firstRow);

        $secondRow = $result->skip(1)->first();
        $this->assertEquals('45.67', $secondRow['paid_out']);
        $this->assertArrayNotHasKey('paid_in', $secondRow);
    }

    public function test_can_handle_column_indices(): void
    {
        // Create a test CSV file without headers
        $csvContent = "2024-01-01,Opening Balance,0.00,1000.00\n".
            "2024-01-02,Grocery Store,-45.67,954.33\n";

        $file = $this->createTempCsvFile($csvContent);

        $schema = [
            'transaction_data_start' => 1,
            'date_column' => 1,
            'balance_column' => 4,
            'amount_column' => 3,
            'description_column' => 2,
        ];

        $result = $this->csvReaderService->parseWithSchema($file, $schema);

        $this->assertCount(2, $result);

        $firstRow = $result->first();
        $this->assertEquals('2024-01-01', $firstRow['date']);
        $this->assertEquals('Opening Balance', $firstRow['description']);
        $this->assertEquals('0', $firstRow['amount']);
        $this->assertEquals('1000', $firstRow['balance']);
    }

    public function test_detects_date_formats(): void
    {
        // Create a test CSV file with various date formats
        $csvContent = "Date,Amount\n".
            "2024-01-15,100.00\n".
            "15/01/2024,200.00\n".
            "01/15/2024,300.00\n";

        $file = $this->createTempCsvFile($csvContent);

        $result = $this->csvReaderService->parseForPreview($file, 10);

        $this->assertNotEmpty($result['detected_date_formats']);

        // Should detect multiple date formats
        $formats = array_column($result['detected_date_formats'], 'format');
        $this->assertContains('Y-m-d', $formats);
    }

    public function test_handles_empty_csv(): void
    {
        $file = $this->createTempCsvFile('');

        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('The CSV file appears to be empty or invalid.');

        $this->csvReaderService->parseForPreview($file, 10);
    }

    public function test_skips_empty_rows(): void
    {
        // Create a test CSV file with empty rows
        $csvContent = "Date,Amount\n".
            "2024-01-01,100.00\n".
            ",,\n".  // Empty row
            "2024-01-02,200.00\n";

        $file = $this->createTempCsvFile($csvContent);

        $schema = [
            'transaction_data_start' => 2,
            'date_column' => 1,
            'balance_column' => 2,
            'amount_column' => 2,
        ];

        $result = $this->csvReaderService->parseWithSchema($file, $schema);

        // Should only have 2 rows (empty row filtered out)
        $this->assertCount(2, $result);
    }

    /**
     * Create a temporary CSV file for testing.
     */
    private function createTempCsvFile(string $content): UploadedFile
    {
        $tempPath = tempnam(sys_get_temp_dir(), 'test_csv');
        file_put_contents($tempPath, $content);

        return new UploadedFile(
            $tempPath,
            'test.csv',
            'text/csv',
            null,
            true
        );
    }
}
