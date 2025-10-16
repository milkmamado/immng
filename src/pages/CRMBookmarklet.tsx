import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, BookMarked, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function CRMBookmarklet() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // 북마크릿 JavaScript 코드 - CRM 자동화 (디버깅용: 필드 값 반복 체크)
  const bookmarkletCode = `javascript:(function(){var hash=window.location.hash;var searchData=null;if(hash.indexOf('crm_data=')!==-1){try{var encoded=hash.split('crm_data=')[1];var decoded=decodeURIComponent(atob(encoded));searchData=JSON.parse(decoded);}catch(e){console.error('데이터 파싱 오류:',e);return;}}else{console.log('검색 데이터가 URL에 없습니다.');return;}if(searchData){var searchBtn=document.querySelector('[id*="btn_bsClntNmPopUp"]');if(searchBtn){searchBtn.click();setTimeout(function(){var popup=document.querySelector('.win_popup-wapper');if(popup){var nameInput=popup.querySelector('[id*="srch_clnt_nm"]');var phoneInput=popup.querySelector('[id*="srch_hp_telno"]');var branchSelect=popup.querySelector('[id*="srch_bnch_cd"]');var popupSearchBtn=popup.querySelector('[id*="btn_srch"]');if(branchSelect)branchSelect.value='';if(nameInput)nameInput.value=searchData.name||'';if(phoneInput)phoneInput.value=searchData.phone||'';if(popupSearchBtn){popupSearchBtn.click();}}},500);}}document.addEventListener('dblclick',function(e){console.log('[디버그] 더블클릭 감지');var attemptCount=0;var maxAttempts=10;var checkInterval=300;var checkData=function(){attemptCount++;console.log('[디버그] 데이터 체크 시도 '+attemptCount+'/'+maxAttempts);var findInput=function(pattern){var inputs=document.querySelectorAll('input[id*="'+pattern+'"]');return inputs.length>0?inputs[0]:null;};var nameField=findInput('bs_clnt_nm');var nameValue=nameField?nameField.value.trim():'';console.log('[디버그] getValue(bs_clnt_nm):', nameValue);if(nameValue){console.log('[디버그] 고객명 발견! 데이터 추출 시작');var findSelect=function(pattern){var selects=document.querySelectorAll('select[id*="'+pattern+'"]');return selects.length>0?selects[0]:null;};var findTextarea=function(pattern){var textareas=document.querySelectorAll('textarea[id*="'+pattern+'"]');return textareas.length>0?textareas[0]:null;};var getValue=function(pattern){var el=findInput(pattern);return el?el.value.trim():'';};var getSelectedText=function(pattern){var select=findSelect(pattern);if(!select)return'';var option=select.options[select.selectedIndex];return option?option.text.trim():'';};var getTextareaValue=function(pattern){var el=findTextarea(pattern);return el?el.value.trim():'';};var data={name:nameValue,customer_number:getValue('bs_clnt_no'),resident_number_masked:getValue('bs_rrn'),phone:getValue('bs_hp_telno'),gender:getValue('bs_sex'),age:getValue('bs_spec_age')||getValue('bs_age'),address:(getValue('bs_up_addr1')+' '+getValue('bs_ref_addr1')).trim(),visit_motivation:getSelectedText('cmhs_motv_cd'),diagnosis_category:getSelectedText('dgns_cd'),diagnosis_detail:getSelectedText('dgns_detl_cd'),hospital_category:getSelectedText('org_hspt_cd'),crm_memo:getTextareaValue('cms_call_memo')};console.log('[디버그] 추출된 데이터:', data);if(window.opener&&!window.opener.closed){console.log('[디버그] postMessage 전송');window.opener.postMessage({type:'crm-patient-data',data:data},'*');console.log('[디버그] 창 닫기 생략 (디버깅용)');}else{console.log('[디버그] localStorage 저장');var appUrl=searchData?searchData.appUrl:window.location.origin+'/first-visit';localStorage.setItem('crm_patient_data',JSON.stringify(data));window.open(appUrl+'?crm=import','_blank');}}else if(attemptCount<maxAttempts){console.log('[디버그] 고객명이 비어있음, '+checkInterval+'ms 후 재시도...');setTimeout(checkData,checkInterval);}else{console.log('[디버그] 최대 시도 횟수 초과, 고객명을 찾을 수 없음');}};setTimeout(checkData,300);});})();`;

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
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertDescription className="text-yellow-800">
              <strong>⚠️ 중요:</strong> 연동 스크립트는 <strong>북마크바에 드래그</strong>하거나 
              <strong>북마크 추가 시 URL에 붙여넣기</strong> 해야 합니다. 
              일반 링크처럼 클릭하면 작동하지 않습니다!
            </AlertDescription>
          </Alert>

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
                <p className="text-sm text-muted-foreground mb-3">
                  아래 방법 중 하나를 선택하세요:
                </p>
                
                <div className="space-y-3">
                  <div className="border rounded p-3 bg-blue-50">
                    <strong className="text-blue-900">방법 A: 새 북마크 만들기 (추천)</strong>
                    <ol className="list-decimal list-inside ml-2 mt-2 text-sm space-y-1">
                      <li>아무 페이지에서 Ctrl+D (또는 ⌘+D) 눌러 북마크 추가</li>
                      <li>이름: <code className="bg-blue-100 px-1">CRM 연동</code></li>
                      <li>아래 버튼 클릭하여 코드 복사</li>
                      <li>URL 필드에 복사한 코드 <strong>전체</strong> 붙여넣기</li>
                      <li>저장</li>
                    </ol>
                  </div>

                  <Button onClick={handleCopyBookmarklet} className="w-full gap-2" size="lg">
                    {copied ? (
                      <>
                        <CheckCircle className="h-5 w-5" />
                        복사됨!
                      </>
                    ) : (
                      <>
                        <Copy className="h-5 w-5" />
                        연동 코드 복사
                      </>
                    )}
                  </Button>
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
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-900 text-xs font-semibold">
                      ✨ 새 버전: 확인 버튼 없이 자동으로 처리됩니다! (오류 발생 시에만 브라우저 콘솔에 로그 표시)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              연동 코드 미리보기
            </h4>
            <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto break-all">
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
            <strong>Q: 작동하지 않을 때는 어떻게 하나요?</strong>
            <p className="text-muted-foreground mt-1">
              A: 브라우저 콘솔(F12)을 열어 오류 메시지를 확인하세요. 모든 디버그 정보는 콘솔에 표시됩니다.
            </p>
          </div>
          <div>
            <strong>Q: 북마크를 추가했는데 북마크바에 보이지 않습니다</strong>
            <p className="text-muted-foreground mt-1">
              A: 브라우저 설정에서 북마크바가 표시되도록 설정하세요. (Chrome: Ctrl+Shift+B)
            </p>
          </div>
          <div>
            <strong>Q: 이전 버전에서 확인 버튼을 많이 눌러야 했는데요?</strong>
            <p className="text-muted-foreground mt-1">
              A: 위의 "연동 코드 복사" 버튼으로 새 버전을 복사하여 북마크를 업데이트하세요. 새 버전은 확인 버튼 없이 조용히 작동합니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}