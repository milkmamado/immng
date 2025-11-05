import { useState } from 'react';
import { Download, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

export function DataMigration() {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  const exportData = async () => {
    if (!user) return;

    try {
      setIsExporting(true);
      
      // 담당자가 접근 가능한 모든 데이터 가져오기
      const [
        patientsRes,
        dailyStatusRes,
        admissionCyclesRes,
        medicalInfoRes,
        packagesRes,
        packageMgmtRes,
        packageTransRes,
        treatmentHistoryRes,
        treatmentPlansRes,
        patientNotesRes,
        reconnectTrackingRes
      ] = await Promise.all([
        supabase.from('patients').select('*'),
        supabase.from('daily_patient_status').select('*'),
        supabase.from('admission_cycles').select('*'),
        supabase.from('medical_info').select('*'),
        supabase.from('packages').select('*'),
        supabase.from('package_management').select('*'),
        supabase.from('package_transactions').select('*'),
        supabase.from('treatment_history').select('*'),
        supabase.from('treatment_plans').select('*'),
        supabase.from('patient_notes').select('*'),
        supabase.from('patient_reconnect_tracking').select('*')
      ]);

      // 워크북 생성
      const wb = XLSX.utils.book_new();

      // 각 테이블을 시트로 추가
      if (patientsRes.data && patientsRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(patientsRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'patients');
      }
      
      if (dailyStatusRes.data && dailyStatusRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(dailyStatusRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'daily_patient_status');
      }
      
      if (admissionCyclesRes.data && admissionCyclesRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(admissionCyclesRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'admission_cycles');
      }
      
      if (medicalInfoRes.data && medicalInfoRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(medicalInfoRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'medical_info');
      }
      
      if (packagesRes.data && packagesRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(packagesRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'packages');
      }
      
      if (packageMgmtRes.data && packageMgmtRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(packageMgmtRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'package_management');
      }
      
      if (packageTransRes.data && packageTransRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(packageTransRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'package_transactions');
      }
      
      if (treatmentHistoryRes.data && treatmentHistoryRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(treatmentHistoryRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'treatment_history');
      }
      
      if (treatmentPlansRes.data && treatmentPlansRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(treatmentPlansRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'treatment_plans');
      }
      
      if (patientNotesRes.data && patientNotesRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(patientNotesRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'patient_notes');
      }
      
      if (reconnectTrackingRes.data && reconnectTrackingRes.data.length > 0) {
        const ws = XLSX.utils.json_to_sheet(reconnectTrackingRes.data);
        XLSX.utils.book_append_sheet(wb, ws, 'patient_reconnect_tracking');
      }

      // 엑셀 파일 다운로드
      const timestamp = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `database_export_${timestamp}.xlsx`);
      
      toast.success('데이터베이스를 성공적으로 내보냈습니다.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('데이터 내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (file: File) => {
    if (!user) return;

    try {
      setIsImporting(true);
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // 각 시트의 데이터를 읽어서 업로드
      const tableMap: Record<string, string> = {
        'patients': 'patients',
        'daily_patient_status': 'daily_patient_status',
        'admission_cycles': 'admission_cycles',
        'medical_info': 'medical_info',
        'packages': 'packages',
        'package_management': 'package_management',
        'package_transactions': 'package_transactions',
        'treatment_history': 'treatment_history',
        'treatment_plans': 'treatment_plans',
        'patient_notes': 'patient_notes',
        'patient_reconnect_tracking': 'patient_reconnect_tracking'
      };

      for (const sheetName of workbook.SheetNames) {
        const tableName = tableMap[sheetName];
        if (!tableName) {
          console.warn(`Unknown table: ${sheetName}`);
          continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) continue;

        // 테이블별로 데이터 삽입
        const { error } = await (supabase as any)
          .from(tableName)
          .upsert(jsonData, { onConflict: 'id' });

        if (error) {
          console.error(`Error importing ${tableName}:`, error);
          toast.error(`${tableName} 테이블 가져오기 실패: ${error.message}`);
        }
      }
      
      toast.success('데이터를 성공적으로 가져왔습니다. 페이지를 새로고침합니다.');
      
      // 페이지 새로고침
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('데이터 가져오기 중 오류가 발생했습니다.');
    } finally {
      setIsImporting(false);
      setShowUploadDialog(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importData(file);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={exportData}
          disabled={isExporting}
          className="gap-2"
        >
          {isExporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
          DB 다운로드
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowUploadDialog(true)}
          disabled={isImporting}
          className="gap-2"
        >
          {isImporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          DB 업로드
        </Button>
      </div>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>데이터베이스 업로드</DialogTitle>
            <DialogDescription>
              이전에 다운로드한 데이터베이스 파일(.xlsx)을 선택하세요.
              <br />
              <strong className="text-destructive">경고: 기존 데이터가 덮어씌워질 수 있습니다.</strong>
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="block w-full text-sm text-muted-foreground
                file:mr-4 file:py-2 file:px-4
                file:rounded-md file:border-0
                file:text-sm file:font-semibold
                file:bg-primary file:text-primary-foreground
                hover:file:bg-primary/90
                cursor-pointer"
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
