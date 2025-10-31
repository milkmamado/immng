-- Add inflow_date column to patients table for manual entry
ALTER TABLE patients 
ADD COLUMN inflow_date DATE;

COMMENT ON COLUMN patients.inflow_date IS '담당자가 수동으로 입력하는 실제 유입일';
