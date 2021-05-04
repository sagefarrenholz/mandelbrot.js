import Mandelbrot from "./mandelbrot.js";

let moving = false;
let lastZoom = 1.00;

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

const defLookAt = [-0.5, 0];

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
        //controls.x.oninput = yChange;
        controls.zoom.value = lastZoom;

        canvas.style.cursor = 'grab';
        canvas.addEventListener('pointerdown', ondown);
        canvas.addEventListener('touchmove', (e) => {e.preventDefault()});
        document.getElementById('factor').addEventListener('input', zoomChange);
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
    document.addEventListener('pointerout', onup);
    document.addEventListener('pointerleave', onup);
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

/**
 * 
 * @param {HTMLSelectElement} event 
 */
    let sel = document.getElementById('factor');
    let factor = 1.0;
    let z = parseFloat(event.target.value);
    if (z <= 0.0 || !Number.isFinite(z)) z = lastZoom;
    lastZoom = z;
    switch (sel.value) {
        case 'octave':    
            mandelbrot.setZoom(Math.pow(8, z));
            return;
        case 'decade':    
            mandelbrot.setZoom(Math.pow(10, z));
            return;
        case 'quadratic':
            factor = 2.0;
            break;
        case 'cubic':
            factor = 3.0;
            break;
    }   
    mandelbrot.setZoom(Math.pow(z, factor));
}