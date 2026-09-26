export function clusterMapNodes(entries) {
  const nodes = entries.filter(node => Number.isFinite(node.x) && Number.isFinite(node.y))
    .slice().sort((a, b) => Number(Boolean(b.primary)) - Number(Boolean(a.primary)) || a.key.localeCompare(b.key));
  const groups = [];
  const intersects = (a, b) => a.radius > 0 && b.radius > 0
    && Math.hypot(a.x - b.x, a.y - b.y) < a.radius + b.radius;
  // Every member must overlap every other visible circle, not just a neighbor in a chain.
  nodes.forEach(node => {
    const group = groups.find(members => members.every(member => intersects(node, member)));
    if (group) group.push(node);
    else groups.push([node]);
  });
  return groups.map(members => {
    const anchor = members[0];
    return { keys: members.map(node => node.key), anchorKey: anchor.key, x: anchor.x, y: anchor.y };
  });
}
