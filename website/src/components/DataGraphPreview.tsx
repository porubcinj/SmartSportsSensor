import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Paper, Box } from "@mui/material";
import { SensorDataRow } from "../models/SensorDataRow";
import { useState, useEffect } from "react";

interface SensorDataGraphProps {
  sensorDataPreview: SensorDataRow[];
}

export const SensorDataGraph = ({ sensorDataPreview }: SensorDataGraphProps) => {
  const [graphData, setGraphData] = useState<{ time: number; A_total: number; G_total: number }[]>([]);
  const MAX_TIME_WINDOW = 10000; // 15 seconds in milliseconds, then sliding window
  const [startTime, setStartTime] = useState<number | null>(null);

  useEffect(() => {

    if (sensorDataPreview.length === 0) {
      setGraphData([]);
      setStartTime(null);
    }
    
    if (sensorDataPreview.length > 0) {
      if (startTime === null) {
        setStartTime(sensorDataPreview[0].ms);
      }

      const newData = sensorDataPreview.map((row) => ({
        time: row.ms - (startTime ?? row.ms), // Normalize time so it starts at 0
        A_total: Math.sqrt(row.ax ** 2 + row.ay ** 2 + row.az ** 2),
        G_total: Math.sqrt(row.gx ** 2 + row.gy ** 2 + row.gz ** 2),
      }));

      setGraphData((prevData) => {
        const updatedData = [...prevData, ...newData];

        // Ensure sliding window effect: Keep only last 20 seconds of data
        const latestTime = updatedData[updatedData.length - 1].time;
        return updatedData.filter((d) => latestTime - d.time <= MAX_TIME_WINDOW);
      });
    }
  }, [sensorDataPreview]);

  return (
    <Box display="flex" justifyContent="space-between" gap={2}>
      {/* Acceleration Graph */}
      <Paper style={{ flex: 1, padding: "20px" }}>
        <h3>Acceleration</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" domain={[0, MAX_TIME_WINDOW]} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="A_total" stroke="red" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>

      {/* Gyroscope Graph */}
      <Paper style={{ flex: 1, padding: "20px" }}>
        <h3>Gyroscope</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={graphData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="time" domain={[0, MAX_TIME_WINDOW]} />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="G_total" stroke="blue" dot={false} />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
};
