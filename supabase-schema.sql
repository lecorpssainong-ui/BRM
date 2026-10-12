-- ==============================================================================
-- BÉNIN RÉFLEXOLOGIE MASSAGE (RBM) — SCHÉMA SUPABASE OFFICIEL (V2.0)
-- À exécuter dans le SQL Editor de votre nouveau projet Supabase
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. SUPPRESSION PROPRE SI EXISTANT (POUR REPARTIR D'UNE BASE VIERGE)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.is_staff(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.is_moderator(uuid) CASCADE;

DROP TABLE IF EXISTS public.health_reports CASCADE;
DROP TABLE IF EXISTS public.anamneses CASCADE;
DROP TABLE IF EXISTS public.invoices CASCADE;
DROP TABLE IF EXISTS public.products CASCADE;
DROP TABLE IF EXISTS public.services CASCADE;
DROP TABLE IF EXISTS public.chat_messages CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.appointments CASCADE;
DROP TABLE IF EXISTS public.media CASCADE;
DROP TABLE IF EXISTS public.app_settings CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- ==============================================================================
-- 3. TABLE PROFILES
-- ==============================================================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE,
  nom TEXT,
  prenoms TEXT,
  full_name TEXT,
  telephone TEXT UNIQUE,
  role TEXT NOT NULL DEFAULT 'client' CHECK (role IN ('client', 'secretary', 'moderator')),
  avatar_url TEXT,
  language TEXT NOT NULL DEFAULT 'fr' CHECK (language IN ('fr', 'en', 'hi', 'es', 'ar')),
  theme TEXT NOT NULL DEFAULT 'cacao' CHECK (theme IN ('cacao', 'sauge', 'argile', 'or')),
  liked_massages JSONB NOT NULL DEFAULT '[]'::jsonb,
  liked_videos JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_profiles_role ON public.profiles(role);
CREATE INDEX idx_profiles_telephone ON public.profiles(telephone);
CREATE INDEX idx_profiles_email ON public.profiles(email);

-- ==============================================================================
-- 4. FONCTIONS DE SÉCURITÉ POUR CONTRÔLE D'ACCÈS (RLS SANS RÉCURSION)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_staff(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role IN ('secretary', 'moderator')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_moderator(user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF user_id IS NULL THEN
    RETURN FALSE;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = user_id AND role = 'moderator'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==============================================================================
-- 5. POLICIES RLS — PROFILES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_policy"
  ON public.profiles FOR SELECT
  USING (
    auth.uid() = id OR public.is_staff(auth.uid())
  );

CREATE POLICY "profiles_update_policy"
  ON public.profiles FOR UPDATE
  USING (
    auth.uid() = id OR public.is_moderator(auth.uid())
  )
  WITH CHECK (
    auth.uid() = id OR public.is_moderator(auth.uid())
  );

CREATE POLICY "profiles_insert_policy"
  ON public.profiles FOR INSERT
  WITH CHECK (
    auth.uid() = id OR public.is_staff(auth.uid())
  );

CREATE POLICY "profiles_delete_policy"
  ON public.profiles FOR DELETE
  USING (
    public.is_moderator(auth.uid())
  );

-- ==============================================================================
-- 6. TABLE APPOINTMENTS (RENDEZ-VOUS)
-- ==============================================================================
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  client_email TEXT,
  service_title TEXT NOT NULL,
  service_price NUMERIC NOT NULL DEFAULT 0,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'confirmed', 'completed', 'cancelled', 'refused')),
  payment_status TEXT NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'refunded', 'pending')),
  notes TEXT,
  pain_mapping JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX idx_appointments_status ON public.appointments(status);

ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "appointments_select_policy"
  ON public.appointments FOR SELECT
  USING (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  );

CREATE POLICY "appointments_insert_policy"
  ON public.appointments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR public.is_staff(auth.uid()) OR auth.uid() IS NULL
  );

CREATE POLICY "appointments_update_policy"
  ON public.appointments FOR UPDATE
  USING (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  );

CREATE POLICY "appointments_delete_policy"
  ON public.appointments FOR DELETE
  USING (
    public.is_staff(auth.uid())
  );

-- ==============================================================================
-- 7. TABLE ORDERS (COMMANDES BOUTIQUE)
-- ==============================================================================
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'momo_mtn',
  momo_transaction_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'delivered', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "orders_select_policy"
  ON public.orders FOR SELECT
  USING (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  );

CREATE POLICY "orders_insert_policy"
  ON public.orders FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR public.is_staff(auth.uid()) OR auth.uid() IS NULL
  );

CREATE POLICY "orders_update_policy"
  ON public.orders FOR UPDATE
  USING (
    public.is_staff(auth.uid())
  )
  WITH CHECK (
    public.is_staff(auth.uid())
  );

