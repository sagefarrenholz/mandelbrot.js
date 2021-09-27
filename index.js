import Mandelbrot from './mandelbrot.js'; // eslint-disable-line import/extensions

let moving = false;
let lastZoom = 1.00;

const controls = {
  /**
     * @type {HTMLInputElement} mandelbrot
     */
  zoom: null,
};

/**
 * @type {Mandelbrot} mandelbrot
 */
let mandelbrot = null;
let lastPoint = [];

/**
 * @type {HTMLCanvasElement} mandelbrot
 */
let canvas = null;

function hex2rgba(hex) {
  const [r, g, b] = hex.match(/\w\w/g).map((x) => parseInt(x, 16));
  return [r / 255.0, g / 255.0, b / 255.0, 1.0];
}

/*
function rgbToHex(r, g, b) {
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}
*/

function onresize() {
  mandelbrot.setViewport(canvas.clientWidth, canvas.clientHeight);
  // console.log([canvas.clientWidth, canvas.clientHeight]);
  mandelbrot.animate(true);
}

/**
 *
 * @param {PointerEvent} event
 */
function onmove(event) {
  event.preventDefault();
  mandelbrot.enableDraw();
  if (moving) {
    const x = event.clientX;
    const y = event.clientY;
    const drift = [-(x - lastPoint[0]), (y - lastPoint[1])];
    lastPoint = [x, y];
    mandelbrot.offsetPoint(drift[0], drift[1]);
  }
}

function onup() {
  document.removeEventListener('pointermove', onmove);
  document.removeEventListener('pointerup', onup);
  canvas.style.cursor = 'grab';
  mandelbrot.disableDraw();
  moving = false;
}

/**
 *
 * @param {PointerEvent} event
 */
function ondown(event) {
  document.addEventListener('pointermove', onmove);
  document.addEventListener('pointerup', onup);
  document.addEventListener('pointerout', onup);
  document.addEventListener('pointerleave', onup);
  event.preventDefault();
  const x = event.clientX;
  const y = event.clientY;
  lastPoint = [x, y];
  moving = true;

  canvas.style.cursor = 'grabbing';
}

/*
function ondepth(event) {
  mandelbrot.maxDepthPrimer;
} */

/**
 *
 * @param {InputEvent} event
 */
function zoomChange(event) {
/**
 *
 * @param {HTMLSelectElement} event
 */

  const sel = document.getElementById('factor');
  let factor = 1.0;
  let z = controls.zoom.value;

  if (event) {
    z = parseFloat(event.target.value);
  }
  if (z <= 0.0 || !Number.isFinite(parseInt(z, 3))) z = lastZoom;

  lastZoom = z;
  switch (sel.value) {
    case 'octave':
      mandelbrot.setZoom(8 ** z);
      return;
    case 'decade':
      mandelbrot.setZoom(10 ** z);
      return;
    case 'quadratic':
      factor = 2.0;
      break;
    case 'cubic':
      factor = 3.0;
      break;
    default:
      factor = 1.0;
      break;
  }
  mandelbrot.setZoom(z ** factor);
}

function onwheel(event) {
  event.preventDefault();
  let scale = 1 + event.deltaY * -0.01;
  scale = Math.min(Math.max(0.8, scale), 1.2);
  controls.zoom.value *= scale.toFixed(2);
  zoomChange();
}

function oncolor(event) {
  const color = event.target.value;

  switch (event.target.id) {
    case 'c-interior':

      mandelbrot.setBGColor(hex2rgba(color));

      break;
    case 'c-boundary':
      mandelbrot.setBoundaryColor(hex2rgba(color));
      break;
    default:
      break;
  }
  mandelbrot.animate(true);
}

window.onload = function main() {
  canvas = document.getElementById('canvas');
  try {
    mandelbrot = new Mandelbrot(canvas);
    controls.zoom = document.getElementById('zoom');
    controls.x = document.getElementById('x');
    controls.x.value = mandelbrot.defaultX;
    controls.y = document.getElementById('y');
    controls.y.value = mandelbrot.defaultY;

    controls.zoom.oninput = zoomChange;
    // controls.x.oninput = xChange;
    // controls.x.oninput = yChange;
    controls.zoom.value = lastZoom;

    canvas.style.cursor = 'grab';
    canvas.addEventListener('pointerdown', ondown);
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); });
    canvas.addEventListener('wheel', onwheel);
    document.getElementById('factor').addEventListener('input', zoomChange);
    // document.getElementById('c-interior').addEventListener('input', oncolor);
    document.getElementById('c-boundary').addEventListener('input', oncolor);
    window.addEventListener('resize', onresize);
  } catch (error) {
    const canvasParent = canvas.parentElement;
    canvasParent.style.color = 'red';
    canvasParent.style.fontFamily = 'Arial, San-Serif';
    canvasParent.innerText = error;
  }
};
