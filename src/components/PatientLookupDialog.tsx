import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, UserPlus, FileCode } from "lucide-react";
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
  const [crmHtml, setCrmHtml] = useState('');
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

  const parseCrmHtml = (html: string) => {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // 입력 필드에서 값 추출
      const getValue = (id: string) => {
        const input = doc.querySelector(`#${id}`) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
        return input?.value?.trim() || '';
      };

      // select 필드에서 선택된 옵션의 텍스트 가져오기
      const getSelectedText = (id: string) => {
        const select = doc.querySelector(`#${id}`) as HTMLSelectElement;
        if (!select) return '';
        const selectedOption = select.options[select.selectedIndex];
        return selectedOption?.text?.trim() || '';
      };

      const data = {
        name: getValue('pagetabs_3013_4_bs_clnt_nm'),
        customer_number: getValue('pagetabs_3013_4_bs_clnt_no'),
        resident_number_masked: getValue('pagetabs_3013_4_bs_rrn'),
        phone: getValue('pagetabs_3013_4_bs_hp_telno'),
        gender: getValue('pagetabs_3013_4_bs_sex'),
        age: getValue('pagetabs_3013_4_bs_spec_age'),
        visit_motivation: getSelectedText('pagetabs_3013_4_cmhs_motv_cd'),
        diagnosis_category: getSelectedText('pagetabs_3013_4_dgns_cd'),
        diagnosis_detail: getSelectedText('pagetabs_3013_4_dgns_detl_cd'),
        hospital_category: getSelectedText('pagetabs_3013_4_org_hspt_cd'),
        hospital_branch: '',
        address: (getValue('pagetabs_3013_4_bs_up_addr1') + ' ' + getValue('pagetabs_3013_4_bs_ref_addr1')).trim(),
        crm_memo: getValue('pagetabs_3013_4_cms_call_memo'),
      };

      return data;
    } catch (error) {
      console.error('HTML 파싱 오류:', error);
      throw new Error('HTML 파싱에 실패했습니다.');
    }
  };

  const handleCrmImport = () => {
    if (!crmHtml.trim()) {
      toast({
        title: "입력 오류",
        description: "CRM HTML 코드를 붙여넣어주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const parsedData = parseCrmHtml(crmHtml);
      
      if (!parsedData.name) {
        toast({
          title: "파싱 오류",
          description: "고객명을 찾을 수 없습니다. HTML 코드를 확인해주세요.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "데이터 가져오기 성공",
        description: `${parsedData.name} 환자 정보를 불러왔습니다.`,
      });

      onProceedToRegistration(parsedData);
      handleClose();
    } catch (error) {
      toast({
        title: "오류",
        description: error instanceof Error ? error.message : "HTML 파싱에 실패했습니다.",
        variant: "destructive",
      });
    }
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

    // CRM 검색 조건을 localStorage에 저장
    const searchData = {
      name: name || "",
      phone: phone || "",
      timestamp: Date.now()
    };
    localStorage.setItem('crm_search_data', JSON.stringify(searchData));
    
    // 현재 탭에서 CRM 페이지로 이동 (일반 탭, 북마크 바 보임)
    const crmWindow = window.open('http://192.168.1.101/html/MEDI20/main.html', '_blank');
    
    if (crmWindow) {
      toast({
        title: "CRM 페이지가 열렸습니다",
        description: "북마크바의 'CRM 연동' 북마크를 클릭하세요.",
        duration: 5000,
      });
    } else {
      toast({
        title: "팝업 차단",
        description: "팝업 차단을 해제하고 다시 시도해주세요.",
        variant: "destructive",
      });
    }
  };

  const handleManualRegistration = () => {
    if (!name.trim() || !phone.trim()) {
      toast({
        title: "입력 오류",
        description: "고객명과 휴대폰 번호를 모두 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    onProceedToRegistration({ name, phone });
    handleClose();
  };

  const handleClose = () => {
    setName('');
    setPhone('');
    setCrmHtml('');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>새 환자 등록 - 고객 정보 입력</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="manual" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="manual">수동 입력</TabsTrigger>
            <TabsTrigger value="crm">CRM 연동</TabsTrigger>
          </TabsList>
          
          <TabsContent value="manual" className="space-y-6 py-4">
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
                onClick={handleManualRegistration}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                등록하기
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="crm" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="crm-html">CRM HTML 코드</Label>
              <div className="text-sm text-muted-foreground mb-2">
                1. CRM에서 전화번호로 환자 조회<br />
                2. 환자명 더블클릭하여 상세정보 표시<br />
                3. 크롬 개발자도구(F12) &gt; Elements 탭<br />
                4. 상세정보 섹션의 HTML 코드를 복사하여 아래에 붙여넣기
              </div>
              <Textarea
                id="crm-html"
                placeholder="CRM 상세정보 HTML 코드를 여기에 붙여넣으세요..."
                value={crmHtml}
                onChange={(e) => setCrmHtml(e.target.value)}
                rows={10}
                className="font-mono text-xs"
              />
            </div>

            <Button
              type="button"
              className="w-full"
              onClick={handleCrmImport}
            >
              <FileCode className="h-4 w-4 mr-2" />
              CRM 데이터 가져오기
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
