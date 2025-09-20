import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ensureChartJSRegistered } from './chartSetup';
export interface TrendDatum {
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
export const CatchTrendLineChart = ({ data }: {
    data: TrendDatum[];
}) => {
    ensureChartJSRegistered();
    const lineColor = getCssVar('--primary', 'rgb(59,130,246)');
    const gridColor = getCssVar('--border', 'rgba(0,0,0,0.1)');
    const textColor = getCssVar('--foreground', '#111827');
    const fillColor = getCssVar('--accent', 'rgba(59,130,246,0.15)');
    function withAlpha(colorStr: string, alpha: number) {
        try {
            const s = colorStr.trim();
            if (!s)
                return `rgba(59,130,246,${alpha})`;
            if (s.startsWith('#')) {
                const hex = s.slice(1);
                if (hex.length === 3) {
                    const r = parseInt(hex[0] + hex[0], 16);
                    const g = parseInt(hex[1] + hex[1], 16);
                    const b = parseInt(hex[2] + hex[2], 16);
                    return `rgba(${r},${g},${b},${alpha})`;
                }
                if (hex.length === 6) {
                    const r = parseInt(hex.slice(0, 2), 16);
                    const g = parseInt(hex.slice(2, 4), 16);
                    const b = parseInt(hex.slice(4, 6), 16);
                    return `rgba(${r},${g},${b},${alpha})`;
                }
                return s;
            }
            if (s.startsWith('rgb(')) {
                const nums = s.replace(/rgb\(|\)/g, '').split(',').map((t) => t.trim());
                if (nums.length >= 3)
                    return `rgba(${nums[0]},${nums[1]},${nums[2]},${alpha})`;
                return s;
            }
            if (s.startsWith('hsl(') || s.startsWith('hsla(')) {
                if (s.includes('/')) {
                    return s.replace(/\/\s*[^)]+\)/, ` / ${alpha})`);
                }
                return s.replace(/\)\s*$/, ` / ${alpha})`);
            }
            if (/^[0-9.\-]+\s+[0-9.%]+\s+[0-9.%]+/.test(s)) {
                return `hsl(${s} / ${alpha})`;
            }
            return s;
        }
        catch (e) {
            return colorStr;
        }
    }
    const chartData = useMemo(() => ({
        labels: data.map(d => d.label),
        datasets: [
            {
                label: 'Total Catch Weight (kg)',
                data: data.map(d => Math.round(d.value)),
                borderColor: lineColor,
                backgroundColor: (ctx: any) => {
                    const { chart } = ctx;
                    const { ctx: c, chartArea } = chart as any;
                    if (!chartArea)
                        return withAlpha(lineColor, 0.2);
                    const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
                    gradient.addColorStop(0, withAlpha(lineColor, 0.2));
                    gradient.addColorStop(1, 'transparent');
                    return gradient;
                },
                tension: 0.35,
                pointRadius: 3,
                pointHoverRadius: 5,
                fill: true,
            },
        ],
    }), [data, lineColor, fillColor]);
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
                ticks: { color: textColor },
                grid: { display: false },
                title: { display: true, text: 'Time', color: textColor },
            },
            y: {
                ticks: { color: textColor },
                grid: { color: gridColor },
                title: { display: true, text: 'Total Catch Weight (kg)', color: textColor },
            },
        },
    }), [textColor, gridColor]);
    return (<div style={{ height: 360 }}>
      <Line data={chartData} options={options} updateMode="active"/>
    </div>);
};
export default CatchTrendLineChart;
