-- =====================================================
-- CINEVERSE ADMIN & MODERATION SYSTEM DATABASE SCHEMA
-- =====================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. USER ROLES & PERMISSIONS
-- =====================================================

-- User roles table
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'moderator', 'admin', 'super_admin')),
  assigned_by UUID REFERENCES auth.users(id),
  assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  UNIQUE(user_id, role)
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role ON public.user_roles(role);

-- =====================================================
-- 2. ADMIN ACTION LOGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.admin_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  action TEXT NOT NULL, -- ban_user, delete_content, feature_movie, etc.
  target_type TEXT NOT NULL, -- user, review, comment, post, channel, movie
  target_id TEXT NOT NULL,
  reason TEXT,
  metadata JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_id ON public.admin_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON public.admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_target ON public.admin_logs(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created_at ON public.admin_logs(created_at DESC);

-- =====================================================
-- 3. USER BANS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES auth.users(id),
  reason TEXT NOT NULL,
  ban_type TEXT NOT NULL CHECK (ban_type IN ('temporary', 'permanent', 'shadow', 'ip')),
  duration INTEGER, -- days for temporary bans
  banned_until TIMESTAMP WITH TIME ZONE,
  ip_address INET,
  is_active BOOLEAN DEFAULT TRUE,
  appeal_allowed BOOLEAN DEFAULT TRUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bans_user_id ON public.bans(user_id);
CREATE INDEX IF NOT EXISTS idx_bans_is_active ON public.bans(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_bans_banned_until ON public.bans(banned_until);
CREATE INDEX IF NOT EXISTS idx_bans_ip_address ON public.bans(ip_address) WHERE ip_address IS NOT NULL;

-- =====================================================
-- 4. CONTENT REPORTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id),
  reported_id TEXT NOT NULL, -- UUID or ID of reported content
  reported_type TEXT NOT NULL CHECK (reported_type IN ('review', 'comment', 'post', 'user', 'channel')),
  reported_user_id UUID REFERENCES auth.users(id), -- User who created the reported content
  reason TEXT NOT NULL CHECK (reason IN ('spam', 'toxicity', 'harassment', 'inappropriate', 'misinformation', 'copyright', 'other')),
  description TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'removed', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  moderator_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON public.reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_reported ON public.reports(reported_type, reported_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_reported_user_id ON public.reports(reported_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- =====================================================
-- 5. CONTENT FLAGS (AI + Manual)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_id TEXT NOT NULL,
  content_type TEXT NOT NULL CHECK (content_type IN ('review', 'comment', 'post', 'bio')),
  content_preview TEXT, -- First 200 chars
  author_id UUID REFERENCES auth.users(id),
  flag_type TEXT NOT NULL CHECK (flag_type IN ('ai_toxicity', 'ai_spam', 'ai_nsfw', 'manual', 'multiple_reports')),
  ai_toxicity_score DECIMAL(3,2), -- 0.00 to 1.00
  ai_scores JSONB, -- Detailed AI scores (toxicity, severe_toxicity, etc.)
  auto_flagged BOOLEAN DEFAULT FALSE,
  manual_review_required BOOLEAN DEFAULT TRUE,
  is_hidden BOOLEAN DEFAULT FALSE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'removed', 'dismissed')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_flags_content ON public.flags(content_type, content_id);
CREATE INDEX IF NOT EXISTS idx_flags_author_id ON public.flags(author_id);
CREATE INDEX IF NOT EXISTS idx_flags_status ON public.flags(status);
CREATE INDEX IF NOT EXISTS idx_flags_toxicity ON public.flags(ai_toxicity_score DESC) WHERE ai_toxicity_score IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_flags_created_at ON public.flags(created_at DESC);

-- =====================================================
-- 6. BAN APPEALS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.appeals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  ban_id UUID NOT NULL REFERENCES public.bans(id),
  explanation TEXT NOT NULL CHECK (LENGTH(explanation) <= 500),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewer_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appeals_user_id ON public.appeals(user_id);
CREATE INDEX IF NOT EXISTS idx_appeals_ban_id ON public.appeals(ban_id);
CREATE INDEX IF NOT EXISTS idx_appeals_status ON public.appeals(status);

-- =====================================================
-- 7. PLATFORM SETTINGS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.platform_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  category TEXT, -- features, api, email, moderation, security
  updated_by UUID REFERENCES auth.users(id),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_settings_category ON public.platform_settings(category);

-- Insert default settings
INSERT INTO public.platform_settings (key, value, description, category) VALUES
  ('features.channels_enabled', 'true', 'Enable/disable channels feature', 'features'),
  ('features.social_feed_enabled', 'true', 'Enable/disable social feed', 'features'),
  ('features.maintenance_mode', 'false', 'Maintenance mode', 'features'),
  ('features.new_user_registration', 'true', 'Allow new user registration', 'features'),
  ('moderation.auto_flag_threshold', '0.85', 'AI toxicity score threshold for auto-flagging', 'moderation'),
  ('moderation.auto_hide_threshold', '0.90', 'AI toxicity score threshold for auto-hiding', 'moderation'),
  ('moderation.max_reports_before_hide', '5', 'Number of reports before auto-hiding content', 'moderation'),
  ('moderation.appeal_review_days', '7', 'Days to review appeals', 'moderation'),
  ('rate_limits.reviews_per_hour', '10', 'Max reviews per hour per user', 'security'),
  ('rate_limits.comments_per_hour', '50', 'Max comments per hour per user', 'security'),
  ('rate_limits.votes_per_hour', '100', 'Max votes per hour per user', 'security')
ON CONFLICT (key) DO NOTHING;

-- =====================================================
-- 8. FEATURED CONTENT
-- =====================================================

CREATE TABLE IF NOT EXISTS public.featured_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content_type TEXT NOT NULL CHECK (content_type IN ('movie', 'channel', 'user', 'review')),
  content_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  display_order INTEGER DEFAULT 0,
  start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  end_date TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_featured_content_type ON public.featured_content(content_type);
CREATE INDEX IF NOT EXISTS idx_featured_content_active ON public.featured_content(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_featured_content_dates ON public.featured_content(start_date, end_date);

-- =====================================================
-- 9. MODERATION NOTES
-- =====================================================

CREATE TABLE IF NOT EXISTS public.moderation_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  target_type TEXT NOT NULL, -- user, content
  target_id TEXT NOT NULL,
  note TEXT NOT NULL,
  moderator_id UUID NOT NULL REFERENCES auth.users(id),
  severity TEXT CHECK (severity IN ('info', 'warning', 'critical')),
  is_internal BOOLEAN DEFAULT TRUE, -- Only visible to moderators/admins
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_notes_target ON public.moderation_notes(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_moderation_notes_moderator ON public.moderation_notes(moderator_id);

-- =====================================================
-- 10. ANNOUNCEMENTS
-- =====================================================

CREATE TABLE IF NOT EXISTS public.announcements (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  severity TEXT DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  target_audience TEXT[] DEFAULT ARRAY['all'], -- ['all', 'users', 'moderators', 'admins']
  display_location TEXT[] DEFAULT ARRAY['banner'], -- ['banner', 'modal', 'email']
  is_active BOOLEAN DEFAULT TRUE,
  scheduled_for TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_at TIMESTAMP WITH TIME ZONE,
  stats JSONB DEFAULT '{"views": 0, "clicks": 0, "dismissals": 0}'
);

CREATE INDEX IF NOT EXISTS idx_announcements_active ON public.announcements(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_announcements_scheduled ON public.announcements(scheduled_for);

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.featured_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

-- User Roles Policies
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
CREATE POLICY "Admins can manage roles" ON public.user_roles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Admin Logs Policies
DROP POLICY IF EXISTS "Admins can view logs" ON public.admin_logs;
CREATE POLICY "Admins can view logs" ON public.admin_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can create logs" ON public.admin_logs;
CREATE POLICY "Admins can create logs" ON public.admin_logs
  FOR INSERT WITH CHECK (
    admin_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin', 'super_admin')
    )
  );

-- Bans Policies
DROP POLICY IF EXISTS "Admins can view bans" ON public.bans;
CREATE POLICY "Admins can view bans" ON public.bans
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can manage bans" ON public.bans;
CREATE POLICY "Admins can manage bans" ON public.bans
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Reports Policies
DROP POLICY IF EXISTS "Users can create reports" ON public.reports;
CREATE POLICY "Users can create reports" ON public.reports
  FOR INSERT WITH CHECK (reporter_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own reports" ON public.reports;
CREATE POLICY "Users can view own reports" ON public.reports
  FOR SELECT USING (
    reporter_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Moderators can update reports" ON public.reports;
CREATE POLICY "Moderators can update reports" ON public.reports
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin', 'super_admin')
    )
  );

-- Flags Policies
DROP POLICY IF EXISTS "System can create flags" ON public.flags;
CREATE POLICY "System can create flags" ON public.flags
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Moderators can view flags" ON public.flags;
CREATE POLICY "Moderators can view flags" ON public.flags
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Moderators can update flags" ON public.flags;
CREATE POLICY "Moderators can update flags" ON public.flags
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin', 'super_admin')
    )
  );

-- Appeals Policies
DROP POLICY IF EXISTS "Users can create appeals" ON public.appeals;
CREATE POLICY "Users can create appeals" ON public.appeals
  FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view own appeals" ON public.appeals;
CREATE POLICY "Users can view own appeals" ON public.appeals
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update appeals" ON public.appeals;
CREATE POLICY "Admins can update appeals" ON public.appeals
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Platform Settings Policies
DROP POLICY IF EXISTS "Admins can view settings" ON public.platform_settings;
CREATE POLICY "Admins can view settings" ON public.platform_settings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Admins can update settings" ON public.platform_settings;
CREATE POLICY "Admins can update settings" ON public.platform_settings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Featured Content Policies
DROP POLICY IF EXISTS "Anyone can view featured content" ON public.featured_content;
CREATE POLICY "Anyone can view featured content" ON public.featured_content
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage featured content" ON public.featured_content;
CREATE POLICY "Admins can manage featured content" ON public.featured_content
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- Moderation Notes Policies
DROP POLICY IF EXISTS "Moderators can manage notes" ON public.moderation_notes;
CREATE POLICY "Moderators can manage notes" ON public.moderation_notes
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('moderator', 'admin', 'super_admin')
    )
  );

