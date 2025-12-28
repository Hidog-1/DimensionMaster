
import { Point } from '../types';

export const calculateDistance = (p1: Point, p2: Point): number => {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
};

export const cmToInch = (cm: number): number => cm * 0.393701;
export const inchToCm = (inch: number): number => inch / 0.393701;

export const formatValue = (val: number): string => {
  return val.toFixed(2).replace(/\.00$/, '');
};
