export default class Mandelbrot {

    drawRect = [
        -1.0,  -1.0, 0,
        -1.0,  1.0, 0,
        1.0,  1.0, 0,
        1.0, -1.0, 0,
        -1.0,  -1.0, 0,
        1.0,  1.0, 0,
    ]

    canDraw = false;

    lookatU = null;
    lookat = [-0.5, 0.0];

    OffsetU = null;
    offset = [0.0, 0.0];

    centerbiasU = null;
    centerbias = [0.0, 0.0];

    viewportU = null;
    zoomU = 0;
    zoom = 1.0;

    /* Colors */
    bgColor = [0, 0, 0, 0];
    boundaryColorU = null;

    vertShaderSrc = `
        attribute vec4 vertexPosition;

        void main() {
            gl_Position = vertexPosition;
        }
    `

    mandelDeclare = `
        precision highp float;
        uniform vec2 viewport;
        uniform vec2 lookat;
        uniform vec2 offset;
        uniform vec2 centerBias;
        uniform vec4 bounds;
        uniform vec4 dColor;
        const float approach = 2.0;
        const float threshold = 0.15;
        const int max_depth = 250;
        uniform float zoom;
        int mandelbrot(vec2, float);
    `

    maxDepthPrimer = `const int max_depth = %d;`

    gradientFragSrc = `
        void main() {      
            int mandelres = mandelbrot(lookat, zoom);
            /*if(mandelres >= max_depth) {    // If iterations maxed out or not
                gl_FragColor = vec4(vec3(0.0), 1.0);
           } else {*/
                float mandelf = float(mandelres);
                float intensity = -1.0 * (approach * mandelf) / (mandelf - threshold * float(max_depth));
                gl_FragColor = intensity * dColor;
         //  }
        }
    `

    mandelbrotShader = `
        int mandelbrot(vec2 point, float zoom) {

            float x_bias = point.x; // Bias the point of focus, x axis / real
            float y_bias = point.y; // Bias the point of focus, y axis / imaginary
            float ratio = viewport.x / viewport.y; // Ratio of the bounding box width to height
            float height = 2.25;  // Default bounding box height in coordinates not pixels
            float width = height * ratio;   // Calculate width of bounding box based on ratio
            float heightZ = height / zoom;
            float widthZ = width / zoom;

            float x =  (gl_FragCoord.x * widthZ + offset.x * widthZ + centerBias.x * width) / viewport.x  + x_bias - widthZ / 2.0;
            float y = (gl_FragCoord.y  * heightZ + offset.y * heightZ + centerBias.y * height)  / viewport.y + y_bias - heightZ / 2.0;

            float a = 0.0, b = 0.0, a2 = 0.0, b2 = 0.0;

            int iter = 0;
            for (int i = 0; i <= max_depth; i++) {
                if (a2 + b2 > 4.0) { break; }
                b = 2.0 * a * b + y;
                a = a2 - b2 + x;
                a2 = a * a;
                b2 = b * b;
                iter = i;
            }
            return iter;
        }
    `

    /**
     * @type {HTMLCanvasElement}
     */
    canvas = null;

    /**
     * @type {WebGLRenderingContext}
     */
    gl = null;

    /**
     * @type {number}
     */
    info = {};

