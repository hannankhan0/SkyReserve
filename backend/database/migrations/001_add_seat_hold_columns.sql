-- Run this once only if your existing Seats table was created before the hold columns were added.
-- The updated backend also runs this automatically, but this script is useful for manual SSMS fixing.
IF COL_LENGTH('Seats', 'held_until') IS NULL
BEGIN
    ALTER TABLE Seats ADD held_until DATETIME2 NULL;
END;

IF COL_LENGTH('Seats', 'hold_user_id') IS NULL
BEGIN
    ALTER TABLE Seats ADD hold_user_id INT NULL;
END;
