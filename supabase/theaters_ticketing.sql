-- ============================================
-- Theater & Ticketing System
-- ============================================
-- Extends audience classification for theater booking
-- Uses TMDB release dates + custom theater data

-- ============================================
-- 1. Cities & Locations
-- ============================================
CREATE TABLE IF NOT EXISTS public.cities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'India',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  timezone TEXT DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert major Indian cities
INSERT INTO public.cities (name, state, country, latitude, longitude) VALUES
  ('Mumbai', 'Maharashtra', 'India', 19.0760, 72.8777),
  ('Delhi', 'Delhi', 'India', 28.7041, 77.1025),
  ('Bangalore', 'Karnataka', 'India', 12.9716, 77.5946),
  ('Hyderabad', 'Telangana', 'India', 17.3850, 78.4867),
  ('Chennai', 'Tamil Nadu', 'India', 13.0827, 80.2707),
  ('Kolkata', 'West Bengal', 'India', 22.5726, 88.3639),
  ('Pune', 'Maharashtra', 'India', 18.5204, 73.8567),
  ('Ahmedabad', 'Gujarat', 'India', 23.0225, 72.5714),
  ('New York', 'New York', 'USA', 40.7128, -74.0060),
  ('Los Angeles', 'California', 'USA', 34.0522, -118.2437),
  ('London', 'England', 'UK', 51.5074, -0.1278),
  ('Toronto', 'Ontario', 'Canada', 43.6532, -79.3832)
ON CONFLICT DO NOTHING;

-- ============================================
-- 2. Theater Chains
-- ============================================
CREATE TABLE IF NOT EXISTS public.theater_chains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  booking_url TEXT,
  country TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert major theater chains
INSERT INTO public.theater_chains (name, website_url, booking_url, country) VALUES
  ('PVR Cinemas', 'https://www.pvrcinemas.com', 'https://www.pvrcinemas.com/buy-tickets/', 'India'),
  ('INOX', 'https://www.inoxmovies.com', 'https://www.inoxmovies.com/buy-tickets', 'India'),
  ('Cinépolis', 'https://www.cinepolis.co.in', 'https://www.cinepolis.co.in/buy-tickets', 'India'),
  ('Carnival Cinemas', 'https://www.carnivalcinemas.com', 'https://www.carnivalcinemas.com/book-tickets', 'India'),
  ('AMC Theatres', 'https://www.amctheatres.com', 'https://www.amctheatres.com/movies', 'USA'),
  ('Regal Cinemas', 'https://www.regmovies.com', 'https://www.regmovies.com/', 'USA'),
  ('Cinemark', 'https://www.cinemark.com', 'https://www.cinemark.com/movies', 'USA')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- 3. Theaters
-- ============================================
CREATE TABLE IF NOT EXISTS public.theaters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain_id UUID REFERENCES public.theater_chains(id) ON DELETE CASCADE,
  city_id UUID NOT NULL REFERENCES public.cities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  audience_type TEXT NOT NULL CHECK (audience_type IN ('high_class', 'celebration', 'normal')),
  total_screens INTEGER DEFAULT 1,
  total_seats INTEGER DEFAULT 200,
  
  -- Amenities
  has_parking BOOLEAN DEFAULT TRUE,
  has_food_court BOOLEAN DEFAULT TRUE,
  has_wheelchair_access BOOLEAN DEFAULT TRUE,
  has_3d BOOLEAN DEFAULT FALSE,
  has_imax BOOLEAN DEFAULT FALSE,
  has_4dx BOOLEAN DEFAULT FALSE,
  has_dolby_atmos BOOLEAN DEFAULT FALSE,
  has_recliners BOOLEAN DEFAULT FALSE,
  
  -- Contact
  phone TEXT,
  email TEXT,
  booking_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_theaters_city ON public.theaters(city_id);
CREATE INDEX IF NOT EXISTS idx_theaters_audience_type ON public.theaters(audience_type);
CREATE INDEX IF NOT EXISTS idx_theaters_chain ON public.theaters(chain_id);
CREATE INDEX IF NOT EXISTS idx_theaters_location ON public.theaters(latitude, longitude);

-- ============================================
-- 4. Movie Releases (TMDB Integration)
-- ============================================
CREATE TABLE IF NOT EXISTS public.movie_releases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tmdb_id INTEGER NOT NULL,
  country TEXT NOT NULL,
  release_date DATE NOT NULL,
  release_type TEXT, -- premiere, theatrical, digital, etc.
  certification TEXT, -- U, UA, A, R, PG-13, etc.
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(tmdb_id, country, release_date)
);

