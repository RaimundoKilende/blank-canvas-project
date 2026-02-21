-- Reload PostgREST schema cache to recognize scheduled_date column
NOTIFY pgrst, 'reload schema';