const duration = 3100;
const rows = 5;
const pointsPerRow = 12;

function scratchPath(width, height) {
  return Array.from({ length: rows * pointsPerRow }, (_, index) => {
    const row = Math.floor(index / pointsPerRow);
    const step = index % pointsPerRow;
    const x = (row % 2 ? pointsPerRow - 1 - step : step) * width / (pointsPerRow - 1);
    const y = (row + 0.5) * height / rows + Math.sin(step * 1.9) * 2.1;
    return [x, y];
  });
}

export function animateScratch(canvas, finish) {
  const ctx = canvas.getContext('2d');
  const { width, height } = canvas;
  const frame = canvas.parentElement;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const path = scratchPath(width, height);
  let elapsed = 0;
  let previousTime = null;
  let previousStep = 0;
  let previousPoint = path[0];
  let animation;
  let complete = false;

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
    ctx.fillText('CÀO Ở ĐÂY', width / 2, height / 2);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.strokeStyle = '#000';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = height / rows + 8;
  } else {
    canvas.dataset.unavailable = '';
  }

  function moveTo(point) {
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(...previousPoint);
      ctx.lineTo(...point);
      ctx.stroke();
    }
    previousPoint = point;
  }

  function tick(time) {
    const total = motion.matches ? 300 : duration;
    elapsed += previousTime === null ? 0 : Math.min(time - previousTime, 64);
    previousTime = time;
    const fraction = Math.min(elapsed / total, 1);
    const position = fraction * (path.length - 1);
    const step = Math.floor(position);
    const [x, y] = path[step];
    const [nextX, nextY] = path[Math.min(step + 1, path.length - 1)];

    while (previousStep < step) moveTo(path[++previousStep]);
    const point = [x + (nextX - x) * (position - step), y + (nextY - y) * (position - step)];
    moveTo(point);
    frame.style.setProperty('--coin-x', `${point[0] / width * 100}%`);
    frame.style.setProperty('--coin-y', `${point[1] / height * 100}%`);
    frame.dataset.scratching = '';
    if (!ctx) canvas.style.setProperty('--scratch-progress', `${fraction * 100}%`);

    if (fraction === 1) {
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
