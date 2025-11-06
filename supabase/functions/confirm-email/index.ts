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
        JSON.stringify({ error: 'Only masters can confirm emails' }),
        { 
          status: 403,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const { email } = await req.json()

    if (!email) {
      return new Response(
        JSON.stringify({ error: 'email is required' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Find user by email
    const { data: { users }, error: listError } = await supabaseClient.auth.admin.listUsers()
    
    if (listError) {
      throw listError
    }

    const targetUser = users?.find(u => u.email === email)
    
    if (!targetUser) {
      return new Response(
        JSON.stringify({ error: 'User not found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Update user to confirm email
    const { error: updateError } = await supabaseClient.auth.admin.updateUserById(
      targetUser.id,
      { 
        email_confirm: true
      }
    )

    if (updateError) {
      throw updateError
    }

    console.log(`이메일 확인 완료: ${email}`)

    return new Response(
      JSON.stringify({ success: true, message: 'Email confirmed successfully' }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
    console.error('이메일 확인 오류:', errorMessage)
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})