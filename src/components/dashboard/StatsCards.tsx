import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Fish, Calendar, MapPin, TrendingUp } from "lucide-react";
interface StatsCardsProps {
    totalCatches: number;
    dateRange: string;
    totalWeight?: number;
    avgWeightPerCatch?: number;
    topSpecies?: string;
}
export const StatsCards = ({ totalCatches, dateRange, totalWeight = 0, avgWeightPerCatch = 0, topSpecies = 'N/A' }: StatsCardsProps) => {
    const stats = [
        {
            title: "Total Catches",
            value: totalCatches.toLocaleString(),
            icon: Fish,
            subtitle: "catch records"
        },
        {
            title: "Date Range",
            value: dateRange,
            icon: Calendar,
            subtitle: "data coverage"
        },
        {
            title: "Total Weight",
            value: `${Number(totalWeight).toLocaleString()} kg`,
            icon: Fish,
            subtitle: "sum of weights"
        },
        {
            title: "Avg Weight",
            value: `${Number(avgWeightPerCatch).toLocaleString()} kg`,
            icon: TrendingUp,
            subtitle: "per catch"
        }
    ];
    return (<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
      {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (<Card key={index} className="bg-card border shadow-data hover:shadow-ocean transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <Icon className="h-4 w-4 text-primary"/>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.subtitle}
              </p>
            </CardContent>
          </Card>);
        })}

      
      <Card className="bg-card border shadow-data lg:col-span-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Top Species by Weight</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-xl font-semibold text-foreground">{topSpecies}</div>
          <p className="text-xs text-muted-foreground mt-1">Top species in the selected filters</p>
        </CardContent>
      </Card>
    </div>);
};
