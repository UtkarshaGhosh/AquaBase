import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FilterPanel } from './FilterPanel';
import { StatsCards } from './StatsCards';
import { InteractiveMap } from '../map/InteractiveMap';
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

  // Calculate statistics
  const stats = React.useMemo(() => {
    const uniqueSpeciesSet = new Set(fishCatches.map(c => c.species?.id).filter(Boolean));
    const dates = fishCatches.map(c => c.catch_date).filter(Boolean);
    const avgQuality = fishCatches.length > 0 
      ? Math.round(fishCatches.reduce((sum, c) => sum + (c.quality_score || 0), 0) / fishCatches.length)
      : 0;

    return {
      totalCatches: fishCatches.length,
      uniqueSpecies: uniqueSpeciesSet.size,
      dateRange: dates.length > 0 
        ? `${Math.min(...dates.map(d => new Date(d).getFullYear()))} - ${Math.max(...dates.map(d => new Date(d).getFullYear()))}`
        : "No data",
      avgQualityScore: avgQuality
    };
  }, [fishCatches]);

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

          {/* Map and Data View */}
          <div className="lg:col-span-3 space-y-6">
            {/* Interactive Map */}
            <Card className="bg-card border shadow-ocean">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <span>Interactive Map</span>
                  {isLoading && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <InteractiveMap 
                  data={fishCatches} 
                  onBoundsChange={handleBoundsChange}
                />
              </CardContent>
            </Card>

            {/* Data Quality Overview */}
            <Card className="bg-card border shadow-data">
              <CardHeader>
                <CardTitle className="text-foreground">Data Quality Overview</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {fishCatches.filter(c => !c.is_anomaly).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Clean Records</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">
                      {fishCatches.filter(c => c.is_anomaly).length}
                    </div>
                    <div className="text-sm text-muted-foreground">Flagged Anomalies</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round((fishCatches.filter(c => (c.quality_score || 0) >= 90).length / Math.max(fishCatches.length, 1)) * 100)}%
                    </div>
                    <div className="text-sm text-muted-foreground">High Quality</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">
                      {fishCatches.length}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Records</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};