import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, BookMarked, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CRMBookmarklet() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // 북마크릿 JavaScript 코드
  const bookmarkletCode = `javascript:(function(){
    var appUrl='https://c1b1e147-d88f-49c7-a031-a4345f1f4a69.lovableproject.com/first-visit';
    var searchData=localStorage.getItem('crm_search_data');
    if(searchData){
      var data=JSON.parse(searchData);
      var nameInput=document.querySelector('#pagetabs_2705_4_popupClnt_01_2715_srch_clnt_nm');
      var phoneInput=document.querySelector('#pagetabs_2705_4_popupClnt_01_2715_srch_hp_telno');
      var searchBtn=document.querySelector('#pagetabs_2705_4_popupClnt_01_2715_btn_srch01');
      var branchSelect=document.querySelector('#pagetabs_2705_4_popupClnt_01_2715_srch_bnch_cd');
      if(branchSelect)branchSelect.value='';
      if(nameInput)nameInput.value=data.name||'';
      if(phoneInput)phoneInput.value=data.phone||'';
      if(searchBtn)searchBtn.click();
      localStorage.removeItem('crm_search_data');
      alert('검색이 실행되었습니다. 환자를 더블클릭하세요.');
    }
    document.addEventListener('dblclick',function(e){
      setTimeout(function(){
        var getValue=function(id){var el=document.querySelector('#'+id);return el?el.value:'';};
        var getSelectedText=function(id){var select=document.querySelector('#'+id);if(!select)return '';var option=select.options[select.selectedIndex];return option?option.text:'';};
        var data={
          name:getValue('pagetabs_3013_4_bs_clnt_nm'),
          customer_number:getValue('pagetabs_3013_4_bs_clnt_no'),
          resident_number_masked:getValue('pagetabs_3013_4_bs_rrn'),
          phone:getValue('pagetabs_3013_4_bs_hp_telno'),
          gender:getValue('pagetabs_3013_4_bs_sex'),
          age:getValue('pagetabs_3013_4_bs_spec_age'),
          address:(getValue('pagetabs_3013_4_bs_up_addr1')+' '+getValue('pagetabs_3013_4_bs_ref_addr1')).trim(),
          visit_motivation:getSelectedText('pagetabs_3013_4_cmhs_motv_cd'),
          diagnosis_category:getSelectedText('pagetabs_3013_4_dgns_cd'),
          diagnosis_detail:getSelectedText('pagetabs_3013_4_dgns_detl_cd'),
          hospital_category:getSelectedText('pagetabs_3013_4_org_hspt_cd'),
          crm_memo:getValue('pagetabs_3013_4_cms_call_memo')
        };
        if(data.name){
          if(window.opener&&!window.opener.closed){
            window.opener.postMessage({type:'crm-patient-data',data:data},'*');
            alert('환자 정보가 전송되었습니다.\\n원래 창에서 확인하세요.');
            window.close();
          }else{
            localStorage.setItem('crm_patient_data',JSON.stringify(data));
            window.open(appUrl+'?crm=import','_blank');
          }
        }
      },500);
    });
  })();`.replace(/\s+/g, ' ');

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    toast({
      title: "복사 완료",
      description: "북마크릿 코드가 클립보드에 복사되었습니다.",
    });
    setTimeout(() => setCopied(false), 3000);
  };

  // URL 파라미터에서 crm=import 확인
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('crm') === 'import') {
      const storedData = localStorage.getItem('crm_patient_data');
      if (storedData) {
        const data = JSON.parse(storedData);
        localStorage.removeItem('crm_patient_data');
        
        // FirstVisitManagement 페이지로 데이터 전달
        window.dispatchEvent(new CustomEvent('crm-import', { detail: data }));
        
        toast({
          title: "CRM 데이터 가져오기 성공",
          description: `${data.name} 환자 정보를 불러왔습니다.`,
        });
      }
    }
  }, [toast]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookMarked className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">CRM 북마크릿 설치</h1>
      </div>

      <Alert>
        <FileCode className="h-4 w-4" />
        <AlertDescription>
          북마크릿을 사용하면 CRM에서 클릭 한 번으로 환자 정보를 자동으로 가져올 수 있습니다.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>북마크릿 설치 방법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div>
                <h3 className="font-semibold mb-2">북마크릿 코드 복사</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  아래 버튼을 클릭하여 북마크릿 코드를 복사하세요.
                </p>
                <Button onClick={handleCopyBookmarklet} className="gap-2">
                  {copied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      복사됨!
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      북마크릿 코드 복사
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div>
                <h3 className="font-semibold mb-2">브라우저 북마크 추가</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p><strong>Chrome/Edge:</strong></p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>Ctrl+D (또는 ⌘+D) 눌러서 북마크 추가</li>
                    <li>이름: "CRM 데이터 가져오기"</li>
                    <li>URL 필드에 복사한 코드 붙여넣기</li>
                    <li>저장</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-2">북마크릿 사용 방법</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>CRM (http://192.168.1.101/html/MEDI20/main.html)에 로그인</li>
                    <li>전화번호로 환자 조회</li>
                    <li>환자명을 <strong>더블클릭</strong>하여 상세정보 표시</li>
                    <li>브라우저 북마크바에서 <strong>"CRM 데이터 가져오기"</strong> 북마크 클릭</li>
                    <li>새 창이 열리면서 환자 정보가 자동으로 입력됨</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              북마크릿 코드 미리보기
            </h4>
            <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto">
              {bookmarkletCode}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>문제 해결</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <strong>Q: 북마크릿을 클릭했는데 "환자 정보를 찾을 수 없습니다" 메시지가 나옵니다</strong>
            <p className="text-muted-foreground mt-1">
              A: 환자명을 더블클릭하여 상세정보 창이 열려있는지 확인하세요. 상세정보가 표시된 상태에서 북마크릿을 클릭해야 합니다.
            </p>
          </div>
          <div>
            <strong>Q: 북마크릿을 추가했는데 북마크바에 보이지 않습니다</strong>
            <p className="text-muted-foreground mt-1">
              A: 브라우저 설정에서 북마크바가 표시되도록 설정하세요. (Chrome: Ctrl+Shift+B)
            </p>
          </div>
          <div>
            <strong>Q: 데이터가 일부만 가져와집니다</strong>
            <p className="text-muted-foreground mt-1">
              A: CRM 상세정보 창에서 모든 정보가 로딩될 때까지 기다린 후 북마크릿을 클릭하세요.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}