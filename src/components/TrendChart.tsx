import type { MetricPoint } from "../lib/reports";

interface TrendChartProps {
  points: MetricPoint[];
}

const width = 360;
const height = 190;
const padding = 34;

export function TrendChart({ points }: TrendChartProps) {
  const minValue = Math.min(90, ...points.map(point => point.value)) - 10;
  const maxValue = Math.max(140, ...points.map(point => point.value)) + 10;
  const weekValues = points.map((point) => point.week);
  const minWeek = Math.min(...weekValues, 10);
  const maxWeek = Math.max(...weekValues, 30);
  const coordinates = points.map((point) => ({
    ...point,
    x: scale(point.week, minWeek, maxWeek, padding, width - padding),
    y: scale(point.value, minValue, maxValue, height - padding, padding),
  }));
  const path = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg className="trend-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="血红蛋白 Hb 趋势图">
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} />
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} />
      <path d={path} />
      {coordinates.map((point, index) => (
        <g key={`${point.week}-${point.value}-${index}`}>
          <circle cx={point.x} cy={point.y} r="5" />
          <text x={point.x} y={point.y - 10}>
            {point.value}
          </text>
          <text className="week-label" x={point.x} y={height - 12}>
            {point.label}
          </text>
        </g>
      ))}
      <text className="band-label" x={width - padding} y={20}>
        Hb (g/L)
      </text>
    </svg>
  );
}

function scale(value: number, min: number, max: number, outMin: number, outMax: number): number {
  if (max === min) {
    return (outMin + outMax) / 2;
  }

  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}
