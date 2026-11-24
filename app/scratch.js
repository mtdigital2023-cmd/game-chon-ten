export function applyFoil(canvas, reveal) {
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) {
    canvas.dataset.unavailable = "";
    return;
  }
  ctx.globalCompositeOperation = "source-over";

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

  function start(event) {
    if (pointer !== null || event.button !== 0) return;
    pointer = event.pointerId;
    canvas.setPointerCapture(pointer);
    erase(event);
  }
  function move(event) {
    if (pointer === event.pointerId) erase(event);
  }
  function release() {
    pointer = null;
    last = null;
  }

  canvas.addEventListener('pointerdown', start);
  canvas.addEventListener('pointermove', move);
  canvas.addEventListener('lostpointercapture', release);
  return () => {
    canvas.removeEventListener('pointerdown', start);
    canvas.removeEventListener('pointermove', move);
    canvas.removeEventListener('lostpointercapture', release);
  };
}
