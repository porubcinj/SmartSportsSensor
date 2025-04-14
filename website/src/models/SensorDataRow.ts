import { Stroke, Side, Spin } from "./InferenceDataRow";

export type SensorDataRow = {
  ms: number;
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
  stroke: Stroke | null;
  side: Side | null;
  spin: Spin | null;
};