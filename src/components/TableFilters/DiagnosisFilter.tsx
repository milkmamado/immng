import { useState, useEffect } from 'react';
import { Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';

interface DiagnosisFilterProps {
  selectedDiagnoses: string[];
  onDiagnosisChange: (diagnoses: string[]) => void;
}

export function DiagnosisFilter({ selectedDiagnoses, onDiagnosisChange }: DiagnosisFilterProps) {
  const [tempSelected, setTempSelected] = useState<string[]>(selectedDiagnoses);
  const [diagnosisOptions, setDiagnosisOptions] = useState<string[]>([]);

  useEffect(() => {
    fetchDiagnosisOptions();
  }, []);

  useEffect(() => {
    setTempSelected(selectedDiagnoses);
  }, [selectedDiagnoses]);

  const fetchDiagnosisOptions = async () => {
    try {
      const { data, error } = await supabase
        .from('diagnosis_options')
        .select('name')
        .is('parent_id', null)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      if (data) {
        setDiagnosisOptions(data.map(d => d.name));
      }
    } catch (error) {
      console.error('Error fetching diagnosis options:', error);
    }
  };

  const handleToggle = (diagnosis: string) => {
    setTempSelected(prev =>
      prev.includes(diagnosis)
        ? prev.filter(d => d !== diagnosis)
        : [...prev, diagnosis]
    );
  };

  const handleApply = () => {
    onDiagnosisChange(tempSelected);
  };

  const handleReset = () => {
    setTempSelected([]);
    onDiagnosisChange([]);
  };

  const hasActiveFilter = selectedDiagnoses.length > 0;

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
            <label className="text-sm font-medium">진단명 선택</label>
            <div className="max-h-64 overflow-y-auto space-y-2">
              {diagnosisOptions.map((diagnosis) => (
                <div key={diagnosis} className="flex items-center space-x-2">
                  <Checkbox
                    id={diagnosis}
                    checked={tempSelected.includes(diagnosis)}
                    onCheckedChange={() => handleToggle(diagnosis)}
                  />
                  <label
                    htmlFor={diagnosis}
                    className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {diagnosis}
                  </label>
                </div>
              ))}
            </div>
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
