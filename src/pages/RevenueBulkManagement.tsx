import { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2, XCircle } from "lucide-react";
import * as XLSX from 'xlsx';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface UploadResult {
  success: number;
  failed: number;
  duplicates: number;
  notFound: Array<{ chartNumber: string; patientName: string; date: string; time: string; amount: number }>;
}

export default function RevenueBulkManagement() {
  const { toast } = useToast();
  const { currentBranch } = useAuth();
  const [uploadingInpatient, setUploadingInpatient] = useState(false);
  const [uploadingOutpatient, setUploadingOutpatient] = useState(false);
  const [inpatientResult, setInpatientResult] = useState<UploadResult | null>(null);
  const [outpatientResult, setOutpatientResult] = useState<UploadResult | null>(null);

  const handleBulkUpload = async (file: File, revenueType: 'inpatient' | 'outpatient') => {
    const setLoading = revenueType === 'inpatient' ? setUploadingInpatient : setUploadingOutpatient;
    const setResult = revenueType === 'inpatient' ? setInpatientResult : setOutpatientResult;
    
    setLoading(true);
    setResult(null);

    try {
      console.log(`📂 ${revenueType === 'inpatient' ? '입원' : '외래'} 매출 엑셀 일괄 업로드 시작`);

      // 엑셀 파일 읽기
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];

      // 여러 행을 시도하면서 헤더 찾기
      let jsonData: any[] = [];
      for (let rangeIndex = 0; rangeIndex < 10; rangeIndex++) {
        const testRange = XLSX.utils.decode_range(firstSheet['!ref'] || 'A1');
        testRange.s.r = rangeIndex;
        const testData = XLSX.utils.sheet_to_json(firstSheet, { 
          range: testRange,
          defval: '' 
        });
        
        if (testData.length > 0 && testData[0]['수납일자'] && testData[0]['입금총액'] !== undefined) {
          console.log(`✅ Range ${rangeIndex + 1}번째 행에서 헤더 발견!`);
          jsonData = testData;
          break;
        }
      }

      if (jsonData.length === 0) {
        toast({
          title: "오류",
          description: "엑셀 파일 형식을 인식할 수 없습니다.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      console.log('📊 엑셀 전체 데이터:', jsonData.length, '행');

      // 차트번호, 환자성명, 수납일자, 수납시간, 입금총액 추출
      const extractedData: Array<{
        chartNumber: string;
        patientName: string;
        date: string;
        time: string;
        amount: number;
      }> = [];

      let skippedCount = 0;

      jsonData.forEach((row: any) => {
        // 빈 행이거나 합계 행은 제외
        if (!row['차트번호'] || !row['환자성명'] || !row['수납일자'] || row['순서'] === '합계' || row['순서'] === '') {
          skippedCount++;
          return;
        }

        const chartNumber = String(row['차트번호']).trim();
        const patientName = String(row['환자성명']).trim();
        const dateStr = row['수납일자'];
        const timeStr = row['수납시간'] || '';
        const amountStr = row['입금총액'];

        // 날짜 파싱
        let date: Date;
        if (typeof dateStr === 'string' && dateStr.includes('-')) {
          date = new Date(dateStr);
        } else if (typeof dateStr === 'number') {
          const excelEpoch = new Date(1900, 0, 1);
          date = new Date(excelEpoch.getTime() + (dateStr - 2) * 24 * 60 * 60 * 1000);
        } else {
          date = new Date(dateStr);
        }

        // 금액 파싱
        let amount = 0;
        if (amountStr === '' || amountStr === undefined || amountStr === null) {
          amount = 0;
        } else if (typeof amountStr === 'number') {
          amount = amountStr;
        } else if (typeof amountStr === 'string') {
          const parsed = parseFloat(amountStr.replace(/,/g, ''));
          amount = isNaN(parsed) ? 0 : parsed;
        }

        if (!isNaN(date.getTime()) && chartNumber && patientName) {
          extractedData.push({
            chartNumber,
            patientName,
            date: date.toISOString().split('T')[0],
            time: String(timeStr).trim(),
            amount
          });
        }
      });

      console.log(`✅ 추출된 데이터: ${extractedData.length}건 (스킵: ${skippedCount}건)`);

      if (extractedData.length === 0) {
        toast({
          title: "오류",
          description: "유효한 데이터를 찾을 수 없습니다.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // 모든 환자 조회 (현재 지점)
      const { data: allPatients, error: patientsError } = await supabase
        .from('patients')
        .select('id, customer_number, name')
        .eq('branch', currentBranch);

      if (patientsError) throw patientsError;

      console.log(`📋 DB 환자 수: ${allPatients?.length || 0}명`);

      // 고객번호(customer_number)와 환자명으로 매칭
      const result: UploadResult = {
        success: 0,
        failed: 0,
        duplicates: 0,
        notFound: []
      };

      const transactionType = revenueType === 'inpatient' ? 'inpatient_revenue' : 'outpatient_revenue';
      const transactionsToInsert: Array<any> = [];

      for (const item of extractedData) {
        // 엑셀의 차트번호를 DB의 고객번호(customer_number)와 매칭, 그리고 환자명도 확인
        const patient = allPatients?.find(p => 
          p.customer_number === item.chartNumber && p.name === item.patientName
        );

        if (!patient) {
          result.notFound.push(item);
          result.failed++;
          continue;
        }

        // 중복 체크 (같은 환자, 같은 날짜, 같은 수납시간, 같은 타입)
        const noteWithTime = `${revenueType === 'inpatient' ? '입원' : '외래'} 매출 (${item.time})`;
        const { data: existingTxn } = await supabase
          .from('package_transactions')
          .select('id')
          .eq('patient_id', patient.id)
          .eq('transaction_date', item.date)
          .eq('transaction_type', transactionType)
          .eq('note', noteWithTime)
          .limit(1);

        if (existingTxn && existingTxn.length > 0) {
          result.duplicates++;
          continue;
        }

        // 삽입 준비 (수납시간 포함)
        transactionsToInsert.push({
          patient_id: patient.id,
          customer_number: patient.customer_number,
          transaction_date: item.date,
          transaction_type: transactionType,
          amount: item.amount,
          count: 0,
          branch: currentBranch,
          note: `${revenueType === 'inpatient' ? '입원' : '외래'} 매출 (${item.time})`
        });
      }

      // 일괄 삽입
      if (transactionsToInsert.length > 0) {
        const { error: insertError } = await supabase
          .from('package_transactions')
          .insert(transactionsToInsert);

        if (insertError) throw insertError;

        result.success = transactionsToInsert.length;
        console.log(`✅ ${result.success}건 업로드 성공`);

        // 각 환자의 payment_amount 업데이트
        const uniquePatientIds = [...new Set(transactionsToInsert.map(t => t.patient_id))];
        
        for (const patientId of uniquePatientIds) {
          const { data: allTransactions } = await supabase
            .from('package_transactions')
            .select('amount, transaction_type')
            .eq('patient_id', patientId);

          const totalPayment = allTransactions?.reduce((sum, t) => {
            if (['deposit_in', 'inpatient_revenue', 'outpatient_revenue'].includes(t.transaction_type)) {
              return sum + t.amount;
            }
            return sum;
          }, 0) || 0;

          await supabase
            .from('patients')
            .update({ payment_amount: totalPayment })
            .eq('id', patientId);
        }

        console.log(`💰 ${uniquePatientIds.length}명 환자 총 수납금액 업데이트 완료`);
      }

      setResult(result);

      toast({
        title: "✅ 일괄 업로드 완료",
        description: `성공: ${result.success}건 / 중복: ${result.duplicates}건 / 실패: ${result.failed}건`,
        duration: 3000,
      });

    } catch (error) {
      console.error('Error uploading excel:', error);
      toast({
        title: "오류",
        description: "엑셀 파일 처리 중 오류가 발생했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <FileSpreadsheet className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">입원/외래 매출 일괄 관리</h1>
          <p className="text-sm text-muted-foreground mt-1">
            엑셀 파일로 전체 환자의 매출 데이터를 한번에 업로드하세요 (Master 전용)
          </p>
        </div>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>사용 방법</AlertTitle>
        <AlertDescription>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>CRM에서 출력한 환자별 입원/외래 수입금 통계 엑셀 파일을 업로드하세요</li>
            <li>차트번호와 환자성명으로 자동 매칭됩니다</li>
            <li>중복된 데이터는 자동으로 제외됩니다</li>
            <li>모든 실장의 관리 환자에 대해 매출이 자동 등록됩니다</li>
          </ul>
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 입원 매출 업로드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              입원 매출 일괄 업로드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                id="inpatient-bulk-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBulkUpload(file, 'inpatient');
                  e.target.value = '';
                }}
              />
              <label htmlFor="inpatient-bulk-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">엑셀 파일을 선택하세요</p>
                    <p className="text-sm text-muted-foreground">환자별_입원_수입금_통계.xlsx</p>
                  </div>
                </div>
              </label>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={uploadingInpatient}
              onClick={() => document.getElementById('inpatient-bulk-upload')?.click()}
            >
              {uploadingInpatient ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  입원 매출 업로드
                </>
              )}
            </Button>

            {inpatientResult && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">성공: {inpatientResult.success}건</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">중복: {inpatientResult.duplicates}건</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">실패: {inpatientResult.failed}건</span>
                </div>

                {inpatientResult.notFound.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      매칭 실패 내역 ({inpatientResult.notFound.length}건)
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">차트번호</th>
                            <th className="p-2 text-left">환자명</th>
                            <th className="p-2 text-left">날짜</th>
                            <th className="p-2 text-left">시간</th>
                            <th className="p-2 text-right">금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {inpatientResult.notFound.map((item, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2">{item.chartNumber}</td>
                              <td className="p-2">{item.patientName}</td>
                              <td className="p-2">{item.date}</td>
                              <td className="p-2">{item.time}</td>
                              <td className="p-2 text-right">{item.amount.toLocaleString()}원</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 외래 매출 업로드 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5 text-primary" />
              외래 매출 일괄 업로드
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="border-2 border-dashed rounded-lg p-8 text-center">
              <input
                id="outpatient-bulk-upload"
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleBulkUpload(file, 'outpatient');
                  e.target.value = '';
                }}
              />
              <label htmlFor="outpatient-bulk-upload" className="cursor-pointer">
                <div className="flex flex-col items-center gap-3">
                  <Upload className="h-12 w-12 text-muted-foreground" />
                  <div>
                    <p className="font-medium">엑셀 파일을 선택하세요</p>
                    <p className="text-sm text-muted-foreground">환자별_외래_수입금_통계.xlsx</p>
                  </div>
                </div>
              </label>
            </div>

            <Button
              className="w-full"
              size="lg"
              disabled={uploadingOutpatient}
              onClick={() => document.getElementById('outpatient-bulk-upload')?.click()}
            >
              {uploadingOutpatient ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  업로드 중...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  외래 매출 업로드
                </>
              )}
            </Button>

            {outpatientResult && (
              <div className="space-y-2 pt-4 border-t">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  <span className="font-medium">성공: {outpatientResult.success}건</span>
                </div>
                <div className="flex items-center gap-2 text-blue-600">
                  <AlertCircle className="h-4 w-4" />
                  <span className="font-medium">중복: {outpatientResult.duplicates}건</span>
                </div>
                <div className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-4 w-4" />
                  <span className="font-medium">실패: {outpatientResult.failed}건</span>
                </div>

                {outpatientResult.notFound.length > 0 && (
                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                      매칭 실패 내역 ({outpatientResult.notFound.length}건)
                    </summary>
                    <div className="mt-2 max-h-40 overflow-y-auto text-xs">
                      <table className="w-full">
                        <thead className="bg-muted sticky top-0">
                          <tr>
                            <th className="p-2 text-left">차트번호</th>
                            <th className="p-2 text-left">환자명</th>
                            <th className="p-2 text-left">날짜</th>
                            <th className="p-2 text-left">시간</th>
                            <th className="p-2 text-right">금액</th>
                          </tr>
                        </thead>
                        <tbody>
                          {outpatientResult.notFound.map((item, idx) => (
                            <tr key={idx} className="border-b">
                              <td className="p-2">{item.chartNumber}</td>
                              <td className="p-2">{item.patientName}</td>
                              <td className="p-2">{item.date}</td>
                              <td className="p-2">{item.time}</td>
                              <td className="p-2 text-right">{item.amount.toLocaleString()}원</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </details>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
