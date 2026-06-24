-- 002_create_employee_manager_map.sql

CREATE TABLE IF NOT EXISTS employee_manager_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  manager_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  assigned_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_employee_manager_map_employee_id
  ON employee_manager_map (employee_id);

CREATE INDEX IF NOT EXISTS idx_employee_manager_map_manager_id
  ON employee_manager_map (manager_id);

