import { Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from "@mui/material";
import { InferenceDataRow, Side, Spin, Stroke } from "../models/InferenceDataRow";

interface InferenceDataPreviewTableProps {
  inferenceDataPreview: InferenceDataRow[];
};

export const InferenceDataPreviewTable = ({ inferenceDataPreview }: InferenceDataPreviewTableProps) => {
    return (
        <TableContainer component={Paper}>
        <Table stickyHeader size='small' style={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell>ms</TableCell>
              <TableCell>stroke</TableCell>
              <TableCell>side</TableCell>
              <TableCell>spin</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {inferenceDataPreview.map((row, index) => (
              <TableRow key={index}>
                <TableCell>{row.ms}</TableCell>
                <TableCell>{Stroke[row.stroke]}</TableCell>
                <TableCell>{Side[row.side]}</TableCell>
                <TableCell>{Spin[row.spin]}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    );
};