CREATE INDEX IF NOT EXISTS idx_movie_releases_tmdb ON public.movie_releases(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_movie_releases_country ON public.movie_releases(country);
CREATE INDEX IF NOT EXISTS idx_movie_releases_date ON public.movie_releases(release_date);

-- ============================================
-- 5. Showtimes
-- ============================================
CREATE TABLE IF NOT EXISTS public.showtimes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  theater_id UUID NOT NULL REFERENCES public.theaters(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  screen_number INTEGER DEFAULT 1,
  show_date DATE NOT NULL,
  show_time TIME NOT NULL,
  language TEXT DEFAULT 'English',
  format TEXT DEFAULT '2D', -- 2D, 3D, IMAX, 4DX
  available_seats INTEGER DEFAULT 0,
  total_seats INTEGER NOT NULL DEFAULT 100,
  base_price DECIMAL(10, 2) NOT NULL,
  booking_url TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Note: final_price is calculated in application layer using:
-- base_price * audience_type.price_multiplier

CREATE INDEX IF NOT EXISTS idx_showtimes_theater ON public.showtimes(theater_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_movie ON public.showtimes(tmdb_id);
CREATE INDEX IF NOT EXISTS idx_showtimes_date ON public.showtimes(show_date);

-- ============================================
-- 6. User Bookings (Optional - for tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  showtime_id UUID NOT NULL REFERENCES public.showtimes(id) ON DELETE CASCADE,
  theater_id UUID NOT NULL REFERENCES public.theaters(id) ON DELETE CASCADE,
  tmdb_id INTEGER NOT NULL,
  num_seats INTEGER NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  booking_status TEXT DEFAULT 'pending' CHECK (booking_status IN ('pending', 'confirmed', 'cancelled')),
  external_booking_id TEXT, -- From theater website if available
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_user ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_showtime ON public.bookings(showtime_id);

-- ============================================
-- 7. RLS Policies
-- ============================================

-- Cities (Public Read)
ALTER TABLE public.cities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Cities are viewable by everyone" ON public.cities FOR SELECT USING (is_active = true);

-- Theater Chains (Public Read)
ALTER TABLE public.theater_chains ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Theater chains are viewable by everyone" ON public.theater_chains FOR SELECT USING (is_active = true);

-- Theaters (Public Read)
ALTER TABLE public.theaters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Theaters are viewable by everyone" ON public.theaters FOR SELECT USING (is_active = true);

-- Movie Releases (Public Read)
ALTER TABLE public.movie_releases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Movie releases are viewable by everyone" ON public.movie_releases FOR SELECT USING (is_active = true);

-- Showtimes (Public Read)
ALTER TABLE public.showtimes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Showtimes are viewable by everyone" ON public.showtimes FOR SELECT USING (is_active = true);

-- Bookings (Users manage their own)
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own bookings" ON public.bookings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================
-- 8. Helper Functions
-- ============================================

-- Get theaters by city and audience type
CREATE OR REPLACE FUNCTION get_theaters_by_city_and_type(
  p_city_id UUID,
  p_audience_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  theater_id UUID,
  theater_name TEXT,
  chain_name TEXT,
  address TEXT,
  audience_type TEXT,
  amenities JSONB,
  booking_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    tc.name,
    t.address,
    t.audience_type,
    jsonb_build_object(
      'parking', t.has_parking,
      'food_court', t.has_food_court,
      'wheelchair_access', t.has_wheelchair_access,
      '3d', t.has_3d,
      'imax', t.has_imax,
      '4dx', t.has_4dx,
      'dolby_atmos', t.has_dolby_atmos,
      'recliners', t.has_recliners
    ),
    t.booking_url
  FROM public.theaters t
  LEFT JOIN public.theater_chains tc ON t.chain_id = tc.id
  WHERE t.city_id = p_city_id
    AND t.is_active = true
    AND (p_audience_type IS NULL OR t.audience_type = p_audience_type)
  ORDER BY t.audience_type, t.name;
END;
$$ LANGUAGE plpgsql;

-- Get showtimes for a movie at a theater
CREATE OR REPLACE FUNCTION get_showtimes_for_movie(
  p_tmdb_id INTEGER,
  p_theater_id UUID,
  p_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
  showtime_id UUID,
  show_time TIME,
  language TEXT,
  format TEXT,
  available_seats INTEGER,
  base_price DECIMAL,
  final_price DECIMAL,
  booking_url TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.show_time,
    s.language,
    s.format,
    s.available_seats,
    s.base_price,
    s.base_price * at.price_multiplier,
    s.booking_url
  FROM public.showtimes s
  JOIN public.theaters t ON s.theater_id = t.id
  JOIN public.audience_types at ON t.audience_type = at.name
  WHERE s.tmdb_id = p_tmdb_id
    AND s.theater_id = p_theater_id
    AND s.show_date = p_date
    AND s.is_active = true
  ORDER BY s.show_time;
END;
$$ LANGUAGE plpgsql;

-- Search nearby theaters
CREATE OR REPLACE FUNCTION search_nearby_theaters(
  p_latitude DECIMAL,
  p_longitude DECIMAL,
  p_radius_km INTEGER DEFAULT 10,
  p_audience_type TEXT DEFAULT NULL
)
RETURNS TABLE (
  theater_id UUID,
  theater_name TEXT,
  distance_km DECIMAL,
  audience_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id,
    t.name,
    (
      6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(t.latitude)) * 
        cos(radians(t.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(t.latitude))
      )
    )::DECIMAL(10, 2) AS distance,
    t.audience_type
  FROM public.theaters t
  WHERE t.is_active = true
    AND (p_audience_type IS NULL OR t.audience_type = p_audience_type)
    AND (
      6371 * acos(
        cos(radians(p_latitude)) * 
        cos(radians(t.latitude)) * 
        cos(radians(t.longitude) - radians(p_longitude)) + 
        sin(radians(p_latitude)) * 
        sin(radians(t.latitude))
      )
    ) <= p_radius_km
  ORDER BY distance;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 9. Sample Theater Data
-- ============================================

-- Insert sample theaters in Mumbai (High Class)
INSERT INTO public.theaters (chain_id, city_id, name, address, latitude, longitude, audience_type, has_imax, has_dolby_atmos, has_recliners, booking_url) VALUES
(
  (SELECT id FROM public.theater_chains WHERE name = 'PVR Cinemas' LIMIT 1),
  (SELECT id FROM public.cities WHERE name = 'Mumbai' LIMIT 1),
  'PVR Director''s Cut - Vasant Kunj',
  'Ambience Mall, Vasant Kunj, Delhi',
  28.5244, 77.1566,
  'high_class',
  true, true, true,
  'https://www.pvrcinemas.com/cinema/pvr-directors-cut-vasant-kunj-delhi'
),
(
  (SELECT id FROM public.theater_chains WHERE name = 'INOX' LIMIT 1),
  (SELECT id FROM public.cities WHERE name = 'Mumbai' LIMIT 1),
  'INOX Insignia - Mumbai',
  'Atria Mall, Worli, Mumbai',
  19.0176, 72.8174,
  'high_class',
  false, true, true,
  'https://www.inoxmovies.com/cinema/inox-insignia-mumbai'
);

-- Insert sample theaters (Celebration)
INSERT INTO public.theaters (chain_id, city_id, name, address, latitude, longitude, audience_type, has_food_court, booking_url) VALUES
(
  (SELECT id FROM public.theater_chains WHERE name = 'Cinépolis' LIMIT 1),
  (SELECT id FROM public.cities WHERE name = 'Bangalore' LIMIT 1),
  'Cinépolis Fun - Bangalore',
  'Forum Mall, Koramangala, Bangalore',
  12.9352, 77.6101,
  'celebration',
  true,
  'https://www.cinepolis.co.in'
);

-- Insert sample theaters (Normal)
INSERT INTO public.theaters (chain_id, city_id, name, address, latitude, longitude, audience_type, has_3d, booking_url) VALUES
(
  (SELECT id FROM public.theater_chains WHERE name = 'PVR Cinemas' LIMIT 1),
  (SELECT id FROM public.cities WHERE name = 'Delhi' LIMIT 1),
  'PVR Priya - Vasant Vihar',
  'Priya Complex, Vasant Vihar, Delhi',
  28.5672, 77.1585,
  'normal',
  true,
  'https://www.pvrcinemas.com/cinema/pvr-priya-vasant-vihar-delhi'
);

COMMENT ON TABLE public.theaters IS 'Theater venues with audience classification';
COMMENT ON TABLE public.showtimes IS 'Movie showtimes with dynamic pricing';
COMMENT ON TABLE public.bookings IS 'User ticket bookings (tracking only)';
