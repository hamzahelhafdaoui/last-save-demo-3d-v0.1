// Low, continuous stone walkovers. Matching visible/physical slopes avoid relying
// on the capsule's autostep at a thin, raised plank edge.
export function walkoverSurface(
  x: number,
  z: number,
  width: number,
  depth: number,
) {
  const vertices: number[] = [],
    indices: number[] = [];
  const inner = [
    [-width / 2, -depth / 2],
    [-width / 2, depth / 2],
    [width / 2, depth / 2],
    [width / 2, -depth / 2],
  ];
  const outer = [
    [-width / 2 - 1, -depth / 2 - 1],
    [-width / 2 - 1, depth / 2 + 1],
    [width / 2 + 1, depth / 2 + 1],
    [width / 2 + 1, -depth / 2 - 1],
  ];
  for (const [dx, dz] of inner) vertices.push(x + dx, 0.25, z + dz);
  for (const [dx, dz] of outer) vertices.push(x + dx, 0.02, z + dz);
  indices.push(0, 1, 2, 0, 2, 3);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    indices.push(i, i + 4, j, i + 4, j + 4, j);
  }
  return { vertices, indices };
}
