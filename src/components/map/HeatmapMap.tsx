import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapContainer, TileLayer } from 'react-leaflet';
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3';
import * as React from 'react';
import 'leaflet/dist/leaflet.css';

interface SpeciesInfo {
  common_name?: string;
  scientific_name?: string;
}

interface FishCatchLike {
  latitude?: number;
  longitude?: number;
  weight_kg?: number;
  quantity?: number;
  species?: SpeciesInfo;
}

interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

interface HeatmapMapProps {
  initialData?: FishCatchLike[];
  className?: string;
}

function nameFromSpecies(s?: SpeciesInfo, fallback?: any): string {
  if (!s) return String(fallback ?? '') || '';
  return s.common_name || s.scientific_name || String(fallback ?? '') || '';
}

export const HeatmapMap: FC<HeatmapMapProps> = ({ initialData = [], className }) => {
  const [uploadedRows, setUploadedRows] = useState<any[] | null>(null);
  const [selectedSpecies, setSelectedSpecies] = useState<string>('all');

  // keep uploaded data in sync with UploadView (localStorage)
  useEffect(() => {
    function readUploaded() {
      try {
        const raw = localStorage.getItem('uploaded_fish_catches');
        if (!raw) { setUploadedRows(null); return; }
        const parsed = JSON.parse(raw);
        setUploadedRows(Array.isArray(parsed) ? parsed : null);
      } catch (e) { setUploadedRows(null); }
    }
    readUploaded();
    window.addEventListener('uploaded-data-changed', readUploaded);
    window.addEventListener('storage', readUploaded);
    return () => {
      window.removeEventListener('uploaded-data-changed', readUploaded);
      window.removeEventListener('storage', readUploaded);
    };
  }, []);

  // Normalize incoming data (from CSV, uploaded data, or initialData) into a common shape for aggregation
  const rows = useMemo(() => {
    const source = uploadedRows ?? initialData ?? [];
    return source
      .map((r: any) => {
        const lat = r.latitude ?? r.lat ?? r.Latitude ?? r.Lat ?? r.LATITUDE;
        const lon = r.longitude ?? r.lng ?? r.lon ?? r.long ?? r.Longitude ?? r.Lon ?? r.LONGITUDE;
        const w = r.weight_kg ?? r.weight ?? r.Weight ?? r.WEIGHT ?? r.total_weight ?? r.TotalWeight;
        const q = r.quantity ?? r.qty ?? r.Quantity ?? r.QTY;
        const species = r.species || undefined;
        const speciesName = typeof r.species === 'string'
          ? String(r.species)
          : (r.species_common_name || r.species_scientific_name || nameFromSpecies(species, r.species_name || r.Species || r.SPECIES));

        const latNum = Number(lat);
        const lonNum = Number(lon);
        const weightNum = w !== undefined && w !== '' ? Number(w) : undefined;
        const qtyNum = q !== undefined && q !== '' ? Number(q) : undefined;

        if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null;

        return {
          lat: latNum,
          lng: lonNum,
          weight: Number.isFinite(weightNum as number) ? (weightNum as number) : undefined,
          quantity: Number.isFinite(qtyNum as number) ? (qtyNum as number) : undefined,
          speciesName: speciesName ? String(speciesName) : '',
        };
      })
      .filter(Boolean) as Array<{ lat: number; lng: number; weight?: number; quantity?: number; speciesName: string }>; 
  }, [uploadedRows, initialData]);

  const [showHeat, setShowHeat] = useState(true);

  const speciesOptions = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => { if (r.speciesName) set.add(r.speciesName); });
    return Array.from(set).sort();
  }, [rows]);

  const aggregatedPoints = useMemo<HeatmapPoint[]>(() => {
    const map = new Map<string, { lat: number; lng: number; value: number }>();

    const filtered = selectedSpecies === 'all' ? rows : rows.filter(r => r.speciesName === selectedSpecies);

    for (const r of filtered) {
      const latKey = Number(r.lat).toFixed(4);
      const lngKey = Number(r.lng).toFixed(4);
      const key = `${latKey},${lngKey}`;
      const base = map.get(key) || { lat: Number(latKey), lng: Number(lngKey), value: 0 };
      const contribution = (r.weight ?? r.quantity ?? 1);
      base.value += contribution;
      map.set(key, base);
    }

    const arr = Array.from(map.values());
    const maxValue = arr.reduce((m, p) => Math.max(m, p.value), 0);

    return arr.map(p => ({ lat: p.lat, lng: p.lng, intensity: maxValue > 0 ? p.value / maxValue : 0 }));
  }, [rows, selectedSpecies]);


  const indiaCenter: [number, number] = [20.5937, 78.9629];

  return (
    <Card className="bg-card border shadow-ocean">
      <CardHeader>
        <CardTitle className="text-foreground">Density Heatmap</CardTitle>
      </CardHeader>
      <CardContent>

        <div className={`relative w-full h-[500px] ${className || ''}`}>
          <MapContainer center={indiaCenter} zoom={5} style={{ height: '100%', width: '100%' }} scrollWheelZoom={true} zoomControl={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            { showHeat && aggregatedPoints.length > 0 && (
              <HeatmapLayer
                fitBoundsOnLoad
                fitBoundsOnUpdate
                points={aggregatedPoints}
                longitudeExtractor={(p: HeatmapPoint) => p.lng}
                latitudeExtractor={(p: HeatmapPoint) => p.lat}
                intensityExtractor={(p: HeatmapPoint) => p.intensity}
                radius={25}
                blur={20}
                max={1}
              />
            )}
          </MapContainer>

          <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 flex flex-col gap-2 items-stretch shadow-data" style={{ zIndex: 1000, pointerEvents: 'auto' }}>
              <div className="min-w-[180px]">
              <Select value={selectedSpecies} onValueChange={(v) => setSelectedSpecies(v)}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="All species" />
                </SelectTrigger>
                <SelectContent disablePortal>
                  <SelectItem value="all">All species</SelectItem>
                  {speciesOptions.map(s => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowHeat(s => !s)}>{showHeat ? 'Hide Heatmap' : 'Show Heatmap'}</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
