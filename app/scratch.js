const duration = 6600;
const reducedDuration = 300;

function orderBands(bands, style) {
  if (style === 'given-first') return [...bands].reverse();
  if (style === 'middle-first') {
    const center = Math.floor((bands.length - 1) / 2);
    return [...bands.slice(0, center + 1).reverse(), ...bands.slice(center + 1)];
  }
  return bands;
}

function measureBands(canvas, words, style) {
  const bounds = canvas.getBoundingClientRect();
  const scaleX = canvas.width / bounds.width;
  const scaleY = canvas.height / bounds.height;

  const bands = words.map((word, index) => {
    const box = word.getBoundingClientRect();
    const left = Math.max(0, (box.left - bounds.left) * scaleX - 3);
    const right = Math.min(canvas.width, (box.right - bounds.left) * scaleX + 3);
    const top = Math.max(0, (box.top - bounds.top) * scaleY - 3);
    const bottom = Math.min(canvas.height, (box.bottom - bounds.top) * scaleY + 3);
    const reverse = style === 'given-first' ||
      (style === 'middle-first' && index <= Math.floor((words.length - 1) / 2));

    return { left, right, top, bottom, start: reverse ? right : left, end: reverse ? left : right };
  });

  return orderBands(bands, style);
}

function paintFoil(ctx, width, height) {
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
  ctx.fillStyle = '#000';
}

function clearBand(ctx, band) {
  ctx?.clearRect(band.left, band.top, band.right - band.left, band.bottom - band.top);
}

function scratchBand(ctx, band, edge) {
  if (!ctx || edge === band.start) return;

  const ridges = [0, 2.5, -1, 1.5, -2, 0];
  ctx.beginPath();
  ctx.moveTo(band.start, band.top);
  for (const [index, ridge] of ridges.entries()) {
    const y = band.top + (band.bottom - band.top) * index / (ridges.length - 1);
    const x = Math.min(band.right, Math.max(band.left, edge + ridge));
    ctx.lineTo(x, y);
  }
  ctx.lineTo(band.start, band.bottom);
  ctx.closePath();
  ctx.fill();
}

function shortStrokes(fraction) {
  if (fraction >= 1) return 1;
  const progress = fraction * 3;
  const stroke = Math.floor(progress);
  return (stroke + Math.min((progress - stroke) / 0.8, 1)) / 3;
}

export function animateScratch(canvas, style, finish, stroke) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const frame = canvas.parentElement;
  const words = [...frame.querySelectorAll('strong > span')];
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const beat = duration / words.length;
  let bands;
  let elapsed = 0;
  let previousTime = null;
  let cleared = 0;
  let lastSound = -1;
  let animation;
  let complete = false;

  function positionCoin(x, y) {
    frame.style.setProperty('--coin-x', `${x / width * 100}%`);
    frame.style.setProperty('--coin-y', `${y / height * 100}%`);
    frame.dataset.scratching = '';
  }

  function render() {
    const index = Math.min(Math.floor(elapsed / beat), bands.length - 1);
    while (cleared < index) clearBand(ctx, bands[cleared++]);

    const band = bands[index];
    const centerY = (band.top + band.bottom) / 2;
    const time = elapsed - index * beat;
    const travel = index ? Math.min(230, beat * 0.15) : 0;
    const hold = Math.min(540, beat * 0.24);
    if (time < travel) {
      const previous = bands[index - 1];
      const fraction = time / travel;
      const previousY = (previous.top + previous.bottom) / 2;
      positionCoin(previous.end + (band.start - previous.end) * fraction, previousY + (centerY - previousY) * fraction);
      return;
    }

    if (lastSound !== index) {
      stroke();
      lastSound = index;
    }
    const progress = shortStrokes((time - travel) / (beat - travel - hold));
    const edge = band.start + (band.end - band.start) * progress;
    if (progress === 1) clearBand(ctx, band);
    else scratchBand(ctx, band, edge);
    const y = centerY + Math.sin(progress * Math.PI * 8) * (band.bottom - band.top) * 0.34;
    positionCoin(edge, y);
  }

  function refreshLayout() {
    const layout = measureBands(canvas, words, style);
    if (bands && layout.every((band, index) =>
      Math.abs(band.left - bands[index].left) < 0.5 &&
      Math.abs(band.right - bands[index].right) < 0.5 &&
      Math.abs(band.top - bands[index].top) < 0.5 &&
      Math.abs(band.bottom - bands[index].bottom) < 0.5
    )) return;

    bands = layout;
    cleared = 0;
    if (ctx) paintFoil(ctx, width, height);
    else canvas.dataset.unavailable = '';
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
      ctx?.clearRect(0, 0, width, height);
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
