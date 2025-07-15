import { Head, Link, router, useForm } from '@inertiajs/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TagSelect, TagSelectRef } from '@/components/ui/tag-select';
import { ErrorMessage, ConflictMessage } from '@/components/ui/error-message';
import {
    ArrowLeft,
    CheckCircle,
    XCircle,
    AlertCircle,
    FileText,
    Calendar,
    DollarSign,
    Tag,
    ChevronLeft,
    ChevronRight,
    Upload,
    Edit3
} from 'lucide-react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/utils/date';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogClose,
} from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { api, type ApiError } from '@/lib/api';

interface CsvSchema {
    id: number;
    name: string;
}

interface Account {
    id: number;
    name: string;
    number: number;
    sort_code: string;
    description?: string;
    balance: number;
}

interface Tag {
    id: number;
    name: string;
    color: string;
}

interface PreviewTransaction {
    row_number: number;
    date: string;
    balance: number; // Balance in pennies
    paid_in?: number; // Paid in amount in pennies
    paid_out?: number; // Paid out amount in pennies
    description?: string;
    reference?: string;
    unique_hash: string;
    is_duplicate: boolean;
    status: 'pending' | 'approved' | 'discarded' | 'duplicate';
    tags: Tag[];
}

interface TransactionPreview {
    transactions: PreviewTransaction[];
    errors: Array<{
        row_number: number;
        error: string;
        row_data: string[];
    }>;
    total_rows: number;
    duplicate_count: number;
    valid_count: number;
}

interface Props {
    preview: TransactionPreview;
    schema: CsvSchema;
    account: Account;
    filename: string;
    temp_path: string;
    tags: Tag[];
}

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Imports',
        href: '/imports',
    },
    {
        title: 'Review Import',
        href: '#',
    },
];

