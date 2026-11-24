'use strict';

const setup = document.querySelector('#setup');
const names = document.querySelector('#names');
const count = document.querySelector('#count');
const play = document.querySelector('#play');
const cards = document.querySelector('#cards');
const status = document.querySelector('#status');
const next = document.querySelector('#next');
const history = document.querySelector('#history');
const storageKey = 'den-luot-ai.players';

let allNames = [];
let remaining = [];
let unopened = 0;
let round = 0;

try {
  names.value = localStorage.getItem(storageKey) || '';
} catch {
  // A blocked storage area does not prevent play.
}

function normalize(name) {
  return name.normalize('NFC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('vi');
}

function parseNames(text) {
  const unique = new Map();
  for (const line of text.split(/\r?\n/)) {
    const name = line.trim().replace(/\s+/g, ' ');
    if (name && !unique.has(normalize(name))) unique.set(normalize(name), name);
  }
  return [...unique.values()];
}

function offListName() {
  const occupied = new Set(allNames.map(normalize));
  const decoys = ['Đỗ Thanh Mai', 'Lâm Hoàng Phúc', 'Vũ Minh Châu', 'Bùi Khánh Linh'];
  const available = decoys.filter(name => !occupied.has(normalize(name)));
  if (available.length) return available[Math.floor(Math.random() * available.length)];

  let number = 1;
  while (occupied.has(normalize(`Khách quán trà ${number}`))) number++;
  return `Khách quán trà ${number}`;
}

function draw() {
  if (remaining.length && Math.random() < 0.65) {
    const index = Math.floor(Math.random() * remaining.length);
    return { name: remaining.splice(index, 1)[0], hit: true };
  }
  return { name: offListName(), hit: false };
}

function createTicket(index, outcome) {
  const ticket = document.createElement('article');
  ticket.className = 'ticket';
  const title = document.createElement('p');
  title.className = 'ticket-title';
  title.textContent = `Phiếu ${index + 1}`;

  const scratch = document.createElement('div');
  scratch.className = 'scratch';
  const result = document.createElement('div');
  result.className = 'ticket-result';
  result.textContent = outcome.name;
  result.setAttribute('aria-hidden', 'true');

  const canvas = document.createElement('canvas');
  canvas.width = 320;
  canvas.height = 96;
  canvas.setAttribute('aria-hidden', 'true');

  const open = document.createElement('button');
  open.type = 'button';
  open.className = 'open-ticket';
  open.textContent = `Mở phiếu ${index + 1}`;

  function reveal() {
    canvas.remove();
    open.disabled = true;
    result.removeAttribute('aria-hidden');
    result.textContent = outcome.hit
      ? `${outcome.name} · Đúng tên!`
      : `${outcome.name} · Ngoài danh sách`;
    if (outcome.hit) {
      const item = document.createElement('li');
      item.textContent = outcome.name;
      history.append(item);
    }

    unopened--;
    const complete = unopened === 0;
    const finished = complete && remaining.length === 0;
    next.disabled = !complete || finished;
    const summary = finished ? ' Đã gọi hết danh sách.' : '';
    status.textContent = `Phiếu ${index + 1}: ${result.textContent}.${summary}`;
    const focusTarget = cards.querySelector('button:not(:disabled)') || (finished ? document.querySelector('#edit') : next);
    focusTarget.focus();
  }

  open.addEventListener('click', reveal);
  scratch.append(result, canvas);
  ticket.append(title, scratch, open);

  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    canvas.remove();
    result.textContent = '';
    return ticket;
  }

  const foil = ctx.createLinearGradient(0, 0, 320, 96);
  foil.addColorStop(0, '#c7cfcb');
  foil.addColorStop(0.5, '#edf2ee');
  foil.addColorStop(1, '#a9b7b0');
  ctx.fillStyle = foil;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#23483b';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 18px system-ui';
  ctx.fillText('CÀO Ở ĐÂY', 160, 48);
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineWidth = 25;
  let pointer = null;
  let last;

  function erase(event) {
    const bounds = canvas.getBoundingClientRect();
    const x = (event.clientX - bounds.left) * canvas.width / bounds.width;
    const y = (event.clientY - bounds.top) * canvas.height / bounds.height;
    const from = last || { x: x + 0.1, y };
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(x, y);
    ctx.stroke();
    last = { x, y };

    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    let cleared = 0;
    for (let alpha = 3; alpha < data.length; alpha += 32) {
      if (data[alpha] === 0) cleared++;
    }
    if (cleared >= canvas.width * canvas.height / 8 * 0.36) reveal();
  }

  canvas.addEventListener('pointerdown', event => {
    if (pointer !== null || event.button !== 0) return;
    pointer = event.pointerId;
    canvas.setPointerCapture(pointer);
    erase(event);
  });
  canvas.addEventListener('pointermove', event => {
    if (pointer === event.pointerId) erase(event);
  });
  canvas.addEventListener('lostpointercapture', () => {
    pointer = null;
    last = null;
  });
  return ticket;
}

function startRound() {
  round++;
  unopened = Number(count.value);
  cards.replaceChildren(...Array.from({ length: unopened }, (_, index) => createTicket(index, draw())));
  status.textContent = `Lượt ${round}. Cào hết phiếu để tiếp tục.`;
  next.disabled = true;
  cards.querySelector('button').focus();
}

setup.addEventListener('submit', event => {
  event.preventDefault();
  allNames = parseNames(names.value);
  if (!allNames.length) {
    names.setCustomValidity('Hãy nhập ít nhất một tên.');
    names.reportValidity();
    return;
  }

  names.value = allNames.join('\n');
  try {
    localStorage.setItem(storageKey, names.value);
  } catch {
    // A blocked storage area does not prevent play.
  }

  remaining = [...allNames];
  round = 0;
  history.replaceChildren();
  setup.hidden = true;
  play.hidden = false;
  startRound();
});

names.addEventListener('input', () => names.setCustomValidity(''));
next.addEventListener('click', startRound);
document.querySelector('#edit').addEventListener('click', () => {
  play.hidden = true;
  setup.hidden = false;
  names.focus();
});
