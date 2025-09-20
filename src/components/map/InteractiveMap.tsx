import React, { useEffect, useRef, useState } from 'react';
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';
import * as L from 'leaflet';
import 'leaflet.heat';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap, useMapEvents } from 'react-leaflet';
interface FishCatch {
    id: string;
    latitude: number;
    longitude: number;
    species?: {
        common_name?: string;
        scientific_name?: string;
    };
    catch_date?: string;
    quantity?: number;
    weight_kg?: number;
}
interface InteractiveMapProps {
    data: FishCatch[];
    onBoundsChange?: (bounds: {
        north: number;
        south: number;
        east: number;
        west: number;
    }) => void;
    className?: string;
}
function MapEvents({ data, onBoundsChange }: {
    data: FishCatch[];
    onBoundsChange?: any;
}) {
    const map = useMap();
    useEffect(() => {
        if (!map)
            return;
        if (data.length === 0)
            return;
        try {
            const bounds = data.reduce((b: any, p) => {
                if (p.latitude !== undefined && p.longitude !== undefined) {
                    b.extend([p.latitude, p.longitude]);
                }
                return b;
            }, L.latLngBounds([]));
            if (bounds.isValid()) {
                map.fitBounds(bounds, { padding: [50, 50] });
            }
        }
        catch (e) {
        }
    }, [data, map]);
    useMapEvents({ moveend: () => {
            if (!onBoundsChange)
                return;
            const b = map.getBounds();
            onBoundsChange({
                north: b.getNorth(),
                south: b.getSouth(),
                east: b.getEast(),
                west: b.getWest(),
            });
        } });
    return null;
}
export const InteractiveMap = ({ data, onBoundsChange, className }: InteractiveMapProps) => {
    const [mounted, setMounted] = useState(false);
    const mapRef = useRef<any>(null);
    const heatRef = useRef<any>(null);
    const [showHeat, setShowHeat] = useState(false);
    useEffect(() => {
        setMounted(true);
    }, []);
    useEffect(() => {
        const map = mapRef.current;
        if (!map)
            return;
        if (heatRef.current) {
            try {
                heatRef.current.remove();
            }
            catch (e) { }
            heatRef.current = null;
        }
        if (!showHeat)
            return;
        const heatPoints: [
            number,
            number,
            number
        ][] = data
            .filter(d => d.latitude !== undefined && d.longitude !== undefined)
            .map(d => [d.latitude as number, d.longitude as number, (Number(d.weight_kg) || 1)]);
        if (heatPoints.length === 0)
            return;
        try {
            heatRef.current = (L as any).heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 17 }).addTo(map);
        }
        catch (e) {
        }
        return () => {
            if (heatRef.current) {
                try {
                    heatRef.current.remove();
                }
                catch (e) { }
                heatRef.current = null;
            }
        };
    }, [data, showHeat]);
    if (!mounted) {
        return (<Card className="p-6 bg-card border shadow-data">
        <div className="text-center">
          <MapPin className="h-8 w-8 text-primary mx-auto mb-2"/>
          <p className="text-sm text-muted-foreground">Initializing map...</p>
        </div>
      </Card>);
    }
    const defaultCenter: [
        number,
        number
    ] = data && data.length > 0
        ? [data[0].latitude || 0, data[0].longitude || 0]
        : [50, -20];
    return (<div className={`relative w-full h-[500px] ${className || ''}`}>
      <MapContainer center={defaultCenter} zoom={3} style={{ height: '100%', width: '100%' }} whenCreated={(m) => { mapRef.current = m; }} scrollWheelZoom={true} zoomControl={true}>
        <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>

        <MapEvents data={data} onBoundsChange={onBoundsChange}/>

        {data.map((item) => ((item.latitude !== undefined && item.longitude !== undefined) ? (<CircleMarker key={item.id} center={[item.latitude, item.longitude]} radius={6} pathOptions={{ color: '#ffffff', fillColor: '#0ea5e9', fillOpacity: 0.9, weight: 2 }}>
              <Popup>
                <div className="p-2">
                  <h3 className="font-bold text-lg">{item.species?.common_name || item.species?.scientific_name || 'Unknown'}</h3>
                  {item.species?.scientific_name && <p className="text-sm italic">{item.species.scientific_name}</p>}
                  {item.catch_date && <p className="text-sm mt-2"><strong>Date:</strong> {item.catch_date}</p>}
                  {item.quantity !== undefined && <p className="text-sm"><strong>Quantity:</strong> {item.quantity}</p>}
                  {item.weight_kg !== undefined && <p className="text-sm"><strong>Weight:</strong> {item.weight_kg} kg</p>}
                </div>
              </Popup>
            </CircleMarker>) : null))}
      </MapContainer>

      <div className="absolute top-4 right-4 bg-card/90 backdrop-blur-sm rounded-lg p-3 flex gap-2 items-center shadow-data" style={{ zIndex: 1000, pointerEvents: 'auto' }}>
        <Button size="sm" variant={showHeat ? undefined : 'outline'} onClick={() => setShowHeat(s => !s)}>
          {showHeat ? 'Hide Heatmap' : 'Show Heatmap'}
        </Button>
      </div>
    </div>);
};
