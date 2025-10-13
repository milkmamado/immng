import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crmUrl, method = 'GET' } = await req.json();

    if (!crmUrl) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'CRM URL이 필요합니다.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`🔍 CRM 연결 테스트 시작: ${crmUrl}`);
    const startTime = Date.now();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10초 타임아웃

    try {
      const response = await fetch(crmUrl, {
        method: method,
        signal: controller.signal,
        headers: {
          'User-Agent': 'Supabase-Edge-Function-Test',
        },
      });

      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;

      console.log(`✅ 연결 성공! 상태: ${response.status}, 소요시간: ${duration}ms`);

      // 응답 본문 읽기 (텍스트로)
      let responseBody = '';
      try {
        responseBody = await response.text();
      } catch (e) {
        console.log('응답 본문 읽기 실패:', e);
      }

      return new Response(
        JSON.stringify({
          success: true,
          status: response.status,
          statusText: response.statusText,
          duration: duration,
          headers: Object.fromEntries(response.headers.entries()),
          bodyPreview: responseBody.substring(0, 500), // 첫 500자만
          message: '✅ CRM 서버에 접속 성공했습니다!'
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );

    } catch (fetchError: unknown) {
      clearTimeout(timeoutId);
      const duration = Date.now() - startTime;
      const error = fetchError as Error;

      if (error.name === 'AbortError') {
        console.error('❌ 연결 타임아웃 (10초 초과)');
        return new Response(
          JSON.stringify({
            success: false,
            error: '타임아웃',
            message: '❌ 10초 내에 응답이 없습니다. 네트워크 연결을 확인해주세요.',
            duration: duration
          }),
          { 
            status: 408, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }

      console.error('❌ 연결 실패:', error.message);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          errorType: error.name,
          message: `❌ CRM 서버에 접속할 수 없습니다: ${error.message}`,
          duration: duration,
          possibleReasons: [
            '1. CRM 서버가 사설 IP (192.168.x.x)라서 외부에서 접근 불가',
            '2. 방화벽에서 Supabase IP를 차단',
            '3. CRM 서버가 꺼져있거나 네트워크 문제',
            '4. 잘못된 URL 형식'
          ]
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

  } catch (error: unknown) {
    const err = error as Error;
    console.error('❌ 전체 오류:', err);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: err.message,
        message: '❌ 테스트 중 오류가 발생했습니다.'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
