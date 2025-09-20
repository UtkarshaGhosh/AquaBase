import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CalendarIcon, Filter, Download, Sparkles } from "lucide-react";
import { format } from "date-fns";

interface FilterPanelProps {
  filters: {
    species?: string;
    dateFrom?: Date;
    dateTo?: Date;
    fishingMethod?: string;
    location?: string;
  };
  onFiltersChange: (filters: any) => void;
  onExport: () => void;
  onFindHotspots: () => void;
  species: Array<{ id: string; common_name: string; scientific_name: string }>;
  locations?: Array<{ id: string; label: string }>;
  isLoading?: boolean;
}

export const FilterPanel = ({
  filters,
  onFiltersChange,
  onExport,
  onFindHotspots,
  species,
  locations = [],
  isLoading
}: FilterPanelProps) => {
  return (
    <Card className="bg-card border shadow-data">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-foreground">
          <Filter className="h-5 w-5 text-primary" />
          Data Filters
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Species Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Species</label>
          <Select 
            value={filters.species || "all"} 
            onValueChange={(value) => onFiltersChange({ ...filters, species: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="All species" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All species</SelectItem>
              {species.map((s) => (
                <SelectItem key={s.id} value={s.id}>
                  {s.common_name} ({s.scientific_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">From Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateFrom}
                  onSelect={(date) => onFiltersChange({ ...filters, dateFrom: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">To Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-left font-normal bg-background">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {filters.dateTo ? format(filters.dateTo, "PPP") : "Pick date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={filters.dateTo}
                  onSelect={(date) => onFiltersChange({ ...filters, dateTo: date })}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Fishing Method */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Fishing Method</label>
          <Select
            value={filters.fishingMethod || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, fishingMethod: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="All methods" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All methods</SelectItem>
              <SelectItem value="Trawling">Trawling</SelectItem>
              <SelectItem value="Longlining">Longlining</SelectItem>
              <SelectItem value="Net fishing">Net fishing</SelectItem>
              <SelectItem value="Rod and reel">Rod and reel</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Location Filter */}
        <div>
          <label className="text-sm font-medium text-foreground mb-2 block">Location</label>
          <Select
            value={filters.location || "all"}
            onValueChange={(value) => onFiltersChange({ ...filters, location: value === "all" ? undefined : value })}
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="All locations" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All locations</SelectItem>
              {locations.map((loc) => (
                <SelectItem key={loc.id} value={loc.id}>{loc.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-2">
          <Button 
            onClick={onFindHotspots}
            className="bg-gradient-ocean hover:opacity-90 text-white w-full"
            disabled={isLoading}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Find Hotspots
          </Button>
          <Button 
            variant="outline" 
            onClick={onExport}
            className="w-full"
            disabled={isLoading}
          >
            <Download className="mr-2 h-4 w-4" />
            Export Data
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
