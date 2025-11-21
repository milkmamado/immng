import { useState } from 'react';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface DateRangeFilterProps {
  startDate?: Date;
  endDate?: Date;
  onDateChange: (startDate?: Date, endDate?: Date) => void;
}

export function DateRangeFilter({ startDate, endDate, onDateChange }: DateRangeFilterProps) {
  const [tempStartDate, setTempStartDate] = useState<Date | undefined>(startDate);
  const [tempEndDate, setTempEndDate] = useState<Date | undefined>(endDate);

  const handleApply = () => {
    onDateChange(tempStartDate, tempEndDate);
  };

  const handleReset = () => {
    setTempStartDate(undefined);
    setTempEndDate(undefined);
    onDateChange(undefined, undefined);
  };

  const hasActiveFilter = startDate || endDate;

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className={cn(
            "h-8 gap-1",
            hasActiveFilter && "text-primary font-semibold"
          )}
        >
          <CalendarIcon className="h-3.5 w-3.5" />
          {hasActiveFilter && (
            <span className="ml-1 rounded-full bg-primary w-1.5 h-1.5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 z-50 bg-background" align="start">
        <ScrollArea className="max-h-[500px]">
          <div className="p-4 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">시작일</label>
              <Calendar
                mode="single"
                selected={tempStartDate}
                onSelect={setTempStartDate}
                className="pointer-events-auto"
                disabled={(date) => tempEndDate ? date > tempEndDate : false}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">종료일</label>
              <Calendar
                mode="single"
                selected={tempEndDate}
                onSelect={setTempEndDate}
                className="pointer-events-auto"
                disabled={(date) => tempStartDate ? date < tempStartDate : false}
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline" size="sm" className="flex-1">
                초기화
              </Button>
              <Button onClick={handleApply} size="sm" className="flex-1">
                적용
              </Button>
            </div>
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
