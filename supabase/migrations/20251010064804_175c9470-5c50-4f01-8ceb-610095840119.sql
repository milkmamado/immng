-- Delete all patient-related data (in order to respect foreign key constraints)
DELETE FROM public.daily_patient_status;
DELETE FROM public.patient_reconnect_tracking;
DELETE FROM public.patient_notes;
DELETE FROM public.treatment_plans;
DELETE FROM public.treatment_history;
DELETE FROM public.packages;
DELETE FROM public.medical_info;
DELETE FROM public.admission_cycles;
DELETE FROM public.patients;