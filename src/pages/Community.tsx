import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

const fetchDatasets = async () => {
  const { data, error } = await supabase
    .from('datasets')
    .select('id, name, description, user_id, visibility, row_count, sample_stats, created_at')
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) throw error;
  return data || [];
};

const CommunityPage: React.FC = () => {
  const { data = [], isLoading, error } = useQuery({ queryKey: ['datasets-list'], queryFn: fetchDatasets });

  if (isLoading) return <div className="p-6">Loading datasets...</div>;
  if (error) return <div className="p-6 text-red-600">Error loading datasets: {(error as any).message}</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <h1 className="mb-6 text-2xl font-semibold">Community Datasets</h1>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {data.map((d: any) => (
            <Card key={d.id} className="bg-card">
              <CardHeader>
                <CardTitle className="text-lg">{d.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{d.description ?? 'No description'}</p>
                <p className="text-sm">Rows: <strong>{d.row_count ?? '—'}</strong></p>
                <p className="text-sm">Visibility: <strong>{d.visibility}</strong></p>
                <p className="text-sm">Owner: <strong>{d.user_id ?? '—'}</strong></p>
                <div className="mt-4 flex gap-2">
                  <Link to={`/dataset/${d.id}`}>
                    <Button size="sm">View</Button>
                  </Link>
                  {d.visibility === 'public' && (
                    <a href={d.file_url} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">Download</Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CommunityPage;
