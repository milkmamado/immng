-- user_role enum에 admin 추가 (별도 트랜잭션)
ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'admin';