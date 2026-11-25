const duration = 6600;
const reducedDuration = 300;
const maxPixelRatio = 2;
const samplesPerStroke = 12;

function easeInOut(t) {
  return 0.5 - Math.cos(Math.PI * t) / 2;
}

function orderCells(cells, style) {
  if (style === 'given-first') return [...cells].reverse();
  if (style === 'middle-first') {
    const center = Math.floor((cells.length - 1) / 2);
    return [...cells.slice(0, center + 1).reverse(), ...cells.slice(center + 1)];
  }
  return cells;
}

// Split the whole foil into one cell per word, so scratching every cell clears every pixel
// while a word stays hidden until its own turn.
function measureCells(canvas, words) {
  const bounds = canvas.getBoundingClientRect();
  const lines = [];
  for (const [index, word] of words.entries()) {
    const box = word.getBoundingClientRect();
    const item = {
      index,
      left: box.left - bounds.left,
      right: box.right - bounds.left,
      top: box.top - bounds.top,
      bottom: box.bottom - bounds.top,
    };
    const middle = (item.top + item.bottom) / 2;
    const line = lines.find(row => middle > row.top && middle < row.bottom);
    if (line) {
      line.items.push(item);
      line.top = Math.min(line.top, item.top);
      line.bottom = Math.max(line.bottom, item.bottom);
    } else {
      lines.push({ top: item.top, bottom: item.bottom, items: [item] });
    }
  }

  lines.sort((a, b) => a.top - b.top);
  const cells = [];
  for (const [row, line] of lines.entries()) {
    const top = row ? (lines[row - 1].bottom + line.top) / 2 : 0;
    const bottom = row < lines.length - 1 ? (line.bottom + lines[row + 1].top) / 2 : bounds.height;
    line.items.sort((a, b) => a.left - b.left);
    for (const [column, item] of line.items.entries()) {
      const previous = line.items[column - 1];
      const next = line.items[column + 1];
      cells[item.index] = {
        left: previous ? (previous.right + item.left) / 2 : 0,
        right: next ? (item.right + next.left) / 2 : bounds.width,
        top,
        bottom,
      };
    }
  }
  return { width: bounds.width, height: bounds.height, cells };
}

function sameLayout(a, b) {
  if (!a || Math.abs(a.width - b.width) > 0.5 || Math.abs(a.height - b.height) > 0.5) return false;
  return a.cells.every((cell, index) => ['left', 'right', 'top', 'bottom']
    .every(side => Math.abs(cell[side] - b.cells[index][side]) < 0.5));
}

// Back-and-forth coin strokes, slightly tilted and bowed like a hand, spaced so the
// coin's width overlaps the previous stroke and leaves no foil behind.
function buildPath(cell, reverse, radius) {
  const insetX = Math.min(radius * 0.55, (cell.right - cell.left) / 2);
  const insetY = Math.min(radius * 0.5, (cell.bottom - cell.top) / 2);
  const from = reverse ? cell.right - insetX : cell.left + insetX;
  const to = reverse ? cell.left + insetX : cell.right - insetX;
  const top = cell.top + insetY;
  const bottom = cell.bottom - insetY;
  const count = Math.max(2, Math.ceil(Math.abs(to - from) / (radius * 1.1)) + 1);
  const points = [];
  const strokes = [];
  let length = 0;

  for (let stroke = 0; stroke < count; stroke++) {
    const x = from + (to - from) * stroke / (count - 1);
    const down = stroke % 2 === 0;
    const start = length;
    for (let sample = 0; sample <= samplesPerStroke; sample++) {
      const t = sample / samplesPerStroke;
      const point = {
        x: x + (t - 0.5) * radius * 0.35 + Math.sin(t * Math.PI) * radius * 0.28 * (down ? 1 : -1),
        y: down ? top + (bottom - top) * t : bottom - (bottom - top) * t,
      };
      const last = points.at(-1);
      if (last) length += Math.hypot(point.x - last.x, point.y - last.y);
      point.distance = length;
      points.push(point);
    }
    strokes.push({ start, end: length });
  }
  return { points, strokes, length };
}

function pointAt(path, distance) {
  const { points } = path;
  if (distance <= 0) return points[0];
  for (let index = 1; index < points.length; index++) {
    const point = points[index];
    if (point.distance >= distance) {
      const previous = points[index - 1];
      const span = point.distance - previous.distance || 1;
      const fraction = (distance - previous.distance) / span;
      return {
        x: previous.x + (point.x - previous.x) * fraction,
        y: previous.y + (point.y - previous.y) * fraction,
        distance,
      };
    }
  }
  return points.at(-1);
}

function paintFoil(ctx, width, height) {
  ctx.save();
  ctx.globalCompositeOperation = 'source-over';
  const silver = ctx.createLinearGradient(0, 0, width, height);
  silver.addColorStop(0, '#9ba7a0');
  silver.addColorStop(0.28, '#ebefeb');
  silver.addColorStop(0.62, '#b2bdb6');
  silver.addColorStop(0.88, '#e0e6df');
  silver.addColorStop(1, '#aab5ab');
  ctx.fillStyle = silver;
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = '#ffffff45';
  ctx.lineWidth = 1;
  for (let x = -height; x < width; x += 9) {
    ctx.beginPath();
    ctx.moveTo(x, height);
    ctx.lineTo(x + height, 0);
    ctx.stroke();
  }

  // Fine grain so the foil reads as metal rather than a flat fill.
  const grains = Math.round(width * height / 90);
  for (let index = 0; index < grains; index++) {
    ctx.fillStyle = index % 2 ? '#ffffff38' : '#5f6f6630';
    ctx.fillRect(Math.random() * width, Math.random() * height, 1.4, 1.4);
  }

  ctx.fillStyle = '#42564d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = `800 ${Math.round(Math.min(height * 0.17, width * 0.06))}px system-ui, sans-serif`;
  ctx.fillText('TÊN BÍ MẬT', width / 2, height / 2);
  ctx.restore();
}

