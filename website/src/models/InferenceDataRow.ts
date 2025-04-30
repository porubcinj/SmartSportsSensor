export enum Classification {
  FlatForehandServe,
  SliceForehandServe,
  TopspinForehandServe,
  FlatForehandGroundstroke,
  SliceForehandGroundstroke,
  TopspinForehandGroundstroke,
  FlatBackhandGroundstroke,
  SliceBackhandGroundstroke,
  TopspinBackhandGroundstroke,
  SliceForehandVolley,
  SliceBackhandVolley,
  FlatForehandOverhead,
  SliceForehandOverhead,
  Count,
};

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

export function classificationToDetails(classification: Classification): { stroke: Stroke, side: Side, spin: Spin } {
  switch (classification) {
    case Classification.FlatForehandServe:
      return { stroke: Stroke.Serve, side: Side.Forehand, spin: Spin.Flat };
    case Classification.SliceForehandServe:
      return { stroke: Stroke.Serve, side: Side.Forehand, spin: Spin.Slice };
    case Classification.TopspinForehandServe:
      return { stroke: Stroke.Serve, side: Side.Forehand, spin: Spin.Topspin };
    case Classification.FlatForehandGroundstroke:
      return { stroke: Stroke.Groundstroke, side: Side.Forehand, spin: Spin.Flat };
    case Classification.SliceForehandGroundstroke:
      return { stroke: Stroke.Groundstroke, side: Side.Forehand, spin: Spin.Slice };
    case Classification.TopspinForehandGroundstroke:
      return { stroke: Stroke.Groundstroke, side: Side.Forehand, spin: Spin.Topspin };
    case Classification.FlatBackhandGroundstroke:
      return { stroke: Stroke.Groundstroke, side: Side.Backhand, spin: Spin.Flat };
    case Classification.SliceBackhandGroundstroke:
      return { stroke: Stroke.Groundstroke, side: Side.Backhand, spin: Spin.Slice };
    case Classification.TopspinBackhandGroundstroke:
      return { stroke: Stroke.Groundstroke, side: Side.Backhand, spin: Spin.Topspin };
    case Classification.SliceForehandVolley:
      return { stroke: Stroke.Volley, side: Side.Forehand, spin: Spin.Slice };
    case Classification.SliceBackhandVolley:
      return { stroke: Stroke.Volley, side: Side.Backhand, spin: Spin.Slice };
    case Classification.FlatForehandOverhead:
      return { stroke: Stroke.Overhead, side: Side.Forehand, spin: Spin.Flat };
    case Classification.SliceForehandOverhead:
      return { stroke: Stroke.Overhead, side: Side.Forehand, spin: Spin.Slice };
    default:
      return { stroke: Stroke.Count, side: Side.Count, spin: Spin.Count }; // fallback
  }
};

export type InferenceDataRow = {
  ms: number;
  stroke: Stroke;
  side: Side;
  spin: Spin;
};