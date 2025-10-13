import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

const CRMTest = () => {
  const [crmUrl, setCrmUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const testConnection = async () => {
    if (!crmUrl) {
      setResult({
        success: false,
        message: "CRM URL을 입력해주세요."
      });
      return;
    }

    setLoading(true);
    setResult(null);

    const startTime = Date.now();

    try {
      console.log("🔍 CRM 연결 테스트 시작:", crmUrl);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

      const response = await fetch(crmUrl, {
        method: 'GET',
        mode: 'cors', // CORS 모드
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
        },
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      let responseData = null;
      let responseText = '';
      
      try {
        // JSON 응답 시도
        responseText = await response.text();
        responseData = JSON.parse(responseText);
      } catch (e) {
        // JSON이 아닌 경우
        responseData = responseText.substring(0, 500);
      }

      console.log("✅ 연결 성공!", {
        status: response.status,
        duration,
        data: responseData
      });

      setResult({
        success: true,
        status: response.status,
        statusText: response.statusText,
        duration: `${duration}ms`,
        headers: Object.fromEntries(response.headers.entries()),
        data: responseData,
        message: "✅ CRM 서버 접속 성공!"
      });

    } catch (error: any) {
      const duration = Date.now() - startTime;

      if (error.name === 'AbortError') {
        console.error("❌ 연결 타임아웃");
        setResult({
          success: false,
          error: "타임아웃",
          duration: `${duration}ms`,
          message: "❌ 10초 내에 응답이 없습니다.",
          possibleReasons: [
            "1. CRM 서버가 응답하지 않음",
            "2. 네트워크 연결 문제",
            "3. URL이 잘못됨"
          ]
        });
      } else if (error.message.includes('CORS')) {
        console.error("❌ CORS 에러");
        setResult({
          success: false,
          error: "CORS 정책 차단",
          duration: `${duration}ms`,
          message: "❌ CORS 정책으로 차단되었습니다.",
          possibleReasons: [
            "1. CRM 서버에서 CORS 허용 필요",
            "2. 'Access-Control-Allow-Origin' 헤더 설정 필요",
            "3. 한국도움기술 담당자에게 CORS 설정 요청"
          ]
        });
      } else {
        console.error("❌ 연결 실패:", error);
        setResult({
          success: false,
          error: error.message,
          errorType: error.name,
          duration: `${duration}ms`,
          message: `❌ 연결 실패: ${error.message}`,
          possibleReasons: [
            "1. URL이 잘못되었을 수 있음",
            "2. 병원 회선이 아닐 수 있음 (IP 차단)",
            "3. CRM 서버가 꺼져있거나 접근 불가",
            "4. CORS 설정 문제"
          ]
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="container max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>한국도움기술 CRM 연결 테스트</CardTitle>
            <CardDescription>
              병원 내부망에서 CRM API 접근 가능 여부를 테스트합니다.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">CRM API URL</label>
              <Input
                placeholder="예: http://192.168.11.100:8080/api/patients"
                value={crmUrl}
                onChange={(e) => setCrmUrl(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                한국도움기술에서 제공받은 CRM API 주소를 입력하세요
              </p>
            </div>

            <Button 
              onClick={testConnection} 
              disabled={loading || !crmUrl}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  테스트 중...
                </>
              ) : (
                "연결 테스트 시작"
              )}
            </Button>

            <Alert>
              <AlertDescription>
                <strong>⚠️ 중요:</strong> 이 테스트는 반드시 <strong>병원 내부 지정된 회선</strong>에서 실행해야 합니다.
                외부 네트워크에서는 IP 차단으로 실패할 수 있습니다.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>

        {result && (
          <Card className={result.success ? "border-green-500" : "border-destructive"}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {result.success ? (
                  <>
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                    테스트 성공
                  </>
                ) : (
                  <>
                    <XCircle className="h-5 w-5 text-destructive" />
                    테스트 실패
                  </>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert variant={result.success ? "default" : "destructive"}>
                <AlertDescription>
                  <strong>{result.message}</strong>
                </AlertDescription>
              </Alert>

              <div className="space-y-2">
                <h4 className="font-semibold">상세 정보</h4>
                <div className="bg-muted p-4 rounded-lg space-y-2 text-sm font-mono">
                  {result.status && (
                    <div>
                      <span className="text-muted-foreground">상태 코드:</span>{" "}
                      <span className={result.status === 200 ? "text-green-500" : "text-destructive"}>
                        {result.status} {result.statusText}
                      </span>
                    </div>
                  )}
                  <div>
                    <span className="text-muted-foreground">소요 시간:</span> {result.duration}
                  </div>
                  {result.error && (
                    <div>
                      <span className="text-muted-foreground">에러:</span>{" "}
                      <span className="text-destructive">{result.error}</span>
                    </div>
                  )}
                  {result.errorType && (
                    <div>
                      <span className="text-muted-foreground">에러 타입:</span> {result.errorType}
                    </div>
                  )}
                </div>
              </div>

              {result.possibleReasons && (
                <div className="space-y-2">
                  <h4 className="font-semibold">가능한 원인</h4>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                    {result.possibleReasons.map((reason: string, index: number) => (
                      <li key={index}>{reason}</li>
                    ))}
                  </ul>
                </div>
              )}

              {result.data && (
                <div className="space-y-2">
                  <h4 className="font-semibold">응답 데이터 (미리보기)</h4>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto max-h-96">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              )}

              {result.headers && Object.keys(result.headers).length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold">응답 헤더</h4>
                  <pre className="bg-muted p-4 rounded-lg text-xs overflow-auto">
                    {JSON.stringify(result.headers, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>한국도움기술 담당자에게 전달할 정보</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted p-4 rounded-lg space-y-2 text-sm">
              <p><strong>구현 방식:</strong> 클라이언트 사이드 직접 호출 (Client-Side Direct API Call)</p>
              <p><strong>요청 출발지:</strong> 병원 PC 브라우저 (병원 회선 IP)</p>
              <p><strong>필요한 설정:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>CORS 허용 (Access-Control-Allow-Origin)</li>
                <li>현재 IP 화이트리스트 정책 유지 가능</li>
                <li>HTTPS 권장 (선택사항)</li>
              </ul>
            </div>

            <Alert>
              <AlertDescription>
                이 테스트 결과 화면을 스크린샷으로 캡처하여 한국도움기술 담당자에게 전달하세요.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default CRMTest;
