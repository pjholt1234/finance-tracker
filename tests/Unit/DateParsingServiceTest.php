<?php

namespace Tests\Unit;

use App\Services\DateParsingService;
use Tests\TestCase;

class DateParsingServiceTest extends TestCase
{
    private DateParsingService $dateParsingService;

    protected function setUp(): void
    {
        parent::setUp();
        $this->dateParsingService = new DateParsingService;
    }

    public function test_parse_date_with_ymd_format()
    {
        $result = $this->dateParsingService->parseDate('2023-01-15');
        $this->assertEquals('2023-01-15', $result);
    }

    public function test_parse_date_with_dmy_format()
    {
        $result = $this->dateParsingService->parseDate('15/01/2023');
        $this->assertEquals('2023-01-15', $result);
    }

    public function test_parse_date_with_mdy_format()
    {
        $result = $this->dateParsingService->parseDate('01/15/2023');
        $this->assertEquals('2023-01-15', $result);
    }

    public function test_parse_date_with_dmy_dash_format()
    {
        $result = $this->dateParsingService->parseDate('15-01-2023');
        $this->assertEquals('2023-01-15', $result);
    }

    public function test_parse_date_with_dmy_dot_format()
    {
        $result = $this->dateParsingService->parseDate('15.01.2023');
        $this->assertEquals('2023-01-15', $result);
    }

    public function test_parse_date_with_single_digit_day_month()
    {
        $result = $this->dateParsingService->parseDate('5/1/2023');
        $this->assertEquals('2023-01-05', $result);
    }

    public function test_parse_date_with_expected_format()
    {
        $result = $this->dateParsingService->parseDate('15/01/2023', 'd/m/Y');
        $this->assertEquals('2023-01-15', $result);
    }

    public function test_parse_date_with_datetime()
    {
        $result = $this->dateParsingService->parseDate('2023-01-15 10:30:00');
        $this->assertEquals('2023-01-15', $result);
    }

    public function test_parse_date_with_datetime_dmy()
    {
        $result = $this->dateParsingService->parseDate('15/01/2023 10:30:00');
        $this->assertEquals('2023-01-15', $result);
    }

