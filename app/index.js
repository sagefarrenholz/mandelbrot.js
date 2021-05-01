import Mandelbrot from "./mandelbrot.js"

window.onload = function main() {
    const canvas = document.getElementById('canvas');
    try {
        let mandelbrot = new Mandelbrot(canvas);
        mandelbrot.draw();
    } catch (error) {
        console.error(error);
        const canvasParent = canvas.parentElement;
        canvasParent.style.color = 'red';
        canvasParent.style.fontFamily = 'Arial, San-Serif';
        canvasParent.innerText = error;
    }
}