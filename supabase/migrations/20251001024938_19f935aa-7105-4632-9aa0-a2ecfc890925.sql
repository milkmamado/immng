-- Delete all related data first (in order of dependencies)
DELETE FROM treatment_plans;
DELETE FROM treatment_history;
DELETE FROM patient_reconnect_tracking;
DELETE FROM patient_notes;
DELETE FROM packages;
DELETE FROM medical_info;
DELETE FROM daily_patient_status;
DELETE FROM admission_cycles;

-- Finally delete all patients
DELETE FROM patients;