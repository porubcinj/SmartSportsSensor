export enum Stroke {
  Serve = 0,
  Groundstroke,
  Volley,
  Overhead,
  Count,
};

export enum Side {
  Forehand = 0,
  Backhand,
  Count,
};

export enum Spin {
  Topspin = 0,
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