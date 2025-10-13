import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PatientLookupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProceedToRegistration: (data: any) => void;
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
    if (!name.trim() && !phone.trim()) {
      toast({
        title: "입력 오류",
        description: "고객명 또는 휴대폰 번호를 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    // 검색 데이터를 URL 파라미터로 인코딩
    const searchData = {
      name: name || "",
      phone: phone || "",
      appUrl: window.location.origin + '/first-visit'
    };
    
    // Base64로 인코딩하여 URL에 포함
    const encodedData = btoa(encodeURIComponent(JSON.stringify(searchData)));
    
    // CRM 페이지를 열면서 hash에 데이터 전달
    const crmWindow = window.open(`http://192.168.1.101/html/MEDI20/main.html#crm_data=${encodedData}`, '_blank');
    
    if (crmWindow) {
      toast({
        title: "CRM 페이지가 열렸습니다",
        description: "북마크바의 'CRM 연동' 북마크를 클릭하세요.",
        duration: 1000,
      });
    } else {
      toast({
        title: "팝업 차단",
        description: "팝업 차단을 해제하고 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
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

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleLookup}
            disabled={isLookingUp}
          >
            <Search className="h-4 w-4 mr-2" />
            {isLookingUp ? "조회 중..." : "조회"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
