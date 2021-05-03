import Mandelbrot from "./mandelbrot.js";

let moving = false;

let controls = {
    /**
     * @type {HTMLInputElement} mandelbrot
     */
    zoom: null,
}

/**
 * @type {Mandelbrot} mandelbrot
 */
let mandelbrot = null;
let lastPoint = [];

/**
 * @type {HTMLCanvasElement} mandelbrot
 */
let canvas = null;

window.onload = function main() {
    controls.zoom = document.getElementById('zoom');
    controls.zoom.oninput = zoomChange;
    controls.zoom.value = '1.0';
    canvas = document.getElementById('canvas');
    canvas.style.cursor = 'grab';
    try {
        mandelbrot = new Mandelbrot(canvas);
        canvas.addEventListener('pointerdown', ondown);
        window.addEventListener('resize', onresize);
    } catch (error) {
        console.error(error);
        const canvasParent = canvas.parentElement;
        canvasParent.style.color = 'red';
        canvasParent.style.fontFamily = 'Arial, San-Serif';
        canvasParent.innerText = error;
    }
}

function onresize() {
    mandelbrot.setViewport(canvas.clientWidth, canvas.clientHeight);
    console.log([canvas.clientWidth, canvas.clientHeight]);
    mandelbrot.animate(true);
}

/**
 * 
 * @param {PointerEvent} event 
 */
function ondown(event) {
    document.addEventListener('pointermove', onmove);
    document.addEventListener('pointerup', onup);
    event.preventDefault();
    let x = event.clientX;
    let y = event.clientY;
    lastPoint = [x, y];
    moving = true;

    canvas.style.cursor = 'grabbing';
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onmove(event) {
    event.preventDefault();
    mandelbrot.enableDraw();
    if (moving) {
        let x = event.clientX;
        let y = event.clientY;
        let drift = [-(x - lastPoint[0]), (y - lastPoint[1])];
        lastPoint = [x, y];
        mandelbrot.offsetPoint(drift[0], drift[1]);
    }
}

function onup(event) {
    document.removeEventListener('pointermove', onmove);
    document.removeEventListener('pointerup', onup);
    canvas.style.cursor = 'grab';
    mandelbrot.disableDraw();
    moving = false;
}

/**
 * 
 * @param {InputEvent} event 
 */
function zoomChange(event) {
    console.log(event.target.value);
    let z = parseFloat(event.target.value);
    if (z > 0) {
        mandelbrot.setZoom(z);
    }

}