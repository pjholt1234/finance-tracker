import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { X, Edit3, Sparkles } from 'lucide-react';
import { Tag } from '@/types/global';

interface ExtendedTag extends Tag {
    isSuggested?: boolean;
}

interface TagItemProps {
    tag: ExtendedTag;
    onRemove: (tag: Tag) => void;
    onEdit?: (tag: Tag) => void;
    size?: 'sm' | 'md';
    showEdit?: boolean;
}

export function TagItem({
    tag,
    onRemove,
    onEdit,
    size = 'md',
    showEdit = false
}: TagItemProps) {
    const isSmall = size === 'sm';

    return (
        <Badge
            key={tag.id}
            variant={tag.isSuggested ? "outline" : "default"}
            className={`
                group flex items-center gap-1 pr-1 transition-all
                ${tag.isSuggested ? 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-950 dark:text-blue-300' : ''}
                ${isSmall ? 'text-xs' : 'text-sm'}
            `}
            style={!tag.isSuggested ? { backgroundColor: tag.color, color: 'white' } : {}}
        >
            <span className="truncate max-w-24">{tag.name}</span>
            {tag.isSuggested && (
                <Sparkles className={`text-blue-500 ${isSmall ? 'h-2.5 w-2.5' : 'h-3 w-3'}`} />
            )}
            <div className="flex items-center gap-0.5">
                {showEdit && onEdit && (
                    <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            onEdit(tag);
                        }}
                        className={`
                            p-0 bg-transparent hover:bg-transparent text-white
                            ${isSmall ? 'h-3 w-3' : 'h-4 w-4'}
                        `}
                    >
                        <Edit3 className={isSmall ? "h-2.5 w-2.5" : "h-3 w-3"} />
                    </Button>
                )}
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        onRemove(tag);
                    }}
                    className={`
                        p-0 bg-transparent hover:bg-transparent text-white
                        ${isSmall ? 'h-3 w-3' : 'h-4 w-4'}
                    `}
                >
                    <X className={isSmall ? "h-2.5 w-2.5" : "h-3 w-3"} />
                </Button>
            </div>
        </Badge>
    );
} 