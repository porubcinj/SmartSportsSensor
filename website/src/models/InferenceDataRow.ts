export enum Stroke {
  Serve = 0,
  Groundstroke,
  Volley,
  Overhead,
  Count,
  None,
};

export enum Side {
  Forehand = 0,
  Backhand,
  Count,
  None,
};

export enum Spin {
  Flat = 0,
  Slice,
  Topspin,
  Count,
  None,
};

export type InferenceDataRow = {
  stroke: Stroke;
  side: Side;
  spin: Spin;
};