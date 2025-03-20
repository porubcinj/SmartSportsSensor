import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { SensorDataRow } from "../models/SensorDataRow";

interface SensorDataPreviewTableProps {
  sensorDataPreview: SensorDataRow[];
};

export const SensorDataPreviewTable = ({ sensorDataPreview }: SensorDataPreviewTableProps) => {
    return (
        <TableContainer component={Paper}>
        <Table stickyHeader size='small' style={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell>ms</TableCell>
              <TableCell>ax</TableCell>
              <TableCell>ay</TableCell>
              <TableCell>az</TableCell>
              <TableCell>gx</TableCell>
              <TableCell>gy</TableCell>
              <TableCell>gz</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sensorDataPreview.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.ms}</TableCell>
                <TableCell>{row.ax.toFixed(3)}</TableCell>
                <TableCell>{row.ay.toFixed(3)}</TableCell>
                <TableCell>{row.az.toFixed(3)}</TableCell>
                <TableCell>{row.gx.toFixed(3)}</TableCell>
                <TableCell>{row.gy.toFixed(3)}</TableCell>
                <TableCell>{row.gz.toFixed(3)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
};