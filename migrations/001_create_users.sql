-- 001_create_users.sql

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(10) NOT NULL DEFAULT 'EMP',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (role IN ('EMP', 'RM', 'APE', 'CFO'))
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

