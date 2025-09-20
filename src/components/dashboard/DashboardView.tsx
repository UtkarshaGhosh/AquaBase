import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from './FilterPanel';
import { StatsCards } from './StatsCards';
import SpeciesBarChart from '@/components/charts/SpeciesBarChart';
import CatchTrendLineChart from '@/components/charts/CatchTrendLineChart';
import AbundanceChart from '@/components/charts/AbundanceChart';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

interface Filters {
  species?: string;
  dateFrom?: Date;
  dateTo?: Date;
  fishingMethod?: string;
  location?: string;
  bounds?: { north: number; south: number; east: number; west: number };
}

export const DashboardView = () => {
  const [filters, setFilters] = useState<Filters>({});
  const [tempFilters, setTempFilters] = useState<Filters>(filters);
  const { toast } = useToast();
  const [exporting, setExporting] = useState(false);
  const isUUID = (s?: string) => !!s && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);

  // keep tempFilters synced when filters applied externally
  useEffect(() => {
    setTempFilters(filters);
  }, [filters]);

  // Fetch species for filter dropdown
  const { data: species = [] } = useQuery({
    queryKey: ['species'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('species')
        .select('id, common_name, scientific_name')
        .order('common_name');
      
      if (error) throw error;
      return data;
    }
  });

  // Fetch fish catch data with filters
  const { data: fishCatches = [], isLoading, error } = useQuery({
    queryKey: ['fish-catches', filters],
    queryFn: async () => {
      let query = supabase
        .from('fish_catches')
        .select(`
          id,
          latitude,
          longitude,
          catch_date,
          quantity,
          weight_kg,
          fishing_method,
          quality_score,
          is_anomaly,
          species:species_id (
            id,
            common_name,
            scientific_name
          )
        `)
        .order('catch_date', { ascending: false });

      // Apply filters
      if (filters.species && isUUID(filters.species)) {
        query = query.eq('species_id', filters.species);
      }
      
      if (filters.dateFrom) {
        query = query.gte('catch_date', format(filters.dateFrom, 'yyyy-MM-dd'));
      }
      
      if (filters.dateTo) {
        query = query.lte('catch_date', format(filters.dateTo, 'yyyy-MM-dd'));
      }
      
      if (filters.fishingMethod) {
        query = query.eq('fishing_method', filters.fishingMethod);
      }

      if (filters.bounds) {
        query = query
          .gte('latitude', filters.bounds.south)
          .lte('latitude', filters.bounds.north)
          .gte('longitude', filters.bounds.west)
          .lte('longitude', filters.bounds.east);
      }

      const { data, error } = await query.limit(500); // Limit for performance
      
      if (error) throw error;
      return data || [];
    }
  });

  // Read any uploaded records from localStorage; listen for changes so dashboard updates in real-time
  const [uploadedRecords, setUploadedRecords] = React.useState<any[]>(() => {
    try {
      if (typeof window === 'undefined') return [];
      const raw = localStorage.getItem('uploaded_fish_catches');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  });

  React.useEffect(() => {
    function handler() {
      try {
        const raw = localStorage.getItem('uploaded_fish_catches');
        if (!raw) {
          setUploadedRecords([]);
          return;
        }
        const parsed = JSON.parse(raw);
        setUploadedRecords(Array.isArray(parsed) ? parsed : []);
      } catch (e) {
        setUploadedRecords([]);
      }
    }

    window.addEventListener('uploaded-data-changed', handler);
    window.addEventListener('storage', handler);
    return () => {
      window.removeEventListener('uploaded-data-changed', handler);
      window.removeEventListener('storage', handler);
    };
  }, []);

  // If uploaded records exist, use them instead of backend data (replace, not merge)
  const combinedData = React.useMemo(() => {
    if (uploadedRecords && uploadedRecords.length > 0) return uploadedRecords;
    return fishCatches || [];
  }, [fishCatches, uploadedRecords]);

  // derive species options and location buckets from combined data
  const speciesForFilter = React.useMemo(() => {
    if (uploadedRecords && uploadedRecords.length > 0) {
      const set = new Map<string, { id: string; common_name: string; scientific_name: string }>();
      uploadedRecords.forEach((r: any) => {
        const common = r.species?.common_name || r.species?.scientific_name || 'Unknown';
        const scientific = r.species?.scientific_name || '';
        if (!set.has(common)) set.set(common, { id: common, common_name: common, scientific_name: scientific });
      });
      return Array.from(set.values());
    }
    return species;
  }, [uploadedRecords, species]);

  // Build location list and resolve area names via reverse geocoding (cached)
  const [locationOptions, setLocationOptions] = React.useState<Array<{ id: string; label: string; lat?: number; lon?: number }>>([]);

  React.useEffect(() => {
    const map = new Map<string, { id: string; label: string; lat: number; lon: number }>();
    combinedData.forEach((r: any) => {
      if (r.latitude === undefined || r.longitude === undefined) return;
      const lat = Number(r.latitude);
      const lon = Number(r.longitude);
      if (Number.isNaN(lat) || Number.isNaN(lon)) return;
      const latR = lat.toFixed(2);
      const lonR = lon.toFixed(2);
      const id = `${latR},${lonR}`;
      const label = `${latR}, ${lonR}`;
      if (!map.has(id)) map.set(id, { id, label, lat, lon });
    });

    const entries = Array.from(map.values());
    setLocationOptions(entries.map(e => ({ id: e.id, label: e.label, lat: e.lat, lon: e.lon })));

    // resolve area names async
    let mounted = true;
    (async () => {
      try {
        const { getAreaName } = await import('@/lib/geocode');
        for (const e of entries) {
          try {
            const area = await getAreaName(e.lat, e.lon);
            if (!mounted) return;
            setLocationOptions(prev => prev.map(p => p.id === e.id ? { ...p, label: area, lat: p.lat, lon: p.lon } : p));
            // small delay to be polite to Nominatim
            await new Promise(r => setTimeout(r, 200));
          } catch (err) {
            // ignore per-entry
          }
        }
      } catch (err) {
        // ignore
      }
    })();

    return () => { mounted = false; };
  }, [combinedData]);

  // Apply filters client-side to combinedData (when using uploaded data or after apply)
  const filteredData = React.useMemo(() => {
    return (combinedData || []).filter((r: any) => {
      // species
      if (filters.species) {
        const sel = filters.species;
        // find mapping from speciesForFilter
        const entry = speciesForFilter.find(s => s.id === sel);
        if (entry) {
          const common = r.species?.common_name || r.species?.scientific_name || '';
          const sci = r.species?.scientific_name || '';
          if (!(common === entry.common_name || sci === entry.scientific_name || r.species?.id === sel)) return false;
        } else {
          // no match entry, try direct id compare
          if (r.species?.id && r.species.id !== sel) return false;
        }
      }
      // date range
      if (filters.dateFrom) {
        const d = r.catch_date ? new Date(r.catch_date) : null;
        if (!d || d < filters.dateFrom) return false;
      }
      if (filters.dateTo) {
        const d = r.catch_date ? new Date(r.catch_date) : null;
        if (!d || d > filters.dateTo) return false;
      }
      // fishing method
      if (filters.fishingMethod) {
        if ((r.fishing_method || r.fishingMethod || '').toLowerCase() !== filters.fishingMethod.toLowerCase()) return false;
      }
      // location
      if (filters.location) {
        if (r.latitude === undefined || r.longitude === undefined) return false;
        const latR = Number(r.latitude).toFixed(2);
        const lonR = Number(r.longitude).toFixed(2);
        const id = `${latR},${lonR}`;
        if (id !== filters.location) return false;
      }
      return true;
    });
  }, [combinedData, filters, speciesForFilter]);

  // Calculate statistics from filtered data
  const stats = React.useMemo(() => {
    const dates = filteredData.map(c => c.catch_date).filter(Boolean);
    const avgQuality = filteredData.length > 0
      ? Math.round(filteredData.reduce((sum, c) => sum + (c.quality_score || 0), 0) / filteredData.length)
      : 0;

    const totalWeight = filteredData.reduce((sum, c) => sum + (Number(c.weight_kg) || 0), 0);
    const avgWeightPerCatch = filteredData.length > 0 ? Math.round(totalWeight / filteredData.length) : 0;

    // top species by weight (based on filtered data)
    const speciesWeightMap = new Map<string, number>();
    filteredData.forEach((c: any) => {
      const name = c?.species?.common_name || c?.species?.scientific_name || 'Unknown';
      speciesWeightMap.set(name, (speciesWeightMap.get(name) || 0) + (Number(c.weight_kg) || 0));
    });
    const topSpecies = Array.from(speciesWeightMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalCatches: filteredData.length,
      dateRange: dates.length > 0
        ? `${Math.min(...dates.map(d => new Date(d).getFullYear()))} - ${Math.max(...dates.map(d => new Date(d).getFullYear()))}`
        : "No data",
      avgQualityScore: avgQuality,
      totalWeight,
      avgWeightPerCatch,
      topSpecies,
    };
  }, [filteredData]);

  const handleExport = async () => {
    try {
      setExporting(true);

      // If user uploaded a CSV, export the filtered client-side data (already contains all rows)
      let exportData: any[] = [];
      const hasUploaded = uploadedRecords && uploadedRecords.length > 0;

      if (hasUploaded) {
        exportData = filteredData || [];
      } else {
        // Fetch ALL filtered rows from Supabase (no preview limit), in chunks
        const pageSize = 1000;
        let from = 0;
        let to = pageSize - 1;
        let done = false;
        const all: any[] = [];

        while (!done) {
          let query = supabase
            .from('fish_catches')
            .select(`
              id,
              latitude,
              longitude,
              catch_date,
              quantity,
              weight_kg,
              fishing_method,
              quality_score,
              is_anomaly,
              species_id
            `, { count: 'exact' })
            .order('catch_date', { ascending: false })
            .range(from, to);

          if (filters.species && isUUID(filters.species)) {
        query = query.eq('species_id', filters.species);
      }
          if (filters.dateFrom) {
            query = query.gte('catch_date', format(filters.dateFrom, 'yyyy-MM-dd'));
          }
          if (filters.dateTo) {
            query = query.lte('catch_date', format(filters.dateTo, 'yyyy-MM-dd'));
          }
          if (filters.fishingMethod) {
            query = query.eq('fishing_method', filters.fishingMethod);
          }
          if (filters.bounds) {
            query = query
              .gte('latitude', filters.bounds.south)
              .lte('latitude', filters.bounds.north)
              .gte('longitude', filters.bounds.west)
              .lte('longitude', filters.bounds.east);
          }

          const { data, error } = await query;
          if (error) throw error;
          const batch = data || [];
          all.push(...batch);

          if (batch.length < pageSize) done = true;
          else {
            from += pageSize;
            to += pageSize;
          }
        }

        // Apply any client-only filters (like precise location bucket)
        const filteredAll = all.filter((r: any) => {
          if (filters.location) {
            if (r.latitude === undefined || r.longitude === undefined) return false;
            const latR = Number(r.latitude).toFixed(2);
            const lonR = Number(r.longitude).toFixed(2);
            const id = `${latR},${lonR}`;
            if (id !== filters.location) return false;
          }
          return true;
        });

        // Enrich species names using the species lookup
        const speciesMap = new Map<string, { common_name: string | null; scientific_name: string }>();
        (species || []).forEach((s: any) => speciesMap.set(s.id, { common_name: s.common_name, scientific_name: s.scientific_name }));
        exportData = filteredAll.map((r: any) => ({
          ...r,
          species: {
            id: r.species_id,
            common_name: speciesMap.get(r.species_id || '')?.common_name || null,
            scientific_name: speciesMap.get(r.species_id || '')?.scientific_name || ''
          }
        }));
      }

      if (exportData.length === 0) {
        toast({
          title: 'No data to export',
          description: 'Please adjust your filters or upload data to include some records.',
          variant: 'destructive',
        });
        return;
      }

      // CSV with escaping
      const escape = (v: any) => {
        const s = String(v ?? '');
        return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
      };

      const headers = ['Date', 'Species (Common)', 'Species (Scientific)', 'Latitude', 'Longitude', 'Quantity', 'Weight (kg)', 'Fishing Method', 'Quality Score'];
      const rows = exportData.map((c) => [
        escape(c.catch_date),
        escape(c.species?.common_name || ''),
        escape(c.species?.scientific_name || ''),
        escape(c.latitude),
        escape(c.longitude),
        escape(c.quantity),
        escape(c.weight_kg || ''),
        escape(c.fishing_method || ''),
        escape(c.quality_score || ''),
      ].join(','));
      const csvContent = [headers.join(','), ...rows].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fish-catch-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Data exported successfully', description: `Downloaded ${exportData.length} records to CSV file.` });
    } catch (e: any) {
      toast({ title: 'Export failed', description: e?.message || 'Unexpected error during export.', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const handleFindHotspots = () => {
    toast({
      title: "AI Hotspot Analysis",
      description: "AI-powered hotspot detection coming soon! This will identify areas with high species diversity and catch rates.",
    });
  };

  const handleBoundsChange = (bounds: { north: number; south: number; east: number; west: number }) => {
    setFilters(prev => ({ ...prev, bounds }));
  };

  // Aggregated data for charts (derived from fetched fishCatches)
  const speciesAggregation = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((c: any) => {
      const name = c?.species?.common_name || c?.species?.scientific_name || 'Unknown';
      const w = Number(c?.weight_kg) || 0;
      map.set(name, (map.get(name) || 0) + w);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  const trendData = React.useMemo(() => {
    const map = new Map<string, number>(); // key = 'YYYY-MM'
    filteredData.forEach((c: any) => {
      if (!c.catch_date) return;
      const d = new Date(c.catch_date);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const w = Number(c?.weight_kg) || 0;
      map.set(key, (map.get(key) || 0) + w);
    });

    const entries = Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
    return entries.map(([key, value]) => {
      const [yearStr, monthStr] = key.split('-');
      const year = Number(yearStr);
      const month = Number(monthStr);
      const label = format(new Date(year, month - 1, 1), 'MMM yyyy');
      return { label, value };
    });
  }, [filteredData]);

  // Abundance aggregation: counts per species
  const abundanceAggregation = React.useMemo(() => {
    const map = new Map<string, number>();
    filteredData.forEach((c: any) => {
      const name = c?.species?.common_name || c?.species?.scientific_name || 'Unknown';
      map.set(name, (map.get(name) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData]);

  if (error) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          Failed to load fish catch data. Please check your connection and try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container mx-auto p-6 space-y-6">
        {/* Statistics Overview */}
        <StatsCards
          totalCatches={stats.totalCatches}
          dateRange={stats.dateRange}
          totalWeight={stats.totalWeight}
          avgWeightPerCatch={stats.avgWeightPerCatch}
          topSpecies={stats.topSpecies}
        />

        <div className="space-y-6">
          {/* Filters at top, full width */}
          <div>
            <FilterPanel
              filters={tempFilters}
              onFiltersChange={setTempFilters}
              onExport={handleExport}
              onFindHotspots={handleFindHotspots}
              species={speciesForFilter}
              locations={locationOptions}
              isLoading={isLoading || exporting}
              onApply={() => setFilters(tempFilters)}
            />
          </div>

          {/* Charts stacked vertically, full width */}
          <div className="space-y-6">
            <Card className="bg-card border shadow-data">
              <CardHeader>
                <CardTitle className="text-foreground">Catch Weight by Species</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[360px]">
                  <SpeciesBarChart data={speciesAggregation} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border shadow-data">
              <CardHeader>
                <CardTitle className="text-foreground">Abundance (Counts) by Species</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[360px]">
                  <AbundanceChart data={abundanceAggregation} />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border shadow-data">
              <CardHeader>
                <CardTitle className="text-foreground">Catch Trend Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[360px]">
                  <CatchTrendLineChart data={trendData} />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Data preview table (first 20 rows, reflects filters) */}
          <Card className="bg-card border shadow-data">
            <CardHeader>
              <CardTitle className="text-foreground">Data Preview (first 20)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground">
                      <th className="p-2">Date</th>
                      <th className="p-2">Species</th>
                      <th className="p-2">Lat</th>
                      <th className="p-2">Lon</th>
                      <th className="p-2">Qty</th>
                      <th className="p-2">Weight (kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredData.slice(0, 20).map((r: any, i: number) => (
                      <tr key={r.id || i} className="border-t">
                        <td className="p-2">{r.catch_date || '-'}</td>
                        <td className="p-2">{r.species?.common_name || r.species?.scientific_name || '-'}</td>
                        <td className="p-2">{r.latitude ?? '-'}</td>
                        <td className="p-2">{r.longitude ?? '-'}</td>
                        <td className="p-2">{r.quantity ?? '-'}</td>
                        <td className="p-2">{r.weight_kg ?? '-'}</td>
                      </tr>
                    ))}
                    {filteredData.length === 0 && (
                      <tr><td colSpan={6} className="p-2 text-muted-foreground">No records found.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
