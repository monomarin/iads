// RLS helper — generates tenant-scoped SQL filter
export function tenantFilter(tenantId: string) {
  return { tenantId };
}

// RLS policies SQL (run via migration)
export const rlsPoliciesSql = `
-- Enable RLS on all tenant-scoped tables
ALTER TABLE tenants ENABLE ROW LEVEL SECURITY;
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Tenant isolation policies
CREATE POLICY tenant_isolation_tenants ON tenants
  USING (id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_stores ON stores
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

CREATE POLICY tenant_isolation_users ON users
  USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Super admin bypass
CREATE POLICY super_admin_bypass ON tenants
  USING (current_setting('app.current_user_role') = 'super_admin');

CREATE POLICY super_admin_bypass_stores ON stores
  USING (current_setting('app.current_user_role') = 'super_admin');

CREATE POLICY super_admin_bypass_users ON users
  USING (current_setting('app.current_user_role') = 'super_admin');
`;

export const rlsSetSessionSql = (tenantId: string, role: string) => `
  SELECT set_config('app.current_tenant_id', '${tenantId}', true);
  SELECT set_config('app.current_user_role', '${role}', true);
`;
