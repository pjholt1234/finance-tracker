import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Plus } from 'lucide-react';
import { TagCriteriaForm, TransactionData } from '@/types/global';
import { TagCriteriaRow } from './tag-criteria-row';
import { useToast } from './toast';

interface TagCriteriaBuilderProps {
    criterias: TagCriteriaForm[];
    newCriteria: TagCriteriaForm;
    transactionData?: TransactionData;
    onCriteriasChange: (criterias: TagCriteriaForm[]) => void;
    onNewCriteriaChange: (criteria: TagCriteriaForm) => void;
    getCriteriaDescription: (criteria: TagCriteriaForm) => string;
    testCriteriaMatch: (criteria: TagCriteriaForm) => boolean;
}

export function TagCriteriaBuilder({
    criterias,
    newCriteria,
    transactionData,
    onCriteriasChange,
    onNewCriteriaChange,
    getCriteriaDescription,
    testCriteriaMatch,
}: TagCriteriaBuilderProps) {
    const { showToast } = useToast();

    const handleCriteriaChange = (field: string, value: string) => {
        onNewCriteriaChange({ ...newCriteria, [field]: value });
    };

    const getMatchTypeOptions = (type: string) => {
        switch (type) {
            case 'description':
                return [
                    { value: 'exact', label: 'Exact match' },
                    { value: 'contains', label: 'Contains' },
                    { value: 'starts_with', label: 'Starts with' },
                    { value: 'ends_with', label: 'Ends with' },
                ];
            case 'amount':
                return [
                    { value: 'exact', label: 'Exact amount' },
                    { value: 'greater_than', label: 'Greater than' },
                    { value: 'less_than', label: 'Less than' },
                    { value: 'range', label: 'Between amounts' },
                ];
            case 'date':
                return [
                    { value: 'exact', label: 'Exact date' },
                    { value: 'before', label: 'Before date' },
                    { value: 'after', label: 'After date' },
                    { value: 'day_of_month', label: 'Day of month' },
                    { value: 'day_of_week', label: 'Day of week' },
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

        // Validation for amount criteria
        if (newCriteria.type === 'amount') {
            if (isNaN(parseFloat(newCriteria.value))) {
                showToast('Please enter a valid number for amount criteria.', 'error');
                return;
            }

            if (newCriteria.match_type === 'range') {
                if (!newCriteria.value_to) {
                    showToast('Range end value is required for range criteria.', 'error');
                    return;
                }
                if (isNaN(parseFloat(newCriteria.value_to))) {
                    showToast('Please enter a valid number for the range end value.', 'error');
                    return;
                }
                if (parseFloat(newCriteria.value) >= parseFloat(newCriteria.value_to)) {
                    showToast('Range start value must be less than range end value.', 'error');
                    return;
                }
            }
        }

        // Validation for date criteria
        if (newCriteria.type === 'date') {
            if (newCriteria.match_type === 'exact' || newCriteria.match_type === 'before' || newCriteria.match_type === 'after') {
                const datePattern = /^\d{4}-\d{2}-\d{2}$/;
                if (!datePattern.test(newCriteria.value)) {
                    showToast('Please enter a valid date (YYYY-MM-DD format).', 'error');
                    return;
                }
            }
            if (newCriteria.match_type === 'day_of_month') {
                const dayOfMonth = parseInt(newCriteria.value);
                if (isNaN(dayOfMonth) || dayOfMonth < 1 || dayOfMonth > 31) {
                    showToast('Day of month must be a number between 1 and 31.', 'error');
                    return;
                }
            }
            if (newCriteria.match_type === 'day_of_week') {
                const dayOfWeek = parseInt(newCriteria.value);
                if (isNaN(dayOfWeek) || dayOfWeek < 1 || dayOfWeek > 7) {
                    showToast('Day of week must be a number between 1 and 7.', 'error');
                    return;
                }
            }
        }

        onCriteriasChange([...criterias, newCriteria]);
        onNewCriteriaChange({
            type: 'description',
            match_type: 'exact',
            value: '',
            logic_type: 'and',
        });
    };

    const removeCriteria = (index: number) => {
        onCriteriasChange(criterias.filter((_, i) => i !== index));
    };

    return (
        <div className="space-y-4">
            <div>
                <Label className="text-sm font-medium">Criteria</Label>
                <p className="text-xs text-gray-500 mt-1">
                    Define rules for automatically assigning this tag to transactions
                </p>
            </div>

            {/* Existing Criteria */}
            {criterias.length > 0 && (
                <div className="space-y-2">
                    {criterias.map((criteria, index) => (
                        <TagCriteriaRow
                            key={index}
                            criteria={criteria}
                            index={index}
                            transactionData={transactionData}
                            onRemove={removeCriteria}
                            getCriteriaDescription={getCriteriaDescription}
                            testCriteriaMatch={testCriteriaMatch}
                        />
                    ))}
                </div>
            )}

            <Separator />

            {/* Add New Criteria */}
            <div className="space-y-4 p-4 border rounded-lg bg-gray-50 dark:bg-gray-900">
                <Label className="text-sm font-medium">Add New Criteria</Label>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="criteria-type" className="text-xs">Type</Label>
                        <Select
                            value={newCriteria.type}
                            onValueChange={(value) => handleCriteriaChange('type', value)}
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

                    <div>
                        <Label htmlFor="criteria-match" className="text-xs">Match</Label>
                        <Select
                            value={newCriteria.match_type}
                            onValueChange={(value) => handleCriteriaChange('match_type', value)}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {getMatchTypeOptions(newCriteria.type).map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        {option.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label htmlFor="criteria-value" className="text-xs">Value</Label>
                        <Input
                            id="criteria-value"
                            value={newCriteria.value}
                            onChange={(e) => handleCriteriaChange('value', e.target.value)}
                            placeholder={
                                newCriteria.type === 'description' ? 'Enter text to match' :
                                    newCriteria.type === 'amount' ? 'Enter amount' :
                                        'Enter date (YYYY-MM-DD)'
                            }
                        />
                    </div>

                    {newCriteria.match_type === 'range' && (
                        <div>
                            <Label htmlFor="criteria-value-to" className="text-xs">End Value</Label>
                            <Input
                                id="criteria-value-to"
                                value={newCriteria.value_to || ''}
                                onChange={(e) => handleCriteriaChange('value_to', e.target.value)}
                                placeholder="Enter end value"
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
            {criterias.length > 1 && (
                <div className="space-y-2">
                    <Label>Combine Criteria With</Label>
                    <Select
                        value={criterias[0]?.logic_type || 'and'}
                        onValueChange={(value: 'and' | 'or') =>
                            onCriteriasChange(criterias.map(c => ({ ...c, logic_type: value })))
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
    );
} 