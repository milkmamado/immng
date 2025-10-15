import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the requesting user is a master
    const authHeader = req.headers.get('Authorization')!
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token)

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Check if requesting user is master
    const { data: roleData, error: roleError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'master')
      .eq('approval_status', 'approved')
      .single()

    if (roleError || !roleData) {
      return new Response(
        JSON.stringify({ error: 'Only masters can delete users' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { userId } = await req.json()

    if (!userId) {
      return new Response(
        JSON.stringify({ error: 'userId is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Prevent self-deletion
    if (userId === user.id) {
      return new Response(
        JSON.stringify({ error: 'Cannot delete yourself' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // 1. 옵션 테이블들의 created_by를 NULL로 변경
    const optionTables = [
      'diagnosis_options',
      'hospital_options',
      'insurance_type_options',
      'patient_status_options',
      'treatment_detail_options'
    ];

    for (const table of optionTables) {
      const { error: updateError } = await supabaseClient
        .from(table)
        .update({ created_by: null })
        .eq('created_by', userId);
      
      if (updateError) {
        console.error(`${table} created_by 업데이트 오류:`, updateError);
        // 계속 진행
      }
    }

    // 2. 해당 매니저에게 할당된 환자들을 조회
    const { data: assignedPatients, error: fetchError } = await supabaseClient
      .from('patients')
      .select('id')
      .eq('assigned_manager', userId);

    if (fetchError) {
      console.error('환자 조회 오류:', fetchError);
      throw new Error(`환자 조회 실패: ${fetchError.message}`);
    }

    // 3. 환자가 있으면 관련 데이터를 모두 삭제
    if (assignedPatients && assignedPatients.length > 0) {
      const patientIds = assignedPatients.map(p => p.id);
      
      console.log(`매니저 ${userId}에게 할당된 환자 ${patientIds.length}명 삭제 시작`);

      // 환자 관련 테이블들을 순서대로 삭제
      const tablesToDelete = [
        'package_transactions',
        'package_management',
        'treatment_plans',
        'treatment_history',
        'patient_reconnect_tracking',
        'patient_notes',
        'packages',
        'medical_info',
        'daily_patient_status',
        'admission_cycles'
      ];

      for (const table of tablesToDelete) {
        const { error: deleteError } = await supabaseClient
          .from(table)
          .delete()
          .in('patient_id', patientIds);
        
        if (deleteError) {
          console.error(`${table} 삭제 오류:`, deleteError);
          // 계속 진행 (일부 테이블에 데이터가 없을 수 있음)
        }
      }

      // 4. created_by가 삭제될 사용자인 데이터 처리
      const createdByTables = [
        'patient_notes',
        'daily_patient_status'
      ];

      for (const table of createdByTables) {
        const { error: updateError } = await supabaseClient
          .from(table)
          .update({ created_by: null })
          .eq('created_by', userId);
        
        if (updateError) {
          console.error(`${table} created_by 업데이트 오류:`, updateError);
          // 계속 진행
        }
      }

      // 5. 마지막으로 환자 데이터 삭제
      const { error: patientsDeleteError } = await supabaseClient
        .from('patients')
        .delete()
        .in('id', patientIds);

      if (patientsDeleteError) {
        console.error('환자 삭제 오류:', patientsDeleteError);
        throw new Error(`환자 삭제 실패: ${patientsDeleteError.message}`);
      }

      console.log(`매니저 ${userId}의 환자 ${patientIds.length}명 및 관련 데이터 삭제 완료`);
    }

    // 6. user_roles 테이블에서 사용자 역할 삭제
    const { error: rolesDeleteError } = await supabaseClient
      .from('user_roles')
      .delete()
      .eq('user_id', userId);

    if (rolesDeleteError) {
      console.error('사용자 역할 삭제 오류:', rolesDeleteError);
      // 계속 진행
    }

    // 7. profiles 테이블에서 프로필 삭제
    const { error: profileDeleteError } = await supabaseClient
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileDeleteError) {
      console.error('프로필 삭제 오류:', profileDeleteError);
      // 계속 진행
    }

    // 6. 마지막으로 auth.users에서 사용자 삭제
    const { error: deleteError } = await supabaseClient.auth.admin.deleteUser(userId)

    if (deleteError) {
      throw deleteError
    }

    return new Response(
      JSON.stringify({ success: true, message: 'User deleted successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
