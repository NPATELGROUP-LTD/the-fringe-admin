'use client';

import { useEffect, useRef } from 'react';

interface DataPoint {
  label: string;
  value: number;
  color?: string;
}

interface StatisticsChartProps {
  data: DataPoint[];
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  title?: string;
  height?: number;
  showLegend?: boolean;
}

export default function StatisticsChart({
  data,
  type,
  title,
  height = 300,
  showLegend = true
}: StatisticsChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !data.length) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - (padding * 2);
    const chartHeight = height - (padding * 2);

    if (type === 'bar') {
      drawBarChart(ctx, data, chartWidth, chartHeight, padding);
    } else if (type === 'line') {
      drawLineChart(ctx, data, chartWidth, chartHeight, padding);
    } else if (type === 'pie' || type === 'doughnut') {
      drawPieChart(ctx, data, chartWidth, chartHeight, padding, type === 'doughnut');
    }
  }, [data, type, height]);

  const drawBarChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    chartWidth: number,
    chartHeight: number,
    padding: number
  ) => {
    const barWidth = chartWidth / data.length;
    const maxValue = Math.max(...data.map(d => d.value));

    data.forEach((point, index) => {
      const barHeight = (point.value / maxValue) * chartHeight;
      const x = padding + (index * barWidth);
      const y = padding + chartHeight - barHeight;

      // Draw bar
      ctx.fillStyle = point.color || `hsl(${index * 360 / data.length}, 70%, 50%)`;
      ctx.fillRect(x + 5, y, barWidth - 10, barHeight);

      // Draw value label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(
        point.value.toString(),
        x + barWidth / 2,
        y - 5
      );

      // Draw label
      ctx.fillText(
        point.label,
        x + barWidth / 2,
        padding + chartHeight + 15
      );
    });
  };

  const drawLineChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    chartWidth: number,
    chartHeight: number,
    padding: number
  ) => {
    const maxValue = Math.max(...data.map(d => d.value));
    const pointSpacing = chartWidth / (data.length - 1);

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.beginPath();

    data.forEach((point, index) => {
      const x = padding + (index * pointSpacing);
      const y = padding + chartHeight - (point.value / maxValue) * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }

      // Draw point
      ctx.fillStyle = '#3b82f6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fill();

      // Draw label
      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, x, padding + chartHeight + 15);
    });

    ctx.stroke();
  };

  const drawPieChart = (
    ctx: CanvasRenderingContext2D,
    data: DataPoint[],
    chartWidth: number,
    chartHeight: number,
    padding: number,
    isDoughnut: boolean
  ) => {
    const centerX = padding + chartWidth / 2;
    const centerY = padding + chartHeight / 2;
    const radius = Math.min(chartWidth, chartHeight) / 2;
    const innerRadius = isDoughnut ? radius * 0.6 : 0;

    const total = data.reduce((sum, d) => sum + d.value, 0);
    let currentAngle = -Math.PI / 2; // Start at top

    data.forEach((point, index) => {
      const sliceAngle = (point.value / total) * Math.PI * 2;

      // Draw slice
      ctx.fillStyle = point.color || `hsl(${index * 360 / data.length}, 70%, 50%)`;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();

      // Draw inner circle for doughnut
      if (isDoughnut) {
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(centerX, centerY, innerRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius + 20;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;

      ctx.fillStyle = '#000';
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(point.label, labelX, labelY);

      currentAngle += sliceAngle;
    });
  };

  return (
    <div className="bg-white p-4 rounded-lg border">
      {title && (
        <h3 className="text-lg font-semibold mb-4 text-center">{title}</h3>
      )}
      <canvas
        ref={canvasRef}
        width={400}
        height={height}
        className="w-full"
      />
      {showLegend && data.length > 0 && (
        <div className="flex flex-wrap justify-center gap-4 mt-4">
          {data.map((point, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded"
                style={{
                  backgroundColor: point.color || `hsl(${index * 360 / data.length}, 70%, 50%)`
                }}
              />
              <span className="text-sm">{point.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}