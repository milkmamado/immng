import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Package, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PackageIntegration() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // 패키지 연동 북마크릿 JavaScript 코드
  const bookmarkletCode = `javascript:(function(){var hash=window.location.hash;var searchData=null;if(hash.indexOf('package_data=')!==-1){try{var encoded=hash.split('package_data=')[1];var decoded=decodeURIComponent(atob(encoded));searchData=JSON.parse(decoded);}catch(e){console.error('데이터 파싱 오류:',e);return;}}else{console.log('검색 데이터가 URL에 없습니다.');return;}if(searchData&&searchData.customerNumber){var searchInput=document.querySelector('[id*="srch_clnt_no"]');if(searchInput){searchInput.value=searchData.customerNumber;var enterEvent=new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true});searchInput.dispatchEvent(enterEvent);}setTimeout(function(){try{var resultRow=document.querySelector('[title="'+searchData.customerNumber+'"]');if(resultRow){var dblClickEvent=new MouseEvent('dblclick',{bubbles:true,cancelable:true,view:window});resultRow.dispatchEvent(dblClickEvent);setTimeout(function(){try{var getGridSum=function(gridId){var total=0;var grid=document.querySelector('[id*="'+gridId+'"]');if(grid){var rows=grid.querySelectorAll('tbody tr');rows.forEach(function(row){var cells=row.querySelectorAll('td');if(cells.length>=2){var value=cells[1].textContent.trim().replace(/,/g,'');var num=parseFloat(value);if(!isNaN(num)){total+=num;}}});}return total;};var depositIncome=getGridSum('grd_list_dpst_pay_01');var depositUsage=getGridSum('grd_list_dpst_pay_02');var rewardIncome=getGridSum('grd_list_mmbr_pnt_01');var rewardUsage=getGridSum('grd_list_mmbr_pnt_02');var countInput=getGridSum('grd_list_thpy_03');var countUsage=getGridSum('grd_list_thpy_04');var packageData={customerNumber:searchData.customerNumber,depositTotal:depositIncome,depositUsed:depositUsage,depositBalance:depositIncome-depositUsage,rewardTotal:rewardIncome,rewardUsed:rewardUsage,rewardBalance:rewardIncome-rewardUsage,countTotal:countInput,countUsed:countUsage,countBalance:countInput-countUsage,lastSyncedAt:new Date().toISOString()};if(window.opener&&!window.opener.closed){window.opener.postMessage({type:'crm-package-data',data:packageData},'*');window.close();}else{alert('원본 창을 찾을 수 없습니다.');}}catch(e){console.error('패키지 데이터 추출 오류:',e);}},2000);}else{alert('검색 결과를 찾을 수 없습니다.');}}catch(e){console.error('더블클릭 오류:',e);}},1500);}})();`;

  const handleCopyBookmarklet = () => {
    navigator.clipboard.writeText(bookmarkletCode);
    setCopied(true);
    toast({
      title: "복사 완료",
      description: "패키지 연동 코드가 클립보드에 복사되었습니다.",
      duration: 1000,
    });
    setTimeout(() => setCopied(false), 3000);
  };

  // URL 파라미터에서 package=import 확인
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('package') === 'import') {
      const storedData = localStorage.getItem('crm_package_data');
      if (storedData) {
        const data = JSON.parse(storedData);
        localStorage.removeItem('crm_package_data');
        
        // PatientListManagement 페이지로 데이터 전달
        window.dispatchEvent(new CustomEvent('package-import', { detail: data }));
        
        toast({
          title: "패키지 데이터 가져오기 성공",
          description: `패키지 정보를 성공적으로 불러왔습니다.`,
          duration: 1000,
        });
      }
    }
  }, [toast]);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Package className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-bold">패키지 연동 설정</h1>
      </div>

      <Alert>
        <FileCode className="h-4 w-4" />
        <AlertDescription>
          패키지 연동을 사용하면 CRM의 예수금, 적립금, 횟수 정보를 자동으로 가져올 수 있습니다.
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
                      <li>이름: <code className="bg-blue-100 px-1">패키지 연동</code></li>
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
                        패키지 연동 코드 복사
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
                      <strong>관리환자 리스트에서 환자 선택 → 패키지 관리 → 최신화 버튼 클릭</strong>
                      <div className="ml-6 text-xs text-gray-500">→ CRM 패키지 관리 페이지가 새 탭으로 열립니다</div>
                    </li>
                    <li>
                      <strong>북마크바의 "패키지 연동" 북마크 클릭</strong>
                      <div className="ml-6 text-xs text-gray-500">→ 자동으로 고객번호로 검색 및 데이터 추출이 실행됩니다</div>
                    </li>
                    <li>
                      <strong>자동으로 정보가 추출되어 환자 관리 시스템으로 전달됩니다</strong>
                      <div className="ml-6 text-xs text-gray-500">→ 예수금, 적립금, 횟수 정보가 업데이트됩니다</div>
                    </li>
                  </ol>
                  <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                    <p className="text-green-900 text-xs font-semibold">
                      ✨ 자동 처리: 6개 그리드(예수금 입금/사용, 적립금 입금/사용, 횟수 입력/사용)에서 합계를 자동으로 계산합니다!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-muted p-4 rounded-lg">
            <h4 className="font-semibold mb-2 flex items-center gap-2">
              <FileCode className="h-4 w-4" />
              패키지 연동 코드 미리보기
            </h4>
            <div className="bg-background p-3 rounded border font-mono text-xs overflow-x-auto break-all">
              {bookmarkletCode}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>추출되는 패키지 정보</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded p-3">
              <strong className="text-primary">예수금</strong>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• 총 입금액</li>
                <li>• 사용액</li>
                <li>• 잔액 (자동 계산)</li>
              </ul>
            </div>
            <div className="border rounded p-3">
              <strong className="text-primary">적립금</strong>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• 총 적립액</li>
                <li>• 사용액</li>
                <li>• 잔액 (자동 계산)</li>
              </ul>
            </div>
            <div className="border rounded p-3">
              <strong className="text-primary">횟수</strong>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• 총 입력 횟수</li>
                <li>• 사용 횟수</li>
                <li>• 잔여 횟수 (자동 계산)</li>
              </ul>
            </div>
            <div className="border rounded p-3">
              <strong className="text-primary">기타</strong>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                <li>• 고객번호</li>
                <li>• 최종 동기화 시간</li>
              </ul>
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
            <strong>Q: CRM 페이지 구조가 변경되면 어떻게 하나요?</strong>
            <p className="text-muted-foreground mt-1">
              A: 북마크릿 코드를 업데이트해야 합니다. 관리자에게 문의하세요.
            </p>
          </div>
          <div>
            <strong>Q: 데이터가 정확하게 추출되지 않습니다</strong>
            <p className="text-muted-foreground mt-1">
              A: CRM 페이지에서 모든 그리드 데이터가 로드된 후 북마크릿을 실행하세요. 페이지 로딩이 완료될 때까지 약 1-2초 기다리는 것이 좋습니다.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
