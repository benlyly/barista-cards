ALTER TABLE public.masters ADD COLUMN is_demo boolean NOT NULL DEFAULT false;
UPDATE public.masters SET is_demo = true WHERE id IN (
  'a0000000-0000-4000-8000-000000000001','a0000000-0000-4000-8000-000000000002','a0000000-0000-4000-8000-000000000003',
  'a0000000-0000-4000-8000-000000000004','a0000000-0000-4000-8000-000000000005','a0000000-0000-4000-8000-000000000006'
);

-- Real users can never mark their own card as demo
CREATE OR REPLACE FUNCTION public.protect_master_is_demo()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.is_demo := false;
  ELSE
    NEW.is_demo := OLD.is_demo;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER masters_protect_is_demo BEFORE INSERT OR UPDATE ON public.masters
FOR EACH ROW EXECUTE FUNCTION public.protect_master_is_demo();

-- App settings (admin-controlled)
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.app_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.app_settings TO authenticated;
GRANT ALL ON public.app_settings TO service_role;
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Settings are public" ON public.app_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
INSERT INTO public.app_settings (key, value) VALUES ('show_demo', 'true'::jsonb);

CREATE OR REPLACE FUNCTION public.demo_visible()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE((SELECT (value)::text = 'true' FROM public.app_settings WHERE key = 'show_demo'), true)
$$;

DROP POLICY "Masters are public" ON public.masters;
CREATE POLICY "Masters are public" ON public.masters FOR SELECT TO anon, authenticated
  USING (NOT is_demo OR public.demo_visible() OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins delete demo masters" ON public.masters FOR DELETE TO authenticated
  USING (is_demo AND public.has_role(auth.uid(), 'admin'));