    public function test_parse_date_throws_exception_for_invalid_date()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Unable to parse date: invalid-date');
        $this->dateParsingService->parseDate('invalid-date');
    }

    public function test_parse_date_throws_exception_for_empty_string()
    {
        $this->expectException(\Exception::class);
        $this->expectExceptionMessage('Date string is empty');
        $this->dateParsingService->parseDate('');
    }

    public function test_detect_date_format()
    {
        $dateStrings = [
            '15/01/2023',
            '16/01/2023',
            '17/01/2023',
        ];

        $result = $this->dateParsingService->detectDateFormat($dateStrings);
        $this->assertEquals('d/m/Y', $result);
    }

    public function test_detect_date_format_with_mixed_formats()
    {
        $dateStrings = [
            '2023-01-15',
            '2023-01-16',
            '15/01/2023', // This should be less common
        ];

        $result = $this->dateParsingService->detectDateFormat($dateStrings);
        $this->assertEquals('Y-m-d', $result);
    }

    public function test_detect_date_format_returns_null_for_invalid_dates()
    {
        $dateStrings = [
            'invalid-date',
            'another-invalid',
            'not-a-date',
        ];

        $result = $this->dateParsingService->detectDateFormat($dateStrings);
        $this->assertNull($result);
    }

    public function test_is_valid_date()
    {
        $this->assertTrue($this->dateParsingService->isValidDate('2023-01-15'));
        $this->assertTrue($this->dateParsingService->isValidDate('15/01/2023'));
        $this->assertFalse($this->dateParsingService->isValidDate('invalid-date'));
        $this->assertFalse($this->dateParsingService->isValidDate(''));
    }

    public function test_is_valid_date_with_expected_format()
    {
        $this->assertTrue($this->dateParsingService->isValidDate('15/01/2023', 'd/m/Y'));
        $this->assertFalse($this->dateParsingService->isValidDate('2023-01-15', 'd/m/Y'));
    }

    public function test_get_supported_formats()
    {
        $formats = $this->dateParsingService->getSupportedFormats();

        $this->assertIsArray($formats);
        $this->assertContains('Y-m-d', $formats);
        $this->assertContains('d/m/Y', $formats);
        $this->assertContains('m/d/Y', $formats);
        $this->assertContains('j/n/Y', $formats);
    }

    public function test_parse_date_with_full_month_name()
    {
        $result = $this->dateParsingService->parseDate('16 July 2025');
        $this->assertEquals('2025-07-16', $result);
    }

    public function test_parse_date_with_short_month_name()
    {
        $result = $this->dateParsingService->parseDate('12 Jul 2024');
        $this->assertEquals('2024-07-12', $result);
    }

    public function test_parse_date_with_ordinal_numbers()
    {
        $result = $this->dateParsingService->parseDate('11th July 2025');
        $this->assertEquals('2025-07-11', $result);

        $result = $this->dateParsingService->parseDate('1st January 2024');
        $this->assertEquals('2024-01-01', $result);

        $result = $this->dateParsingService->parseDate('2nd February 2024');
        $this->assertEquals('2024-02-02', $result);

        $result = $this->dateParsingService->parseDate('3rd March 2024');
        $this->assertEquals('2024-03-03', $result);

        $result = $this->dateParsingService->parseDate('22nd December 2024');
        $this->assertEquals('2024-12-22', $result);
    }

    public function test_parse_date_with_comma_separated_format()
    {
        $result = $this->dateParsingService->parseDate('July 16, 2025');
        $this->assertEquals('2025-07-16', $result);

        $result = $this->dateParsingService->parseDate('Jul 12, 2024');
        $this->assertEquals('2024-07-12', $result);

        $result = $this->dateParsingService->parseDate('16 July, 2025');
        $this->assertEquals('2025-07-16', $result);

        $result = $this->dateParsingService->parseDate('12 Jul, 2024');
        $this->assertEquals('2024-07-12', $result);
    }

    public function test_parse_date_with_ordinal_and_comma()
    {
        $result = $this->dateParsingService->parseDate('11th July, 2025');
        $this->assertEquals('2025-07-11', $result);

        $result = $this->dateParsingService->parseDate('1st Jan, 2024');
        $this->assertEquals('2024-01-01', $result);
    }

    public function test_parse_date_with_various_month_formats()
    {
        // Test all months with full names
        $result = $this->dateParsingService->parseDate('15 January 2024');
        $this->assertEquals('2024-01-15', $result);

        $result = $this->dateParsingService->parseDate('15 February 2024');
        $this->assertEquals('2024-02-15', $result);

        $result = $this->dateParsingService->parseDate('15 March 2024');
        $this->assertEquals('2024-03-15', $result);

        $result = $this->dateParsingService->parseDate('15 April 2024');
        $this->assertEquals('2024-04-15', $result);

        $result = $this->dateParsingService->parseDate('15 May 2024');
        $this->assertEquals('2024-05-15', $result);

        $result = $this->dateParsingService->parseDate('15 June 2024');
        $this->assertEquals('2024-06-15', $result);

        $result = $this->dateParsingService->parseDate('15 July 2024');
        $this->assertEquals('2024-07-15', $result);

        $result = $this->dateParsingService->parseDate('15 August 2024');
        $this->assertEquals('2024-08-15', $result);

        $result = $this->dateParsingService->parseDate('15 September 2024');
        $this->assertEquals('2024-09-15', $result);

        $result = $this->dateParsingService->parseDate('15 October 2024');
        $this->assertEquals('2024-10-15', $result);

        $result = $this->dateParsingService->parseDate('15 November 2024');
        $this->assertEquals('2024-11-15', $result);

        $result = $this->dateParsingService->parseDate('15 December 2024');
        $this->assertEquals('2024-12-15', $result);
    }

    public function test_parse_date_with_abbreviated_months()
    {
        // Test all months with abbreviated names
        $result = $this->dateParsingService->parseDate('15 Jan 2024');
        $this->assertEquals('2024-01-15', $result);

        $result = $this->dateParsingService->parseDate('15 Feb 2024');
        $this->assertEquals('2024-02-15', $result);

        $result = $this->dateParsingService->parseDate('15 Mar 2024');
        $this->assertEquals('2024-03-15', $result);

        $result = $this->dateParsingService->parseDate('15 Apr 2024');
        $this->assertEquals('2024-04-15', $result);

        $result = $this->dateParsingService->parseDate('15 May 2024');
        $this->assertEquals('2024-05-15', $result);

        $result = $this->dateParsingService->parseDate('15 Jun 2024');
        $this->assertEquals('2024-06-15', $result);

        $result = $this->dateParsingService->parseDate('15 Jul 2024');
        $this->assertEquals('2024-07-15', $result);

        $result = $this->dateParsingService->parseDate('15 Aug 2024');
        $this->assertEquals('2024-08-15', $result);

        $result = $this->dateParsingService->parseDate('15 Sep 2024');
        $this->assertEquals('2024-09-15', $result);

        $result = $this->dateParsingService->parseDate('15 Oct 2024');
        $this->assertEquals('2024-10-15', $result);

        $result = $this->dateParsingService->parseDate('15 Nov 2024');
        $this->assertEquals('2024-11-15', $result);

        $result = $this->dateParsingService->parseDate('15 Dec 2024');
        $this->assertEquals('2024-12-15', $result);
    }

    public function test_parse_date_with_single_digit_days()
    {
        $result = $this->dateParsingService->parseDate('5 July 2025');
        $this->assertEquals('2025-07-05', $result);

        $result = $this->dateParsingService->parseDate('1 Jan 2024');
        $this->assertEquals('2024-01-01', $result);

        $result = $this->dateParsingService->parseDate('9 December 2024');
        $this->assertEquals('2024-12-09', $result);
    }

    public function test_parse_date_with_extra_whitespace()
    {
        $result = $this->dateParsingService->parseDate('  16   July   2025  ');
        $this->assertEquals('2025-07-16', $result);

        $result = $this->dateParsingService->parseDate('12    Jul    2024');
        $this->assertEquals('2024-07-12', $result);
    }

    public function test_detect_date_format_with_textual_months()
    {
        $dateStrings = [
            '16 July 2025',
            '17 July 2025',
            '18 July 2025',
        ];

        $result = $this->dateParsingService->detectDateFormat($dateStrings);
        $this->assertEquals('j F Y', $result);
    }

    public function test_detect_date_format_with_abbreviated_months()
    {
        $dateStrings = [
            '12 Jul 2024',
            '13 Jul 2024',
            '14 Jul 2024',
        ];

        $result = $this->dateParsingService->detectDateFormat($dateStrings);
        $this->assertEquals('j M Y', $result);
    }

    public function test_detect_date_format_with_ordinal_numbers()
    {
        $dateStrings = [
            '11th July 2025',
            '12th July 2025',
            '13th July 2025',
        ];

        $result = $this->dateParsingService->detectDateFormat($dateStrings);
        $this->assertEquals('jS F Y', $result);
    }

    public function test_is_valid_date_with_textual_formats()
    {
        $this->assertTrue($this->dateParsingService->isValidDate('16 July 2025'));
        $this->assertTrue($this->dateParsingService->isValidDate('12 Jul 2024'));
        $this->assertTrue($this->dateParsingService->isValidDate('11th July 2025'));
        $this->assertTrue($this->dateParsingService->isValidDate('July 16, 2025'));
        $this->assertTrue($this->dateParsingService->isValidDate('1st January 2024'));

        $this->assertFalse($this->dateParsingService->isValidDate('32 July 2025')); // Invalid day
        $this->assertFalse($this->dateParsingService->isValidDate('16 Julyyy 2025')); // Invalid month
        $this->assertFalse($this->dateParsingService->isValidDate('16 July')); // Missing year
    }
}
