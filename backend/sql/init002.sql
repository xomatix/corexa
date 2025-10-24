DO $$
DECLARE
    users_collection_id uuid := gen_random_uuid();
BEGIN
    IF NOT EXISTS (SELECT 1 FROM collections WHERE name = 'users') THEN
      INSERT INTO collections (id, name, label)
      VALUES (users_collection_id, 'users', 'Users');
  
      INSERT INTO fields (collection_id, name, label, type, is_primary, is_nullable, is_unique)
      VALUES
          (users_collection_id, 'id', 'ID', 'uuid', TRUE, FALSE, TRUE),
          (users_collection_id, 'username', 'Username', 'varchar(255)', FALSE, FALSE, TRUE),
          (users_collection_id, 'password_hash', 'Password Hash', 'text', FALSE, FALSE, FALSE),
          (users_collection_id, 'display_name', 'Display Name', 'text', FALSE, TRUE, FALSE),
          (users_collection_id, 'email', 'Email', 'varchar(320)', FALSE, TRUE, FALSE),
          (users_collection_id, 'is_active', 'Is Active', 'boolean', FALSE, FALSE, FALSE),
          (users_collection_id, 'is_superuser', 'Is Superuser', 'boolean', FALSE, FALSE, FALSE);
    END IF;
END $$;

INSERT INTO data_types (name, label) VALUES
    ('boolean', 'True/False value'),
    ('integer', 'Whole numbers'),
    ('text', 'Unlimited length text'),
    ('uuid', 'Universally unique identifier'),

    ('varchar(50)', 'Short text (max 50 characters)'),
    ('varchar(100)', 'Medium text (max 100 characters)'),
    ('varchar(255)', 'Standard text (max 255 characters)'),
    ('varchar(1000)', 'Long text (max 1000 characters)'),
    ('varchar(4000)', 'Description text (max 4000 characters)'),
    
    ('bigint', 'Large whole numbers'),
    ('numeric(10, 2)', 'Currency values (max 99999999.99)'),
    ('numeric(15, 4)', 'Scientific measurements (15 digits, 4 decimals)'),
    ('numeric(18, 6)', 'High-precision finance (18 digits, 6 decimals)'),
    
    ('date', 'Calendar date (YYYY-MM-DD)'),
    ('time', 'Time without timezone'),
    ('timestamp', 'Date and time without timezone'),
    ('timestamp_tz', 'Date and time with timezone'),
    
    ('json', 'JSON document storage'),
    ('jsonb', 'Optimized binary JSON storage'),
    ('bytea', 'Binary data'),
    ('tsvector', 'Full-text search optimized data')
ON CONFLICT (name) DO NOTHING;


INSERT INTO users (username, password_hash, display_name, is_active, is_superuser) VALUES
    ('admin', md5('admin'), 'admin', TRUE, TRUE)
ON CONFLICT (username) DO NOTHING;
