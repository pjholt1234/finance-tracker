import { useState } from 'react';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DateRangePickerProps {
    from: Date | null;
    to: Date | null;
    onSelect: (range: { from: Date | null; to: Date | null }) => void;
    className?: string;
}

export function DateRangePicker({
    from,
    to,
    onSelect,
    className,
}: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [startDate, setStartDate] = useState<Date | null>(from);
    const [endDate, setEndDate] = useState<Date | null>(to);

    const applyRange = () => {
        onSelect({ from: startDate, to: endDate });
        setIsOpen(false);
    };

    const clearRange = () => {
        setStartDate(null);
        setEndDate(null);
        onSelect({ from: null, to: null });
        setIsOpen(false);
    };

    const cancelSelection = () => {
        setStartDate(from);
        setEndDate(to);
        setIsOpen(false);
    };

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "w-full justify-start text-left font-normal",
                        !from && "text-muted-foreground",
                        className
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {from ? (
                        to ? (
                            <>
                                {format(from, "LLL dd, y")} -{" "}
                                {format(to, "LLL dd, y")}
                            </>
                        ) : (
                            format(from, "LLL dd, y")
                        )
                    ) : (
                        <span>Pick a date range</span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-4" align="start">
                <div className="space-y-4">
                    <div className="text-sm font-medium">Select Date Range</div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* Start Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                                Start Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !startDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {startDate ? format(startDate, "LLL dd, y") : "Select start"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={startDate || undefined}
                                        onSelect={(date) => setStartDate(date || null)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* End Date */}
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-muted-foreground">
                                End Date
                            </label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            "w-full justify-start text-left font-normal",
                                            !endDate && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {endDate ? format(endDate, "LLL dd, y") : "Select end"}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={endDate || undefined}
                                        onSelect={(date) => setEndDate(date || null)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 pt-2">
                        <Button
                            size="sm"
                            onClick={applyRange}
                            className="flex-1"
                            disabled={!startDate || !endDate}
                        >
                            Apply
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={cancelSelection}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={clearRange}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
} 