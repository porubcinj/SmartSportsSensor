import { Stroke, Side, Spin } from "./InferenceDataRow";

export type SensorDataRow = {
  ms: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  stroke: Stroke;
  side: Side;
  spin: Spin;
};