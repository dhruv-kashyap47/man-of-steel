"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { format } from "date-fns";
import type { SensorReading } from "@/types/database";

interface SensorChartProps {
  readings: SensorReading[];
  metrics?: Array<keyof Pick<SensorReading, "temperature_c" | "pressure_bar" | "rpm" | "vibration_mm_s">>;
  height?: number;
}

const COLORS = {
  temperature_c: "#6C8EFF",
  pressure_bar: "#5CC489",
  rpm: "#E6B450",
  vibration_mm_s: "#E76F51",
};

const LABELS = {
  temperature_c: "Temp (°C)",
  pressure_bar: "Pressure (bar)",
  rpm: "RPM",
  vibration_mm_s: "Vibration (mm/s)",
};

export function SensorChart({
  readings,
  metrics = ["temperature_c", "vibration_mm_s"],
  height = 280,
}: SensorChartProps) {
  const data = readings.map((r) => ({
    time: format(new Date(r.recorded_at), "MMM d HH:mm"),
    temperature_c: r.temperature_c,
    pressure_bar: r.pressure_bar,
    rpm: r.rpm,
    vibration_mm_s: r.vibration_mm_s,
  }));

  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2E3643" />
        <XAxis
          dataKey="time"
          tick={{ fontSize: 10, fill: "#9AA4B2" }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis tick={{ fontSize: 10, fill: "#9AA4B2" }} tickLine={false} width={45} />
        <Tooltip
          contentStyle={{
            background: "#1C2128",
            border: "1px solid #2E3643",
            borderRadius: 8,
            fontSize: 12,
          }}
        />
        <Legend wrapperStyle={{ fontSize: 11 }} />
        {metrics.map((metric) => (
          <Line
            key={metric}
            type="monotone"
            dataKey={metric}
            name={LABELS[metric]}
            stroke={COLORS[metric]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