-- Announcements Policies
DROP POLICY IF EXISTS "Users can view active announcements" ON public.announcements;
CREATE POLICY "Users can view active announcements" ON public.announcements
  FOR SELECT USING (is_active = TRUE);

DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid()
      AND role IN ('admin', 'super_admin')
    )
  );

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to check if user is banned
CREATE OR REPLACE FUNCTION public.is_user_banned(check_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.bans
    WHERE user_id = check_user_id
    AND is_active = TRUE
    AND (banned_until IS NULL OR banned_until > NOW())
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(check_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.user_roles
  WHERE user_id = check_user_id
  ORDER BY
    CASE role
      WHEN 'super_admin' THEN 1
      WHEN 'admin' THEN 2
      WHEN 'moderator' THEN 3
      ELSE 4
    END
  LIMIT 1;
  
  RETURN COALESCE(user_role, 'user');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has permission
CREATE OR REPLACE FUNCTION public.has_permission(check_user_id UUID, required_role TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  user_role TEXT;
BEGIN
  user_role := public.get_user_role(check_user_id);
  
  RETURN CASE required_role
    WHEN 'super_admin' THEN user_role = 'super_admin'
    WHEN 'admin' THEN user_role IN ('super_admin', 'admin')
    WHEN 'moderator' THEN user_role IN ('super_admin', 'admin', 'moderator')
    ELSE TRUE
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to auto-expire bans
CREATE OR REPLACE FUNCTION public.expire_bans()
RETURNS void AS $$
BEGIN
  UPDATE public.bans
  SET is_active = FALSE
  WHERE is_active = TRUE
  AND banned_until IS NOT NULL
  AND banned_until <= NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to expire bans (if pg_cron is available)
-- SELECT cron.schedule('expire-bans', '*/5 * * * *', 'SELECT public.expire_bans()');

COMMENT ON TABLE public.user_roles IS 'User role assignments for access control';
COMMENT ON TABLE public.admin_logs IS 'Audit log of all admin and moderator actions';
COMMENT ON TABLE public.bans IS 'User bans with types and durations';
COMMENT ON TABLE public.reports IS 'User-submitted content reports';
COMMENT ON TABLE public.flags IS 'AI and manual content flags for moderation';
COMMENT ON TABLE public.appeals IS 'User appeals for bans';
COMMENT ON TABLE public.platform_settings IS 'Platform-wide configuration settings';
COMMENT ON TABLE public.featured_content IS 'Featured movies, channels, and users';
COMMENT ON TABLE public.moderation_notes IS 'Internal moderator notes on users/content';
COMMENT ON TABLE public.announcements IS 'Platform-wide announcements';
