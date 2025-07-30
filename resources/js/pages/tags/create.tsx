import { Head, useForm } from '@inertiajs/react';
import { TAG_COLORS, VALIDATION_MESSAGES } from '@/utils/constants';
import { generateRandomColor } from '@/utils/form-helpers';
import { ArrowLeft, Save, Plus, X, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Link } from '@inertiajs/react';
import { type BreadcrumbItem } from '@/types';
import AppLayout from '@/layouts/app-layout';
import { FormEvent, useState, useEffect } from 'react';
import { TagCriteria, TagFormData } from '@/types/global';
import { useToast } from '@/components/ui/toast';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Tags',
        href: '/tags',
    },
    {
        title: 'Create Tag',
        href: '/tags/create',
    },
];


export default function TagsCreate() {
    const { data, setData, post, processing, errors } = useForm<TagFormData>({
        name: '',
        color: '',
        description: '',
        criterias: [],
    });

    const [newCriteria, setNewCriteria] = useState<TagCriteria>({
        type: 'description',
        match_type: 'exact',
        value: '',
        logic_type: 'and',
    });

    const { showToast } = useToast();

    // Show toast notifications for validation errors
    useEffect(() => {
        if (Object.keys(errors).length > 0) {
            // Show general error toast
            showToast(VALIDATION_MESSAGES.VALIDATION_ERRORS, 'error');
        }
    }, [errors, showToast]);

    const handleSubmit = (e: FormEvent) => {
        e.preventDefault();

        // Client-side validation
        if (!data.name.trim()) {
            showToast(VALIDATION_MESSAGES.TAG_NAME_REQUIRED, 'error');
            return;
        }

        post(route('tags.store'), {
            onError: (errors) => {
                showToast(VALIDATION_MESSAGES.VALIDATION_ERRORS, 'error');
            },
            onSuccess: () => {
                showToast(VALIDATION_MESSAGES.TAG_CREATED_SUCCESS, 'success');
            },
        });
    };

    const handleGenerateRandomColor = () => {
        setData('color', generateRandomColor());
    };
    const addCriteria = () => {
        if (!newCriteria.value) {
            showToast('Please enter a value for the criteria.', 'error');
            return;
        }

        // Validate amount criteria
        if (newCriteria.type === 'amount') {
            const amountValue = parseFloat(newCriteria.value);
            if (isNaN(amountValue)) {
                showToast('Please enter a valid number for amount criteria.', 'error');
                return;
            }
            if (newCriteria.match_type === 'range') {
                if (!newCriteria.value_to) {
                    showToast('Range end value is required for range criteria.', 'error');
                    return;
                }
                const rangeValue = parseFloat(newCriteria.value_to);
                if (isNaN(rangeValue)) {
                    showToast('Please enter a valid number for the range end value.', 'error');
                    return;
                }
                if (amountValue >= rangeValue) {
                    showToast('Range start value must be less than range end value.', 'error');
                    return;
                }
            }
        }

        // Validate date criteria
        if (newCriteria.type === 'date') {
            if (newCriteria.match_type === 'exact') {
                const dateValue = new Date(newCriteria.value);
                if (isNaN(dateValue.getTime())) {
                    showToast('Please enter a valid date (YYYY-MM-DD format).', 'error');
                    return;
                }
            } else if (newCriteria.match_type === 'day_of_month') {
                const dayValue = parseInt(newCriteria.value);
                if (isNaN(dayValue) || dayValue < 1 || dayValue > 31) {
                    showToast('Day of month must be a number between 1 and 31.', 'error');
                    return;
                }
            } else if (newCriteria.match_type === 'day_of_week') {
                const dayValue = parseInt(newCriteria.value);
                if (isNaN(dayValue) || dayValue < 1 || dayValue > 7) {
                    showToast('Day of week must be a number between 1 and 7.', 'error');
                    return;
                }
            }
        }

        // Create the criteria object with proper field mapping
        const criteriaToAdd = { ...newCriteria };

        // For date criteria, map the value to the correct field
        if (newCriteria.type === 'date') {
            if (newCriteria.match_type === 'day_of_month') {
                criteriaToAdd.day_of_month = parseInt(newCriteria.value);
                criteriaToAdd.value = ''; // Clear the value field
            } else if (newCriteria.match_type === 'day_of_week') {
                criteriaToAdd.day_of_week = parseInt(newCriteria.value);
                criteriaToAdd.value = ''; // Clear the value field
            }
        }

        setData('criterias', [...data.criterias, criteriaToAdd]);

        setNewCriteria({
            type: 'description',
            match_type: 'exact',
            value: '',
            logic_type: 'and',
        });
        showToast('Criteria added successfully!', 'success');
    };

    const removeCriteria = (index: number) => {
        setData('criterias', data.criterias.filter((_, i) => i !== index));
    };

    const getMatchTypeOptions = (type: string) => {
        switch (type) {
            case 'description':
                return [
                    { value: 'exact', label: 'Exact Match' },
                    { value: 'contains', label: 'Contains' },
                    { value: 'starts_with', label: 'Starts With' },
                    { value: 'ends_with', label: 'Ends With' },
                ];
            case 'amount':
                return [
                    { value: 'exact', label: 'Exact Amount' },
                    { value: 'range', label: 'Range' },
                    { value: 'greater_than', label: 'Greater Than' },
                    { value: 'less_than', label: 'Less Than' },
                ];
            case 'date':
                return [
                    { value: 'exact', label: 'Exact Date' },
                    { value: 'day_of_month', label: 'Day of Month' },
                    { value: 'day_of_week', label: 'Day of Week' },
                ];
            default:
                return [];
        }
    };

    const getCriteriaDescription = (criteria: Criteria): string => {
        const typeName = criteria.type.charAt(0).toUpperCase() + criteria.type.slice(1);
        const matchName = getMatchTypeOptions(criteria.type).find(opt => opt.value === criteria.match_type)?.label || criteria.match_type;

        switch (criteria.type) {
            case 'description':
                return `${typeName} ${matchName}: "${criteria.value}"`;
            case 'amount':
                if (criteria.match_type === 'range' && criteria.value_to) {
                    return `${typeName} between $${criteria.value} and $${criteria.value_to}`;
                }
                return `${typeName} ${matchName}: $${criteria.value}`;
            case 'date':
                if (criteria.match_type === 'day_of_month') {
                    return `${typeName} on day ${criteria.day_of_month || criteria.value} of month`;
                }
                if (criteria.match_type === 'day_of_week') {
                    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
                    const dayNumber = criteria.day_of_week || parseInt(criteria.value);
                    const dayName = days[dayNumber - 1] || 'Unknown';
                    return `${typeName} on ${dayName}`;
                }
                return `${typeName} ${matchName}: ${criteria.value}`;
            default:
                return 'Unknown criteria';
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Create Tag" />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" asChild>
                        <Link href={route('tags.index')}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Back to Tags
                        </Link>
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Create Tag</h1>
                        <p className="text-muted-foreground">
                            Create a new tag with automatic criteria matching for your transactions.
                        </p>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tag Details and Criteria Management - Side by Side */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Tag Details */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tag Details</CardTitle>
                                <CardDescription>
                                    Create a new tag with a name, color, and optional description.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Name */}
                                <div className="space-y-2">
                                    <Label htmlFor="name">Name *</Label>
                                    <Input
                                        id="name"
                                        value={data.name}
                                        onChange={(e) => setData('name', e.target.value)}
                                        placeholder="Enter tag name"
                                        className={errors.name ? 'border-red-500' : ''}
                                        required
                                    />
                                    {errors.name && (
                                        <p className="text-sm text-red-500">{errors.name}</p>
                                    )}
                                </div>

                                {/* Color */}
                                <div className="space-y-2">
                                    <Label htmlFor="color">Color</Label>
                                    <div className="flex items-center space-x-3">
                                        <Input
                                            id="color"
                                            type="color"
                                            value={data.color}
                                            onChange={(e) => setData('color', e.target.value)}
                                            className="w-16 h-10 p-1 border rounded"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            onClick={handleGenerateRandomColor}
                                        >
                                            Random Color
                                        </Button>
                                        {data.color && (
                                            <div className="flex items-center space-x-2">
                                                <div
                                                    className="w-6 h-6 rounded border"
                                                    style={{ backgroundColor: data.color }}
                                                />
                                                <span className="text-sm text-muted-foreground">
                                                    {data.color}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                    {errors.color && (
                                        <p className="text-sm text-red-500">{errors.color}</p>
                                    )}
                                </div>

                                {/* Description */}
                                <div className="space-y-2">
                                    <Label htmlFor="description">Description</Label>
                                    <Textarea
                                        id="description"
                                        value={data.description}
                                        onChange={(e) => setData('description', e.target.value)}
                                        placeholder="Optional description for this tag"
                                        rows={3}
                                        className={errors.description ? 'border-red-500' : ''}
                                    />
                                    {errors.description && (
                                        <p className="text-sm text-red-500">{errors.description}</p>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Criteria Management */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Auto-Apply Criteria</CardTitle>
                                <CardDescription>
                                    Define criteria to automatically apply this tag to matching transactions.
                                    You can add multiple criteria types and combine them with AND/OR logic.
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Existing Criteria */}
                                {data.criterias.length > 0 && (
                                    <div className="space-y-3">
                                        <Label>Current Criteria</Label>
                                        <div className="space-y-2">
                                            {data.criterias.map((criteria, index) => (
                                                <div key={index} className="space-y-2">
                                                    <div className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                                                        <div className="flex items-center space-x-2">
                                                            <Badge variant="outline">
                                                                {criteria.type.charAt(0).toUpperCase() + criteria.type.slice(1)}
                                                            </Badge>
                                                            <span className="text-sm">{getCriteriaDescription(criteria)}</span>
                                                        </div>
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeCriteria(index)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                    {/* Show errors for this specific criteria */}
                                                    {errors[`criterias.${index}.value`] && (
                                                        <p className="text-sm text-red-500 px-3">
                                                            {errors[`criterias.${index}.value`]}
                                                        </p>
                                                    )}
                                                    {errors[`criterias.${index}.value_to`] && (
                                                        <p className="text-sm text-red-500 px-3">
                                                            {errors[`criterias.${index}.value_to`]}
                                                        </p>
                                                    )}
                                                    {errors[`criterias.${index}.day_of_month`] && (
                                                        <p className="text-sm text-red-500 px-3">
                                                            {errors[`criterias.${index}.day_of_month`]}
                                                        </p>
                                                    )}
                                                    {errors[`criterias.${index}.day_of_week`] && (
                                                        <p className="text-sm text-red-500 px-3">
                                                            {errors[`criterias.${index}.day_of_week`]}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                        <Separator />
                                    </div>
                                )}

                                {/* Add New Criteria */}
                                <div className="space-y-4">
                                    <Label>Add New Criteria</Label>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {/* Criteria Type */}
                                        <div className="space-y-2">
                                            <Label>Type</Label>
                                            <Select
                                                value={newCriteria.type}
                                                onValueChange={(value: 'description' | 'amount' | 'date') =>
                                                    setNewCriteria(prev => ({ ...prev, type: value, match_type: 'exact' }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="description">Description</SelectItem>
                                                    <SelectItem value="amount">Amount</SelectItem>
                                                    <SelectItem value="date">Date</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Match Type */}
                                        <div className="space-y-2">
                                            <Label>Match Type</Label>
                                            <Select
                                                value={newCriteria.match_type}
                                                onValueChange={(value) =>
                                                    setNewCriteria(prev => ({ ...prev, match_type: value }))
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {getMatchTypeOptions(newCriteria.type).map(option => (
                                                        <SelectItem key={option.value} value={option.value}>
                                                            {option.label}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>

                                        {/* Value */}
                                        <div className="space-y-2">
                                            <Label>Value</Label>
                                            <Input
                                                value={newCriteria.value}
                                                onChange={(e) => setNewCriteria(prev => ({ ...prev, value: e.target.value }))}
                                                placeholder={
                                                    newCriteria.type === 'description' ? 'Enter text to match' :
                                                        newCriteria.type === 'amount' ? 'Enter amount' :
                                                            newCriteria.type === 'date' ? 'Enter date (YYYY-MM-DD)' : 'Enter value'
                                                }
                                                className={errors['criterias.*.value'] ? 'border-red-500' : ''}
                                            />
                                            {errors['criterias.*.value'] && (
                                                <p className="text-sm text-red-500">{errors['criterias.*.value']}</p>
                                            )}
                                        </div>

                                        {/* Value To (for ranges) */}
                                        {newCriteria.match_type === 'range' && (
                                            <div className="space-y-2">
                                                <Label>To *</Label>
                                                <Input
                                                    value={newCriteria.value_to || ''}
                                                    onChange={(e) => setNewCriteria(prev => ({ ...prev, value_to: e.target.value }))}
                                                    placeholder="Maximum value"
                                                    className={errors['criterias.*.value_to'] ? 'border-red-500' : ''}
                                                    required
                                                />
                                                {errors['criterias.*.value_to'] && (
                                                    <p className="text-sm text-red-500">{errors['criterias.*.value_to']}</p>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={addCriteria}
                                        disabled={!newCriteria.value}
                                        className="w-full"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Criteria
                                    </Button>
                                </div>

                                {/* Logic Type */}
                                {data.criterias.length > 1 && (
                                    <div className="space-y-2">
                                        <Label>Combine Criteria With</Label>
                                        <Select
                                            value={data.criterias[0]?.logic_type || 'and'}
                                            onValueChange={(value: 'and' | 'or') =>
                                                setData('criterias', data.criterias.map(c => ({ ...c, logic_type: value })))
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="and">AND (All must match)</SelectItem>
                                                <SelectItem value="or">OR (Any can match)</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3">
                        <Button variant="outline" asChild>
                            <Link href={route('tags.index')}>
                                Cancel
                            </Link>
                        </Button>
                        <Button type="submit" disabled={processing}>
                            <Save className="mr-2 h-4 w-4" />
                            {processing ? 'Creating...' : 'Create Tag'}
                        </Button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
