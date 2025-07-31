import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';
import { TAG_COLORS } from '@/utils/constants';
import { generateRandomColor } from '@/utils/form-helpers';

interface TagBasicInfoProps {
    name: string;
    color: string;
    description: string;
    onNameChange: (name: string) => void;
    onColorChange: (color: string) => void;
    onDescriptionChange: (description: string) => void;
    onGenerateRandomColor: () => void;
}

export function TagBasicInfo({
    name,
    color,
    description,
    onNameChange,
    onColorChange,
    onDescriptionChange,
    onGenerateRandomColor,
}: TagBasicInfoProps) {
    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Tag Name *</Label>
                <Input
                    id="name"
                    value={name}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Enter tag name"
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="color">Color</Label>
                <div className="flex items-center space-x-3">
                    <Input
                        id="color"
                        type="color"
                        value={color}
                        onChange={(e) => onColorChange(e.target.value)}
                        placeholder={TAG_COLORS[0]}
                        className="w-20 h-10 p-1 rounded-md border"
                    />
                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={onGenerateRandomColor}
                        className="flex-shrink-0"
                    >
                        <Sparkles className="mr-2 h-4 w-4" />
                        Random
                    </Button>
                    {color && (
                        <div
                            className="w-8 h-8 rounded-full border-2 border-gray-200 flex-shrink-0"
                            style={{ backgroundColor: color }}
                        />
                    )}
                </div>
            </div>

            <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={description}
                    onChange={(e) => onDescriptionChange(e.target.value)}
                    placeholder="Optional description for this tag"
                    rows={3}
                />
            </div>
        </div>
    );
} 