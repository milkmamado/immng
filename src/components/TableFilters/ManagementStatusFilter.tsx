import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';

interface ManagementStatusFilterProps {
  selectedStatuses: string[];
  onStatusChange: (statuses: string[]) => void;
}

// 필터에 포함할 관리 상태 (면책기간, 아웃, 아웃위기는 별도 페이지 존재하므로 제외)
const MANAGEMENT_STATUS_OPTIONS = [
  { value: '관리 중', label: '관리 중' },
  { value: '사망', label: '사망' },
  { value: '상태악화', label: '상태악화' },
  { value: '치료 종료', label: '치료 종료' },
];

export function ManagementStatusFilter({ selectedStatuses, onStatusChange }: ManagementStatusFilterProps) {
  const [open, setOpen] = useState(false);

  const handleStatusToggle = (status: string) => {
    if (selectedStatuses.includes(status)) {
      onStatusChange(selectedStatuses.filter(s => s !== status));
    } else {
      onStatusChange([...selectedStatuses, status]);
    }
  };

  const handleReset = () => {
    onStatusChange([]);
  };

  const hasActiveFilter = selectedStatuses.length > 0;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1 min-w-[100px]",
            hasActiveFilter && "border-primary text-primary font-semibold"
          )}
        >
          <Filter className="h-3.5 w-3.5" />
          관리 상태
          {hasActiveFilter && (
            <span className="ml-1 rounded-full bg-primary text-primary-foreground text-xs px-1.5">
              {selectedStatuses.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-3 z-50 bg-background" align="start">
        <div className="space-y-3">
          <div className="space-y-2">
            {MANAGEMENT_STATUS_OPTIONS.map((option) => (
              <div key={option.value} className="flex items-center space-x-2">
                <Checkbox
                  id={`status-${option.value}`}
                  checked={selectedStatuses.includes(option.value)}
                  onCheckedChange={() => handleStatusToggle(option.value)}
                />
                <label
                  htmlFor={`status-${option.value}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {option.label}
                </label>
              </div>
            ))}
          </div>
          {hasActiveFilter && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="w-full text-muted-foreground"
            >
              초기화
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
