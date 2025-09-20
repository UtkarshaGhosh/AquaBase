import React, { useMemo } from 'react';
import { Line } from 'react-chartjs-2';
import { ensureChartJSRegistered } from './chartSetup';

export interface TrendDatum {
  label: string; // e.g., 'Jul 2024'
  value: number; // kg
}

function getCssVar(name: string, fallback: string) {
  const val = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return val || fallback;
}

export const CatchTrendLineChart = ({ data }: { data: TrendDatum[] }) => {
  ensureChartJSRegistered();

  const lineColor = getCssVar('--primary', 'rgb(59,130,246)');
  const gridColor = getCssVar('--border', 'rgba(0,0,0,0.1)');
  const textColor = getCssVar('--foreground', '#111827');
  const fillColor = getCssVar('--accent', 'rgba(59,130,246,0.15)');

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
          if (!chartArea) return fillColor;
          const gradient = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${lineColor}33`); // ~0.2 alpha
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

  return (
    <div style={{ height: 360 }}>
      <Line data={chartData} options={options} updateMode="active" />
    </div>
  );
};

export default CatchTrendLineChart;
