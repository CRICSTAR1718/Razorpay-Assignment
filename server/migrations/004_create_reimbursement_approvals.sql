-- 004_create_reimbursement_approvals.sql

CREATE TABLE IF NOT EXISTS reimbursement_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reimbursement_id UUID NOT NULL REFERENCES reimbursements(id) ON DELETE CASCADE,
  approver_id UUID NOT NULL REFERENCES users(id),
  approver_role VARCHAR(10) NOT NULL,
  action VARCHAR(20) NOT NULL,
  remarks TEXT,
  acted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  CHECK (approver_role IN ('RM', 'APE', 'CFO')),
  CHECK (action IN ('APPROVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_reimbursement_approvals_reimbursement_id
  ON reimbursement_approvals (reimbursement_id);

CREATE INDEX IF NOT EXISTS idx_reimbursement_approvals_approver_id
  ON reimbursement_approvals (approver_id);