    /**
     * 
     * @param {HTMLCanvasElement} canvas
     */
    constructor(canvas) {
        this.canvas = canvas;
        this.canvas.height = this.canvas.parentElement.clientHeight;
        this.canvas.width = this.canvas.parentElement.clientWidth;
        this.gl = canvas.getContext('webgl', {antialias: false});
        if (this.gl === null) {
            throw new Error("WebGL not supported");
        }

        this.info.program = this._initShaders();
        this.info.buffer = this._bufferDrawRect();
        this.lookatU = this.gl.getUniformLocation(this.info.program, "lookat");
        this.offsetU = this.gl.getUniformLocation(this.info.program, "offset");
        this.viewportU = this.gl.getUniformLocation(this.info.program, "viewport");
        this.zoomU = this.gl.getUniformLocation(this.info.program, "zoom");
        this.centerbiasU = this.gl.getUniformLocation(this.info.program, "centerBias");
        this.boundaryColorU = this.gl.getUniformLocation(this.info.program, "dColor");

        this.gl.clearColor(...this.bgColor);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.DEPTH_TEST);
        {
            const numComponents = 3; 
            const type = this.gl.FLOAT;    
            const normalize = false; 
            const stride = 0;      
            const offset = 0;         
            this.gl.vertexAttribPointer(
                this.gl.getAttribLocation(this.info.program, "vertexPosition"),
                numComponents,
                type,
                normalize,
                stride,
                offset);
            this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.info.program, "vertexPosition"));
        }

        this.gl.useProgram(this.info.program);

        this.setViewport(this.canvas.width, this.canvas.height);
        this.lookAt(...this.lookat);
        this.setZoom(this.zoom);
        this.setBoundaryColor([Math.random(), Math.random(), Math.random(), 1.0]);

        this.animate(true);
        setInterval(this.animate.bind(this), 16);
    }

    animate(force) {
        if (this.canDraw || force) {
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }
    }

   /**
     * 
     * @param {number} x
     * @param {number} y
     */
    offsetPoint(x, y) {
        this.offset[0] += x;
        this.offset[1] += y;
        this.gl.uniform2fv(this.offsetU, this.offset);
    }

    enableDraw() {
        this.canDraw = true;
    }

    disableDraw() {
        this.canDraw = false;
    }

    setViewport(w, h) {
        console.log("setting viewport " + [w, h])
        this.gl.uniform2fv(this.viewportU, [w, h]);
    }

    setBGColor(color){
        this.gl.clearColor(...color);
    }

    setBoundaryColor(color) {
        this.gl.uniform4fv(this.boundaryColorU, color);
        console.log(color);
    }

    setZoom(zoom) {
        this.centerbias[0] += this.offset[0] / this.zoom;
        this.centerbias[1] += this.offset[1] / this.zoom;
        this.offset = [0, 0];
        this.zoom = zoom;
        this.gl.uniform2fv(this.centerbiasU, this.centerbias);
        this.gl.uniform1f(this.zoomU, this.zoom);
        this.gl.uniform2fv(this.offsetU, this.offset);
        this.animate(true);
    }

    lookAt(x, y) {
        this.lookat[0] += x;
        this.lookat[1] += y;
        this.gl.uniform2fv(this.lookatU, this.lookat);
    }

    center() {
        let centerX = this.lookAt[0] - this.offset[0] / this.canvas.width;
    }

    _initShaders() {
        const vertShader = this._loadShader(this.gl.VERTEX_SHADER, this.vertShaderSrc);
        const fragShader = this._loadShader(this.gl.FRAGMENT_SHADER, this.mandelDeclare + this.gradientFragSrc + this.mandelbrotShader);

        const program = this.gl.createProgram();
        this.gl.attachShader(program, vertShader);
        this.gl.attachShader(program, fragShader);
        this.gl.linkProgram(program);

        const linkStatus = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
        if (linkStatus !== true) {
            this.gl.deleteProgram(program);
            throw new Error(`Program (${program}) failed to link with status: ${linkStatus}`);
        }

        return program;
    }

    _bufferDrawRect() {
        const buff = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buff);
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(this.drawRect), this.gl.STATIC_DRAW);
        return buff;
    }

    /**
     * 
     * @param {number} type
     * @param {string} source
     */
    _loadShader(type, source) {
        this.gl.VERTEX_SHADER
        const shader = this.gl.createShader(type);
        this.gl.shaderSource(shader, source);
        this.gl.compileShader(shader);
        const compileStatus = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
        if (compileStatus !== true) {
            console.error(this.gl.getShaderInfoLog(shader));
            this.gl.deleteShader(shader);
            throw new Error(`${type} shader (${shader}) failed to compile with status: ${compileStatus}`);
        }
        return shader;
    }
}