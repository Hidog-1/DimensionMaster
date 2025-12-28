
export type Point = {
  x: number;
  y: number;
};

export type LineStyle = 'solid' | 'dashed';

export type MeasurementLine = {
  id: string;
  start: Point;
  end: Point;
  lengthCm: number;
  color: string;
  label?: string;
  style: LineStyle;
  thickness: number;
};

export type Calibration = {
  pixels: number;
  cm: number;
};

export enum Tool {
  SELECT = 'select',
  LINE = 'line',
  CALIBRATE = 'calibrate',
  MOVE = 'move'
}

export enum Unit {
  CM = 'cm',
  INCH = 'inch',
  BOTH = 'both'
}