function carve(ctx, step, from, to) {
  if (!ctx || to <= from) return;
  const { cell, path, radius } = step;
  const trail = [pointAt(path, from)];
  for (const point of path.points) {
    if (point.distance > from && point.distance < to) trail.push(point);
  }
  const tip = pointAt(path, to);
  trail.push(tip);

  ctx.save();
  ctx.beginPath();
  ctx.rect(cell.left, cell.top, cell.right - cell.left, cell.bottom - cell.top);
  ctx.clip();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  ctx.moveTo(trail[0].x, trail[0].y);
  for (const point of trail.slice(1)) ctx.lineTo(point.x, point.y);
  // A thin, half-worn rim around the coin, then the coin's full bite.
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = radius * 2.3;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = radius * 2;
  ctx.stroke();

  // Flakes torn off at the coin's leading edge.
  ctx.fillStyle = '#000';
  for (let flake = 0; flake < 3; flake++) {
    const angle = Math.random() * Math.PI * 2;
    const reach = radius * (0.95 + Math.random() * 0.25);
    ctx.beginPath();
    ctx.arc(tip.x + Math.cos(angle) * reach, tip.y + Math.sin(angle) * reach, radius * (0.05 + Math.random() * 0.1), 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function clearCell(ctx, cell) {
  ctx?.clearRect(cell.left, cell.top, cell.right - cell.left, cell.bottom - cell.top);
}

export function animateScratch(canvas, style, finish, stroke) {
  const ctx = canvas.getContext('2d');
  const frame = canvas.parentElement;
  const words = [...frame.querySelectorAll('strong > span')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const beat = duration / words.length;
  let layout;
  let plan;
  let elapsed = 0;
  let previousTime = null;
  let cleared = 0;
  let drawnStep = -1;
  let drawn = 0;
  let lastSound = '';
  let animation;
  let complete = false;

  function positionCoin(point) {
    frame.style.setProperty('--coin-x', `${point.x / layout.width * 100}%`);
    frame.style.setProperty('--coin-y', `${point.y / layout.height * 100}%`);
    frame.dataset.scratching = '';
  }

  function render() {
    const index = Math.min(Math.floor(elapsed / beat), plan.length - 1);
    while (cleared < index) clearCell(ctx, plan[cleared++].cell);
    if (drawnStep !== index) {
      drawnStep = index;
      drawn = 0;
    }

    const step = plan[index];
    const { path } = step;
    const time = elapsed - index * beat;
    const travel = index ? Math.min(230, beat * 0.15) : 0;
    const hold = Math.min(540, beat * 0.24);
    if (time < travel) {
      const from = plan[index - 1].path.points.at(-1);
      const to = path.points[0];
      const fraction = easeInOut(time / travel);
      positionCoin({ x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction });
      return;
    }

    const strokes = path.strokes;
    const progress = Math.min(1, (time - travel) / (beat - travel - hold)) * strokes.length;
    const current = Math.min(Math.floor(progress), strokes.length - 1);
    const soundKey = `${index}:${current}`;
    if (progress < strokes.length && lastSound !== soundKey) {
      stroke();
      lastSound = soundKey;
    }
    const { start, end } = strokes[current];
    const distance = progress >= strokes.length ? path.length : start + (end - start) * easeInOut(progress - current);
    carve(ctx, step, drawn, distance);
    drawn = Math.max(drawn, distance);
    positionCoin(pointAt(path, distance));
  }

  function refreshLayout() {
    const next = measureCells(canvas, words);
    if (sameLayout(layout, next)) return;
    layout = next;

    const directions = layout.cells.map((cell, index) => ({
      cell,
      reverse: style === 'given-first' ||
        (style === 'middle-first' && index <= Math.floor((words.length - 1) / 2)),
    }));
    plan = orderCells(directions, style).map(({ cell, reverse }) => {
      const radius = Math.max(12, Math.min(48, (cell.bottom - cell.top) * 0.2));
      return { cell, radius, path: buildPath(cell, reverse, radius) };
    });

    cleared = 0;
    drawnStep = -1;
    if (!ctx) {
      canvas.dataset.unavailable = '';
      return;
    }
    const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
    canvas.width = Math.max(1, Math.round(layout.width * ratio));
    canvas.height = Math.max(1, Math.round(layout.height * ratio));
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    paintFoil(ctx, layout.width, layout.height);
    if (elapsed > 0 && !complete) render();
  }

  refreshLayout();
  const observer = new ResizeObserver(refreshLayout);
  observer.observe(canvas);
  for (const word of words) observer.observe(word);

  function tick(time) {
    const delta = previousTime === null ? 0 : Math.min(time - previousTime, 64);
    elapsed = Math.min(duration, elapsed + delta * (motion.matches ? duration / reducedDuration : 1));
    previousTime = time;

    if (elapsed === duration) {
      ctx?.clearRect(0, 0, layout.width, layout.height);
      complete = true;
      finish();
      return;
    }
    render();
    animation = requestAnimationFrame(tick);
  }

  function stop() {
    cancelAnimationFrame(animation);
    previousTime = null;
  }

  return {
    start() {
      if (!complete) animation = requestAnimationFrame(tick);
    },
    stop,
    dispose() {
      stop();
      observer.disconnect();
    },
  };
}
