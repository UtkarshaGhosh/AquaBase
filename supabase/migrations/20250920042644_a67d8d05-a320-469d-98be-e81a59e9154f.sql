-- Create fish catch database schema for AquaBase

-- Species reference table
CREATE TABLE public.species (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  scientific_name TEXT NOT NULL UNIQUE,
  common_name TEXT,
  family TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Main fish catches table
CREATE TABLE public.fish_catches (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  species_id UUID REFERENCES public.species(id) NOT NULL,
  latitude DECIMAL(10, 8) NOT NULL,
  longitude DECIMAL(11, 8) NOT NULL,
  catch_date DATE NOT NULL,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  weight_kg DECIMAL(8, 3),
  depth_m INTEGER,
  water_temperature DECIMAL(4, 2),
  fishing_method TEXT,
  vessel_name TEXT,
  notes TEXT,
  data_source TEXT,
  quality_score INTEGER DEFAULT 100 CHECK (quality_score >= 0 AND quality_score <= 100),
  is_anomaly BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Upload tracking table
CREATE TABLE public.data_uploads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  filename TEXT NOT NULL,
  upload_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  records_count INTEGER NOT NULL DEFAULT 0,
  records_processed INTEGER NOT NULL DEFAULT 0,
  records_errors INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  error_details JSONB,
  uploaded_by TEXT
);

-- Enable Row Level Security
ALTER TABLE public.species ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fish_catches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.data_uploads ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access (research data should be accessible)
CREATE POLICY "Anyone can view species data" 
ON public.species 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view fish catch data" 
ON public.fish_catches 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can view upload status" 
ON public.data_uploads 
FOR SELECT 
USING (true);

-- Admin policies for data management (will be restricted to authenticated admins later)
CREATE POLICY "Authenticated users can manage species" 
ON public.species 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage fish catches" 
ON public.fish_catches 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Authenticated users can manage uploads" 
ON public.data_uploads 
FOR ALL 
TO authenticated
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_fish_catches_species ON public.fish_catches(species_id);
CREATE INDEX idx_fish_catches_date ON public.fish_catches(catch_date);
CREATE INDEX idx_fish_catches_location ON public.fish_catches(latitude, longitude);
CREATE INDEX idx_fish_catches_quality ON public.fish_catches(quality_score);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_fish_catches_updated_at
BEFORE UPDATE ON public.fish_catches
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert some sample species data
INSERT INTO public.species (scientific_name, common_name, family) VALUES
('Gadus morhua', 'Atlantic Cod', 'Gadidae'),
('Thunnus albacares', 'Yellowfin Tuna', 'Scombridae'),
('Scomber scombrus', 'Atlantic Mackerel', 'Scombridae'),
('Pleuronectes platessa', 'European Plaice', 'Pleuronectidae'),
('Salmo salar', 'Atlantic Salmon', 'Salmonidae'),
('Merluccius merluccius', 'European Hake', 'Merlucciidae'),
('Sardina pilchardus', 'European Sardine', 'Clupeidae'),
('Clupea harengus', 'Atlantic Herring', 'Clupeidae');

-- Insert sample fish catch data for demonstration
INSERT INTO public.fish_catches (species_id, latitude, longitude, catch_date, quantity, weight_kg, depth_m, water_temperature, fishing_method, vessel_name, data_source)
SELECT 
  s.id,
  CASE 
    WHEN s.scientific_name = 'Gadus morhua' THEN 60.5 + (random() * 10 - 5)
    WHEN s.scientific_name = 'Thunnus albacares' THEN 25.0 + (random() * 20 - 10)
    ELSE 45.0 + (random() * 20 - 10)
  END as latitude,
  CASE 
    WHEN s.scientific_name = 'Gadus morhua' THEN -5.0 + (random() * 10 - 5)
    WHEN s.scientific_name = 'Thunnus albacares' THEN -40.0 + (random() * 40 - 20)
    ELSE -10.0 + (random() * 30 - 15)
  END as longitude,
  DATE '2024-01-01' + (random() * 270)::integer as catch_date,
  (random() * 100 + 1)::integer as quantity,
  (random() * 50 + 0.5)::decimal(8,3) as weight_kg,
  (random() * 200 + 10)::integer as depth_m,
  (random() * 20 + 5)::decimal(4,2) as water_temperature,
  CASE (random() * 4)::integer 
    WHEN 0 THEN 'Trawling'
    WHEN 1 THEN 'Longlining'
    WHEN 2 THEN 'Net fishing'
    ELSE 'Rod and reel'
  END as fishing_method,
  'Research Vessel ' || (random() * 10 + 1)::integer as vessel_name,
  'Sample Dataset v1.0'
FROM public.species s
CROSS JOIN generate_series(1, 25) i;