CREATE POLICY "orders_delete_policy"
  ON public.orders FOR DELETE
  USING (
    public.is_moderator(auth.uid())
  );

-- ==============================================================================
-- 8. TABLE CHAT_MESSAGES (MESSAGERIE CLIENT-SECRÉTARIAT)
-- ==============================================================================
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_key TEXT NOT NULL,
  sender TEXT NOT NULL CHECK (sender IN ('client', 'secretary', 'moderator', 'system')),
  sender_name TEXT NOT NULL,
  content TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_chat_messages_client_key ON public.chat_messages(client_key);
CREATE INDEX idx_chat_messages_created_at ON public.chat_messages(created_at);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages_select_policy"
  ON public.chat_messages FOR SELECT
  USING (
    public.is_staff(auth.uid()) OR client_key = auth.uid()::text OR client_key = (SELECT telephone FROM public.profiles WHERE id = auth.uid())
  );

CREATE POLICY "chat_messages_insert_policy"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    public.is_staff(auth.uid()) OR auth.uid() IS NOT NULL OR client_key IS NOT NULL
  );

CREATE POLICY "chat_messages_update_policy"
  ON public.chat_messages FOR UPDATE
  USING (
    public.is_staff(auth.uid()) OR client_key = auth.uid()::text
  );

