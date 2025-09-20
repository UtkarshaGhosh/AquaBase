import React from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Fish, Map, Upload, BarChart3, Waves } from "lucide-react";
interface NavigationProps {
    className?: string;
    currentPage: string;
    onPageChange: (page: string) => void;
}
const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
    { id: 'map', label: 'Map View', icon: Map },
    { id: 'upload', label: 'Data Upload', icon: Upload },
];
export const Navigation = ({ className, currentPage, onPageChange }: NavigationProps) => {
    return (<nav className={cn("flex items-center space-x-1", className)}>
      {navigationItems.map((item) => {
            const Icon = item.icon;
            return (<Button key={item.id} variant={currentPage === item.id ? "default" : "ghost"} size="sm" onClick={() => onPageChange(item.id)} className="flex items-center gap-2">
            <Icon className="h-4 w-4"/>
            {item.label}
          </Button>);
        })}
    </nav>);
};
import { supabase } from '@/integrations/supabase/client';
export const Header = ({ currentPage, onPageChange }: {
    currentPage: string;
    onPageChange: (page: string) => void;
}) => {
    async function handleLogout() {
        try { await supabase.auth.signOut(); } catch {}
    }
    return (<header className="bg-gradient-ocean text-white border-b shadow-ocean">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
              <Waves className="h-6 w-6"/>
            </div>
            <div>
              <h1 className="text-xl font-bold">AquaBase</h1>
              <p className="text-white/80 text-sm">Marine Research Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Navigation currentPage={currentPage} onPageChange={onPageChange}/>
            <Button size="sm" variant="secondary" onClick={handleLogout}>Logout</Button>
          </div>
        </div>
      </div>
    </header>);
};
