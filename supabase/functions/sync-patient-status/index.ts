import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

interface Patient {
  id: string;
  name: string;
  patient_number: string;
  management_status: string;
  last_visit_date: string | null;
  inflow_date: string | null;
  created_at: string;
}

interface DailyStatus {
  patient_id: string;
  status_date: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Use service role key to bypass RLS
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log('Starting patient status synchronization...');

    // 1. 모든 환자 조회
    const { data: patients, error: patientsError } = await supabaseClient
      .from('patients')
      .select('id, name, patient_number, management_status, last_visit_date, inflow_date, created_at')
      .order('patient_number');

    if (patientsError) {
      throw patientsError;
    }

    console.log(`Found ${patients?.length || 0} patients to process`);

    // 2. 모든 환자의 daily_patient_status 조회 (최근 기록만)
    const { data: dailyStatuses, error: statusError } = await supabaseClient
      .from('daily_patient_status')
      .select('patient_id, status_date')
      .order('status_date', { ascending: false });

    if (statusError) {
      throw statusError;
    }

    // 환자별 최근 체크 날짜 매핑
    const lastCheckMap = new Map<string, string>();
    dailyStatuses?.forEach((status: DailyStatus) => {
      if (!lastCheckMap.has(status.patient_id)) {
        lastCheckMap.set(status.patient_id, status.status_date);
      }
    });

    const finalStatuses = ['사망', '상태악화', '치료종료'];
    const updates: Array<{ id: string; last_visit_date?: string; management_status?: string }> = [];
    let syncCount = 0;
    let statusUpdateCount = 0;
    let skippedFinalStatus = 0;

    // 3. 각 환자 처리
    for (const patient of patients as Patient[]) {
      // 최종 상태는 건드리지 않음
      if (finalStatuses.includes(patient.management_status)) {
        skippedFinalStatus++;
        continue;
      }

      const lastCheckDate = lastCheckMap.get(patient.id);
      const updateData: { last_visit_date?: string; management_status?: string } = {};

      // last_visit_date 동기화
      if (lastCheckDate && patient.last_visit_date !== lastCheckDate) {
        updateData.last_visit_date = lastCheckDate;
        syncCount++;
      }

      // 경과 일수 계산 (우선순위: last_visit_date > inflow_date > created_at)
      const today = new Date();
      let daysSinceCheck: number;

      if (lastCheckDate) {
        // 1순위: last_visit_date (마지막 내원일)
        const lastDate = new Date(lastCheckDate);
        daysSinceCheck = Math.floor((today.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));
      } else if (patient.inflow_date) {
        // 2순위: inflow_date (유입일)
        const inflowDate = new Date(patient.inflow_date);
        daysSinceCheck = Math.floor((today.getTime() - inflowDate.getTime()) / (1000 * 60 * 60 * 24));
      } else {
        // 3순위: created_at (환자 등록일)
        const createdDate = new Date(patient.created_at);
        daysSinceCheck = Math.floor((today.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      }

      // 자동 상태 계산
      let autoStatus: string;
      if (daysSinceCheck >= 30) {
        autoStatus = '아웃';
      } else if (daysSinceCheck >= 21) {
        autoStatus = '아웃위기';
      } else {
        autoStatus = '관리 중';
      }

      // 상태가 다르면 업데이트
      if (patient.management_status !== autoStatus) {
        updateData.management_status = autoStatus;
        statusUpdateCount++;
      }

      // 업데이트 필요 시 실행
      if (Object.keys(updateData).length > 0) {
        updates.push({ id: patient.id, ...updateData });
      }
    }

    // 4. 일괄 업데이트 (배치 처리)
    console.log(`Updating ${updates.length} patients...`);
    
    for (const update of updates) {
      const { error: updateError } = await supabaseClient
        .from('patients')
        .update({
          last_visit_date: update.last_visit_date,
          management_status: update.management_status,
        })
        .eq('id', update.id);

      if (updateError) {
        console.error(`Failed to update patient ${update.id}:`, updateError);
      }
    }

    const summary = {
      total_patients: patients?.length || 0,
      last_visit_date_synced: syncCount,
      status_updated: statusUpdateCount,
      skipped_final_status: skippedFinalStatus,
      total_updated: updates.length,
      timestamp: new Date().toISOString(),
    };

    console.log('Synchronization completed:', summary);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Patient status synchronization completed',
        summary,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in sync-patient-status:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
