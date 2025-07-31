import { useState, useEffect } from 'react';
import { VALIDATION_MESSAGES } from '@/utils/constants';
import { generateRandomColor } from '@/utils/form-helpers';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { useToast } from '@/components/ui/toast';
import { Tag, TagCriteriaForm, TransactionData } from '@/types/global';
import { TagBasicInfo } from './tag-basic-info';
import { TagCriteriaBuilder } from './tag-criteria-builder';

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
        criterias: [] as TagCriteriaForm[],
    });

    const [newCriteria, setNewCriteria] = useState<TagCriteriaForm>({
        type: 'description',
        match_type: 'exact',
        value: '',
        logic_type: 'and',
    });

    const [isCreating, setIsCreating] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const { showToast } = useToast();
    const { handleApiError, handleApiSuccess } = useErrorHandler();

    // Reset form when modal opens/closes
    useEffect(() => {
        if (open) {
            const editMode = !!editingTag;
            setIsEditMode(editMode);

            if (editingTag) {
                // Load editing tag data
                const mappedCriterias: TagCriteriaForm[] = (editingTag.criterias || []).map(criteria => ({
                    type: criteria.type as 'description' | 'amount' | 'date',
                    match_type: criteria.match_type,
                    value: criteria.value,
                    value_to: criteria.value_to || undefined,
                    day_of_month: criteria.day_of_month || undefined,
                    day_of_week: criteria.day_of_week || undefined,
                    logic_type: criteria.logic_type as 'and' | 'or',
                }));

                setFormData({
                    name: editingTag.name,
                    color: editingTag.color,
                    description: editingTag.description || '',
                    criterias: mappedCriterias,
                });
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
    }, [open, editingTag, initialTagName]);

    const handleGenerateRandomColor = () => {
        setFormData(prev => ({ ...prev, color: generateRandomColor() }));
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
                    { value: 'range', label: 'Range' },
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

    const getCriteriaDescription = (criteria: TagCriteriaForm): string => {
        const typeName = criteria.type.charAt(0).toUpperCase() + criteria.type.slice(1);
        const matchName = getMatchTypeOptions(criteria.type).find(opt => opt.value === criteria.match_type)?.label || criteria.match_type;

        let description = `${typeName} ${matchName.toLowerCase()} "${criteria.value}"`;

        if (criteria.match_type === 'range' && criteria.value_to) {
            description = `${typeName} between "${criteria.value}" and "${criteria.value_to}"`;
        }

        return description;
    };

    // Test if criteria matches the current transaction
    const testCriteriaMatch = (criteria: TagCriteriaForm): boolean => {
        if (!transactionData) {
            return false;
        }

        switch (criteria.type) {
            case 'description':
                const description = transactionData.description?.toLowerCase() || '';
                const searchValue = criteria.value.toLowerCase();

                switch (criteria.match_type) {
                    case 'exact':
                        return description === searchValue;
                    case 'contains':
                        return description.includes(searchValue);
                    case 'starts_with':
                        return description.startsWith(searchValue);
                    case 'ends_with':
                        return description.endsWith(searchValue);
                    default:
                        return false;
                }

            case 'amount':
                const amount = transactionData.amount || 0;
                const criteriaAmount = parseFloat(criteria.value);

                switch (criteria.match_type) {
                    case 'exact':
                        return amount === criteriaAmount;
                    case 'greater_than':
                        return amount > criteriaAmount;
                    case 'less_than':
                        return amount < criteriaAmount;
                    case 'range':
                        const endAmount = parseFloat(criteria.value_to || '0');
                        return amount >= criteriaAmount && amount <= endAmount;
                    default:
                        return false;
                }

            case 'date':
                const transactionDate = new Date(transactionData.date || '');
                const criteriaDate = new Date(criteria.value);

                switch (criteria.match_type) {
                    case 'exact':
                        return transactionDate.toDateString() === criteriaDate.toDateString();
                    case 'before':
                        return transactionDate < criteriaDate;
                    case 'after':
                        return transactionDate > criteriaDate;
                    case 'day_of_month':
                        return transactionDate.getDate() === parseInt(criteria.value);
                    case 'day_of_week':
                        return transactionDate.getDay() === parseInt(criteria.value);
                    default:
                        return false;
                }

            default:
                return false;
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            showToast(VALIDATION_MESSAGES.TAG_NAME_REQUIRED, 'error');
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
                handleApiSuccess(VALIDATION_MESSAGES.TAG_UPDATED_SUCCESS);
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
                handleApiSuccess(VALIDATION_MESSAGES.TAG_CREATED_SUCCESS);
            }

            onOpenChange(false);
        } catch (error) {
            handleApiError(error, VALIDATION_MESSAGES.UNEXPECTED_ERROR);
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl sm:max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5" />
                        {editingTag ? 'Edit Tag' : 'Create Tag with Criteria'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Tag Details */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <TagBasicInfo
                            name={formData.name}
                            color={formData.color}
                            description={formData.description}
                            onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
                            onColorChange={(color) => setFormData(prev => ({ ...prev, color }))}
                            onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
                            onGenerateRandomColor={handleGenerateRandomColor}
                        />

                        <TagCriteriaBuilder
                            criterias={formData.criterias}
                            newCriteria={newCriteria}
                            transactionData={transactionData}
                            onCriteriasChange={(criterias) => setFormData(prev => ({ ...prev, criterias }))}
                            onNewCriteriaChange={setNewCriteria}
                            getMatchTypeOptions={getMatchTypeOptions}
                            getCriteriaDescription={getCriteriaDescription}
                            testCriteriaMatch={testCriteriaMatch}
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end space-x-3 pt-4 border-t">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenChange(false)}
                            disabled={isCreating}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isCreating || !formData.name.trim()}>
                            {isCreating ? 'Saving...' : (editingTag ? 'Update Tag' : 'Create Tag')}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
