import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DiagnosisFilterProps {
  searchText: string;
  onSearchChange: (text: string) => void;
}

export function DiagnosisFilter({ searchText, onSearchChange }: DiagnosisFilterProps) {
  const [tempText, setTempText] = useState(searchText);

  const handleApply = () => {
    onSearchChange(tempText);
  };

  const handleReset = () => {
    setTempText('');
    onSearchChange('');
  };

  const hasActiveFilter = searchText.length > 0;

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
      <PopoverContent className="w-64 z-50 bg-background" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">진단명 검색</label>
            <Input
              placeholder="진단명 입력..."
              value={tempText}
              onChange={(e) => setTempText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleApply();
                }
              }}
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
      </PopoverContent>
    </Popover>
  );
}
