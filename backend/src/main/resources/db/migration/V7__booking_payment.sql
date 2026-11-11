-- How a client's booking was paid: credit first, then money for the remainder. All columns are null for a
-- booking that was not paid in the app (an owner manual booking, or one made before payments existed).
ALTER TABLE booking ADD COLUMN credits_used INTEGER CHECK (credits_used >= 0);
ALTER TABLE booking ADD COLUMN amount_charged DECIMAL(8, 2) CHECK (amount_charged >= 0);
ALTER TABLE booking ADD COLUMN payment_method_id BIGINT REFERENCES payment_method (id);
ALTER TABLE booking ADD COLUMN charge_reference VARCHAR(100);

-- The booking a CONSUMPTION paid for.
ALTER TABLE credit_transaction ADD COLUMN booking_id BIGINT REFERENCES booking (id);
CREATE INDEX idx_credit_transaction_booking ON credit_transaction (booking_id);
