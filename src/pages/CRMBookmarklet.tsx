import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, BookMarked, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CRMBookmarklet() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // 북마크릿 JavaScript 코드 - CRM 자동화 (정식 버전)
  const bookmarkletCode = `javascript:(function(){var hash=window.location.hash;var searchData=null;if(hash.indexOf('crm_data=')!==-1){try{var encoded=hash.split('crm_data=')[1];var decoded=decodeURIComponent(atob(encoded));searchData=JSON.parse(decoded);}catch(e){console.error('데이터 파싱 오류:',e);return;}}else{console.log('검색 데이터가 URL에 없습니다.');return;}if(searchData){var searchBtn=document.querySelector('[id*="btn_bsClntNmPopUp"]');if(searchBtn){searchBtn.click();setTimeout(function(){var popup=document.querySelector('.win_popup-wapper');if(popup){var nameInput=popup.querySelector('[id*="srch_clnt_nm"]');var phoneInput=popup.querySelector('[id*="srch_hp_telno"]');var branchSelect=popup.querySelector('[id*="srch_bnch_cd"]');var popupSearchBtn=popup.querySelector('[id*="btn_srch"]');if(branchSelect)branchSelect.value='';if(nameInput)nameInput.value=searchData.name||'';if(phoneInput)phoneInput.value=searchData.phone||'';if(popupSearchBtn){popupSearchBtn.click();}}},500);}}document.addEventListener('dblclick',function(e){setTimeout(function(){var findInputWithValue=function(pattern){var inputs=document.querySelectorAll('input[id*="'+pattern+'"]');for(var i=0;i<inputs.length;i++){var val=inputs[i].value.trim();if(val){return inputs[i];}}return null;};var findTextareaWithValue=function(pattern){var textareas=document.querySelectorAll('textarea[id*="'+pattern+'"]');for(var i=0;i<textareas.length;i++){var val=textareas[i].value.trim();if(val){return textareas[i];}}return textareas.length>0?textareas[0]:null;};var getValue=function(pattern){var el=findInputWithValue(pattern);return el?el.value.trim():'';};var getSelectedText=function(pattern){console.log('🔍 Finding select for pattern:',pattern);var selects=document.querySelectorAll('select[id*="'+pattern+'"]');console.log('Found selects:',selects.length);for(var i=0;i<selects.length;i++){var select=selects[i];console.log('Select #'+i+':',select.id,'selectedIndex:',select.selectedIndex);var option=select.options[select.selectedIndex];if(option){console.log('Option text:',option.text,'value:',option.value);}if(option&&option.text.trim()&&select.selectedIndex>0){console.log('✅ Selected:',option.text.trim());return option.text.trim();}}console.log('❌ No selection found');return'';};var getTextareaValue=function(pattern){var el=findTextareaWithValue(pattern);return el?el.value.trim():'';};var name=getValue('bs_clnt_nm');if(name){var diagCategory=getSelectedText('dgns_cd');var diagDetail=getSelectedText('dgns_detl_cd');console.log('📋 진단명(대분류):',diagCategory);console.log('📋 진단명(중분류):',diagDetail);var data={name:name,customer_number:getValue('bs_clnt_no'),resident_number_masked:getValue('bs_rrn'),phone:getValue('bs_hp_telno'),gender:getValue('bs_sex'),age:getValue('bs_spec_age')||getValue('bs_age'),address:(getValue('bs_up_addr1')+' '+getValue('bs_ref_addr1')).trim(),visit_motivation:getSelectedText('cmhs_motv_cd'),diagnosis_category:diagCategory,diagnosis_detail:diagDetail,hospital_category:getSelectedText('org_hspt_cd'),crm_memo:getTextareaValue('cms_call_memo'),special_note_1:getTextareaValue('rmk_1'),special_note_2:getTextareaValue('rmk_2'),treatment_memo_1:getTextareaValue('mdcr_memo_cnts_1'),treatment_memo_2:getTextareaValue('mdcr_memo_cnts_2')};console.log('📦 최종 데이터:',data);if(window.opener&&!window.opener.closed){window.opener.postMessage({type:'crm-patient-data',data:data},'*');window.close();}else{var appUrl=searchData?searchData.appUrl:window.location.origin+'/first-visit';localStorage.setItem('crm_patient_data',JSON.stringify(data));window.open(appUrl+'?crm=import','_blank');}}},500);});})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    toast({
      title: "복사 완료",
      description: "연동 코드가 클립보드에 복사되었습니다.",
      duration: 1000,
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
          duration: 1000,
        });
      }
    }
  }, [toast]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <BookMarked className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">CRM 연동 설정</h1>
      </div>

      <Alert>
        <FileCode className="h-4 w-4" />
        <AlertDescription>
          CRM 연동을 사용하면 클릭 한 번으로 환자 정보를 자동으로 가져올 수 있습니다.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle>연동 설정 방법</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                1
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">북마크바 표시하기</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  먼저 북마크바가 보이도록 설정하세요.
                </p>
                <div className="bg-muted p-3 rounded text-sm">
                  <strong>단축키:</strong> Ctrl + Shift + B (Windows) 또는 ⌘ + Shift + B (Mac)
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                2
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">북마크 생성</h3>
                
                <div className="space-y-3">
                  <Button onClick={handleCopyBookmarklet} className="w-full gap-2" size="lg">
                    {copied ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        복사됨!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        CRM 연동 코드 복사
                      </>
                    )}
                  </Button>

                  <div className="border rounded p-3 bg-blue-50">
                    <strong className="text-blue-900">방법: 새 북마크 만들기</strong>
                    <ol className="list-decimal list-inside ml-2 mt-2 text-sm space-y-1">
                      <li>위 "CRM 연동 코드 복사" 버튼 클릭</li>
                      <li>아무 페이지에서 <code className="bg-blue-100 px-1">Ctrl+D</code> (또는 <code className="bg-blue-100 px-1">⌘+D</code>) 눌러 북마크 추가하고 완료</li>
                      <li>이름: <code className="bg-blue-100 px-1">CRM 연동</code></li>
                      <li>추가된 "CRM 연동" 북마크에 마우스 우클릭 → <strong>수정</strong> 클릭</li>
                      <li>URL 필드에 복사한 코드 <strong>전체</strong> 붙여넣기</li>
                      <li>저장</li>
                    </ol>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center font-bold">
                3
              </div>
              <div>
                <h3 className="font-semibold mb-2">사용 방법</h3>
                <div className="text-sm text-muted-foreground space-y-2">
                  <ol className="list-decimal list-inside space-y-2">
                    <li>
                      <strong>초진관리 → 새 환자 등록 → 조회</strong> 클릭
                      <div className="ml-6 text-xs text-gray-500">→ CRM 페이지가 새 탭으로 열립니다</div>
                    </li>
                    <li>
                      <strong>북마크바의 "CRM 연동" 북마크 클릭</strong>
                      <div className="ml-6 text-xs text-gray-500">→ 자동으로 검색이 실행됩니다</div>
                    </li>
                    <li>
                      <strong>환자명 더블클릭</strong> (상세정보 표시)
                      <div className="ml-6 text-xs text-gray-500">→ 자동으로 정보가 추출되어 원래 창에 전달됩니다</div>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-blue-900 text-xs font-semibold">
                      ⚠️ 중요: 북마크 클릭 전에 미리 CRM 프로그램에 로그인해 두어야 합니다. 로그인이 안 되어 있으면 데이터를 가져올 수 없습니다!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}