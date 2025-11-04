import { useState } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface VisitTypeFilterProps {
  selectedTypes: string[];
  onTypeChange: (types: string[]) => void;
}

const VISIT_TYPES = ['입원', '외래', '재원', '낮병동'];

export function VisitTypeFilter({ selectedTypes, onTypeChange }: VisitTypeFilterProps) {
  const [tempTypes, setTempTypes] = useState<string[]>(selectedTypes);

  const handleToggle = (type: string) => {
    if (tempTypes.includes(type)) {
      setTempTypes(tempTypes.filter(t => t !== type));
    } else {
      setTempTypes([...tempTypes, type]);
    }
  };

  const handleApply = () => {
    onTypeChange(tempTypes);
  };

  const handleReset = () => {
    setTempTypes([]);
    onTypeChange([]);
  };

  const hasActiveFilter = selectedTypes.length > 0;

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
            {VISIT_TYPES.map((type) => (
              <div key={type} className="flex items-center space-x-2">
                <Checkbox
                  id={`visit-${type}`}
                  checked={tempTypes.includes(type)}
                  onCheckedChange={() => handleToggle(type)}
                />
                <label
                  htmlFor={`visit-${type}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  {type}
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
