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
  const { user, userRole } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);

  // Master 계정만 접근 가능
  if (userRole !== 'master') {
    return null;
  }

  const exportData = async () => {
    if (!user || userRole !== 'master') {
      toast.error('Master 권한이 필요합니다.');
      return;
    }

    try {
      setIsExporting(true);
      toast.info('데이터베이스를 내보내는 중...');
      
      // 모든 테이블 데이터 가져오기 (Master는 모든 데이터 접근 가능)
      const [
        // 환자 관련
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
        reconnectTrackingRes,
        // 사용자 및 권한 관련
        profilesRes,
        userRolesRes,
        managerSupervisorsRes,
        // 옵션 테이블
        diagnosisOptionsRes,
        hospitalOptionsRes,
        insuranceTypeOptionsRes,
        patientStatusOptionsRes,
        treatmentDetailOptionsRes
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
        supabase.from('patient_reconnect_tracking').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('user_roles').select('*'),
        supabase.from('manager_supervisors').select('*'),
        supabase.from('diagnosis_options').select('*'),
        supabase.from('hospital_options').select('*'),
        supabase.from('insurance_type_options').select('*'),
        supabase.from('patient_status_options').select('*'),
        supabase.from('treatment_detail_options').select('*')
      ]);

      // 워크북 생성
      const wb = XLSX.utils.book_new();

      // 각 테이블을 시트로 추가
      const addSheet = (data: any[] | null, sheetName: string) => {
        if (data && data.length > 0) {
          const ws = XLSX.utils.json_to_sheet(data);
          XLSX.utils.book_append_sheet(wb, ws, sheetName);
        }
      };

      // 환자 관련 테이블
      addSheet(patientsRes.data, 'patients');
      addSheet(dailyStatusRes.data, 'daily_patient_status');
      addSheet(admissionCyclesRes.data, 'admission_cycles');
      addSheet(medicalInfoRes.data, 'medical_info');
      addSheet(packagesRes.data, 'packages');
      addSheet(packageMgmtRes.data, 'package_management');
      addSheet(packageTransRes.data, 'package_transactions');
      addSheet(treatmentHistoryRes.data, 'treatment_history');
      addSheet(treatmentPlansRes.data, 'treatment_plans');
      addSheet(patientNotesRes.data, 'patient_notes');
      addSheet(reconnectTrackingRes.data, 'patient_reconnect_tracking');

      // 사용자 및 권한 관련 테이블
      addSheet(profilesRes.data, 'profiles');
      addSheet(userRolesRes.data, 'user_roles');
      addSheet(managerSupervisorsRes.data, 'manager_supervisors');

      // 옵션 테이블
      addSheet(diagnosisOptionsRes.data, 'diagnosis_options');
      addSheet(hospitalOptionsRes.data, 'hospital_options');
      addSheet(insuranceTypeOptionsRes.data, 'insurance_type_options');
      addSheet(patientStatusOptionsRes.data, 'patient_status_options');
      addSheet(treatmentDetailOptionsRes.data, 'treatment_detail_options');

      // 엑셀 파일 다운로드
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      XLSX.writeFile(wb, `complete_database_backup_${timestamp}.xlsx`);
      
      toast.success('전체 데이터베이스를 성공적으로 내보냈습니다.');
    } catch (error) {
      console.error('Export error:', error);
      toast.error('데이터 내보내기 중 오류가 발생했습니다.');
    } finally {
      setIsExporting(false);
    }
  };

  const importData = async (file: File) => {
    if (!user || userRole !== 'master') {
      toast.error('Master 권한이 필요합니다.');
      return;
    }

    try {
      setIsImporting(true);
      toast.info('데이터를 가져오는 중...');
      
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      
      // Step 1: 업로드된 profiles에서 이메일 → 기존 UUID 매핑 생성
      const profilesSheet = workbook.Sheets['profiles'];
      if (!profilesSheet) {
        toast.error('profiles 시트가 없습니다.');
        setIsImporting(false);
        return;
      }
      
      const uploadedProfiles = XLSX.utils.sheet_to_json(profilesSheet) as any[];
      const oldEmailToUuid: Record<string, string> = {};
      uploadedProfiles.forEach((profile: any) => {
        if (profile.email && profile.id) {
          oldEmailToUuid[profile.email] = profile.id;
        }
      });
      
      // Step 2: 현재 프로젝트의 profiles 조회하여 이메일 → 새 UUID 매핑 생성
      const { data: currentProfiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, email');
      
      if (profilesError) {
        toast.error(`프로필 조회 실패: ${profilesError.message}`);
        setIsImporting(false);
        return;
      }
      
      const newEmailToUuid: Record<string, string> = {};
      currentProfiles?.forEach((profile: any) => {
        if (profile.email && profile.id) {
          newEmailToUuid[profile.email] = profile.id;
        }
      });
      
      // Step 3: 기존 UUID → 새 UUID 매핑 테이블 생성
      const uuidMapping: Record<string, string> = {};
      Object.keys(oldEmailToUuid).forEach((email) => {
        const oldUuid = oldEmailToUuid[email];
        const newUuid = newEmailToUuid[email];
        if (newUuid) {
          uuidMapping[oldUuid] = newUuid;
        } else {
          console.warn(`이메일 ${email}에 해당하는 신규 계정이 없습니다.`);
        }
      });
      
      console.log('UUID 매핑:', uuidMapping);
      toast.info(`${Object.keys(uuidMapping).length}개의 계정 매핑 완료`);
      
      // Step 4: UUID 필드를 변환하는 헬퍼 함수
      const transformUuid = (uuid: string | null | undefined): string | null => {
        if (!uuid) return null;
        return uuidMapping[uuid] || uuid;
      };
      
      // 존재하지 않는 컬럼을 제거하는 헬퍼 함수
      const removeNonExistentColumns = (record: any, tableName: string): any => {
        const cleaned = { ...record };
        
        // patients 테이블에서 제거할 컬럼들
        if (tableName === 'patients') {
          delete cleaned.consultation_date;
          delete cleaned.diagnosis_category;
          delete cleaned.hospital_branch;
          delete cleaned.patient_or_guardian;
          delete cleaned.memo1;
          delete cleaned.special_note_1;
          delete cleaned.special_note_2;
          delete cleaned.treatment_memo_1;
          delete cleaned.treatment_memo_2;
          delete cleaned.failure_reason;
          delete cleaned.inflow_date;
        }
        
        // user_roles 테이블에서 제거할 컬럼들
        if (tableName === 'user_roles') {
          delete cleaned.approved_at;
          delete cleaned.approved_by;
        }
        
        // diagnosis_options, hospital_options에서 parent_id, sort_order 제거
        if (tableName === 'diagnosis_options' || tableName === 'hospital_options') {
          delete cleaned.parent_id;
          delete cleaned.sort_order;
        }
        
        return cleaned;
      };
      
      const transformRecord = (record: any, tableName: string): any => {
        let transformed = { ...record };
        
        // 먼저 존재하지 않는 컬럼 제거
        transformed = removeNonExistentColumns(transformed, tableName);
        
        // 공통 UUID 필드 변환
        if (transformed.user_id) transformed.user_id = transformUuid(transformed.user_id);
        if (transformed.created_by) transformed.created_by = transformUuid(transformed.created_by);
        if (transformed.approved_by) transformed.approved_by = transformUuid(transformed.approved_by);
        if (transformed.assigned_by) transformed.assigned_by = transformUuid(transformed.assigned_by);
        if (transformed.assigned_manager) transformed.assigned_manager = transformUuid(transformed.assigned_manager);
        
        // 테이블별 특수 필드
        if (tableName === 'manager_supervisors') {
          if (transformed.manager_id) transformed.manager_id = transformUuid(transformed.manager_id);
          if (transformed.supervisor_id) transformed.supervisor_id = transformUuid(transformed.supervisor_id);
        }
        
        // profiles는 업로드하지 않음 (이미 가입된 계정 사용)
        // user_roles도 업로드하지 않음 (이미 승인된 role 사용)
        
        return transformed;
      };
      
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
        'patient_reconnect_tracking': 'patient_reconnect_tracking',
        'profiles': 'profiles',
        'user_roles': 'user_roles',
        'manager_supervisors': 'manager_supervisors',
        'diagnosis_options': 'diagnosis_options',
        'hospital_options': 'hospital_options',
        'insurance_type_options': 'insurance_type_options',
        'patient_status_options': 'patient_status_options',
        'treatment_detail_options': 'treatment_detail_options'
      };

      for (const sheetName of workbook.SheetNames) {
        const tableName = tableMap[sheetName];
        if (!tableName) {
          console.warn(`Unknown table: ${sheetName}`);
          continue;
        }
        
        // profiles와 user_roles는 스킵 (이미 가입된 계정 사용)
        if (tableName === 'profiles' || tableName === 'user_roles') {
          console.log(`Skipping ${tableName} - using existing accounts`);
          continue;
        }

        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        
        if (jsonData.length === 0) continue;

        // Step 5: UUID 변환 및 컬럼 정리 적용
        const transformedData = jsonData.map((record: any) => 
          transformRecord(record, tableName)
        );

        // 옵션 테이블은 중복 방지를 위해 이름 기반 upsert
        const upsertConfig = ['diagnosis_options', 'hospital_options', 'insurance_type_options', 'patient_status_options', 'treatment_detail_options'].includes(tableName)
          ? { onConflict: 'name', ignoreDuplicates: true }
          : { onConflict: 'id' };

        // 테이블별로 데이터 삽입
        const { error } = await (supabase as any)
          .from(tableName)
          .upsert(transformedData, upsertConfig);

        if (error) {
          console.error(`Error importing ${tableName}:`, error);
          toast.error(`${tableName} 테이블 가져오기 실패: ${error.message}`);
        } else {
          toast.success(`${tableName} 테이블 가져오기 완료 (${transformedData.length}건)`);
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
