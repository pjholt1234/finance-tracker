import { useRef, KeyboardEvent } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tag, TransactionData } from '@/types/global';

interface TagDropdownProps {
    isOpen: boolean;
    searchValue: string;
    onSearchChange: (value: string) => void;
    filteredTags: Tag[];
    selectedTags: Tag[];
    highlightedIndex: number;
    onHighlightChange: (index: number) => void;
    onSelectTag: (tag: Tag) => void;
    onCreateTag: () => void;
    onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
    placeholder?: string;
    transactionData?: TransactionData;
    className?: string;
}

export function TagDropdown({
    isOpen,
    searchValue,
    onSearchChange,
    filteredTags,
    selectedTags,
    highlightedIndex,
    onHighlightChange,
    onSelectTag,
    onCreateTag,
    onKeyDown,
    placeholder = "Add tag",
    transactionData,
    className,
}: TagDropdownProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Check if search value matches an existing tag exactly
    const exactMatch = filteredTags.find(tag =>
        tag.name.toLowerCase() === searchValue.toLowerCase()
    );

    // Show create option if search value is not empty and doesn't match existing tag
    const showCreateOption = searchValue.trim() && !exactMatch;

    // All selectable options (filtered tags + create option)
    const allOptions = [
        ...filteredTags,
        ...(showCreateOption ? [{ id: -1, name: searchValue, color: '#6b7280', isCreate: true }] : [])
    ];

    // Only show dropdown when there's search input
    const shouldShowDropdown = isOpen && searchValue.trim().length > 0;

    return (
        <div className={cn("relative", className)}>
            <Input
                ref={inputRef}
                type="text"
                placeholder={placeholder}
                value={searchValue}
                onChange={(e) => onSearchChange(e.target.value)}
                onKeyDown={onKeyDown}
                className="w-full"
            />

            {shouldShowDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
                    {allOptions.length === 0 ? (
                        <div className="px-3 py-2 text-sm text-muted-foreground">
                            No tags found
                        </div>
                    ) : (
                        allOptions.map((option, index) => {
                            const isHighlighted = index === highlightedIndex;
                            const isSelected = selectedTags?.some(tag => tag.id === option.id);
                            const isCreateOption = 'isCreate' in option && option.isCreate;

                            return (
                                <div
                                    key={option.id}
                                    className={cn(
                                        "px-3 py-2 cursor-pointer text-sm border-b border-border last:border-b-0",
                                        isHighlighted && "bg-accent text-accent-foreground",
                                        isSelected && "bg-muted text-muted-foreground"
                                    )}
                                    onMouseEnter={() => onHighlightChange(index)}
                                    onClick={() => {
                                        if (isCreateOption) {
                                            onCreateTag();
                                        } else if (!isSelected) {
                                            onSelectTag(option as Tag);
                                        }
                                    }}
                                >
                                    {isCreateOption ? (
                                        <div className="flex items-center gap-2">
                                            <Plus className="h-4 w-4" />
                                            <span>Create "{option.name}"</span>
                                            {transactionData && (
                                                <Badge variant="outline" className="text-xs ml-auto">
                                                    with criteria
                                                </Badge>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: option.color }}
                                                />
                                                <span className={isSelected ? "line-through" : ""}>
                                                    {option.name}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <span className="text-xs text-muted-foreground">Selected</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
} 