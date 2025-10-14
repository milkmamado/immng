-- Add date range columns to package_transactions for usage transactions
ALTER TABLE package_transactions 
ADD COLUMN date_from date,
ADD COLUMN date_to date;

-- Add comment explaining the columns
COMMENT ON COLUMN package_transactions.date_from IS 'Start date for usage transactions (사용일자F)';
COMMENT ON COLUMN package_transactions.date_to IS 'End date for usage transactions (사용일자T)';

-- For existing data, set date_from and date_to to transaction_date
UPDATE package_transactions 
SET date_from = transaction_date, 
    date_to = transaction_date
WHERE date_from IS NULL;