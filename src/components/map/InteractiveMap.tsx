import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MapPin } from "lucide-react";

interface FishCatch {
  id: string;
  latitude: number;
  longitude: number;
  species: {
    common_name: string;
    scientific_name: string;
  };
  catch_date: string;
  quantity: number;
  weight_kg: number;
}

interface InteractiveMapProps {
  data: FishCatch[];
  onBoundsChange?: (bounds: { north: number; south: number; east: number; west: number }) => void;
  className?: string;
}

export const InteractiveMap = ({ data, onBoundsChange, className }: InteractiveMapProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const [mapboxToken, setMapboxToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(true);

  useEffect(() => {
    // Check if token is already set
    if (mapboxToken && mapContainer.current && !map.current) {
      initializeMap();
    }
  }, [mapboxToken]);

  useEffect(() => {
    if (map.current && data.length > 0) {
      updateMapData();
    }
  }, [data]);

  const initializeMap = () => {
    if (!mapContainer.current || !mapboxToken) return;

    mapboxgl.accessToken = mapboxToken;
    
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [-20, 50], // Atlantic Ocean center
      zoom: 3,
      projection: 'mercator' as any
    });

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Listen for map movements to update bounds
    map.current.on('moveend', () => {
      if (map.current && onBoundsChange) {
        const bounds = map.current.getBounds();
        onBoundsChange({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest()
        });
      }
    });

    map.current.on('load', () => {
      updateMapData();
    });

    setShowTokenInput(false);
  };

  const updateMapData = () => {
    if (!map.current || data.length === 0) return;

    // Create GeoJSON data
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: data.map((catch_item) => ({
        type: 'Feature' as const,
        properties: {
          id: catch_item.id,
          species: catch_item.species.common_name,
          scientific_name: catch_item.species.scientific_name,
          date: catch_item.catch_date,
          quantity: catch_item.quantity,
          weight: catch_item.weight_kg
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [catch_item.longitude, catch_item.latitude]
        }
      }))
    };

    // Remove existing source and layer if they exist
    if (map.current.getSource('fish-catches')) {
      map.current.removeLayer('fish-catches-layer');
      map.current.removeSource('fish-catches');
    }

    // Add source and layer
    map.current.addSource('fish-catches', {
      type: 'geojson',
      data: geojsonData,
      cluster: true,
      clusterMaxZoom: 14,
      clusterRadius: 50
    });

    // Add cluster layer
    map.current.addLayer({
      id: 'fish-catches-layer',
      type: 'circle',
      source: 'fish-catches',
      filter: ['has', 'point_count'],
      paint: {
        'circle-color': '#1e40af', // Ocean blue
        'circle-radius': [
          'step',
          ['get', 'point_count'],
          15,
          10, 20,
          30, 25
        ],
        'circle-opacity': 0.8
      }
    });

    // Add individual points layer
    map.current.addLayer({
      id: 'fish-catches-points',
      type: 'circle',
      source: 'fish-catches',
      filter: ['!', ['has', 'point_count']],
      paint: {
        'circle-color': '#0ea5e9', // Bright aqua
        'circle-radius': 6,
        'circle-stroke-width': 2,
        'circle-stroke-color': '#ffffff',
        'circle-opacity': 0.8
      }
    });

    // Add cluster count labels
    map.current.addLayer({
      id: 'cluster-count',
      type: 'symbol',
      source: 'fish-catches',
      filter: ['has', 'point_count'],
      layout: {
        'text-field': '{point_count_abbreviated}',
        'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
        'text-size': 12
      },
      paint: {
        'text-color': '#ffffff'
      }
    });

    // Add click handlers
    map.current.on('click', 'fish-catches-points', (e) => {
      if (e.features && e.features[0]) {
        const feature = e.features[0];
        const coordinates = (feature.geometry as any).coordinates;
        const popup = new mapboxgl.Popup()
          .setLngLat([coordinates[0], coordinates[1]])
          .setHTML(`
            <div class="p-3">
              <h3 class="font-bold text-lg">${feature.properties?.species}</h3>
              <p class="text-sm text-gray-600 italic">${feature.properties?.scientific_name}</p>
              <p class="text-sm mt-2"><strong>Date:</strong> ${feature.properties?.date}</p>
              <p class="text-sm"><strong>Quantity:</strong> ${feature.properties?.quantity}</p>
              <p class="text-sm"><strong>Weight:</strong> ${feature.properties?.weight} kg</p>
            </div>
          `)
          .addTo(map.current!);
      }
    });

    // Change cursor on hover
    map.current.on('mouseenter', 'fish-catches-points', () => {
      if (map.current) map.current.getCanvas().style.cursor = 'pointer';
    });
    map.current.on('mouseleave', 'fish-catches-points', () => {
      if (map.current) map.current.getCanvas().style.cursor = '';
    });

    // Fit map to data bounds if we have data
    if (data.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      data.forEach(catch_item => {
        bounds.extend([catch_item.longitude, catch_item.latitude]);
      });
      map.current.fitBounds(bounds, { padding: 50 });
    }
  };

  const handleTokenSubmit = () => {
    if (mapboxToken.trim()) {
      initializeMap();
    }
  };

  if (showTokenInput) {
    return (
      <Card className="p-6 bg-card border shadow-data">
        <div className="text-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-lg">
            <MapPin className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="text-lg font-semibold text-foreground">Map Configuration</h3>
            <p className="text-sm text-muted-foreground">
              Enter your Mapbox public token to enable the interactive map
            </p>
          </div>
          <div className="space-y-3">
            <Input
              type="password"
              placeholder="Enter Mapbox public token"
              value={mapboxToken}
              onChange={(e) => setMapboxToken(e.target.value)}
              className="max-w-md mx-auto"
            />
            <Button onClick={handleTokenSubmit} className="bg-gradient-ocean text-white">
              Initialize Map
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Get your token at{' '}
            <a 
              href="https://mapbox.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              mapbox.com
            </a>
          </p>
        </div>
      </Card>
    );
  }

  return (
    <div className={`relative w-full h-[500px] ${className}`}>
      <div ref={mapContainer} className="absolute inset-0 rounded-lg shadow-ocean border" />
      <div className="absolute top-4 left-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 shadow-data">
        <p className="text-sm font-medium text-foreground">Fish Catch Locations</p>
        <p className="text-xs text-muted-foreground">Click points for details</p>
      </div>
    </div>
  );
};