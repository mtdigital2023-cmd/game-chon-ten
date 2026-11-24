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

export function drawTicket(roster, remaining) {
  if (Math.random() < 0.65) {
    const index = Math.floor(Math.random() * remaining.length);
    return { name: remaining[index], hit: true };
  }

  return { name: offListName(roster), hit: false };
}
