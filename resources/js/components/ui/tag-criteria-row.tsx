import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trash2, CheckCircle, XCircle } from 'lucide-react';
import { TagCriteriaForm, TransactionData } from '@/types/global';

interface TagCriteriaRowProps {
    criteria: TagCriteriaForm;
    index: number;
    transactionData?: TransactionData;
    onRemove: (index: number) => void;
    getCriteriaDescription: (criteria: TagCriteriaForm) => string;
    testCriteriaMatch: (criteria: TagCriteriaForm) => boolean;
}

export function TagCriteriaRow({
    criteria,
    index,
    transactionData,
    onRemove,
    getCriteriaDescription,
    testCriteriaMatch,
}: TagCriteriaRowProps) {
    const isMatch = transactionData ? testCriteriaMatch(criteria) : null;

    return (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center space-x-3 flex-1">
                <Badge variant="secondary" className="text-xs">
                    {criteria.type}
                </Badge>
                <span className="text-sm text-gray-600 dark:text-gray-400 flex-1">
                    {getCriteriaDescription(criteria)}
                </span>
                {transactionData && (
                    <div className="flex items-center space-x-1">
                        {isMatch ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-xs ${isMatch ? 'text-green-600' : 'text-red-600'}`}>
                            {isMatch ? 'Matches' : 'No match'}
                        </span>
                    </div>
                )}
            </div>
            <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onRemove(index)}
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
} 