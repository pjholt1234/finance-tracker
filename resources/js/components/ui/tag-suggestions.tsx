import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles } from 'lucide-react';
import { Tag } from '@/types/global';

interface TagSuggestionsProps {
    suggestedTags: Tag[];
    selectedTags: Tag[];
    onSelectTag: (tag: Tag) => void;
    loading?: boolean;
    className?: string;
}

export function TagSuggestions({
    suggestedTags,
    selectedTags,
    onSelectTag,
    loading = false,
    className,
}: TagSuggestionsProps) {
    if (loading) {
        return (
            <div className={`flex items-center gap-2 text-sm text-gray-500 ${className || ''}`}>
                <Sparkles className="h-4 w-4 animate-spin" />
                <span>Loading suggestions...</span>
            </div>
        );
    }

    if (!suggestedTags.length) {
        return null;
    }

    // Filter out already selected tags
    const availableSuggestions = suggestedTags.filter(
        suggestion => !selectedTags.some(selected => selected.id === suggestion.id)
    );

    if (!availableSuggestions.length) {
        return null;
    }

    return (
        <div className={`space-y-2 ${className || ''}`}>
            <div className="flex items-center gap-2 text-sm text-gray-600">
                <Sparkles className="h-4 w-4" />
                <span>Suggested tags:</span>
            </div>
            <div className="flex flex-wrap gap-2">
                {availableSuggestions.map((tag) => (
                    <Button
                        key={tag.id}
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => onSelectTag(tag)}
                        className="h-7 px-2 py-1 text-xs border-dashed border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100"
                    >
                        <div
                            className="w-2 h-2 rounded-full mr-1.5"
                            style={{ backgroundColor: tag.color }}
                        />
                        {tag.name}
                    </Button>
                ))}
            </div>
        </div>
    );
} 