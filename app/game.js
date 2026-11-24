function normalize(name) {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

export function parseNames(text) {
  const unique = new Map();
  for (const line of text.split(/\r?\n/)) {
    const name = line.trim().replace(/\s+/g, ' ');
    if (name && !unique.has(normalize(name))) unique.set(normalize(name), name);
  }
  return [...unique.values()];
}

function offListName(allNames) {
  const occupied = new Set(allNames.map(normalize));
  const decoys = ['Đỗ Thanh Mai', 'Lâm Hoàng Phúc', 'Vũ Minh Châu', 'Bùi Khánh Linh'];
  const available = decoys.filter(name => !occupied.has(normalize(name)));
  if (available.length) return available[Math.floor(Math.random() * available.length)];

  let number = 1;
  while (occupied.has(normalize(`Khách quán trà ${number}`))) number++;
  return `Khách quán trà ${number}`;
}

function draw(allNames, remaining, goal) {
  if (allNames.length - remaining.length < goal && Math.random() < 0.65) {
    const index = Math.floor(Math.random() * remaining.length);
    return { name: remaining.splice(index, 1)[0], hit: true };
  }
  return { name: offListName(allNames), hit: false };
}


export function createRound(allNames, pool, goal, count) {
  const remaining = [...pool];
  const tickets = Array.from({ length: count }, () => ({
    ...draw(allNames, remaining, goal),
    open: false,
  }));
  return { remaining, tickets };
}
