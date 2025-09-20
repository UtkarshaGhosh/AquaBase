import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, FileSpreadsheet, CheckCircle, AlertTriangle, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const UploadView = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const { toast } = useToast();

  const handleFileUpload = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid file type",
        description: "Please upload a CSV file.",
        variant: "destructive"
      });
      return;
    }

    setUploadStatus('uploading');
    
    // Simulate upload process
    setTimeout(() => {
      setUploadStatus('success');
      toast({
        title: "Upload successful",
        description: `${file.name} has been uploaded and is being processed.`
      });
    }, 2000);
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

  return (
    <div className="min-h-screen bg-gradient-surface">
      <div className="container mx-auto p-6 space-y-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">Data Upload Portal</h1>
            <p className="text-muted-foreground">Upload your fish catch data files for analysis and visualization</p>
          </div>

          {/* Upload Instructions */}
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Upload Requirements:</strong> Please ensure your CSV file contains columns for species, latitude, longitude, catch_date, quantity, and weight_kg. 
              The system will automatically validate and process your data with AI-powered quality checks.
            </AlertDescription>
          </Alert>

          {/* Upload Area */}
          <Card className="bg-card border shadow-ocean">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Upload className="h-5 w-5 text-primary" />
                Upload Fish Catch Data
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div
                className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
                  isDragOver ? 'border-primary bg-primary/5' : 'border-border'
                } ${uploadStatus === 'uploading' ? 'opacity-50' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                {uploadStatus === 'idle' && (
                  <>
                    <FileSpreadsheet className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Drop your CSV file here</h3>
                    <p className="text-muted-foreground mb-4">or click to browse files</p>
                    <Input
                      type="file"
                      accept=".csv"
                      onChange={(e) => handleFileUpload(e.target.files)}
                      className="hidden"
                      id="file-upload"
                    />
                    <Button 
                      asChild 
                      className="bg-gradient-ocean text-white hover:opacity-90"
                    >
                      <label htmlFor="file-upload" className="cursor-pointer">
                        Choose File
                      </label>
                    </Button>
                  </>
                )}

                {uploadStatus === 'uploading' && (
                  <>
                    <div className="animate-spin h-16 w-16 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">Processing your data...</h3>
                    <p className="text-muted-foreground">Running AI quality checks and validation</p>
                  </>
                )}

                {uploadStatus === 'success' && (
                  <>
                    <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Upload successful!</h3>
                    <p className="text-muted-foreground mb-4">Your data has been processed and is now available in the dashboard</p>
                    <Button 
                      onClick={() => setUploadStatus('idle')}
                      variant="outline"
                    >
                      Upload Another File
                    </Button>
                  </>
                )}

                {uploadStatus === 'error' && (
                  <>
                    <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-foreground mb-2">Upload failed</h3>
                    <p className="text-muted-foreground mb-4">There was an error processing your file</p>
                    <Button 
                      onClick={() => setUploadStatus('idle')}
                      variant="outline"
                    >
                      Try Again
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* CSV Format Guide */}
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
        </div>
      </div>
    </div>
  );
};