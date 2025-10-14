-- 일자별 패키지 거래 내역 테이블 생성
CREATE TABLE IF NOT EXISTS public.package_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  customer_number TEXT,
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL, -- 'deposit_in', 'deposit_out', 'reward_in', 'reward_out', 'count_in', 'count_out'
  amount NUMERIC NOT NULL DEFAULT 0,
  count INTEGER DEFAULT 0,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 인덱스 생성
CREATE INDEX idx_package_transactions_patient ON public.package_transactions(patient_id);
CREATE INDEX idx_package_transactions_date ON public.package_transactions(transaction_date DESC);
CREATE INDEX idx_package_transactions_type ON public.package_transactions(transaction_type);

-- RLS 활성화
ALTER TABLE public.package_transactions ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 매니저는 자신의 환자 거래 내역 조회
CREATE POLICY "Managers can view package transactions for their patients"
ON public.package_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = package_transactions.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);

-- RLS 정책: 매니저는 자신의 환자 거래 내역 관리
CREATE POLICY "Managers can manage package transactions for their patients"
ON public.package_transactions
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.patients
    WHERE patients.id = package_transactions.patient_id
    AND patients.assigned_manager = auth.uid()
  )
);

-- RLS 정책: 마스터는 모든 거래 내역 조회
CREATE POLICY "Masters can view all package transactions"
ON public.package_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'master'
    AND ur.approval_status = 'approved'
  )
);

-- RLS 정책: 관리자는 모든 거래 내역 조회
CREATE POLICY "Admins can view all package transactions"
ON public.package_transactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
    AND ur.role = 'admin'
    AND ur.approval_status = 'approved'
  )
);

-- 자동 updated_at 업데이트 트리거
CREATE TRIGGER update_package_transactions_updated_at
BEFORE UPDATE ON public.package_transactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();