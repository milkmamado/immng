import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface InflowStatusFilterProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

const INFLOW_STATUSES = ['유입', '전화상담', '방문상담', '실패'];

export function InflowStatusFilter({ selectedStatuses, onStatusChange }: InflowStatusFilterProps) {
  const [tempStatuses, setTempStatuses] = useState<string[]>(selectedStatuses);

  const handleToggle = (status: string) => {
    if (tempStatuses.includes(status)) {
      setTempStatuses(tempStatuses.filter(s => s !== status));
    } else {
      setTempStatuses([...tempStatuses, status]);
    }
  };

  const handleApply = () => {
    onStatusChange(tempStatuses);
  };

  const handleReset = () => {
    setTempStatuses([]);
    onStatusChange([]);
  };

  const hasActiveFilter = selectedStatuses.length > 0;

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
          <Filter className="h-3.5 w-3.5" />
          {hasActiveFilter && (
            <span className="ml-1 rounded-full bg-primary w-1.5 h-1.5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-56 z-50 bg-background" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            {INFLOW_STATUSES.map((status) => (
              <div key={status} className="flex items-center space-x-2">
                <Checkbox
                  id={`inflow-${status}`}
                  checked={tempStatuses.includes(status)}
                  onCheckedChange={() => handleToggle(status)}
                />
                <label
                  htmlFor={`inflow-${status}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {status}
                </label>
              </div>
            ))}
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
      </PopoverContent>
    </Popover>
  );
}
