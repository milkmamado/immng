import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Copy, CheckCircle, Package, FileCode } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function PackageIntegration() {
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  // 패키지 연동 북마크릿 (스크롤하면서 실시간 데이터 수집 - 합계가 나올 때까지, 개선된 스크롤 로직)
  const bookmarkletCode = `javascript:(function(){console.log('🚀 북마크릿 시작');var hash=window.location.hash;var searchData=null;if(hash.indexOf('package_data=')!==-1){try{var encoded=hash.split('package_data=')[1];var decoded=decodeURIComponent(atob(encoded));searchData=JSON.parse(decoded);console.log('✅ URL 데이터 파싱 성공:',searchData);}catch(e){console.error('❌ 데이터 파싱 오류:',e);alert('URL 데이터 파싱 실패');return;}}else{var stored=localStorage.getItem('crm_package_search');if(stored){searchData=JSON.parse(stored);console.log('✅ localStorage에서 복원');}else{alert('검색 데이터가 없습니다. 최신화 버튼을 먼저 클릭하세요.');return;}}if(searchData&&searchData.customerNumber){var searchInput=document.querySelector('[id*="srch_clnt_no"]');if(searchInput){console.log('🔍 검색:',searchData.customerNumber);searchInput.value=searchData.customerNumber;searchInput.focus();searchInput.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',code:'Enter',keyCode:13,which:13,bubbles:true}));}setTimeout(function(){try{var resultRow=document.querySelector('[title="'+searchData.customerNumber+'"]');if(resultRow){console.log('✅ 검색 결과 발견');resultRow.dispatchEvent(new MouseEvent('dblclick',{bubbles:true,cancelable:true}));setTimeout(function(){try{console.log('📊 데이터 추출 시작');var formatDate=function(d){if(!d)return'';var c=d.replace(/[^0-9]/g,'');if(c.length===8)return c.substring(0,4)+'-'+c.substring(4,6)+'-'+c.substring(6,8);if(c.length===6)return'20'+c.substring(0,2)+'-'+c.substring(2,4)+'-'+c.substring(4,6);return d;};var scrollAndCollectData=function(gridId,isUsage,callback){var g=document.querySelector('[id*="'+gridId+'"]');if(!g){console.log('❌',gridId,'없음');callback([]);return;}console.log('📜',gridId,'스크롤&수집 시작');var viewport=g.querySelector('.slick-viewport');var canvas=g.querySelector('.grid-canvas');if(!viewport||!canvas){console.log('⚠️ viewport/canvas 없음');callback([]);return;}var collectedData=[];var collectedKeys=new Set();var attempt=0;var lastScrollTop=0;var scrollStableCount=0;var scrollInterval=setInterval(function(){var currentScrollTop=viewport.scrollTop;if(Math.abs(currentScrollTop-lastScrollTop)<5){scrollStableCount++;}else{scrollStableCount=0;}lastScrollTop=currentScrollTop;var rows=canvas.querySelectorAll('.slick-row');var hasSummary=false;var newDataCount=0;rows.forEach(function(r){var cs=r.querySelectorAll('.slick-cell');if(cs.length<2)return;var fc=cs[0]?cs[0].querySelector('lable'):null;if(!fc)return;var ft=(fc.getAttribute('title')||fc.textContent||'').trim();if(ft==='합계'||ft==='소계'){hasSummary=true;return;}if(isUsage){var date1Lbl=cs[0]?cs[0].querySelector('lable'):null;var date2Lbl=cs[1]?cs[1].querySelector('lable'):null;var valueLbl=cs[2]?cs[2].querySelector('lable'):null;var noteLbl=cs[3]?cs[3].querySelector('lable'):null;if(date1Lbl&&date2Lbl&&valueLbl){var d1=(date1Lbl.getAttribute('title')||date1Lbl.textContent||'').trim();var d2=(date2Lbl.getAttribute('title')||date2Lbl.textContent||'').trim();var vt=(valueLbl.getAttribute('title')||valueLbl.textContent||'').trim().replace(/,/g,'');var nt=noteLbl?(noteLbl.getAttribute('title')||noteLbl.textContent||'').trim():'';var v=parseFloat(vt);if(!isNaN(v)&&v!==0){var key=d1+'|'+d2+'|'+v+'|'+nt;if(!collectedKeys.has(key)){collectedKeys.add(key);var mainDate=d2||d1;collectedData.push({dateFrom:formatDate(d1),dateTo:formatDate(d2),date:formatDate(mainDate),value:v,note:nt});newDataCount++;}}}}else{var dateLbl=cs[0]?cs[0].querySelector('lable'):null;var valueLbl=cs[1]?cs[1].querySelector('lable'):null;var noteLbl=cs[2]?cs[2].querySelector('lable'):null;if(dateLbl&&valueLbl){var dt=(dateLbl.getAttribute('title')||dateLbl.textContent||'').trim();var vt=(valueLbl.getAttribute('title')||valueLbl.textContent||'').trim().replace(/,/g,'');var nt=noteLbl?(noteLbl.getAttribute('title')||noteLbl.textContent||'').trim():'';var v=parseFloat(vt);if(!isNaN(v)&&v!==0&&dt){var key=dt+'|'+v+'|'+nt;if(!collectedKeys.has(key)){collectedKeys.add(key);collectedData.push({date:formatDate(dt),value:v,note:nt});newDataCount++;}}}}});attempt++;console.log('  스크롤',attempt,'- 수집:',collectedData.length,'건 (+'+newDataCount+') - 합계:',hasSummary?'✓':'✗','- 안정:',scrollStableCount);if(hasSummary){clearInterval(scrollInterval);console.log('✅',gridId,'완료 - 총',collectedData.length,'건 수집 (합계 발견)');callback(collectedData);return;}if(scrollStableCount>=3&&newDataCount===0){clearInterval(scrollInterval);console.log('⚠️',gridId,'스크롤 끝 (합계 없음) - 총',collectedData.length,'건 수집');callback(collectedData);return;}var maxScroll=viewport.scrollHeight-viewport.clientHeight;viewport.scrollTop=Math.min(viewport.scrollTop+viewport.clientHeight,maxScroll);},300);};var gridConfigs=[{id:'gridPkgActCdA01',isUsage:false},{id:'gridPkgActCdA02',isUsage:true},{id:'gridPkgActCdB01',isUsage:false},{id:'gridPkgActCdB02',isUsage:true},{id:'gridPkgActCdC01',isUsage:false},{id:'gridPkgActCdC02',isUsage:true}];var results={depositIncome:[],depositUsage:[],rewardIncome:[],rewardUsage:[],countInput:[],countUsage:[]};var currentIndex=0;var processNext=function(){if(currentIndex>=gridConfigs.length){var total=results.depositIncome.length+results.depositUsage.length+results.rewardIncome.length+results.rewardUsage.length+results.countInput.length+results.countUsage.length;console.log('\\n📦 총',total,'건');console.log('예치금:',results.depositIncome.length,'/',results.depositUsage.length);console.log('적립금:',results.rewardIncome.length,'/',results.rewardUsage.length);console.log('횟수:',results.countInput.length,'/',results.countUsage.length);if(total===0){alert('⚠️ 데이터를 찾지 못했습니다.\\n페이지 로딩 후 다시 시도하세요.');return;}var pkgData={customerNumber:searchData.customerNumber,depositIncome:results.depositIncome,depositUsage:results.depositUsage,rewardIncome:results.rewardIncome,rewardUsage:results.rewardUsage,countInput:results.countInput,countUsage:results.countUsage,lastSyncedAt:new Date().toISOString()};localStorage.setItem('crm_package_result',JSON.stringify(pkgData));if(window.opener&&!window.opener.closed){console.log('✅ 부모 창 전송');window.opener.postMessage({type:'crm-package-data',data:pkgData},'*');alert('데이터 추출 완료! ('+total+'건)');window.close();}else{console.log('⚠️ localStorage 저장');alert('데이터 추출 완료! ('+total+'건)\\nlocalStorage에 저장됨');if(searchData.appUrl)window.location.href=searchData.appUrl;}return;}var config=gridConfigs[currentIndex];var resultKey=['depositIncome','depositUsage','rewardIncome','rewardUsage','countInput','countUsage'][currentIndex];scrollAndCollectData(config.id,config.isUsage,function(data){results[resultKey]=data;currentIndex++;processNext();});};processNext();}catch(e){console.error('❌ 추출 오류:',e);alert('오류: '+e.message);}},3000);}else{alert('검색 결과 없음');}}catch(e){console.error('❌ 오류:',e);}},2000);}})();`;

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
                        패키지 연동 코드 복사
                      </>
                    )}
                  </Button>

                  <div className="border rounded p-3 bg-blue-50">
                    <strong className="text-blue-900">방법: 새 북마크 만들기</strong>
                    <ol className="list-decimal list-inside ml-2 mt-2 text-sm space-y-1">
                      <li>위 "패키지 연동 코드 복사" 버튼 클릭</li>
                      <li>아무 페이지에서 <code className="bg-blue-100 px-1">Ctrl+D</code> (또는 <code className="bg-blue-100 px-1">⌘+D</code>) 눌러 북마크 추가하고 완료</li>
                      <li>이름: <code className="bg-blue-100 px-1">패키지 연동</code></li>
                      <li>추가된 "패키지 연동" 북마크에 마우스 우클릭 → <strong>수정</strong> 클릭</li>
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
                      <strong>관리환자 리스트에서 환자 선택 → 패키지 관리 → 최신화 버튼 클릭</strong>
                      <div className="ml-6 text-xs text-gray-500">→ 새 탭에서 CRM 패키지 관리 페이지를 수동으로 열어줍니다</div>
                    </li>
                    <li>
                      <strong>CRM에서 해당 지점의 패키지 관리 페이지로 이동</strong>
                      <div className="ml-6 text-xs text-gray-500">→ 환자를 검색하고 패키지 관리 화면을 엽니다</div>
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
