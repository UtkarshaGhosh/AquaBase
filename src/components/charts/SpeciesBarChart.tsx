import React, { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { ensureChartJSRegistered } from './chartSetup';
export interface SpeciesDatum {
    label: string;
    value: number;
}
function getCssVar(name: string, fallback: string) {
    try {
        if (typeof window === 'undefined' || typeof document === 'undefined')
            return fallback;
        const root = document.documentElement;
        if (!root)
            return fallback;
        const val = getComputedStyle(root).getPropertyValue(name) || '';
        return val.trim() || fallback;
    }
    catch (e) {
        return fallback;
    }
}
export const SpeciesBarChart = ({ data }: {
    data: SpeciesDatum[];
}) => {
    ensureChartJSRegistered();
    const color = getCssVar('--primary', 'rgb(59,130,246)');
    const gridColor = getCssVar('--border', 'rgba(0,0,0,0.1)');
    const textColor = getCssVar('--foreground', '#111827');
    const chartData = useMemo(() => ({
        labels: data.map(d => d.label),
        datasets: [
            {
                label: 'Total Catch Weight (kg)',
                data: data.map(d => Math.round(d.value)),
                backgroundColor: color,
                borderRadius: 6,
                borderSkipped: false,
            },
        ],
    }), [data, color]);
    const options = useMemo(() => ({
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutCubic' },
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (ctx: any) => `${ctx.label}: ${ctx.parsed.y.toLocaleString()} kg`,
                },
            },
        },
        scales: {
            x: {
                ticks: { color: textColor, maxRotation: 45, minRotation: 0 },
                grid: { display: false },
                title: { display: true, text: 'Species', color: textColor },
            },
            y: {
                ticks: { color: textColor },
                grid: { color: gridColor },
                title: { display: true, text: 'Total Catch Weight (kg)', color: textColor },
            },
        },
    }), [textColor, gridColor]);
    return (<div style={{ height: 360 }}>
      <Bar data={chartData} options={options} updateMode="active"/>
    </div>);
};
export default SpeciesBarChart;
