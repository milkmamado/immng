import * as React from "react";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { format, parse, isValid } from "date-fns";
import { ko } from "date-fns/locale";

interface DatePickerWithInputProps {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  initialFocus?: boolean;
  className?: string;
}

export function DatePickerWithInput({
  selected,
  onSelect,
  initialFocus,
  className,
}: DatePickerWithInputProps) {
  const [inputValue, setInputValue] = React.useState("");
  const [month, setMonth] = React.useState<Date>(selected || new Date());

  React.useEffect(() => {
    if (selected) {
      setInputValue(format(selected, "yyyy-MM-dd"));
      setMonth(selected);
    }
  }, [selected]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);

    // YYYY-MM-DD 형식 검증
    if (value.length === 10) {
      const parsedDate = parse(value, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        setMonth(parsedDate);
      }
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      const parsedDate = parse(inputValue, "yyyy-MM-dd", new Date());
      if (isValid(parsedDate)) {
        onSelect?.(parsedDate);
      }
    }
  };

  return (
    <div className="space-y-3">
      <div className="px-3">
        <Label htmlFor="date-input" className="text-xs text-muted-foreground">
          날짜 직접 입력 (YYYY-MM-DD)
        </Label>
        <Input
          id="date-input"
          type="text"
          placeholder="2024-01-15"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleInputKeyDown}
          className="mt-1"
          maxLength={10}
        />
      </div>
      <Calendar
        mode="single"
        selected={selected}
        onSelect={onSelect}
        month={month}
        onMonthChange={setMonth}
        initialFocus={initialFocus}
        className={className}
      />
    </div>
  );
}
