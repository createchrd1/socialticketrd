CREATE TABLE public.ad_campaigns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL,
  name text NOT NULL,
  objective text NOT NULL DEFAULT 'mensajes',
  status text NOT NULL DEFAULT 'activa',
  daily_budget numeric NOT NULL DEFAULT 0,
  spend numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  results integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  started_on date NOT NULL DEFAULT current_date,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaigns TO anon, authenticated;
GRANT ALL ON public.ad_campaigns TO service_role;

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo abierta ad_campaigns" ON public.ad_campaigns FOR ALL USING (true) WITH CHECK (true);

CREATE TRIGGER ad_campaigns_updated_at
BEFORE UPDATE ON public.ad_campaigns
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.ad_daily_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id uuid NOT NULL REFERENCES public.ad_campaigns(id) ON DELETE CASCADE,
  day date NOT NULL,
  spend numeric NOT NULL DEFAULT 0,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  results integer NOT NULL DEFAULT 0,
  revenue numeric NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (campaign_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_daily_stats TO anon, authenticated;
GRANT ALL ON public.ad_daily_stats TO service_role;

ALTER TABLE public.ad_daily_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Demo abierta ad_daily_stats" ON public.ad_daily_stats FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX ad_daily_stats_campaign_day_idx ON public.ad_daily_stats (campaign_id, day);

ALTER TABLE public.conversations ADD COLUMN campaign_id uuid REFERENCES public.ad_campaigns(id) ON DELETE SET NULL;