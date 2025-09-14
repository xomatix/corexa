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