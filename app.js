'use strict';

const storageKey = 'den-luot-ai.players';
const form = document.querySelector('#player-form');
const names = document.querySelector('#names');
const cards = document.querySelector('#cards');
const progress = document.querySelector('#progress');
const result = document.querySelector('#result');
const reset = document.querySelector('#reset');
const history = document.querySelector('#history');
const historyEmpty = document.querySelector('#history-empty');

let players = [];
let remaining = [];

function readSavedNames() {
  try {
    return localStorage.getItem(storageKey) || '';
  } catch {
    return '';
  }
}

function saveNames(value) {
  try {
    localStorage.setItem(storageKey, value);
  } catch {
    // The game still works when storage is unavailable.
  }
}

function updateProgress() {
  progress.textContent = players.length
    ? `Còn ${remaining.length}/${players.length} người chơi`
    : 'Chưa có người chơi';
}

function reveal(card) {
  if (card.disabled || remaining.length === 0) return;

  const index = Math.floor(Math.random() * remaining.length);
  const [player] = remaining.splice(index, 1);
  card.textContent = player;
  card.disabled = true;

  const entry = document.createElement('li');
  entry.textContent = player;
  history.append(entry);
  historyEmpty.hidden = true;
  updateProgress();
  result.textContent = remaining.length
    ? `Đến lượt ${player}!`
    : `Đến lượt ${player}! Tất cả người chơi đã được gọi.`;

  (cards.querySelector('button:not(:disabled)') || reset).focus();
}

function startRound() {
  remaining = [...players];
  cards.replaceChildren();
  history.replaceChildren();
  historyEmpty.hidden = false;
  reset.disabled = players.length === 0;
  updateProgress();

  result.textContent = players.length
    ? 'Chọn một thẻ để bắt đầu.'
    : 'Nhập danh sách người chơi để bắt đầu.';

  players.forEach((_, index) => {
    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'card';
    card.setAttribute('aria-label', `Lật thẻ ${index + 1}`);

    const symbol = document.createElement('span');
    symbol.className = 'card-symbol';
    symbol.textContent = '✦';
    symbol.setAttribute('aria-hidden', 'true');

    const number = document.createElement('span');
    number.className = 'card-number';
    number.textContent = `Thẻ ${index + 1}`;
    card.append(symbol, number);
    card.addEventListener('click', () => {
      card.removeAttribute('aria-label');
      reveal(card);
    });
    cards.append(card);
  });
}

function parseNames(value) {
  return value.split(/\r?\n/).map(name => name.trim()).filter(Boolean);
}

form.addEventListener('submit', event => {
  event.preventDefault();
  const list = parseNames(names.value);
  if (!list.length) {
    names.setCustomValidity('Hãy nhập ít nhất một tên.');
    names.reportValidity();
    return;
  }
  players = list;
  names.value = list.join('\n');
  saveNames(names.value);
  startRound();
  cards.firstElementChild.focus();
});

names.addEventListener('input', () => names.setCustomValidity(''));
reset.addEventListener('click', () => {
  startRound();
  cards.firstElementChild?.focus();
});

names.value = readSavedNames();
players = parseNames(names.value);
startRound();
