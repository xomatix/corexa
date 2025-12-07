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
    validation VARCHAR(255),
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
    password_hash TEXT,
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

CREATE TABLE IF NOT EXISTS data_types (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name varchar(100) NOT NULL UNIQUE, 
    label varchar(255)    
);


-- Role Based Access Control
CREATE TABLE IF NOT EXISTS roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_roles (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, role_id)
);

CREATE TABLE IF NOT EXISTS permissions (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS user_permissions (
    user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    permissions_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, permissions_id)
);

CREATE TABLE IF NOT EXISTS role_permissions (
    role_id uuid NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    permissions_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permissions_id)
);

CREATE TABLE IF NOT EXISTS collection_permissions (
    collections_id uuid NOT NULL REFERENCES collections(id) ON DELETE CASCADE,
    permissions_id uuid NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
    action varchar(1), -- Create, Read, Update, Delete
    PRIMARY KEY (collections_id, permissions_id, action)
);