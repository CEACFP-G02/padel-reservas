-- Each booked slot keeps the price charged when it was booked, so later schedule price changes
-- never alter past bookings. Existing rows get an even share of their booking's total.

ALTER TABLE booking_slot ADD COLUMN price DECIMAL(8, 2);
UPDATE booking_slot SET price = ROUND(
        (SELECT b.total_price FROM booking b WHERE b.id = booking_slot.booking_id)
        / (SELECT COUNT(*) FROM booking_slot s WHERE s.booking_id = booking_slot.booking_id), 2);
ALTER TABLE booking_slot ALTER COLUMN price SET NOT NULL;
ALTER TABLE booking_slot ADD CONSTRAINT chk_booking_slot_price CHECK (price >= 0);
