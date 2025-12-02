import { useState, useMemo } from 'react';
import { CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface MonthFilterProps {
  selectedMonth: string | null; // 'YYYY-MM' 형식
  onMonthChange: (month: string | null) => void;
  availableMonths?: string[]; // 데이터에서 추출한 월 목록
}

export function MonthFilter({ selectedMonth, onMonthChange, availableMonths = [] }: MonthFilterProps) {
  const [open, setOpen] = useState(false);

  // 최근 24개월 생성 (또는 availableMonths 사용)
  const months = useMemo(() => {
    if (availableMonths.length > 0) {
      return [...new Set(availableMonths)].sort().reverse();
    }
    
    const result: string[] = [];
    const now = new Date();
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      result.push(month);
    }
    return result;
  }, [availableMonths]);

  const formatMonthLabel = (month: string) => {
    const [year, monthNum] = month.split('-');
    return `${year}년 ${parseInt(monthNum)}월`;
  };

  const hasActiveFilter = selectedMonth !== null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "h-8 gap-1 min-w-[120px]",
            hasActiveFilter && "border-primary text-primary font-semibold"
          )}
        >
          <CalendarDays className="h-3.5 w-3.5" />
          {selectedMonth ? formatMonthLabel(selectedMonth) : '월 선택'}
          {hasActiveFilter && (
            <span className="ml-1 rounded-full bg-primary w-1.5 h-1.5" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2 z-50 bg-background" align="start">
        <div className="space-y-1">
          <Button
            variant={selectedMonth === null ? "default" : "ghost"}
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              onMonthChange(null);
              setOpen(false);
            }}
          >
            전체 보기
          </Button>
          <div className="max-h-64 overflow-y-auto space-y-1">
            {months.map((month) => (
              <Button
                key={month}
                variant={selectedMonth === month ? "default" : "ghost"}
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  onMonthChange(month);
                  setOpen(false);
                }}
              >
                {formatMonthLabel(month)}
              </Button>
            ))}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
