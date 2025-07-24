import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Plus, X, Trash2, CheckCircle, XCircle, Sparkles } from 'lucide-react';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { Tag } from '@/types/global';

interface Criteria {
    type: 'description' | 'amount' | 'date';
    match_type: string;
    value: string;
    value_to?: string;
    day_of_month?: number;
    day_of_week?: number;
    logic_type: 'and' | 'or';
}

interface TransactionData {
    description?: string;
    amount?: number;
    date?: string;
}

interface TagCreateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onTagCreated: (tag: Tag) => void;
    onTagUpdated?: (tag: Tag) => void;
    transactionData?: TransactionData;
    initialTagName?: string;
    editingTag?: Tag | null;
}

export function TagCreateModal({
    open,
    onOpenChange,
    onTagCreated,
    onTagUpdated,
    transactionData,
    initialTagName = '',
    editingTag
}: TagCreateModalProps) {
    const [formData, setFormData] = useState({
        name: initialTagName,
        color: '',
        description: '',
        criterias: [] as Criteria[],
    });

    const [newCriteria, setNewCriteria] = useState<Criteria>({
        type: 'description',
        match_type: 'exact',
        value: '',
        logic_type: 'and',
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const { showToast } = useToast();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open) {
            const editMode = !!editingTag;
            setIsEditMode(editMode);

            if (editingTag) {
                // Load editing tag data
                const mappedCriterias: Criteria[] = (editingTag.criterias || []).map(criteria => ({
                    type: criteria.type as 'description' | 'amount' | 'date',
                    match_type: criteria.match_type,
                    value: criteria.value,
                    value_to: criteria.value_to || undefined,
                    day_of_month: criteria.day_of_month || undefined,
                    day_of_week: criteria.day_of_week || undefined,
                    logic_type: criteria.logic_type as 'and' | 'or',
                }));

                const newFormData = {
                    name: editingTag.name,
                    color: editingTag.color,
                    description: editingTag.description || '',
                    criterias: mappedCriterias,
                };

                setFormData(newFormData);
            } else {
                // Reset form for new tag
                setFormData({
                    name: initialTagName,
                    color: '',
                    description: '',
                    criterias: [],
                });
            }

            setNewCriteria({
                type: 'description',
                match_type: 'exact',
                value: '',
                logic_type: 'and',
            });
        }
    }, [open, editingTag]);

    const generateRandomColor = () => {
        const colors = [
            '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
            '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
            '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
            '#ec4899', '#f43f5e'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        setFormData(prev => ({ ...prev, color: randomColor }));
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

        setFormData(prev => ({ ...prev, criterias: [...prev.criterias, criteriaToAdd] }));
        setNewCriteria({
            type: 'description',
            match_type: 'exact',
            value: '',
            logic_type: 'and',
        });
    };

    const removeCriteria = (index: number) => {
        setFormData(prev => ({
            ...prev,
            criterias: prev.criterias.filter((_, i) => i !== index)
        }));
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

    // Test if criteria matches the current transaction
    const testCriteriaMatch = (criteria: Criteria): boolean => {
        if (!transactionData) {
            return false;
        }

        switch (criteria.type) {
            case 'description':
                if (!transactionData.description || !criteria.value) return false;
                switch (criteria.match_type) {
                    case 'exact':
                        return transactionData.description === criteria.value;
                    case 'contains':
                        return transactionData.description.toLowerCase().includes(criteria.value.toLowerCase());
                    case 'starts_with':
                        return transactionData.description.toLowerCase().startsWith(criteria.value.toLowerCase());
                    case 'ends_with':
                        return transactionData.description.toLowerCase().endsWith(criteria.value.toLowerCase());
                    default:
                        return false;
                }
            case 'amount':
                if (transactionData.amount === undefined || !criteria.value) return false;
                const amount = transactionData.amount;
                const value = parseFloat(criteria.value);
                if (isNaN(value)) return false;

                switch (criteria.match_type) {
                    case 'exact':
                        return Math.abs(amount - value) < 0.01;
                    case 'range':
                        const valueTo = parseFloat(criteria.value_to || '0');
                        return amount >= value && amount <= valueTo;
                    case 'greater_than':
                        return amount > value;
                    case 'less_than':
                        return amount < value;
                    default:
                        return false;
                }
            case 'date':
                if (!transactionData.date) return false;
                const date = new Date(transactionData.date);
                if (isNaN(date.getTime())) return false;

                switch (criteria.match_type) {
                    case 'exact':
                        return date.toISOString().split('T')[0] === criteria.value;
                    case 'day_of_month':
                        return date.getDate() === (criteria.day_of_month || parseInt(criteria.value));
                    case 'day_of_week':
                        // JavaScript getDay() returns 0-6 (Sunday-Saturday), but criteria expects 1-7
                        const jsDay = date.getDay();
                        const criteriaDay = criteria.day_of_week || parseInt(criteria.value);
                        // Convert JavaScript day (0-6) to criteria day (1-7) where 1=Monday, 7=Sunday
                        const convertedDay = jsDay === 0 ? 7 : jsDay;
                        return convertedDay === criteriaDay;
                    default:
                        return false;
                }
            default:
                return false;
        }
    };

    // Test if all criteria match (for AND logic) or any criteria match (for OR logic)
    const testAllCriteriaMatch = (): boolean => {
        if (formData.criterias.length === 0) return false;
        if (!transactionData) return false;

        const logicType = formData.criterias[0]?.logic_type || 'and';

        if (logicType === 'and') {
            return formData.criterias.every(testCriteriaMatch);
        } else {
            return formData.criterias.some(testCriteriaMatch);
        }
    };

    const handleSubmit = async () => {
        if (!formData.name.trim()) {
            showToast('Please enter a tag name.', 'error');
            return;
        }

        setIsCreating(true);

        try {
            if (editingTag) {
                // Update existing tag
                const response = await api.put(route('tags.update', editingTag.id), {
                    name: formData.name.trim(),
                    color: formData.color || undefined,
                    description: formData.description.trim() || undefined,
                    criterias: formData.criterias,
                    expect_json: true,
                });

                const updatedTag = response.data;
                if (onTagUpdated) {
                    onTagUpdated(updatedTag);
                }
                showToast(`Tag "${formData.name.trim()}" updated successfully!`, 'success');
            } else {
                // Create new tag
                const response = await api.post(route('tags.store'), {
                    name: formData.name.trim(),
                    color: formData.color || undefined,
                    description: formData.description.trim() || undefined,
                    criterias: formData.criterias,
                    expect_json: true,
                });

                const newTag = response.data;
                onTagCreated(newTag);
                showToast(`Tag "${formData.name.trim()}" created successfully!`, 'success');
            }

            onOpenChange(false);
        } catch (error) {
            const apiError = error as ApiError;

            if (apiError.isValidation && apiError.errors?.name) {
                showToast(apiError.errors.name[0], 'error');
            } else if (apiError.isConflict) {
                showToast('A tag with this name already exists.', 'error');
            } else {
                showToast(`Failed to ${editingTag ? 'update' : 'create'} tag. Please try again.`, 'error');
            }
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        {editingTag ? 'Edit Tag' : 'Create Tag with Criteria'}
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Tag Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Tag Name *</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    placeholder="Enter tag name"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Color</Label>
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-8 h-8 rounded border-2 border-white shadow-sm cursor-pointer"
                                        style={{ backgroundColor: formData.color || '#6b7280' }}
                                        onClick={generateRandomColor}
                                    />
                                    <Input
                                        value={formData.color}
                                        onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                                        placeholder="#ef4444"
                                        className="flex-1"
                                    />
                                    <Button type="button" variant="outline" onClick={generateRandomColor}>
                                        Random
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                    placeholder="Optional description"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Transaction Preview */}
                        {transactionData && (
                            <div className="space-y-4">
                                <Label>Current Transaction</Label>
                                <div className="p-4 border rounded-lg bg-muted/50">
                                    {transactionData.description && (
                                        <div className="text-sm">
                                            <span className="font-medium">Description:</span> {transactionData.description}
                                        </div>
                                    )}
                                    {transactionData.amount !== undefined && (
                                        <div className="text-sm">
                                            <span className="font-medium">Amount:</span> ${transactionData.amount.toFixed(2)}
                                        </div>
                                    )}
                                    {transactionData.date && (
                                        <div className="text-sm">
                                            <span className="font-medium">Date:</span> {transactionData.date}
                                        </div>
                                    )}
                                </div>

                                {/* Overall Match Status */}
                                {formData.criterias.length > 0 && (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">Overall Match:</span>
                                        {testAllCriteriaMatch() ? (
                                            <Badge variant="default" className="bg-green-100 text-green-800">
                                                <CheckCircle className="mr-1 h-3 w-3" />
                                                Matches
                                            </Badge>
                                        ) : (
                                            <Badge variant="secondary">
                                                <XCircle className="mr-1 h-3 w-3" />
                                                No Match
                                            </Badge>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <Separator />

                    {/* Criteria Section */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <Label className="text-base font-medium">Auto-Apply Criteria</Label>
                            {transactionData && formData.criterias.length > 0 && (
                                <Badge variant="outline" className="text-xs">
                                    {formData.criterias.filter(testCriteriaMatch).length} of {formData.criterias.length} match
                                </Badge>
                            )}
                        </div>

                        {/* Existing Criteria */}
                        {formData.criterias.length > 0 && (
                            <div className="space-y-2">
                                {formData.criterias.map((criteria, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-2">
                                            {transactionData && (
                                                testCriteriaMatch(criteria) ? (
                                                    <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                )
                                            )}
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
                                ))}
                            </div>
                        )}

                        {/* Add New Criteria */}
                        <div className="space-y-4 p-4 border rounded-lg">
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
                                    />
                                </div>

                                {/* Value To (for ranges) */}
                                {newCriteria.match_type === 'range' && (
                                    <div className="space-y-2">
                                        <Label>To *</Label>
                                        <Input
                                            value={newCriteria.value_to || ''}
                                            onChange={(e) => setNewCriteria(prev => ({ ...prev, value_to: e.target.value }))}
                                            placeholder="Maximum value"
                                            required
                                        />
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
                        {formData.criterias.length > 1 && (
                            <div className="space-y-2">
                                <Label>Combine Criteria With</Label>
                                <Select
                                    value={formData.criterias[0]?.logic_type || 'and'}
                                    onValueChange={(value: 'and' | 'or') =>
                                        setFormData(prev => ({
                                            ...prev,
                                            criterias: prev.criterias.map(c => ({ ...c, logic_type: value }))
                                        }))
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
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>
                            Cancel
                        </Button>
                        <Button onClick={handleSubmit} disabled={isCreating || !formData.name.trim()}>
                            {isCreating ? (editingTag ? 'Updating...' : 'Creating...') : (editingTag ? 'Update Tag' : 'Create Tag')}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
} 