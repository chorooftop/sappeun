export function halfEllipsePath(
  x: number,
  y: number,
  width: number,
  height: number,
) {
  const rx = width / 2
  const ry = height / 2
  const cy = y + ry
  return `M${x} ${cy}A${rx} ${ry} 0 0 1 ${x + width} ${cy}L${x + width} ${y + height}H${x}Z`
}
