-- Add "면책기간" to patient_status_options
INSERT INTO public.patient_status_options (name, exclude_from_daily_tracking)
VALUES ('면책기간', true)
ON CONFLICT DO NOTHING;