<?php

namespace App\Services;

use Carbon\Carbon;
use Exception;

class DateParsingService
{
    /**
     * Common date formats to try when parsing dates
     */
    private const DATE_FORMATS = [
        'Y-m-d',           // 2024-01-15
        'd/m/Y',           // 15/01/2024
        'm/d/Y',           // 01/15/2024
        'd-m-Y',           // 15-01-2024
        'm-d-Y',           // 01-15-2024
        'Y/m/d',           // 2024/01/15
        'd.m.Y',           // 15.01.2024
        'j/n/Y',           // 5/1/2024
        'j-n-Y',           // 5-1-2024
        'j.n.Y',           // 5.1.2024
        'd/m/y',           // 15/01/24
        'm/d/y',           // 01/15/24
        'd-m-y',           // 15-01-24
        'm-d-y',           // 01-15-24
        'Y-m-d H:i:s',     // 2024-01-15 10:30:00
        'd/m/Y H:i:s',     // 15/01/2024 10:30:00
        'm/d/Y H:i:s',     // 01/15/2024 10:30:00
        // Textual month formats
        'j F Y',           // 16 July 2025
        'd F Y',           // 16 July 2025
        'j M Y',           // 12 Jul 2024
        'd M Y',           // 12 Jul 2024
        'F j, Y',          // July 16, 2025
        'F d, Y',          // July 16, 2025
        'M j, Y',          // Jul 12, 2024
        'M d, Y',          // Jul 12, 2024
        'j F, Y',          // 16 July, 2025
        'd F, Y',          // 16 July, 2025
        'j M, Y',          // 12 Jul, 2024
        'd M, Y',          // 12 Jul, 2024
        'jS F Y',          // 11th July 2025
        'jS M Y',          // 11th Jul 2025
        'jS F, Y',         // 11th July, 2025
        'jS M, Y',         // 11th Jul, 2025
    ];

    /**
     * Parse a date string and return it in Y-m-d format
     *
     * @param string $dateString The date string to parse
     * @param string|null $expectedFormat Optional expected format to try first
     * @return string Date in Y-m-d format
     * @throws Exception If date cannot be parsed
     */
    public function parseDate(string $dateString, ?string $expectedFormat = null): string
    {
        $dateString = trim($dateString);

        if (empty($dateString)) {
            throw new Exception('Date string is empty');
        }

        // Normalize the date string for better parsing
        $dateString = $this->normalizeDateString($dateString);

        // Try the expected format first if provided
        if ($expectedFormat) {
            try {
                $date = Carbon::createFromFormat($expectedFormat, $dateString);
                if ($date && $this->isValidDateForFormat($date, $expectedFormat, $dateString)) {
                    return $date->format('Y-m-d');
                }
            } catch (Exception $e) {
                // Continue to try other formats
            }
        }

        // Try common formats
        foreach (self::DATE_FORMATS as $format) {
            try {
                $date = Carbon::createFromFormat($format, $dateString);
                if ($date && $this->isValidDateForFormat($date, $format, $dateString)) {
                    return $date->format('Y-m-d');
                }
            } catch (Exception $e) {
                // Continue to next format
                continue;
            }
        }

        // Try Carbon's general parsing as a last resort, but be more strict
        try {
            // Only use general parsing if the string contains a year (4 digits)
            if (preg_match('/\b\d{4}\b/', $dateString)) {
                $date = Carbon::parse($dateString);
                return $date->format('Y-m-d');
            }
        } catch (Exception $e) {
            // Continue to throw exception below
        }

        throw new Exception("Unable to parse date: {$dateString}");
    }

    /**
     * Normalize date string for better parsing
     *
     * @param string $dateString
     * @return string
     */
    private function normalizeDateString(string $dateString): string
    {
        // Remove extra whitespace
        $dateString = preg_replace('/\s+/', ' ', trim($dateString));

        // Handle ordinal numbers (1st, 2nd, 3rd, 4th, etc.)
        $dateString = preg_replace('/(\d+)(st|nd|rd|th)\b/', '$1', $dateString);

        return $dateString;
    }

    /**
     * Check if a parsed date is valid for the given format
     *
     * @param Carbon $date
     * @param string $format
     * @param string $originalString
     * @return bool
     */
    private function isValidDateForFormat(Carbon $date, string $format, string $originalString): bool
    {
        // Check if formatting the date back matches the original string
        $formatted = $date->format($format);

        // For formats with single digit days/months, we need to be more flexible
        if (in_array($format, ['j/n/Y', 'j-n-Y', 'j.n.Y'])) {
            // Allow both single and double digit formats
            return $formatted === $originalString ||
                $date->format('d/m/Y') === $originalString ||
                $date->format('d-m-Y') === $originalString ||
                $date->format('d.m.Y') === $originalString;
        }

        // For textual month formats, be more flexible with spacing and case
        if (strpos($format, 'F') !== false || strpos($format, 'M') !== false) {
            // Normalize both strings for comparison
            $normalizedFormatted = strtolower(preg_replace('/\s+/', ' ', trim($formatted)));
            $normalizedOriginal = strtolower(preg_replace('/\s+/', ' ', trim($originalString)));

            return $normalizedFormatted === $normalizedOriginal;
        }

        return $formatted === $originalString;
    }

    /**
     * Detect the most likely date format from a sample of date strings
     *
     * @param array $dateStrings Array of date strings to analyze
     * @return string|null The most likely format or null if none found
     */
    public function detectDateFormat(array $dateStrings): ?string
    {
        $formatCounts = [];

        foreach ($dateStrings as $dateString) {
            if (empty(trim($dateString))) {
                continue;
            }

            foreach (self::DATE_FORMATS as $format) {
                try {
                    $date = Carbon::createFromFormat($format, trim($dateString));
                    if ($date && $this->isValidDateForFormat($date, $format, trim($dateString))) {
                        $formatCounts[$format] = ($formatCounts[$format] ?? 0) + 1;
                        break; // Stop at first matching format for this string
                    }
                } catch (Exception $e) {
                    continue;
                }
            }
        }

        if (empty($formatCounts)) {
            return null;
        }

        // Return the format that matched the most strings
        arsort($formatCounts);
        return array_key_first($formatCounts);
    }

    /**
     * Validate if a date string can be parsed
     *
     * @param string $dateString
     * @param string|null $expectedFormat
     * @return bool
     */
    public function isValidDate(string $dateString, ?string $expectedFormat = null): bool
    {
        try {
            // If expected format is provided, only check that format
            if ($expectedFormat) {
                $date = Carbon::createFromFormat($expectedFormat, $dateString);
                return $date && $this->isValidDateForFormat($date, $expectedFormat, $dateString);
            }

            $this->parseDate($dateString, $expectedFormat);
            return true;
        } catch (Exception $e) {
            return false;
        }
    }

    /**
     * Get all supported date formats
     *
     * @return array
     */
    public function getSupportedFormats(): array
    {
        return self::DATE_FORMATS;
    }
}
