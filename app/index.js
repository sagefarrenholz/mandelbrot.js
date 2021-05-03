import Mandelbrot from "./mandelbrot.js"

let moving = false;

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
    canvas = document.getElementById('canvas');
    try {
        mandelbrot = new Mandelbrot(canvas);
        canvas.addEventListener('pointerdown', ondown);
        canvas.addEventListener('pointermove', onmove);
        canvas.addEventListener('pointerup', onup);
        mandelbrot.draw();
    } catch (error) {
        console.error(error);
        const canvasParent = canvas.parentElement;
        canvasParent.style.color = 'red';
        canvasParent.style.fontFamily = 'Arial, San-Serif';
        canvasParent.innerText = error;
    }
}

/**
 * 
 * @param {PointerEvent} event 
 */
function ondown(event) {
    event.preventDefault();
    let x = event.clientX;
    let y = event.clientY;
    lastPoint = [x, y];
    moving = true;
}

/**
 * 
 * @param {PointerEvent} event 
 */
function onmove(event) {
    event.preventDefault();
    if (moving) {
        let x = event.clientX;
        let y = event.clientY;
        
        let drift = [-(x - lastPoint[0]), (y - lastPoint[1])];
        lastPoint = [x, y];
        mandelbrot.offsetPoint(drift[0], drift[1]);
    }
}

function onup(event) {

    moving = false;
}
