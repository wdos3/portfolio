import type { WheelVariant } from '../data/portfolio';

// Rails, segment boundaries, and content share this cylindrical design space.
export const wheelGeometry = {
  width: 360,
  height: 640,
  itemAngle: 0.48,
  radius: 205,
  focusY: 310,
  headingY: 150,
  entriesTop: 190,
};

export interface RailCurve {
  edge: number;
  control: number;
  top: number;
  bottom: number;
}

export const centerRail: RailCurve = { edge: 66, control: 25, top: 70, bottom: 600 };
export const centerBack: RailCurve = { ...centerRail, edge: 50, control: 5 };
export const outerRail: RailCurve = { edge: 125, control: 20, top: 0, bottom: 640 };
export const outerBack: RailCurve = { ...outerRail, control: -18 };
export const innerRail: RailCurve = { edge: 344, control: 320, top: 70, bottom: 600 };

export function mirrorRail(rail: RailCurve): RailCurve {
  return { ...rail, edge: wheelGeometry.width - rail.edge, control: wheelGeometry.width - rail.control };
}

export function railPath({ edge, control, top, bottom }: RailCurve) {
  const third = (bottom - top) / 3;
  return `M ${edge} ${top} C ${control} ${top + third} ${control} ${bottom - third} ${edge} ${bottom}`;
}

export function railX(rail: RailCurve, y: number) {
  // These cubic rails have linear y(t), allowing exact separator intersections.
  const t = Math.max(0, Math.min(1, (y - rail.top) / (rail.bottom - rail.top)));
  return rail.edge + 3 * (rail.control - rail.edge) * t * (1 - t);
}

export function rowGeometry(y: number, variant: WheelVariant) {
  if (variant === 'center') {
    const inset = railX(centerRail, y);
    return { left: inset, right: wheelGeometry.width - inset, leftY: y, rightY: y, skew: 0 };
  }
  const tilt = (y - 330) * 0.07;
  const leftY = y + tilt;
  const rightY = y - tilt;
  const left = railX(outerRail, leftY);
  const right = railX(innerRail, rightY);
  const skew = Math.atan2(rightY - leftY, right - left) * 180 / Math.PI;
  return variant === 'right'
    ? { left: wheelGeometry.width - right, right: wheelGeometry.width - left, leftY: rightY, rightY: leftY, skew: -skew }
    : { left, right, leftY, rightY, skew };
}

export function focusBounds(variant: WheelVariant) {
  const row = rowGeometry(wheelGeometry.focusY, variant);
  const back = railX(variant === 'center' ? centerBack : outerBack, wheelGeometry.focusY);
  return {
    left: (variant === 'right' ? row.left : back) / wheelGeometry.width,
    right: (variant === 'left' ? row.right : wheelGeometry.width - back) / wheelGeometry.width,
  };
}

interface Point { x: number; y: number }
export interface WheelSize { width: number; height: number }

// Maps a flat cell onto its four projected cylindrical corners. A projective
// transform (rather than separate translate/scale guesses) keeps every child
// attached to the same surface, including when its edges aren't parallel.
function projectCell([a, b, c, d]: Point[], width: number, height: number) {
  const dx = a.x - b.x + c.x - d.x;
  const dy = a.y - b.y + c.y - d.y;
  const determinant = (b.x - c.x) * (d.y - c.y) - (d.x - c.x) * (b.y - c.y);
  const g = (dx * (d.y - c.y) - (d.x - c.x) * dy) / determinant;
  const h = ((b.x - c.x) * dy - dx * (b.y - c.y)) / determinant;
  return `matrix3d(${[
    (b.x - a.x + g * b.x) / width, (b.y - a.y + g * b.y) / width, 0, g / width,
    (d.x - a.x + h * d.x) / height, (d.y - a.y + h * d.y) / height, 0, h / height,
    0, 0, 1, 0, a.x, a.y, 0, 1,
  ].join(',')})`;
}

export function segmentGeometry(offset: number, variant: WheelVariant, size: WheelSize) {
  const { itemAngle, radius, focusY, entriesTop, width, height } = wheelGeometry;
  const angle = offset * itemAngle;
  const visible = Math.abs(angle) < 1.4;
  const depth = Math.max(0, Math.cos(angle));
  const fade = Math.max(0, Math.min(1, (1.4 - Math.abs(angle)) / 0.25));
  const yAt = (angle: number) => focusY + radius * Math.sin(Math.max(-Math.PI / 2, Math.min(Math.PI / 2, angle)));
  const top = rowGeometry(yAt(angle - itemAngle / 2), variant);
  const bottom = rowGeometry(yAt(angle + itemAngle / 2), variant);
  const focused = rowGeometry(focusY, variant);
  const cellWidth = (focused.right - focused.left) * size.width / width;
  const cellHeight = 2 * radius * Math.sin(itemAngle / 2) * size.height / height;
  const corners = [
    { x: top.left, y: top.leftY }, { x: top.right, y: top.rightY },
    { x: bottom.right, y: bottom.rightY }, { x: bottom.left, y: bottom.leftY },
  ].map(point => ({ x: point.x * size.width / width, y: point.y * size.height / height }));
  // Back-facing cells stay mounted for keyboard selection, but never fold over
  // visible neighbours or produce a singular projective matrix.
  const transform = visible ? projectCell(corners, cellWidth, cellHeight) : 'none';
  const clearance = Math.max(0, Math.min(1, (yAt(angle) - entriesTop) / 36));
  return { width: cellWidth, height: cellHeight, transform, visible, depth: depth ** 4, fade: fade * clearance };
}
