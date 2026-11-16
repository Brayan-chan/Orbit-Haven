export interface OrbitalControlInput {
  px: number; py: number; vx: number; vy: number;
  cx: number; cy: number;
  thrust: number; steer: number;
  radialPower: number; tangentPower: number; liftPower?: number;
}

/** Control validado en el laboratorio: elevación radial + maniobra tangencial sin borrar inercia. */
export function orbitalControl(i: OrbitalControlInput) {
  const dx = i.px - i.cx;
  const dy = i.py - i.cy;
  const d = Math.hypot(dx, dy) || 1;
  const rx = dx / d;
  const ry = dy / d;
  let tx = -ry;
  let ty = rx;
  if (i.vx * tx + i.vy * ty < 0) { tx = -tx; ty = -ty; }
  const radial = i.radialPower * i.thrust;
  // Un mínimo conserva el flujo; arrastrar permite frenar, sostener o acelerar el giro.
  const tangent = (0.2 + i.steer) * i.tangentPower * i.thrust;
  const lift = (i.liftPower ?? 0) * i.thrust;
  return { ax: rx * radial + tx * tangent, ay: ry * radial + ty * tangent - lift, rx, ry };
}
