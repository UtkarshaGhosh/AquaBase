import React, { useState, useEffect } from 'react';
import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from './FilterPanel';
import { StatsCards } from './StatsCards';
import SpeciesBarChart from '@/components/charts/SpeciesBarChart';
import CatchTrendLineChart from '@/components/charts/CatchTrendLineChart';
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Filters {
  species?: string;
  dateFrom?: Date;
  dateTo?: Date;
  fishingMethod?: string;
  bounds?: { north: number; south: number; east: number; west: number };
}

export const DashboardView = () => {
  const [filters, setFilters] = useState<Filters>({});
  const { toast } = useToast();

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
      if (filters.species) {
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

  // Calculate statistics from combined data
  const stats = React.useMemo(() => {
    const uniqueSpeciesSet = new Set(combinedData.map(c => c.species?.id || c.species?.common_name).filter(Boolean));
    const dates = combinedData.map(c => c.catch_date).filter(Boolean);
    const avgQuality = combinedData.length > 0
      ? Math.round(combinedData.reduce((sum, c) => sum + (c.quality_score || 0), 0) / combinedData.length)
      : 0;

    const totalWeight = combinedData.reduce((sum, c) => sum + (Number(c.weight_kg) || 0), 0);
    const avgWeightPerCatch = combinedData.length > 0 ? Math.round(totalWeight / combinedData.length) : 0;

    // top species by weight
    const speciesWeightMap = new Map<string, number>();
    combinedData.forEach((c: any) => {
      const name = c?.species?.common_name || c?.species?.scientific_name || 'Unknown';
      speciesWeightMap.set(name, (speciesWeightMap.get(name) || 0) + (Number(c.weight_kg) || 0));
    });
    const topSpecies = Array.from(speciesWeightMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    return {
      totalCatches: combinedData.length,
      uniqueSpecies: uniqueSpeciesSet.size,
      dateRange: dates.length > 0
        ? `${Math.min(...dates.map(d => new Date(d).getFullYear()))} - ${Math.max(...dates.map(d => new Date(d).getFullYear()))}`
        : "No data",
      avgQualityScore: avgQuality,
      totalWeight,
      avgWeightPerCatch,
      topSpecies,
    };
  }, [combinedData]);

  const handleExport = () => {
    if (fishCatches.length === 0) {
      toast({
        title: "No data to export",
        description: "Please adjust your filters to include some data.",
        variant: "destructive"
      });
      return;
    }

    // Create CSV content
    const headers = ['Date', 'Species (Common)', 'Species (Scientific)', 'Latitude', 'Longitude', 'Quantity', 'Weight (kg)', 'Fishing Method', 'Quality Score'];
    const csvContent = [
      headers.join(','),
      ...fishCatches.map(catch_item => [
        catch_item.catch_date,
        catch_item.species?.common_name || '',
        catch_item.species?.scientific_name || '',
        catch_item.latitude,
        catch_item.longitude,
        catch_item.quantity,
        catch_item.weight_kg || '',
        catch_item.fishing_method || '',
        catch_item.quality_score || ''
      ].join(','))
    ].join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fish-catch-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast({
      title: "Data exported successfully",
      description: `Downloaded ${fishCatches.length} records to CSV file.`
    });
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
    combinedData.forEach((c: any) => {
      const name = c?.species?.common_name || c?.species?.scientific_name || 'Unknown';
      const w = Number(c?.weight_kg) || 0;
      map.set(name, (map.get(name) || 0) + w);
    });
    return Array.from(map.entries())
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
  }, [combinedData]);

  const trendData = React.useMemo(() => {
    const map = new Map<string, number>(); // key = 'YYYY-MM'
    combinedData.forEach((c: any) => {
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
  }, [combinedData]);

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
          uniqueSpecies={stats.uniqueSpecies}
          dateRange={stats.dateRange}
          avgQualityScore={stats.avgQualityScore}
          totalWeight={stats.totalWeight}
          avgWeightPerCatch={stats.avgWeightPerCatch}
          topSpecies={stats.topSpecies}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filter Panel */}
          <div className="lg:col-span-1">
            <FilterPanel
              filters={filters}
              onFiltersChange={setFilters}
              onExport={handleExport}
              onFindHotspots={handleFindHotspots}
              species={species}
              isLoading={isLoading}
            />
          </div>

          {/* Charts and Data View */}
          <div className="lg:col-span-3 space-y-6">
            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="bg-card border shadow-data">
                <CardHeader>
                  <CardTitle className="text-foreground">Catch Weight by Species</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[420px]">
                    <SpeciesBarChart data={speciesAggregation} />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border shadow-data">
                <CardHeader>
                  <CardTitle className="text-foreground">Catch Trend Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[420px]">
                    <CatchTrendLineChart data={trendData} />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
