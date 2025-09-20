import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const fetchDataset = async (id: string) => {
  const { data, error } = await supabase
    .from('datasets')
    .select('*')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

const DatasetDetail: React.FC = () => {
  const { id } = useParams();
  const { data, isLoading, error } = useQuery({ queryKey: ['dataset', id], queryFn: () => fetchDataset(id as string), enabled: !!id });

  if (!id) return <div className="p-6">Missing dataset id</div>;
  if (isLoading) return <div className="p-6">Loading...</div>;
  if (error) return <div className="p-6 text-red-600">Error loading dataset: {(error as any).message}</div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6">
        <Link to="/community">
          <Button variant="ghost">Back to Community</Button>
        </Link>
        <Card className="mt-4 bg-card">
          <CardHeader>
            <CardTitle>{data.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{data.description ?? 'No description'}</p>
            <p><strong>Rows:</strong> {data.row_count ?? '—'}</p>
            <p><strong>Visibility:</strong> {data.visibility}</p>
            <p><strong>Owner:</strong> {data.user_id}</p>
            <p className="mt-3"><strong>Sample stats:</strong></p>
            <pre className="bg-surface p-3 rounded text-xs overflow-auto mt-2">{JSON.stringify(data.sample_stats ?? {}, null, 2)}</pre>
            {data.file_url && (
              <a href={data.file_url} target="_blank" rel="noreferrer">
                <Button className="mt-4">Download dataset</Button>
              </a>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DatasetDetail;
