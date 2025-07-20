import { useState, useRef, useEffect, useImperativeHandle, forwardRef, ChangeEvent, KeyboardEvent } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { X, ChevronDown, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tag } from '@/types/global';
import { api, ApiError } from '@/lib/api';
import { useToast } from '@/components/ui/toast';

interface TagSelectProps {
    tags: Tag[];
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    onTagCreated?: (tag: Tag) => void;
    placeholder?: string;
    className?: string;
}

export interface TagSelectRef {
    focus: () => void;
}

export const TagSelect = forwardRef<TagSelectRef, TagSelectProps>(({
    tags,
    selectedTags,
    onTagsChange,
    onTagCreated,
    placeholder = "Add tag",
    className
}, ref) => {
    const [open, setOpen] = useState(false);
    const [searchValue, setSearchValue] = useState('');
    const [isCreating, setIsCreating] = useState(false);
    const [availableTags, setAvailableTags] = useState(tags);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const { showToast } = useToast();

    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);

    // Expose focus method to parent via ref
    useImperativeHandle(ref, () => ({
        focus: () => {
            if (buttonRef.current) {
                buttonRef.current.focus();
            }
        }
    }));

    // Filter available tags (exclude already selected ones) and limit to 5
    const filteredTags = (availableTags || []).filter(tag =>
        !(selectedTags || []).some(selected => selected.id === tag.id) &&
        tag.name.toLowerCase().includes(searchValue.toLowerCase())
    ).slice(0, 5);

    // Check if search value matches an existing tag exactly
    const exactMatch = (availableTags || []).find(tag =>
        tag.name.toLowerCase() === searchValue.toLowerCase()
    );

    // Show create option if search value is not empty and doesn't match existing tag
    const showCreateOption = searchValue.trim() && !exactMatch;

    // All selectable options (filtered tags + create option)
    const allOptions = [
        ...filteredTags,
        ...(showCreateOption ? [{ id: -1, name: searchValue, color: '#6b7280', isCreate: true }] : [])
    ];

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
                setSearchValue('');
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Sync availableTags with parent tags prop
    useEffect(() => {
        setAvailableTags(tags || []);
    }, [tags]);

    // Focus input when dropdown opens and reset highlighted index
    useEffect(() => {
        if (open && inputRef.current) {
            inputRef.current.focus();
            setHighlightedIndex(-1);
        }
    }, [open]);

    // Reset highlighted index when search value changes
    useEffect(() => {
        setHighlightedIndex(-1);
    }, [searchValue]);

    // Only show dropdown when there's search input
    const shouldShowDropdown = open && searchValue.trim().length > 0;

    const handleSelectTag = (tag: Tag) => {
        onTagsChange([...(selectedTags || []), tag]);
        setSearchValue('');
        setHighlightedIndex(-1);
        // Keep focus on input after selection
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 0);
    };

    const handleRemoveTag = (tagToRemove: Tag) => {
        onTagsChange((selectedTags || []).filter(tag => tag.id !== tagToRemove.id));
    };

    const handleCreateTag = async () => {
        if (!searchValue.trim() || isCreating) return;

        setIsCreating(true);

        try {
            const response = await api.post(route('tags.store'), {
                name: searchValue.trim(),
                expect_json: true,
            });

            const newTag = response.data;

            // Add to available tags
            setAvailableTags(prev => [...prev, newTag]);

            // Notify parent component of new tag
            if (onTagCreated) {
                onTagCreated(newTag);
            }

            // Add to selected tags
            onTagsChange([...(selectedTags || []), newTag]);

            // Show success toast
            showToast(`Tag "${searchValue.trim()}" created successfully!`, 'success');

            // Clear search and keep focus on input
            setSearchValue('');
            setHighlightedIndex(-1);
            setTimeout(() => {
                if (inputRef.current) {
                    inputRef.current.focus();
                }
            }, 0);
        } catch (error) {
            const apiError = error as ApiError;

            if (apiError.isValidation && apiError.errors?.name) {
                // Handle validation errors (like duplicate tag name)
                showToast(apiError.errors.name[0], 'error');
            } else if (apiError.isConflict) {
                // Handle conflict errors (409 status)
                showToast('A tag with this name already exists.', 'error');
            } else {
                showToast('Failed to create tag. Please try again.', 'error');
            }
        } finally {
            setIsCreating(false);
        }
    };

    const handleButtonKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setOpen(true);
        } else if (e.key === 'Tab') {
            // Close dropdown when tabbing away
            setOpen(false);
            setSearchValue('');
            setHighlightedIndex(-1);
        }
    };

    const handleInputKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        switch (e.key) {
            case 'Tab':
                // Close dropdown when tabbing away from input
                setOpen(false);
                setSearchValue('');
                setHighlightedIndex(-1);
                break;
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < allOptions.length - 1 ? prev + 1 : prev
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev => prev > 0 ? prev - 1 : -1);
                break;
            case 'Enter':
                e.preventDefault();
                if (highlightedIndex >= 0 && highlightedIndex < allOptions.length) {
                    const selectedOption = allOptions[highlightedIndex];
                    if ('isCreate' in selectedOption && selectedOption.isCreate) {
                        handleCreateTag();
                    } else {
                        handleSelectTag(selectedOption as Tag);
                    }
                } else if (showCreateOption) {
                    // If no option is highlighted but we can create, create the tag
                    handleCreateTag();
                }
                break;
            case 'Escape':
                setOpen(false);
                setSearchValue('');
                setHighlightedIndex(-1);
                if (buttonRef.current) {
                    buttonRef.current.focus();
                }
                break;
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchValue(value);
        // Open dropdown when user starts typing
        if (value.trim() && !open) {
            setOpen(true);
        }
    };

    const handleOptionClick = (option: Tag | { id: number; name: string; color: string; isCreate: true }) => {
        if ('isCreate' in option && option.isCreate) {
            handleCreateTag();
        } else {
            handleSelectTag(option as Tag);
        }
    };

    return (
        <div className={cn("flex items-start gap-2 flex-wrap", className)}>
            <div className="flex-1 min-w-0">
                {/* Selected Tags - Moved above the add tag box */}
                {(selectedTags || []).length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                        {(selectedTags || []).map((tag) => (
                            <Badge
                                key={tag.id}
                                variant="secondary"
                                className="cursor-pointer hover:bg-secondary/80"
                                onClick={() => handleRemoveTag(tag)}
                            >
                                <div
                                    className="w-2 h-2 rounded-full mr-1"
                                    style={{ backgroundColor: tag.color }}
                                />
                                {tag.name}
                                <X className="ml-1 h-3 w-3" />
                            </Badge>
                        ))}
                    </div>
                )}

                <div className="relative" ref={dropdownRef}>
                    <Button
                        ref={buttonRef}
                        variant="outline"
                        onClick={() => {
                            setOpen(true);
                            // Focus input when button is clicked
                            setTimeout(() => {
                                if (inputRef.current) {
                                    inputRef.current.focus();
                                }
                            }, 0);
                        }}
                        onKeyDown={handleButtonKeyDown}
                        className={cn(
                            "w-full justify-between min-w-40",
                            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                        )}
                        type="button"
                    >
                        {placeholder}
                        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>

                    {open && (
                        <div className="absolute top-full left-0 z-50 w-full min-w-60 mt-1 bg-popover border border-border rounded-md shadow-lg">
                            <div className="p-2">
                                <Input
                                    ref={inputRef}
                                    placeholder="Search or create tag..."
                                    value={searchValue}
                                    onChange={handleInputChange}
                                    onKeyDown={handleInputKeyDown}
                                    className="mb-2"
                                />
                            </div>

                            {shouldShowDropdown && (
                                <div className="max-h-60 overflow-y-auto">
                                    {filteredTags.length > 0 && (
                                        <div className="px-2 pb-2">
                                            <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Available Tags</div>
                                            {filteredTags.map((tag, index) => (
                                                <button
                                                    key={tag.id}
                                                    onClick={() => handleOptionClick(tag)}
                                                    className={cn(
                                                        "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left",
                                                        "hover:bg-accent hover:text-accent-foreground",
                                                        highlightedIndex === index && "bg-accent text-accent-foreground"
                                                    )}
                                                >
                                                    <div
                                                        className="w-3 h-3 rounded-full"
                                                        style={{ backgroundColor: tag.color }}
                                                    />
                                                    <span>{tag.name}</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {showCreateOption && (
                                        <div className="px-2 pb-2">
                                            {filteredTags.length > 0 && <div className="border-t border-border my-2" />}
                                            <div className="text-xs font-medium text-muted-foreground mb-1 px-2">Create New</div>
                                            <button
                                                onClick={() => handleOptionClick({ id: -1, name: searchValue, color: '#6b7280', isCreate: true })}
                                                disabled={isCreating}
                                                className={cn(
                                                    "w-full flex items-center gap-2 px-2 py-1.5 text-sm rounded text-left",
                                                    "hover:bg-accent hover:text-accent-foreground",
                                                    "disabled:opacity-50 disabled:cursor-not-allowed",
                                                    highlightedIndex === filteredTags.length && "bg-accent text-accent-foreground"
                                                )}
                                            >
                                                <Plus className="h-3 w-3" />
                                                <span>
                                                    {isCreating ? 'Creating...' : `Create "${searchValue}"`}
                                                </span>
                                            </button>
                                        </div>
                                    )}

                                    {filteredTags.length === 0 && !showCreateOption && (
                                        <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                            No tags found.
                                        </div>
                                    )}
                                </div>
                            )}

                            {open && !shouldShowDropdown && (
                                <div className="px-4 py-3 text-sm text-muted-foreground text-center">
                                    Start typing to search or create tags.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
});
