-- Admin Users Table
CREATE TABLE admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'editor' CHECK (role IN ('admin', 'super_admin', 'editor')),
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Sessions Table
CREATE TABLE admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Admin Audit Log Table
CREATE TABLE admin_audit_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(255) NOT NULL,
  resource_type VARCHAR(100),
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users
-- Only super_admin can view all users
CREATE POLICY "Super admin can view all users" ON admin_users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON admin_users
  FOR SELECT USING (id = auth.uid());

-- Only super_admin can insert/update/delete users
CREATE POLICY "Super admin can manage users" ON admin_users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'super_admin'
    )
  );

-- RLS Policies for admin_sessions
-- Users can only see their own sessions
CREATE POLICY "Users can manage own sessions" ON admin_sessions
  FOR ALL USING (user_id = auth.uid());

-- RLS Policies for admin_audit_log
-- Only admin and super_admin can view audit logs
CREATE POLICY "Admin can view audit logs" ON admin_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- All authenticated users can insert audit logs
CREATE POLICY "Authenticated users can insert audit logs" ON admin_audit_log
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);