export default function ImportReview({ preview, schema, account, filename, temp_path, tags }: Props) {
    const [transactions, setTransactions] = useState<PreviewTransaction[]>(
        preview?.transactions?.map(t => ({
            ...t,
            status: t.is_duplicate ? 'duplicate' : 'pending',
            reference: t.reference || ''
        })) || []
    );
    const [availableTags, setAvailableTags] = useState<Tag[]>(tags || []);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [showFinalReview, setShowFinalReview] = useState(false);
    const [tagModalOpen, setTagModalOpen] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [tagModalMode, setTagModalMode] = useState<'create' | 'edit'>('create');
    const [criteriaLoading, setCriteriaLoading] = useState(false);
    const [criteriaError, setCriteriaError] = useState<string | null>(null);

    // Refs for tab navigation
    const tagSelectRef = useRef<TagSelectRef>(null);
    const descriptionRef = useRef<HTMLTextAreaElement>(null);
    const referenceRef = useRef<HTMLInputElement>(null);
    const approveRef = useRef<HTMLButtonElement>(null);
    const discardRef = useRef<HTMLButtonElement>(null);
    const nextRef = useRef<HTMLButtonElement>(null);
    const prevRef = useRef<HTMLButtonElement>(null);

    const { processing } = useForm();

    // Skip duplicates when navigating - add null check
    const nonDuplicateTransactions = (transactions || []).filter(t => !t.is_duplicate);
    const currentTransaction = nonDuplicateTransactions.length > 0 ? nonDuplicateTransactions[currentIndex] : null;

    // Function to handle new tag creation from TagSelect components
    const handleTagCreated = (newTag: Tag) => {
        setAvailableTags(prev => [...prev, newTag]);
    };

    // Open modal for editing a tag
    const handleEditTag = (tag: Tag) => {
        setEditingTag(tag);
        setTagModalMode('edit');
        setTagModalOpen(true);
    };

    const formatCurrency = (amount: number | undefined) => {
        if (!amount) return '-';

        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 2,
        }).format(amount / 100);
    };

    const updateCurrentTransaction = (updates: Partial<PreviewTransaction>) => {
        if (!currentTransaction) return;
        setTransactions(prev => prev.map(t =>
            t.unique_hash === currentTransaction.unique_hash ? { ...t, ...updates } : t
        ));
    };

    const updateTransactionTags = (newTags: Tag[]) => {
        if (!currentTransaction) return;
        updateCurrentTransaction({ tags: newTags });
    };

    const updateTransactionDescription = (description: string) => {
        if (!currentTransaction) return;
        updateCurrentTransaction({ description });
    };

    const updateTransactionReference = (reference: string) => {
        if (!currentTransaction) return;
        updateCurrentTransaction({ reference });
    };

    const handleApprove = () => {
        if (!currentTransaction) return;
        updateCurrentTransaction({ status: 'approved' });
        handleNext();
    };

    const handleDiscard = () => {
        if (!currentTransaction) return;
        updateCurrentTransaction({ status: 'discarded' });
        handleNext();
    };

    const handleNext = () => {
        if (currentIndex < nonDuplicateTransactions.length - 1) {
            setCurrentIndex(prev => prev + 1);
        } else {
            setShowFinalReview(true);
        }
    };

    const handlePrevious = () => {
        if (currentIndex > 0) {
            setCurrentIndex(prev => prev - 1);
        }
    };

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        // Only handle global shortcuts when not focused on input elements
        if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
            return;
        }

        switch (e.key) {
            case 'a':
            case 'A':
                e.preventDefault();
                handleApprove();
                break;
            case 'd':
            case 'D':
                e.preventDefault();
                handleDiscard();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                handlePrevious();
                break;
            case 'ArrowRight':
                e.preventDefault();
                handleNext();
                break;
        }
    }, [handleApprove, handleDiscard, handlePrevious, handleNext]);

    const handleTabNavigation = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Tab') {
            const focusableElements = [
                descriptionRef.current,
                referenceRef.current,
                tagSelectRef.current,
                approveRef.current,
                discardRef.current,
                prevRef.current,
                nextRef.current
            ].filter(Boolean);

            // Find current focus index
            let currentFocusIndex = -1;
            const activeElement = document.activeElement;

            focusableElements.forEach((el, index) => {
                if (el === tagSelectRef.current) {
                    // Check if TagSelect button or any of its dropdown elements have focus
                    const tagSelectContainer = document.querySelector('[data-tag-select]');
                    if (tagSelectContainer?.contains(activeElement)) {
                        currentFocusIndex = index;
                    }
                } else if ((el as HTMLElement)?.contains?.(activeElement as Node) || el === activeElement) {
                    currentFocusIndex = index;
                }
            });

            if (e.shiftKey) {
                // Shift+Tab (previous)
                e.preventDefault();
                const prevIndex = currentFocusIndex <= 0 ? focusableElements.length - 1 : currentFocusIndex - 1;
                const prevElement = focusableElements[prevIndex];
                if (prevElement === tagSelectRef.current) {
                    tagSelectRef.current?.focus();
                } else {
                    (prevElement as HTMLElement)?.focus();
                }
            } else {
                // Tab (next)
                e.preventDefault();
                const nextIndex = currentFocusIndex >= focusableElements.length - 1 ? 0 : currentFocusIndex + 1;
                const nextElement = focusableElements[nextIndex];
                if (nextElement === tagSelectRef.current) {
                    tagSelectRef.current?.focus();
                } else {
                    (nextElement as HTMLElement)?.focus();
                }
            }
        }
    }, []);

    useEffect(() => {
        document.addEventListener('keydown', handleKeyDown);
        document.addEventListener('keydown', handleTabNavigation);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('keydown', handleTabNavigation);
        };
    }, [currentIndex, currentTransaction, handleKeyDown, handleTabNavigation]);

    const handleSubmit = () => {
        router.post(route('transaction-imports.finalize'), {
            transactions: JSON.stringify(transactions),
            schema_id: schema.id,
            filename: filename,
            temp_path: temp_path,
            account_id: account.id,
        });
    };

    const getStatusStats = () => {
        const stats = (transactions || []).reduce((acc, t) => {
            acc[t.status] = (acc[t.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            pending: stats.pending || 0,
            approved: stats.approved || 0,
            discarded: stats.discarded || 0,
            duplicate: stats.duplicate || 0,
        };
    };

    const stats = getStatusStats();
    const canSubmit = stats.approved > 0;
    const progressValue = ((currentIndex + 1) / nonDuplicateTransactions.length) * 100;

    // Tag criteria modal state
    const [criteria, setCriteria] = useState({
        description_match: '',
        match_type: 'exact',
        balance_match: '',
        balance_min: '',
        balance_max: '',
        date_match: '',
        date_start: '',
        date_end: '',
        day_of_month: '',
        day_of_week: '',
        logic_type: 'and',
    });

    // Load criteria for editing
    useEffect(() => {
        if (editingTag && tagModalMode === 'edit' && tagModalOpen) {
            setCriteriaLoading(true);
            setCriteriaError(null);
            api.get(`/tags/${editingTag.id}/criteria`)
                .then(res => {
                    if (res.data) {
                        setCriteria({
                            description_match: res.data.description_match || '',
                            match_type: res.data.match_type || 'exact',
                            balance_match: res.data.balance_match || '',
                            balance_min: res.data.balance_min || '',
                            balance_max: res.data.balance_max || '',
                            date_match: res.data.date_match || '',
                            date_start: res.data.date_start || '',
                            date_end: res.data.date_end || '',
                            day_of_month: res.data.day_of_month || '',
                            day_of_week: res.data.day_of_week || '',
                            logic_type: res.data.logic_type || 'and',
                        });
                    } else {
                        setCriteria({
                            description_match: '',
                            match_type: 'exact',
                            balance_match: '',
                            balance_min: '',
                            balance_max: '',
                            date_match: '',
                            date_start: '',
                            date_end: '',
                            day_of_month: '',
                            day_of_week: '',
                            logic_type: 'and',
                        });
                    }
                })
                .catch((error: ApiError) => {
                    if (error.isConflict) {
                        setCriteriaError('Tag criteria already exists for this tag. Please edit the existing criteria instead.');
                    } else {
                        setCriteriaError('Failed to load criteria');
                    }
                })
                .finally(() => setCriteriaLoading(false));
        }
    }, [editingTag, tagModalMode, tagModalOpen]);

    const handleCriteriaChange = (field: string, value: string) => {
        setCriteria(prev => ({ ...prev, [field]: value }));
    };

    const handleSaveCriteria = async () => {
        setCriteriaLoading(true);
        setCriteriaError(null);
        try {
            if (editingTag && tagModalMode === 'edit') {
                // Try to load existing criteria to get its ID
                const res = await api.get(`/tags/${editingTag.id}/criteria`);
                if (res.data && res.data.id) {
                    await api.put(`/tags/${editingTag.id}/criteria/${res.data.id}`, criteria);
                } else {
                    await api.post(`/tags/${editingTag.id}/criteria`, criteria);
                }
            } else if (editingTag && tagModalMode === 'create') {
                await api.post(`/tags/${editingTag.id}/criteria`, criteria);
            }
            setTagModalOpen(false);
            // Re-fetch or re-apply recommendations for all transactions (simulate by reloading page for now)
            window.location.reload();
        } catch (error) {
            const apiError = error as ApiError;

            if (apiError.isConflict) {
                setCriteriaError('Tag criteria already exists for this tag. Please edit the existing criteria instead.');
            } else if (apiError.isValidation) {
                setCriteriaError('Please check your criteria values and try again.');
            } else {
                setCriteriaError('Failed to save criteria. Please try again.');
            }
        } finally {
            setCriteriaLoading(false);
        }
    };

    if (showFinalReview) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Final Review - ${filename}`} />

                <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                    {/* Header */}
                    <div>
                        <h1 className="text-3xl font-bold mb-4">
                            Review Transactions - {filename} • {schema.name}
                        </h1>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowFinalReview(false)}
                                >
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Review
                                </Button>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={!canSubmit || processing}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    <Upload className="h-4 w-4 mr-2" />
                                    Import {stats.approved} Transactions
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Final Summary */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Import Summary
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Total Transactions</p>
                                    <p className="text-2xl font-bold">{preview?.total_rows || 0}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                    <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Discarded</p>
                                    <p className="text-2xl font-bold text-red-600">{stats.discarded}</p>
                                </div>
                                <div className="space-y-2">
                                    <p className="text-sm font-medium text-muted-foreground">Duplicates</p>
                                    <p className="text-2xl font-bold text-yellow-600">{preview?.duplicate_count || 0}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Transaction List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>All Transactions</CardTitle>
                            <CardDescription>
                                Review and edit transactions before final import
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {(transactions || []).map((transaction) => (
                                    <div
                                        key={transaction.unique_hash}
                                        className={`p-4 border rounded-lg ${transaction.is_duplicate ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                                            transaction.status === 'approved' ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' :
                                                transaction.status === 'discarded' ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                                                    'bg-card border-border'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-sm text-muted-foreground">Row {transaction.row_number}</span>
                                                    <Badge variant={
                                                        transaction.is_duplicate ? "secondary" :
                                                            transaction.status === 'approved' ? "default" :
                                                                transaction.status === 'discarded' ? "destructive" :
                                                                    "outline"
                                                    }>
                                                        {transaction.is_duplicate ? 'Duplicate' :
                                                            transaction.status === 'approved' ? 'Approved' :
                                                                transaction.status === 'discarded' ? 'Discarded' :
                                                                    'Pending'}
                                                    </Badge>
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{formatDate(transaction.date)}</span>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {transaction.paid_in && (
                                                        <div className="text-green-600 font-medium">
                                                            +{formatCurrency(transaction.paid_in)}
                                                        </div>
                                                    )}
                                                    {transaction.paid_out && (
                                                        <div className="text-red-600 font-medium">
                                                            -{formatCurrency(transaction.paid_out)}
                                                        </div>
                                                    )}
                                                    <div className="text-sm text-muted-foreground">
                                                        Balance: {formatCurrency(transaction.balance)}
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    {transaction.description && (
                                                        <div>
                                                            <label className="text-sm font-medium">Description</label>
                                                            <Textarea
                                                                value={transaction.description}
                                                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                                                    const updatedTransactions = (transactions || []).map(t =>
                                                                        t.unique_hash === transaction.unique_hash
                                                                            ? { ...t, description: e.target.value }
                                                                            : t
                                                                    );
                                                                    setTransactions(updatedTransactions);
                                                                }}
                                                                className="mt-1"
                                                                rows={2}
                                                            />
                                                        </div>
                                                    )}

                                                    {!transaction.is_duplicate && (
                                                        <div>
                                                            <label className="text-sm font-medium">Reference</label>
                                                            <Input
                                                                value={transaction.reference || ''}
                                                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                                    const updatedTransactions = (transactions || []).map(t =>
                                                                        t.unique_hash === transaction.unique_hash
                                                                            ? { ...t, reference: e.target.value }
                                                                            : t
                                                                    );
                                                                    setTransactions(updatedTransactions);
                                                                }}
                                                                placeholder="Add reference information..."
                                                                className="mt-1"
                                                            />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Tags */}
                                                {!transaction.is_duplicate && (
                                                    <TagSelect
                                                        tags={availableTags}
                                                        selectedTags={transaction.tags}
                                                        onTagsChange={(newTags) => {
                                                            const updatedTransactions = (transactions || []).map(t =>
                                                                t.unique_hash === transaction.unique_hash
                                                                    ? { ...t, tags: newTags }
                                                                    : t
                                                            );
                                                            setTransactions(updatedTransactions);
                                                        }}
                                                        onTagCreated={handleTagCreated}
                                                        onEditTag={handleEditTag}
                                                        placeholder="Add tag"
                                                    />
                                                )}
                                            </div>

                                            {/* Actions */}
                                            {!transaction.is_duplicate && (
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={transaction.status === 'approved' ? 'default' : 'outline'}
                                                        onClick={() => {
                                                            const updatedTransactions = (transactions || []).map(t =>
                                                                t.unique_hash === transaction.unique_hash
                                                                    ? { ...t, status: 'approved' as const }
                                                                    : t
                                                            );
                                                            setTransactions(updatedTransactions);
                                                        }}
                                                        className={transaction.status === 'approved' ? 'bg-green-600 hover:bg-green-700' : ''}
                                                    >
                                                        <CheckCircle className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant={transaction.status === 'discarded' ? 'destructive' : 'outline'}
                                                        onClick={() => {
                                                            const updatedTransactions = (transactions || []).map(t =>
                                                                t.unique_hash === transaction.unique_hash
                                                                    ? { ...t, status: 'discarded' as const }
                                                                    : t
                                                            );
                                                            setTransactions(updatedTransactions);
                                                        }}
                                                    >
                                                        <XCircle className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AppLayout>
        );
    }

    if (!currentTransaction) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title={`Review Import - ${filename}`} />
                <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                    <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            No transactions to review. All transactions may be duplicates or the import data is not available.
                        </AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={`Review Import - ${filename}`} />

            <div className="flex h-full flex-1 flex-col gap-6 rounded-xl p-4">
                {/* Header */}
                <div>
                    <h1 className="text-3xl font-bold mb-4">
                        Review Transactions - {filename} • {schema.name}
                    </h1>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href={route('transaction-imports.create')}>
                                <Button variant="outline" size="sm">
                                    <ArrowLeft className="h-4 w-4 mr-2" />
                                    Back to Import
                                </Button>
                            </Link>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                                {currentIndex + 1} of {nonDuplicateTransactions.length}
                            </span>
                            <Button
                                onClick={() => setShowFinalReview(true)}
                                variant="outline"
                                size="sm"
                            >
                                <Edit3 className="h-4 w-4 mr-2" />
                                Final Review
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Progress</span>
                        <span className="text-sm text-muted-foreground">
                            {currentIndex + 1} / {nonDuplicateTransactions.length}
                        </span>
                    </div>
                    <Progress value={progressValue} className="h-2" />
                </div>

                {/* Current Transaction Card */}
                <Card className="flex-1">
                    <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                            <span className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                Transaction {currentIndex + 1}
                            </span>
                            <Badge variant="outline">
                                Row {currentTransaction.row_number}
                            </Badge>
                        </CardTitle>
                        <CardDescription>
                            Review transaction details and assign tags
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        {/* Transaction Details */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Date</span>
                                </div>
                                <p className="text-lg font-semibold">{formatDate(currentTransaction.date)}</p>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm font-medium">Amount</span>
                                </div>
                                <div className="space-y-1">
                                    {currentTransaction.paid_in && (
                                        <div className="text-lg font-semibold text-green-600">
                                            +{formatCurrency(currentTransaction.paid_in)}
                                        </div>
                                    )}
                                    {currentTransaction.paid_out && (
                                        <div className="text-lg font-semibold text-red-600">
                                            -{formatCurrency(currentTransaction.paid_out)}
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-sm font-medium text-muted-foreground">Balance</span>
                                <p className="text-lg font-semibold">{formatCurrency(currentTransaction.balance)}</p>
                            </div>
                        </div>

                        {/* Editable Fields */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">Description</label>
                                <Textarea
                                    ref={descriptionRef}
                                    value={currentTransaction.description || ''}
                                    onChange={(e) => updateTransactionDescription(e.target.value)}
                                    placeholder="Transaction description..."
                                    className="mt-1"
                                    rows={3}
                                />
                            </div>

                            <div>
                                <label className="text-sm font-medium">Reference</label>
                                <Input
                                    ref={referenceRef}
                                    value={currentTransaction.reference || ''}
                                    onChange={(e) => updateTransactionReference(e.target.value)}
                                    placeholder="Add reference information..."
                                    className="mt-1"
                                />
                            </div>

                            <div data-tag-select>
                                <TagSelect
                                    ref={tagSelectRef}
                                    tags={availableTags}
                                    selectedTags={currentTransaction?.tags || []}
                                    onTagsChange={updateTransactionTags}
                                    onTagCreated={handleTagCreated}
                                    onEditTag={handleEditTag}
                                    placeholder="Add tag"
                                />
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center justify-between pt-4 border-t">
                            <Button
                                ref={prevRef}
                                variant="outline"
                                onClick={handlePrevious}
                                disabled={currentIndex === 0}
                                className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                <ChevronLeft className="h-4 w-4 mr-2" />
                                Previous
                            </Button>

                            <div className="flex gap-2">
                                <Button
                                    ref={approveRef}
                                    className="bg-green-600 hover:bg-green-700 focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
                                    onClick={handleApprove}
                                >
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Approve (A)
                                </Button>
                                <Button
                                    ref={discardRef}
                                    variant="destructive"
                                    onClick={handleDiscard}
                                    className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                    <XCircle className="h-4 w-4 mr-2" />
                                    Discard (D)
                                </Button>
                            </div>

                            <Button
                                ref={nextRef}
                                variant="outline"
                                onClick={handleNext}
                                className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                            >
                                {currentIndex === nonDuplicateTransactions.length - 1 ? 'Finish' : 'Next'}
                                <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        </div>

                        {/* Keyboard Shortcuts Help */}
                        <div className="text-xs text-muted-foreground pt-2 border-t">
                            <p><strong>Keyboard shortcuts:</strong> A = Approve, D = Discard, ← → = Navigate, Tab = Next field</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Errors */}
                {preview?.errors?.length > 0 && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                            <strong>Import Errors:</strong> {preview.errors.length} rows could not be processed.
                        </AlertDescription>
                    </Alert>
                )}
            </div>
            {/* Tag Criteria Modal */}
            <Dialog open={tagModalOpen} onOpenChange={setTagModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>
                            {tagModalMode === 'create' ? 'Create Tag Criteria' : 'Edit Tag Criteria'}
                        </DialogTitle>
                    </DialogHeader>

                    {criteriaError && (
                        <ErrorMessage
                            error={criteriaError}
                            onDismiss={() => setCriteriaError(null)}
                        />
                    )}

                    <div className="space-y-4">
                        {/* Description Criteria */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Description Match</label>
                            <Input
                                placeholder="Enter description to match"
                                value={criteria.description_match}
                                onChange={(e) => handleCriteriaChange('description_match', e.target.value)}
                            />
                            <Select
                                value={criteria.match_type}
                                onValueChange={(value) => handleCriteriaChange('match_type', value)}
                            >
                                <option value="exact">Exact Match</option>
                                <option value="contains">Contains</option>
                            </Select>
                        </div>

                        {/* Balance Criteria */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Balance Criteria</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    placeholder="Min amount"
                                    type="number"
                                    step="0.01"
                                    value={criteria.balance_min}
                                    onChange={(e) => handleCriteriaChange('balance_min', e.target.value)}
                                />
                                <Input
                                    placeholder="Max amount"
                                    type="number"
                                    step="0.01"
                                    value={criteria.balance_max}
                                    onChange={(e) => handleCriteriaChange('balance_max', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Date Criteria */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Date Criteria</label>
                            <div className="grid grid-cols-2 gap-2">
                                <Input
                                    type="date"
                                    value={criteria.date_start}
                                    onChange={(e) => handleCriteriaChange('date_start', e.target.value)}
                                />
                                <Input
                                    type="date"
                                    value={criteria.date_end}
                                    onChange={(e) => handleCriteriaChange('date_end', e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Logic Type */}
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Logic Type</label>
                            <Select
                                value={criteria.logic_type}
                                onValueChange={(value) => handleCriteriaChange('logic_type', value)}
                            >
                                <option value="and">AND (All criteria must match)</option>
                                <option value="or">OR (Any criteria can match)</option>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <DialogClose asChild>
                            <Button variant="outline">Cancel</Button>
                        </DialogClose>
                        <Button
                            onClick={handleSaveCriteria}
                            disabled={criteriaLoading}
                        >
                            {criteriaLoading ? 'Saving...' : 'Save Criteria'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </AppLayout>
    );
} 