import React, { useEffect, useState } from 'react';
import { Header } from "@/components/ui/navigation";
import { DashboardView } from "@/components/dashboard/DashboardView";
import { UploadView } from "@/components/upload/UploadView";
import { InteractiveMap } from "@/components/map/InteractiveMap";
import { HeatmapMap } from "@/components/map/HeatmapMap";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import AuthPage from '@/components/auth/AuthPage';
import Community from '@/pages/Community';
const Index = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [sessionReady, setSessionReady] = useState(false);
    const [hasSession, setHasSession] = useState(false);

    useEffect(() => {
        (async () => {
            const { data } = await supabase.auth.getSession();
            setHasSession(!!data.session);
            setSessionReady(true);
        })();
        const { data: listener } = supabase.auth.onAuthStateChange((_e, s) => setHasSession(!!s));
        return () => { listener.subscription.unsubscribe(); };
    }, []);

    const { data: mapDataFromBackend = [] } = useQuery({
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
            if (error)
                throw error;
            return data || [];
        },
        enabled: currentPage === 'map'
    });
    const [uploadedRecords, setUploadedRecords] = useState<any[]>(() => {
        try {
            const raw = localStorage.getItem('uploaded_fish_catches');
            if (!raw)
                return [];
            const parsed = JSON.parse(raw);
            return Array.isArray(parsed) ? parsed : [];
        }
        catch (e) {
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
            }
            catch (e) {
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
    const mapData = uploadedRecords && uploadedRecords.length > 0 ? uploadedRecords : mapDataFromBackend;
    const renderCurrentView = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardView />;
            case 'map':
                return (<div className="min-h-screen bg-gradient-surface">
            <div className="container mx-auto p-6 space-y-6">
              <Card className="bg-card border shadow-ocean">
                <CardHeader>
                  <CardTitle className="text-foreground">Fish Catch Map View</CardTitle>
                </CardHeader>
                <CardContent>
                  <InteractiveMap data={mapData} className="h-[600px]"/>
                </CardContent>
              </Card>

              <HeatmapMap initialData={mapData} className="h-[600px]"/>
            </div>
          </div>);
            case 'upload':
                return <UploadView />;
            default:
                return <DashboardView />;
        }
    };
    if (!sessionReady) {
        return <div className="min-h-screen bg-background"/>;
    }
    if (!hasSession) {
        return <AuthPage/>;
    }
    return (<div className="min-h-screen bg-background">
      <Header currentPage={currentPage} onPageChange={setCurrentPage}/>
      {renderCurrentView()}
    </div>);
};
export default Index;
