-- Update created_at to random dates between August and September 2025
UPDATE public.patients
SET created_at = timestamp '2025-08-01 00:00:00' + 
                 random() * (timestamp '2025-09-30 23:59:59' - timestamp '2025-08-01 00:00:00')
WHERE assigned_manager = '862b4fa8-2cd7-4470-a4dc-af70ada520c3';