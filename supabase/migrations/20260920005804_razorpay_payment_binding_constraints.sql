-- Abort without deleting data when an existing external identifier is duplicated.
DO $$
DECLARE
  duplicate_gateway_references TEXT;
  duplicate_transaction_ids TEXT;
BEGIN
  SELECT string_agg(gateway_reference, ', ' ORDER BY gateway_reference)
  INTO duplicate_gateway_references
  FROM (
    SELECT gateway_reference
    FROM public.payments
    WHERE gateway_reference IS NOT NULL
    GROUP BY gateway_reference
    HAVING COUNT(*) > 1
  ) conflicts;

  SELECT string_agg(transaction_id, ', ' ORDER BY transaction_id)
  INTO duplicate_transaction_ids
  FROM (
    SELECT transaction_id
    FROM public.payments
    WHERE transaction_id IS NOT NULL
    GROUP BY transaction_id
    HAVING COUNT(*) > 1
  ) conflicts;

  IF duplicate_gateway_references IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate payments.gateway_reference values must be reconciled first: %', duplicate_gateway_references;
  END IF;
  IF duplicate_transaction_ids IS NOT NULL THEN
    RAISE EXCEPTION 'Duplicate payments.transaction_id values must be reconciled first: %', duplicate_transaction_ids;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_gateway_reference
  ON public.payments (gateway_reference)
  WHERE gateway_reference IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_transaction_id
  ON public.payments (transaction_id)
  WHERE transaction_id IS NOT NULL;
