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
  Flat = 0,
  Slice,
  Topspin,
  Count,
};

export type InferenceDataRow = {
  stroke: Stroke;
  side: Side;
  spin: Spin;
};