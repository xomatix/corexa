-- Table to store collection configurations
CREATE TABLE IF NOT EXISTS collections (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    -- The UNIQUE constraint automatically creates an index on this column.
    name VARCHAR(255) NOT NULL UNIQUE,
    label VARCHAR(255) NOT NULL
);

CREATE TABLE IF NOT EXISTS fields (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id uuid NOT NULL,
    name VARCHAR(255) NOT NULL,
    label VARCHAR(255),
    type VARCHAR(100) NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_nullable BOOLEAN NOT NULL DEFAULT TRUE,
    is_unique BOOLEAN NOT NULL DEFAULT FALSE,
    foreign_table uuid DEFAULT NULL,
    CONSTRAINT fk_collection
        FOREIGN KEY(collection_id)
        REFERENCES collections(id)
        ON DELETE CASCADE,
    CONSTRAINT uq_collection_field_name UNIQUE (collection_id, name)
);

CREATE INDEX IF NOT EXISTS idx_collections_name ON collections (name);
CREATE INDEX IF NOT EXISTS idx_collections_label ON collections (label);
CREATE INDEX IF NOT EXISTS idx_fields_name ON fields (name);
CREATE INDEX IF NOT EXISTS idx_fields_label ON fields (label);

CREATE TABLE IF NOT EXISTS users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    username varchar(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    display_name TEXT,
    email varchar(320),
    is_active BOOLEAN NOT NULL DEFAULT FALSE,
    is_superuser BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE TABLE IF NOT EXISTS sessions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    users_id uuid REFERENCES users(id) ON DELETE CASCADE,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT now(),
    expires_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    collections_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE, 
    action varchar(10) NOT NULL, -- create, read, update, delete
    condition TEXT,
    UNIQUE(collections_id, action)
);

CREATE TABLE IF NOT EXISTS data_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL UNIQUE, 
    label varchar(255)    
);