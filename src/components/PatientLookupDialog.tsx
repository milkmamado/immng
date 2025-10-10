import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, UserPlus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientLookupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceedToRegistration: (name: string, phone: string) => void;
}

export function PatientLookupDialog({ 
  open, 
  onOpenChange, 
  onProceedToRegistration 
}: PatientLookupDialogProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const { toast } = useToast();

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const numbers = value.replace(/[^0-9]/g, '');
    let formattedPhone = numbers;
    
    if (numbers.length <= 3) {
      formattedPhone = numbers;
    } else if (numbers.length <= 7) {
      formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
    } else if (numbers.length <= 11) {
      formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7)}`;
    } else {
      formattedPhone = `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    }
    
    setPhone(formattedPhone);
  };

  const handleLookup = async () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "입력 오류",
        description: "고객명과 휴대폰 번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    setIsLookingUp(true);
    
    // TODO: 한국도움기술 API 연동 (나중에 구현)
    // 현재는 준비 단계이므로 임시 메시지 표시
    setTimeout(() => {
      toast({
        title: "API 연동 대기 중",
        description: "한국도움기술 API 연동 후 고객 정보를 조회할 수 있습니다.",
      });
      setIsLookingUp(false);
    }, 1000);
  };

  const handleProceedToRegistration = () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "입력 오류",
        description: "고객명과 휴대폰 번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onProceedToRegistration(name, phone);
    // 다이얼로그 닫고 초기화
    setName('');
    setPhone('');
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>새 환자 등록 - 고객 정보 입력</DialogTitle>
        </DialogHeader>
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <Label htmlFor="customer-name">고객명 *</Label>
            <Input
              id="customer-name"
              placeholder="이름을 입력하세요"
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="customer-phone">휴대폰 번호 *</Label>
            <Input
              id="customer-phone"
              type="tel"
              placeholder="010-0000-0000"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={13}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={handleLookup}
              disabled={isLookingUp}
            >
              <Search className="h-4 w-4 mr-2" />
              {isLookingUp ? "조회 중..." : "조회"}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleProceedToRegistration}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              등록하기
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
