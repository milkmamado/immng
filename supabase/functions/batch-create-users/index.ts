import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'
import { corsHeaders } from '../_shared/cors.ts'

interface UserAccount {
  name: string
  email: string
  password: string
  role: 'master' | 'admin' | 'manager'
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Service Role 클라이언트 생성 (관리자 권한)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // 요청자가 master인지 확인
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)

    if (authError || !user) {
      console.error('Auth error:', authError)
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // master 권한 확인
    const { data: roleData, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role, approval_status')
      .eq('user_id', user.id)
      .eq('role', 'master')
      .eq('approval_status', 'approved')
      .maybeSingle()

    if (roleError || !roleData) {
      console.error('Role check error:', roleError)
      return new Response(
        JSON.stringify({ error: 'Master role required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 계정 데이터 받기
    const { accounts } = await req.json() as { accounts: UserAccount[] }

    if (!accounts || !Array.isArray(accounts) || accounts.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No accounts provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log(`Creating ${accounts.length} user accounts...`)

    const results = []
    const errors = []

    for (const account of accounts) {
      try {
        console.log(`Creating user: ${account.email}`)

        // 사용자 생성 (이메일 확인 우회)
        const { data: newUser, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: {
            name: account.name
          }
        })

        if (signUpError) {
          console.error(`Error creating user ${account.email}:`, signUpError)
          errors.push({
            email: account.email,
            error: signUpError.message
          })
          continue
        }

        if (!newUser.user) {
          errors.push({
            email: account.email,
            error: 'User creation failed - no user returned'
          })
          continue
        }

        console.log(`User created: ${newUser.user.id}`)

        // 역할 할당 (approved 상태로)
        const { error: roleInsertError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: newUser.user.id,
            role: account.role,
            approval_status: 'approved',
            assigned_by: user.id
          })

        if (roleInsertError) {
          console.error(`Error assigning role to ${account.email}:`, roleInsertError)
          errors.push({
            email: account.email,
            error: `Role assignment failed: ${roleInsertError.message}`
          })
          continue
        }

        console.log(`Role assigned to ${account.email}: ${account.role}`)

        results.push({
          email: account.email,
          name: account.name,
          role: account.role,
          userId: newUser.user.id,
          success: true
        })

      } catch (error: any) {
        console.error(`Error processing ${account.email}:`, error)
        errors.push({
          email: account.email,
          error: error?.message || 'Unknown error'
        })
      }
    }

    console.log(`Batch creation completed. Success: ${results.length}, Errors: ${errors.length}`)

    return new Response(
      JSON.stringify({
        success: true,
        created: results.length,
        failed: errors.length,
        results,
        errors
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error: any) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ error: error?.message || 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})