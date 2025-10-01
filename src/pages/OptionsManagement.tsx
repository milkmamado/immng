import { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, X, Trash2 } from "lucide-react";

interface Option {
  id: string;
  name: string;
}

interface PatientStatusOption extends Option {
  exclude_from_daily_tracking: boolean;
}

export default function OptionsManagement() {
  const [diagnosisOptions, setDiagnosisOptions] = useState<Option[]>([]);
  const [hospitalOptions, setHospitalOptions] = useState<Option[]>([]);
  const [insuranceTypeOptions, setInsuranceTypeOptions] = useState<Option[]>([]);
  const [treatmentDetailOptions, setTreatmentDetailOptions] = useState<Option[]>([]);
  const [patientStatusOptions, setPatientStatusOptions] = useState<PatientStatusOption[]>([]);
  const [loading, setLoading] = useState(true);

  // 각 탭별 새 옵션명 입력 state
  const [newDiagnosis, setNewDiagnosis] = useState('');
  const [newHospital, setNewHospital] = useState('');
  const [newInsurance, setNewInsurance] = useState('');
  const [newTreatment, setNewTreatment] = useState('');
  const [newPatientStatus, setNewPatientStatus] = useState('');
  const [excludeFromTracking, setExcludeFromTracking] = useState(true);

  const { toast } = useToast();

  useEffect(() => {
    fetchAllOptions();
  }, []);

  const fetchAllOptions = async () => {
    setLoading(true);
    try {
      const [diagnosis, hospital, insurance, treatment, patientStatus] = await Promise.all([
        (supabase as any).from('diagnosis_options').select('*').order('name'),
        (supabase as any).from('hospital_options').select('*').order('name'),
        (supabase as any).from('insurance_type_options').select('*').order('name'),
        (supabase as any).from('treatment_detail_options').select('*').order('name'),
        (supabase as any).from('patient_status_options').select('*').order('name')
      ]);

      if (diagnosis.data) setDiagnosisOptions(diagnosis.data);
      if (hospital.data) setHospitalOptions(hospital.data);
      if (insurance.data) setInsuranceTypeOptions(insurance.data);
      if (treatment.data) setTreatmentDetailOptions(treatment.data);
      if (patientStatus.data) setPatientStatusOptions(patientStatus.data);
    } catch (error) {
      console.error('Error fetching options:', error);
      toast({
        title: "오류",
        description: "옵션을 불러오는데 실패했습니다.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addOption = async (type: 'diagnosis' | 'hospital' | 'insurance' | 'treatment' | 'patient_status', name: string, excludeTracking?: boolean) => {
    if (!name.trim()) {
      toast({
        title: "입력 오류",
        description: "옵션명을 입력해주세요.",
        variant: "destructive",
      });
      return;
    }

    try {
      const tableMap = {
        diagnosis: 'diagnosis_options',
        hospital: 'hospital_options',
        insurance: 'insurance_type_options',
        treatment: 'treatment_detail_options',
        patient_status: 'patient_status_options'
      } as const;

      const tableName = tableMap[type];
      const insertData = type === 'patient_status' 
        ? { name: name.trim(), exclude_from_daily_tracking: excludeTracking || false }
        : { name: name.trim() };

      const { error } = await (supabase as any)
        .from(tableName)
        .insert(insertData);

      if (error) throw error;

      toast({
        title: "성공",
        description: "옵션이 추가되었습니다.",
      });

      // 입력 필드 초기화
      switch (type) {
        case 'diagnosis':
          setNewDiagnosis('');
          break;
        case 'hospital':
          setNewHospital('');
          break;
        case 'insurance':
          setNewInsurance('');
          break;
        case 'treatment':
          setNewTreatment('');
          break;
        case 'patient_status':
          setNewPatientStatus('');
          setExcludeFromTracking(true);
          break;
      }

      fetchAllOptions();
    } catch (error: any) {
      console.error('Error adding option:', error);
      toast({
        title: "오류",
        description: error.message || "옵션 추가에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const deleteOption = async (type: 'diagnosis' | 'hospital' | 'insurance' | 'treatment' | 'patient_status', optionId: string) => {
    try {
      const tableMap = {
        diagnosis: 'diagnosis_options',
        hospital: 'hospital_options',
        insurance: 'insurance_type_options',
        treatment: 'treatment_detail_options',
        patient_status: 'patient_status_options'
      } as const;

      const tableName = tableMap[type];
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', optionId);

      if (error) throw error;

      toast({
        title: "성공",
        description: "옵션이 삭제되었습니다.",
      });

      fetchAllOptions();
    } catch (error) {
      console.error('Error deleting option:', error);
      toast({
        title: "오류",
        description: "옵션 삭제에 실패했습니다.",
        variant: "destructive",
      });
    }
  };

  const renderPatientStatusList = () => (
    <div className="space-y-4">
      {/* 새 옵션 추가 */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="새 관리 상태를 입력하세요"
            value={newPatientStatus}
            onChange={(e) => setNewPatientStatus(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                addOption('patient_status', newPatientStatus, excludeFromTracking);
              }
            }}
          />
          <Button onClick={() => addOption('patient_status', newPatientStatus, excludeFromTracking)}>
            <Plus className="h-4 w-4 mr-2" />
            추가
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Switch 
            id="exclude-tracking" 
            checked={excludeFromTracking}
            onCheckedChange={setExcludeFromTracking}
          />
          <Label htmlFor="exclude-tracking" className="text-sm">
            일별 환자 관리 현황에서 제외
          </Label>
        </div>
      </div>

      {/* 옵션 목록 */}
      <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
        {patientStatusOptions.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            등록된 옵션이 없습니다.
          </div>
        ) : (
          patientStatusOptions.map(option => (
            <div key={option.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <span className="font-medium">{option.name}</span>
                {option.exclude_from_daily_tracking && (
                  <Badge variant="outline" className="text-xs">일별 관리 제외</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteOption('patient_status', option.id)}
                className="hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        총 {patientStatusOptions.length}개의 옵션
      </div>
    </div>
  );

  const renderOptionList = (
    options: Option[],
    type: 'diagnosis' | 'hospital' | 'insurance' | 'treatment',
    newValue: string,
    setNewValue: (value: string) => void
  ) => (
    <div className="space-y-4">
      {/* 새 옵션 추가 */}
      <div className="flex gap-2">
        <Input
          placeholder="새 옵션명을 입력하세요"
          value={newValue}
          onChange={(e) => setNewValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              addOption(type, newValue);
            }
          }}
        />
        <Button onClick={() => addOption(type, newValue)}>
          <Plus className="h-4 w-4 mr-2" />
          추가
        </Button>
      </div>

      {/* 옵션 목록 */}
      <div className="border rounded-lg divide-y max-h-[500px] overflow-y-auto">
        {options.length === 0 ? (
          <div className="p-8 text-center text-muted-foreground">
            등록된 옵션이 없습니다.
          </div>
        ) : (
          options.map(option => (
            <div key={option.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
              <span className="font-medium">{option.name}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteOption(type, option.id)}
                className="hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))
        )}
      </div>

      <div className="text-sm text-muted-foreground">
        총 {options.length}개의 옵션
      </div>
    </div>
  );

  if (loading) {
    return <div className="flex justify-center items-center h-64">로딩 중...</div>;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="h-8 w-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">옵션 관리</h1>
          <p className="text-muted-foreground">시스템에서 사용하는 드롭다운 옵션을 관리합니다.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>옵션 목록</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="diagnosis" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="diagnosis">진단명</TabsTrigger>
              <TabsTrigger value="hospital">이전병원</TabsTrigger>
              <TabsTrigger value="insurance">실비보험유형</TabsTrigger>
              <TabsTrigger value="treatment">치료상세</TabsTrigger>
              <TabsTrigger value="patient_status">환자 관리 상태</TabsTrigger>
            </TabsList>

            <TabsContent value="diagnosis" className="mt-6">
              {renderOptionList(diagnosisOptions, 'diagnosis', newDiagnosis, setNewDiagnosis)}
            </TabsContent>

            <TabsContent value="hospital" className="mt-6">
              {renderOptionList(hospitalOptions, 'hospital', newHospital, setNewHospital)}
            </TabsContent>

            <TabsContent value="insurance" className="mt-6">
              {renderOptionList(insuranceTypeOptions, 'insurance', newInsurance, setNewInsurance)}
            </TabsContent>

            <TabsContent value="treatment" className="mt-6">
              {renderOptionList(treatmentDetailOptions, 'treatment', newTreatment, setNewTreatment)}
            </TabsContent>

            <TabsContent value="patient_status" className="mt-6">
              {renderPatientStatusList()}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