-- ==============================================================================
-- 9. TABLE MEDIA (FLUX VIDÉO & MÉDIAS)
-- ==============================================================================
CREATE TABLE public.media (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  playlist TEXT,
  massage_name TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  comments_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "media_select_policy"
  ON public.media FOR SELECT
  USING (true);

CREATE POLICY "media_insert_policy"
  ON public.media FOR INSERT
  WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "media_update_policy"
  ON public.media FOR UPDATE
  USING (public.is_staff(auth.uid()) OR auth.uid() IS NOT NULL)
  WITH CHECK (public.is_staff(auth.uid()) OR auth.uid() IS NOT NULL);

CREATE POLICY "media_delete_policy"
  ON public.media FOR DELETE
  USING (public.is_staff(auth.uid()));

-- ==============================================================================
-- 10. TABLE APP_SETTINGS (CONFIGURATION DU CENTRE)
-- ==============================================================================
CREATE TABLE public.app_settings (
  id UUID PRIMARY KEY DEFAULT 'a0000000-0000-0000-0000-000000000001'::uuid,
  header_title TEXT NOT NULL DEFAULT 'Bénin Réflexologie Massage',
  logo_url TEXT,
  app_logos JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_name TEXT NOT NULL DEFAULT 'Rébecca la lionne',
  ai_greeting TEXT DEFAULT 'Bonjour ! Je suis Rébecca la lionne, votre conseillère bien-être holistique. Comment puis-je vous accompagner aujourd''hui ?',
  is_locked BOOLEAN NOT NULL DEFAULT false,
  lock_message TEXT DEFAULT 'Le centre Bénin Réflexologie Massage effectue une mise à niveau technique temporaire.',
  center_phone TEXT NOT NULL DEFAULT '0191729117',
  center_momo_number TEXT NOT NULL DEFAULT '0191729117',
  center_momo_number_2 TEXT,
  center_address TEXT NOT NULL DEFAULT 'Rue 340, Haie Vive, Cotonou, Bénin',
  center_owner_name TEXT NOT NULL DEFAULT 'Fatoumbi Adedodja Rébecca',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "app_settings_select_policy"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "app_settings_modify_policy"
  ON public.app_settings FOR ALL
  USING (public.is_moderator(auth.uid()))
  WITH CHECK (public.is_moderator(auth.uid()));

-- Insertion de la configuration officielle par défaut
INSERT INTO public.app_settings (
  id,
  header_title,
  logo_url,
  app_logos,
  ai_name,
  ai_greeting,
  is_locked,
  lock_message,
  center_phone,
  center_momo_number,
  center_address,
  center_owner_name
) VALUES (
  'a0000000-0000-0000-0000-000000000001'::uuid,
  'Bénin Réflexologie Massage',
  '',
  '[]'::jsonb,
  'Rébecca la lionne',
  'Bonjour ! Je suis Rébecca la lionne, votre conseillère bien-être holistique. Comment puis-je vous accompagner aujourd''hui ?',
  false,
  'Le centre Bénin Réflexologie Massage effectue une mise à niveau technique temporaire.',
  '0191729117',
  '0191729117',
  'Rue 340, Haie Vive, Cotonou, Bénin',
  'Fatoumbi Adedodja Rébecca'
) ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- 11. TABLE SERVICES (CATALOGUE DES SOINS)
-- ==============================================================================
CREATE TABLE public.services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  duration TEXT,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "services_select_policy"
  ON public.services FOR SELECT
  USING (true);

CREATE POLICY "services_write_policy"
  ON public.services FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ==============================================================================
-- 12. TABLE PRODUCTS (BOUTIQUE BIEN-ÊTRE)
-- ==============================================================================
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  category TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "products_select_policy"
  ON public.products FOR SELECT
  USING (true);

CREATE POLICY "products_write_policy"
  ON public.products FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ==============================================================================
-- 13. TABLE INVOICES (FACTURES & REÇUS)
-- ==============================================================================
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  total_price NUMERIC NOT NULL DEFAULT 0,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_invoices_client_phone ON public.invoices(client_phone);

ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invoices_select_policy"
  ON public.invoices FOR SELECT
  USING (
    public.is_staff(auth.uid()) OR
    client_phone = (SELECT telephone FROM public.profiles WHERE id = auth.uid()) OR
    (order_id IS NOT NULL AND auth.uid() IN (SELECT user_id FROM public.orders WHERE id = invoices.order_id))
  );

CREATE POLICY "invoices_write_policy"
  ON public.invoices FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- ==============================================================================
-- 14. TABLE ANAMNESES (BILANS CLINIQUES DE VITALITÉ)
-- ==============================================================================
CREATE TABLE public.anamneses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pathology TEXT,
  questionnaire JSONB NOT NULL DEFAULT '[]'::jsonb,
  results JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_anamneses_user_id ON public.anamneses(user_id);

ALTER TABLE public.anamneses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anamneses_select_policy"
  ON public.anamneses FOR SELECT
  USING (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  );

CREATE POLICY "anamneses_insert_policy"
  ON public.anamneses FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR public.is_staff(auth.uid()) OR auth.uid() IS NULL
  );

CREATE POLICY "anamneses_update_policy"
  ON public.anamneses FOR UPDATE
  USING (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  );

CREATE POLICY "anamneses_delete_policy"
  ON public.anamneses FOR DELETE
  USING (
    public.is_staff(auth.uid())
  );

-- ==============================================================================
-- 15. TABLE HEALTH_REPORTS (ÉVALUATIONS DES OUTILS DE SANTÉ)
-- ==============================================================================
CREATE TABLE public.health_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  type TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_health_reports_user_id ON public.health_reports(user_id);

ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_reports_select_policy"
  ON public.health_reports FOR SELECT
  USING (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  );

CREATE POLICY "health_reports_insert_policy"
  ON public.health_reports FOR INSERT
  WITH CHECK (
    auth.uid() = user_id OR public.is_staff(auth.uid()) OR auth.uid() IS NULL
  );

CREATE POLICY "health_reports_update_policy"
  ON public.health_reports FOR UPDATE
  USING (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  )
  WITH CHECK (
    auth.uid() = user_id OR public.is_staff(auth.uid())
  );

CREATE POLICY "health_reports_delete_policy"
  ON public.health_reports FOR DELETE
  USING (
    public.is_staff(auth.uid())
  );

-- ==============================================================================
-- 16. TRIGGER AUTOMATIQUE : CRÉATION DE PROFIL (RÔLE 'CLIENT' POUR TOUS SANS EXCEPTION)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_full_name TEXT := '';
  v_phone TEXT := NULL;
BEGIN
  -- Extraction des métadonnées
  v_full_name := COALESCE(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    CONCAT(COALESCE(new.raw_user_meta_data->>'prenoms', ''), ' ', COALESCE(new.raw_user_meta_data->>'nom', ''))
  );
  v_full_name := TRIM(v_full_name);

  v_phone := COALESCE(
    new.raw_user_meta_data->>'telephone',
    new.raw_user_meta_data->>'phone',
    NULL
  );

  -- Règle stricte : TOUT nouvel utilisateur reçoit le rôle 'client' par défaut.
  -- L'attribution des rôles 'secretary' ou 'moderator' se fait manuellement.
  INSERT INTO public.profiles (
    id,
    email,
    nom,
    prenoms,
    full_name,
    telephone,
    role,
    avatar_url,
    language,
    theme,
    liked_massages,
    liked_videos
  )
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'nom', ''),
    COALESCE(new.raw_user_meta_data->>'prenoms', ''),
    v_full_name,
    v_phone,
    'client',
    COALESCE(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture', ''),
    'fr',
    'cacao',
    '[]'::jsonb,
    '[]'::jsonb
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    avatar_url = COALESCE(EXCLUDED.avatar_url, profiles.avatar_url),
    full_name = CASE WHEN profiles.full_name IS NULL OR profiles.full_name = '' THEN EXCLUDED.full_name ELSE profiles.full_name END,
    updated_at = timezone('utc'::text, now());

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ==============================================================================
-- 17. ACTIVATION DU TEMPS RÉEL (SUPABASE REALTIME)
-- ==============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.media;
ALTER PUBLICATION supabase_realtime ADD TABLE public.app_settings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.services;
ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
ALTER PUBLICATION supabase_realtime ADD TABLE public.invoices;
