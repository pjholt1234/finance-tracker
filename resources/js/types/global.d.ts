import type { route as routeFn } from 'ziggy-js';

declare global {
    const route: typeof routeFn;
}

interface CsvPreviewData {
    headers: string[];
    rows: string[][];
    detected_date_formats: string[];
}

interface Account {
    id: number;
    name: string;
    number: number;
    sort_code?: string;
    description?: string;
    balance_at_start: number;
    balance: number;
    formatted_balance: string;
    formatted_balance_at_start: string;
    user_id: number;
    created_at: string;
    updated_at: string;
    imports?: Import[];
    total_transaction_count?: number;
    transactions?: Transaction[];
}

interface Import {
    id: number;
    filename: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    total_rows: number;
    processed_rows: number;
    imported_rows: number;
    duplicate_rows: number;
    error_message?: string;
    started_at?: string;
    completed_at?: string;
    created_at: string;
    csv_schema: CsvSchema;
    transactions: Transaction[];
}

interface Transaction {
    id: number;
    date: string;
    balance: number; // Balance in pennies
    paid_in?: number; // Paid in amount in pennies
    paid_out?: number; // Paid out amount in pennies
    description?: string;
    reference?: string;
    import_id: number;
    created_at: string;
    updated_at: string;
}

interface CsvSchema {
    id: number;
    name: string;
    transaction_data_start: number;
    date_column: number;
    balance_column: number;
    amount_column?: number;
    paid_in_column?: number;
    paid_out_column?: number;
    description_column?: number;
    date_format?: string;
    created_at: string;
    updated_at: string;
}

interface Tag {
    id: number;
    name: string;
    color: string;
}

export { Account, Import, Transaction, CsvSchema, CsvPreviewData, Tag };
