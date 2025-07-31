import { useState, useRef, useEffect, useImperativeHandle, forwardRef, KeyboardEvent } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tag, TransactionData } from '@/types/global';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { VALIDATION_MESSAGES } from '@/utils/constants';
import { TagCreateModal } from './tag-create-modal';
import { TagItem } from './tag-item';
import { TagDropdown } from './tag-dropdown';
import { TagSuggestions } from './tag-suggestions';

// Extend the Tag interface to include isSuggested property
interface ExtendedTag extends Tag {
    isSuggested?: boolean;
}

interface TagSelectProps {
    tags: Tag[];
    selectedTags: Tag[];
    onTagsChange: (tags: Tag[]) => void;
    onTagCreated?: (tag: Tag) => void;
    placeholder?: string;
    className?: string;
    suggestedTags?: Tag[];
    showSuggestions?: boolean;
    suggestionsLoading?: boolean;
    transactionData?: TransactionData;
}

export interface TagSelectRef {
    focus: () => void;
}

export const TagSelect = forwardRef<TagSelectRef, TagSelectProps>((
    {
        tags,
        selectedTags,
        onTagsChange,
        onTagCreated,
        placeholder = "Add tag",
        className,
        suggestedTags = [],
        showSuggestions = false,
        suggestionsLoading = false,
        transactionData,
    }: TagSelectProps,
    ref
) => {
    const [searchValue, setSearchValue] = useState('');
    const [open, setOpen] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [availableTags, setAvailableTags] = useState<Tag[]>(tags || []);
    const [isCreating, setIsCreating] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTag, setEditingTag] = useState<Tag | null>(null);
    const [modalInitialTagName, setModalInitialTagName] = useState('');

    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { showToast } = useToast();
    const { handleApiError, handleApiSuccess } = useErrorHandler();

    // Filter tags based on search
    const filteredTags = availableTags.filter(tag =>
        tag.name.toLowerCase().includes(searchValue.toLowerCase()) &&
        !selectedTags.some(selected => selected.id === tag.id)
    );

    // Expose focus method to parent
    useImperativeHandle(ref, () => ({
        focus: () => {
            if (inputRef.current) {
                inputRef.current.focus();
                setOpen(true);
            }
        }
    }));

    const handleRemoveTag = (tagToRemove: Tag) => {
        onTagsChange(selectedTags.filter(tag => tag.id !== tagToRemove.id));
    };

    const handleEditTag = async (tag: Tag) => {
        try {
            // Fetch the full tag data with criteria
            const response = await api.get(route('tags.api-show', tag.id));
            const fullTag = response.data;

            setEditingTag(fullTag);
            setShowCreateModal(true);
            setOpen(false);
        } catch (error) {
            handleApiError(error, VALIDATION_MESSAGES.UNEXPECTED_ERROR);
        }
    };

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

    const handleSearchValueChange = (value: string) => {
        setSearchValue(value);
        // Auto-open dropdown when user starts typing
        if (value.trim() && !open) {
            setOpen(true);
        }
    };

    const handleCreateTag = async () => {
        if (!searchValue.trim() || isCreating) return;

        // If we have transaction data, show the modal for advanced tag creation
        if (transactionData) {
            setModalInitialTagName(searchValue.trim());
            setShowCreateModal(true);
            setOpen(false);
            return;
        }

        // Otherwise, use the simple tag creation
        setIsCreating(true);

        try {
            const response = await api.post(route('tags.store'), {
                name: searchValue.trim(),
                expect_json: true,
            });

            const newTag = response.data;
            setAvailableTags(prev => [...prev, newTag]);
            onTagsChange([...(selectedTags || []), newTag]);

            if (onTagCreated) {
                onTagCreated(newTag);
            }

            handleApiSuccess(VALIDATION_MESSAGES.TAG_CREATED_SUCCESS);
            setSearchValue('');
            setOpen(false);
        } catch (error) {
            handleApiError(error, VALIDATION_MESSAGES.UNEXPECTED_ERROR);
        } finally {
            setIsCreating(false);
        }
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        const exactMatch = filteredTags.find(tag =>
            tag.name.toLowerCase() === searchValue.toLowerCase()
        );
        const showCreateOption = searchValue.trim() && !exactMatch;
        const allOptions = [...filteredTags, ...(showCreateOption ? [{ id: -1, name: searchValue, color: '#6b7280', isCreate: true }] : [])];

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev < allOptions.length - 1 ? prev + 1 : 0
                );
                if (!open) setOpen(true);
                break;
            case 'ArrowUp':
                e.preventDefault();
                setHighlightedIndex(prev =>
                    prev > 0 ? prev - 1 : allOptions.length - 1
                );
                if (!open) setOpen(true);
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
                    handleCreateTag();
                }
                break;
            case 'Escape':
                setOpen(false);
                setSearchValue('');
                setHighlightedIndex(-1);
                break;
        }
    };

    const handleTagCreated = (newTag: Tag) => {
        setAvailableTags(prev => [...prev, newTag]);
        onTagsChange([...(selectedTags || []), newTag]);

        if (onTagCreated) {
            onTagCreated(newTag);
        }

        setShowCreateModal(false);
        setEditingTag(null);
        setModalInitialTagName('');
    };

    const handleTagUpdated = (updatedTag: Tag) => {
        setAvailableTags(prev => prev.map(tag => tag.id === updatedTag.id ? updatedTag : tag));
        onTagsChange(selectedTags.map(tag => tag.id === updatedTag.id ? updatedTag : tag));

        setShowCreateModal(false);
        setEditingTag(null);
    };

    // Use selectedTags directly - they now include suggested tags with a flag
    const allSelectedTags: ExtendedTag[] = (selectedTags || []).map(tag => ({
        ...tag,
        isSuggested: (tag as any).suggested === true
    }));

    return (
        <div className={cn("w-full", className)} ref={dropdownRef}>
            {/* Selected tags */}
            {allSelectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {allSelectedTags.map((tag) => (
                        <TagItem
                            key={tag.id}
                            tag={tag}
                            onRemove={handleRemoveTag}
                            onEdit={handleEditTag}
                            showEdit={true}
                            size="sm"
                        />
                    ))}
                </div>
            )}

            {/* Tag suggestions */}
            {showSuggestions && (
                <TagSuggestions
                    suggestedTags={suggestedTags}
                    selectedTags={selectedTags}
                    onSelectTag={handleSelectTag}
                    loading={suggestionsLoading}
                    className="mb-3"
                />
            )}

            {/* Add tag input/dropdown */}
            <div className="relative">
                <div className="flex items-center">
                    <TagDropdown
                        isOpen={open}
                        searchValue={searchValue}
                        onSearchChange={handleSearchValueChange}
                        filteredTags={filteredTags}
                        selectedTags={selectedTags}
                        highlightedIndex={highlightedIndex}
                        onHighlightChange={setHighlightedIndex}
                        onSelectTag={handleSelectTag}
                        onCreateTag={handleCreateTag}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        isCreating={isCreating}
                        transactionData={transactionData}
                        className="flex-1"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setOpen(!open)}
                        className="ml-2 px-2"
                    >
                        <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
                    </Button>
                </div>
            </div>

            {/* Tag creation modal */}
            <TagCreateModal
                open={showCreateModal}
                onOpenChange={setShowCreateModal}
                onTagCreated={handleTagCreated}
                onTagUpdated={handleTagUpdated}
                transactionData={transactionData}
                initialTagName={modalInitialTagName}
                editingTag={editingTag}
            />
        </div>
    );
});
