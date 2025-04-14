export enum Stroke {
  Serve,
  Groundstroke,
  Volley,
  Overhead,
  Count,
};

export enum Side {
  Forehand,
  Backhand,
  Count,
};

export enum Spin {
  Topspin,
  Flat,
  Slice,
  Count,
};

export type InferenceDataRow = {
  ms: number;
  stroke: Stroke;
  side: Side;
  spin: Spin;
};