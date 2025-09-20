import React, { useState } from 'react';
import { Header } from "@/components/ui/navigation";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { UploadView } from "@/components/upload/UploadView";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

const Index = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');

  // Fetch fish catch data for map view
  const { data: mapData = [] } = useQuery({
    queryKey: ['fish-catches-map'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('fish_catches')
        .select(`
          id,
          latitude,
          longitude,
          catch_date,
          quantity,
          weight_kg,
          species:species_id (
            common_name,
            scientific_name
          )
        `)
        .limit(200);
      
      if (error) throw error;
      return data || [];
    },
    enabled: currentPage === 'map'
  });

  const renderCurrentView = () => {
    switch (currentPage) {
      case 'dashboard':
        return <DashboardView />;
      case 'map':
        return (
          <div className="min-h-screen bg-gradient-surface">
            <div className="container mx-auto p-6">
              <Card className="bg-card border shadow-ocean">
                <CardHeader>
                  <CardTitle className="text-foreground">Fish Catch Map View</CardTitle>
                </CardHeader>
                <CardContent>
                  <InteractiveMap data={mapData} className="h-[600px]" />
                </CardContent>
              </Card>
            </div>
          </div>
        );
      case 'upload':
        return <UploadView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header currentPage={currentPage} onPageChange={setCurrentPage} />
      {renderCurrentView()}
    </div>
  );
};

export default Index;
