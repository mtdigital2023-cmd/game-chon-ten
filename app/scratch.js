// The coin makes a few short strokes per beat, then rests on the silver edge.
const scratchBeats = [
  { edge: 0.14, stroke: 660, hold: 290 },
  { edge: 0.32, stroke: 720, hold: 410 },
  { edge: 0.53, stroke: 800, hold: 460 },
  { edge: 0.74, stroke: 850, hold: 530 },
  { edge: 0.91, stroke: 680, hold: 660 },
  { edge: 1, stroke: 410, hold: 230 },
];

function scratchPath(width, height) {
  const path = [{ time: 0, x: 0, y: height * 0.08 }];
  let time = 0;
  let left = 0;
  let points = 0;

  for (const { edge, stroke, hold } of scratchBeats) {
    const right = edge * width;
    const count = Math.ceil((right - left) / (width / 48));
    for (let index = 1; index <= count; index++) {
      const fraction = index / count;
      const y = height * (++points % 2 ? 0.92 : 0.08);
      path.push({ time: time + stroke * fraction, x: left + (right - left) * fraction, y });
    }
    time += stroke + hold;
    left = right;
    path.push({ ...path.at(-1), time });
  }

  return { path, duration: time };
}

export function animateScratch(canvas, finish, stroke) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const frame = canvas.parentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const { path, duration } = scratchPath(width, height);
  let elapsed = 0;
  let previousTime = null;
  let previousStep = 0;
  let previousPoint = path[0];
  let animation;
  let complete = false;
  let wasMoving = false;

  if (ctx) {
    const silver = ctx.createLinearGradient(0, 0, width, height);
    silver.addColorStop(0, '#9ba7a0');
    silver.addColorStop(0.28, '#ebefeb');
    silver.addColorStop(0.62, '#b2bdb6');
    silver.addColorStop(0.88, '#e0e6df');
    silver.addColorStop(1, '#aab5ab');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = silver;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#ffffff45';
    for (let x = -height; x < width; x += 9) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + height, 0);
      ctx.stroke();
    }
    ctx.fillStyle = '#42564d';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 26px system-ui';
    ctx.fillText('TÊN BÍ MẬT', width / 2, height / 2);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = width / 12;
  } else {
    canvas.dataset.unavailable = '';
  }

  function moveTo(point) {
    if (point.x === previousPoint.x && point.y === previousPoint.y) return;
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(previousPoint.x, previousPoint.y);
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
    previousPoint = point;
  }

  function tick(time) {
    const total = motion.matches ? 300 : duration;
    elapsed += previousTime === null ? 0 : Math.min(time - previousTime, 64);
    previousTime = time;
    const timeOnPath = Math.min(elapsed / total, 1) * duration;

    while (path[previousStep + 1]?.time <= timeOnPath) {
      moveTo(path[++previousStep]);
    }
    const from = path[previousStep];
    const to = path[previousStep + 1] || from;
    const moving = to.x !== from.x;
    if (moving && !wasMoving) stroke();
    wasMoving = moving;
    const fraction = to.time === from.time ? 0 : (timeOnPath - from.time) / (to.time - from.time);
    const point = { x: from.x + (to.x - from.x) * fraction, y: from.y + (to.y - from.y) * fraction };
    moveTo(point);
    frame.style.setProperty('--coin-x', `${point.x / width * 100}%`);
    frame.style.setProperty('--coin-y', `${point.y / height * 100}%`);
    frame.dataset.scratching = '';
    if (!ctx) canvas.style.setProperty('--scratch-progress', `${point.x / width * 100}%`);

    if (timeOnPath === duration) {
      ctx?.clearRect(0, 0, width, height);
      complete = true;
      finish();
      return;
    }
    animation = requestAnimationFrame(tick);
  }

  return {
    start() {
      if (!complete) animation = requestAnimationFrame(tick);
    },
    stop() {
      cancelAnimationFrame(animation);
      previousTime = null;
    },
  };
}
