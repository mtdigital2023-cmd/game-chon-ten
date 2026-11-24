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

const scratchStyles = ['given-first', 'surname-first', 'middle-first'];
const surnames = ['Nguyễn', 'Trần', 'Lê', 'Phạm', 'Hoàng', 'Vũ', 'Đỗ', 'Bùi', 'Trương'];
const givenNames = ['An', 'Hà', 'Hân', 'Huy', 'Linh', 'Mai', 'Nam', 'Phúc', 'Tiền', 'Vy'];

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function offListName(roster, remaining, style) {
  const occupied = new Set(roster.map(normalize));
  const words = pick(remaining).split(' ');
  const changeGiven = style === 'surname-first' && words.length > 1;
  const alternatives = changeGiven
    ? givenNames.map(name => [...words.slice(0, -1), name].join(' '))
    : surnames.map(name => [name, ...words.slice(words.length === 1 ? 0 : 1)].join(' '));
  const available = alternatives.filter(name => !occupied.has(normalize(name)));
  if (available.length) return pick(available);

  // Retain the similar part even when the roster contains every common variant.
  let alternative = alternatives[0];
  do {
    alternative = changeGiven ? `${alternative} Anh` : `Hà ${alternative}`;
  } while (occupied.has(normalize(alternative)));
  return alternative;
}

export function drawTicket(roster, remaining, missesLeft, serial) {
  const style = scratchStyles[serial % scratchStyles.length];
  if (missesLeft === 0) return { name: pick(remaining), hit: true, style };

  return { name: offListName(roster, remaining, style), hit: false, style };
}
