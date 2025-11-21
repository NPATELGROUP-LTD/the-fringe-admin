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

-- Content Management Tables

-- Courses Table
CREATE TABLE courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  category_id UUID REFERENCES courses_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  requirements JSONB,
  tags TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Categories Table
CREATE TABLE courses_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Services Table
CREATE TABLE services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT NOT NULL,
  short_description TEXT,
  price DECIMAL(10,2) NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  category_id UUID REFERENCES service_categories(id) ON DELETE SET NULL,
  image_url TEXT,
  features TEXT[],
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Service Categories Table
CREATE TABLE service_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Offers Table
CREATE TABLE offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10,2) NOT NULL,
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User Engagement Tables

-- Contact Submissions Table
CREATE TABLE contact_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  subject VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  responded_at TIMESTAMPTZ,
  response TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Newsletter Subscriptions Table
CREATE TABLE newsletter_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(255),
  last_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('subscribed', 'unsubscribed', 'pending')),
  subscribed_at TIMESTAMPTZ DEFAULT NOW(),
  unsubscribed_at TIMESTAMPTZ,
  interests TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Reviews Table
CREATE TABLE reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Testimonials Table
CREATE TABLE testimonials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  company VARCHAR(255),
  position VARCHAR(255),
  content TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  image_url TEXT,
  is_featured BOOLEAN DEFAULT false,
  is_approved BOOLEAN DEFAULT false,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Information Tables

-- FAQs Table
CREATE TABLE faqs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category VARCHAR(100),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Business Info Table
CREATE TABLE business_info (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('text', 'email', 'phone', 'address', 'hours', 'social')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site Settings Table
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value JSONB NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('string', 'number', 'boolean', 'json')),
  category VARCHAR(100) NOT NULL,
  description TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Statistics Table
CREATE TABLE statistics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL,
  value DECIMAL(15,2) NOT NULL,
  label VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  period VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE email_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100) DEFAULT 'general',
  variables JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email SMTP Settings Table
CREATE TABLE email_smtp_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  host VARCHAR(255) NOT NULL,
  port INTEGER NOT NULL,
  username VARCHAR(255),
  password VARCHAR(255),
  encryption VARCHAR(20) DEFAULT 'tls' CHECK (encryption IN ('none', 'ssl', 'tls')),
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Triggers Table
CREATE TABLE email_triggers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100) NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE CASCADE,
  conditions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaigns Table
CREATE TABLE email_campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  segment_filters JSONB DEFAULT '{}',
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'paused', 'cancelled')),
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  total_recipients INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0,
  bounced_count INTEGER DEFAULT 0,
  unsubscribed_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaign Sends Table
CREATE TABLE email_campaign_sends (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  subscriber_id UUID REFERENCES newsletter_subscriptions(id) ON DELETE CASCADE,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ,
  unsubscribed_at TIMESTAMPTZ,
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'unsubscribed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Email Campaign Analytics Table
CREATE TABLE email_campaign_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES email_campaigns(id) ON DELETE CASCADE,
  metric VARCHAR(50) NOT NULL,
  value INTEGER NOT NULL,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on all new tables
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE newsletter_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;
ALTER TABLE faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_info ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE statistics ENABLE ROW LEVEL SECURITY;

-- RLS Policies for Content Management Tables
-- Admin and super_admin have full access, editors can only read

-- Courses policies
CREATE POLICY "Admin and super_admin manage courses" ON courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Editors can view courses" ON courses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'editor'
    )
  );

-- Course Categories policies
CREATE POLICY "Admin and super_admin manage course categories" ON courses_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Editors can view course categories" ON courses_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'editor'
    )
  );

-- Services policies
CREATE POLICY "Admin and super_admin manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Editors can view services" ON services
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'editor'
    )
  );

-- Service Categories policies
CREATE POLICY "Admin and super_admin manage service categories" ON service_categories
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Editors can view service categories" ON service_categories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'editor'
    )
  );

-- Offers policies
CREATE POLICY "Admin and super_admin manage offers" ON offers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Editors can view offers" ON offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role = 'editor'
    )
  );

-- RLS Policies for User Engagement Tables
-- Only admin and super_admin have access

-- Contact Submissions policies
CREATE POLICY "Admin and super_admin manage contact submissions" ON contact_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- Newsletter Subscriptions policies
CREATE POLICY "Admin and super_admin manage newsletter subscriptions" ON newsletter_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- Reviews policies
CREATE POLICY "Admin and super_admin manage reviews" ON reviews
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- Testimonials policies
CREATE POLICY "Admin and super_admin manage testimonials" ON testimonials
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for Information Tables
-- Admin and super_admin have full access, some public read access

-- FAQs policies
CREATE POLICY "Admin and super_admin manage FAQs" ON faqs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public can view active FAQs" ON faqs
  FOR SELECT USING (is_active = true);

-- Business Info policies
CREATE POLICY "Admin and super_admin manage business info" ON business_info
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public can view active business info" ON business_info
  FOR SELECT USING (is_active = true);

-- Site Settings policies
CREATE POLICY "Admin and super_admin manage site settings" ON site_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public can view public site settings" ON site_settings
  FOR SELECT USING (is_public = true);

-- Statistics policies
CREATE POLICY "Admin and super_admin manage statistics" ON statistics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Public can view statistics" ON statistics
  FOR SELECT USING (true);

-- Enable RLS on email tables
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_triggers ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_campaign_analytics ENABLE ROW LEVEL SECURITY;

-- Email Templates policies
CREATE POLICY "Admin and super_admin manage email templates" ON email_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- Email SMTP Settings policies
CREATE POLICY "Admin and super_admin manage SMTP settings" ON email_smtp_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- Email Triggers policies
CREATE POLICY "Admin and super_admin manage email triggers" ON email_triggers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- Email Campaigns policies
CREATE POLICY "Admin and super_admin manage email campaigns" ON email_campaigns
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- Email Campaign Sends policies
CREATE POLICY "Admin and super_admin manage campaign sends" ON email_campaign_sends
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );

-- Email Campaign Analytics policies
CREATE POLICY "Admin and super_admin manage campaign analytics" ON email_campaign_analytics
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admin_users au
      WHERE au.id = auth.uid() AND au.role IN ('admin', 'super_admin')
    )
  );