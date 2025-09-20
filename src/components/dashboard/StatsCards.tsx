import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Calendar, MapPin, TrendingUp } from "lucide-react";

interface StatsCardsProps {
  totalCatches: number;
  uniqueSpecies: number;
  dateRange: string;
  avgQualityScore: number;
}

export const StatsCards = ({ 
  totalCatches, 
  uniqueSpecies, 
  dateRange, 
  avgQualityScore 
}: StatsCardsProps) => {
  const stats = [
    {
      title: "Total Catches",
      value: totalCatches.toLocaleString(),
      icon: Fish,
      subtitle: "catch records"
    },
    {
      title: "Unique Species", 
      value: uniqueSpecies.toString(),
      icon: TrendingUp,
      subtitle: "different species"
    },
    {
      title: "Date Range",
      value: dateRange,
      icon: Calendar,
      subtitle: "data coverage"
    },
    {
      title: "Data Quality",
      value: `${avgQualityScore}%`,
      icon: MapPin,
      subtitle: "avg quality score"
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="bg-card border shadow-data hover:shadow-ocean transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};