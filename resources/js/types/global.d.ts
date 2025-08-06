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
    csv_schema_id?: number;
    csv_schema?: CsvSchema;
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

interface TagCriteria {
    id: number;
    tag_id: number;
    type: string;
    match_type: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value_to: any;
    day_of_month: number | null;
    day_of_week: number | null;
    logic_type: string;
    created_at: string;
    updated_at: string;
}

interface Tag {
    id: number;
    name: string;
    color: string;
    description: string | null;
    archived: boolean;
    created_at: string;
    updated_at: string;
    transactions: Transaction[];
    criterias: TagCriteria[];
}

// Common UI/Component types
interface TransactionData {
    description?: string;
    amount?: number;
    date?: string;
}

interface PreviewTransaction {
    id?: number;
    date: string;
    balance: number;
    paid_in?: number;
    paid_out?: number;
    description?: string;
    reference?: string;
    unique_hash: string;
    is_duplicate: boolean;
    suggested_tags?: Tag[];
}

// Form data interfaces with more specific names
interface AccountFormData {
    name: string;
    number: number;
    sort_code?: string;
    description?: string;
    balance_at_start: number;
    csv_schema_id?: number;
}

interface TagFormData {
    name: string;
    color: string;
    description: string;
    criterias: TagCriteria[];
}

// Form-specific criteria interface (without database fields)
interface TagCriteriaForm {
    type: 'description' | 'amount' | 'date';
    match_type: string;
    value: string;
    value_to?: string;
    day_of_month?: number;
    day_of_week?: number;
    logic_type: 'and' | 'or';
}

// Export all interfaces at the bottom
export {
    Account,
    AccountFormData,
    CsvPreviewData,
    CsvSchema,
    Import,
    PreviewTransaction,
    Tag,
    TagCriteria,
    TagCriteriaForm,
    TagFormData,
    Transaction,
    TransactionData,
};
