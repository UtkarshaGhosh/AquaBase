import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
export const UploadView = () => {
    const [isDragOver, setIsDragOver] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [parsedRecords, setParsedRecords] = useState<any[]>([]);
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const parseCSV = (text: string) => {
        const lines = text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
        if (lines.length === 0)
            return [];
        const header = lines[0].split(',').map(h => h.trim());
        const rows = lines.slice(1);
        const records = rows.map((row, idx) => {
            const cols = row.split(',').map(c => c.trim());
            const obj: any = {};
            header.forEach((h, i) => {
                obj[h] = cols[i] !== undefined ? cols[i] : '';
            });
            const rec: any = {
                id: `${Date.now()}-${idx}`,
                latitude: parseFloat(obj.latitude || obj.lat || '') || undefined,
                longitude: parseFloat(obj.longitude || obj.lon || obj.long || '') || undefined,
                catch_date: obj.catch_date || obj.date || '',
                quantity: obj.quantity ? Number(obj.quantity) : undefined,
                weight_kg: obj.weight_kg ? Number(obj.weight_kg) : undefined,
                quality_score: obj.quality_score ? Number(obj.quality_score) : undefined,
                fishing_method: obj.fishing_method || '',
                species: {
                    scientific_name: obj.species_scientific_name || obj.species || '',
                    common_name: obj.species_common_name || ''
                }
            };
            rec.is_anomaly = !(rec.latitude && rec.longitude) || (rec.quality_score !== undefined && rec.quality_score < 50);
            return rec;
        }).filter(r => r.catch_date || r.latitude !== undefined || r.longitude !== undefined);
        return records;
    };
    const handleFileUpload = async (files: FileList | null) => {
        if (!files || files.length === 0)
            return;
        const file = files[0];
        if (!file.name.toLowerCase().endsWith('.csv')) {
            toast({
                title: "Invalid file type",
                description: "Please upload a CSV file.",
                variant: "destructive"
            });
            return;
        }
        setUploadStatus('uploading');
        try {
            const text = await file.text();
            const records = parseCSV(text);
            setParsedRecords(records);
            try {
                localStorage.setItem('uploaded_fish_catches', JSON.stringify(records));
                try {
                    window.dispatchEvent(new Event('uploaded-data-changed'));
                }
                catch (err) { }
            }
            catch (e) { }
            try {
                if (queryClient)
                    queryClient.invalidateQueries(['fish-catches']);
            }
            catch (e) { }
            setUploadStatus('success');
            toast({
                title: "Upload successful",
                description: `${file.name} has been uploaded and parsed (${records.length} records).`
            });
        }
        catch (e) {
            console.error(e);
            setUploadStatus('error');
            toast({
                title: "Upload failed",
                description: `There was an error processing ${file.name}.`,
                variant: 'destructive'
            });
        }
    };
    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };
    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };
    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        handleFileUpload(e.dataTransfer.files);
    };
    return (<div className="min-h-screen bg-gradient-surface">
      <div className="container mx-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto">
          
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Data Upload Portal</h1>
            <p className="text-muted-foreground">Upload your fish catch data files for analysis and visualization</p>
          </div>

          
          <Alert className="mb-6">
            <Info className="h-4 w-4"/>
            <AlertDescription>
              <strong>Upload Requirements:</strong> Please ensure your CSV file contains columns for species, latitude, longitude, catch_date, quantity, and weight_kg. 
              The system will automatically validate and process your data with AI-powered quality checks.
            </AlertDescription>
          </Alert>

          
          <Card className="bg-card border shadow-ocean">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Upload className="h-5 w-5 text-primary"/>
                Upload Fish Catch Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${isDragOver ? 'border-primary bg-primary/5' : 'border-border'} ${uploadStatus === 'uploading' ? 'opacity-50' : ''}`} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
                {uploadStatus === 'idle' && (<>
                    <FileSpreadsheet className="h-16 w-16 text-muted-foreground mx-auto mb-4"/>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Drop your CSV file here</h3>
                    <p className="text-muted-foreground mb-4">or click to browse files</p>
                    <Input type="file" accept=".csv" onChange={(e) => handleFileUpload(e.target.files)} className="hidden" id="file-upload"/>
                    <Button asChild className="bg-gradient-ocean text-white hover:opacity-90">
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Choose File
                      </label>
                    </Button>
                  </>)}

                {uploadStatus === 'uploading' && (<>
                    <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Processing your data...</h3>
                    <p className="text-muted-foreground">Running AI quality checks and validation</p>
                  </>)}

                {uploadStatus === 'success' && (<>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4"/>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Upload successful!</h3>
                    <p className="text-muted-foreground mb-4">Your data has been processed and is now available in the dashboard</p>
                    <Button onClick={() => setUploadStatus('idle')} variant="outline">
                      Upload Another File
                    </Button>
                  </>)}

                {uploadStatus === 'error' && (<>
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4"/>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Upload failed</h3>
                    <p className="text-muted-foreground mb-4">There was an error processing your file</p>
                    <Button onClick={() => setUploadStatus('idle')} variant="outline">
                      Try Again
                    </Button>
                  </>)}
              </div>
            </CardContent>
          </Card>

          
          <Card className="bg-card border shadow-data">
            <CardHeader>
              <CardTitle className="text-foreground">CSV Format Guide</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Your CSV file should include the following columns (column names must match exactly):
                </p>
                <div className="bg-muted/50 p-4 rounded-lg">
                  <code className="text-sm">
                    species_scientific_name, latitude, longitude, catch_date, quantity, weight_kg, depth_m, water_temperature, fishing_method, vessel_name, notes
                  </code>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <strong>Required columns:</strong>
                    <ul className="list-disc list-inside text-muted-foreground mt-1">
                      <li>species_scientific_name</li>
                      <li>latitude (decimal degrees)</li>
                      <li>longitude (decimal degrees)</li>
                      <li>catch_date (YYYY-MM-DD)</li>
                      <li>quantity (integer)</li>
                    </ul>
                  </div>
                  <div>
                    <strong>Optional columns:</strong>
                    <ul className="list-disc list-inside text-muted-foreground mt-1">
                      <li>weight_kg (decimal)</li>
                      <li>depth_m (integer)</li>
                      <li>water_temperature (decimal)</li>
                      <li>fishing_method (text)</li>
                      <li>vessel_name (text)</li>
                      <li>notes (text)</li>
                    </ul>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          
          <Card className="bg-card border shadow-data">
            <CardHeader>
              <CardTitle className="text-foreground">Flagged Anomalies (first 10)</CardTitle>
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
                      <th className="p-2">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRecords.filter(r => r.is_anomaly).slice(0, 10).map((r, i) => (<tr key={r.id || i} className="border-t">
                        <td className="p-2">{r.catch_date || '-'}</td>
                        <td className="p-2">{r.species?.common_name || r.species?.scientific_name || '-'}</td>
                        <td className="p-2">{r.latitude ?? '-'}</td>
                        <td className="p-2">{r.longitude ?? '-'}</td>
                        <td className="p-2">{r.quantity ?? '-'}</td>
                        <td className="p-2">{r.weight_kg ?? '-'}</td>
                        <td className="p-2">{r.quality_score ?? '-'}</td>
                      </tr>))}
                  </tbody>
                </table>
                {parsedRecords.filter(r => r.is_anomaly).length === 0 && (<div className="text-xs text-muted-foreground p-2">No flagged anomalies found in the uploaded file.</div>)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border shadow-data">
            <CardHeader>
              <CardTitle className="text-foreground">Data Preview (first 10 rows)</CardTitle>
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
                      <th className="p-2">Quality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRecords.slice(0, 10).map((r, i) => (<tr key={r.id || i} className="border-t">
                        <td className="p-2">{r.catch_date || '-'}</td>
                        <td className="p-2">{r.species?.common_name || r.species?.scientific_name || '-'}</td>
                        <td className="p-2">{r.latitude ?? '-'}</td>
                        <td className="p-2">{r.longitude ?? '-'}</td>
                        <td className="p-2">{r.quantity ?? '-'}</td>
                        <td className="p-2">{r.weight_kg ?? '-'}</td>
                        <td className="p-2">{r.quality_score ?? '-'}</td>
                      </tr>))}
                  </tbody>
                </table>
                {parsedRecords.length === 0 && (<div className="text-xs text-muted-foreground p-2">No data parsed yet. Upload a CSV to preview rows.</div>)}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>);
};
