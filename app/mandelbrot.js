export default class Mandelbrot {

    drawRect = [
        -1.0,  -1.0, 0,
        -1.0,  1.0, 0,
        1.0,  1.0, 0,
        1.0, -1.0, 0,
        -1.0,  -1.0, 0,
        1.0,  1.0, 0,
    ]

    lookatU = null;
    lookat = [0.0, 0.0];

    OffsetU = null;
    offset = [0.0, 0.0];

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
        uniform vec4 bounds;
        const float approach = 2.0;
        const float threshold = 0.15;
        const int max_depth = 1000;
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
                gl_FragColor = intensity * vec4(1.0, 0.0, 1.0, 1.0);
         //  }
        }
    `

    mandelbrotShader = `
        int mandelbrot(vec2 point, float zoom) {

            float x_bias = point.x; // Bias the point of focus, x axis / real
            float y_bias = point.y; // Bias the point of focus, y axis / imaginary
            float ratio = viewport.x / viewport.y; // Ratio of the bounding box width to height
            float default_height = 2.25;  // Default bounding box height in coordinates not pixels
            float width = default_height * ratio;   // Calculate width of bounding box based on ratio
            vec4 bounds = vec4(-1.0 * width, width, -1.0 * default_height, default_height) / 2.0 / zoom;

            float x =  (gl_FragCoord.x + offset.x) / viewport.x * (bounds[1] - bounds[0]) + bounds[0] + x_bias;
            float y = (gl_FragCoord.y + offset.y)  / viewport.y * (bounds[3] - bounds[2]) + bounds[2] + y_bias;

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
        this.gl = canvas.getContext('webgl');
        if (this.gl === null) {
            throw new Error("WebGL not supported");
        }

        this.info.program = this._initShaders();
        this.info.buffer = this._bufferDrawRect();
        this.lookatU = this.gl.getUniformLocation(this.info.program, "lookat");
        this.offsetU = this.gl.getUniformLocation(this.info.program, "offset");

        this.gl.clearColor(0.0, 0.0, 0.0, 0.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    }

    /**
     * 
     * @param {Function} breakCond
     */
    draw(breakCond) {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
        this.gl.disable(this.gl.DEPTH_TEST);
        {
            const numComponents = 3;  // pull out 2 values per iteration
            const type = this.gl.FLOAT;    // the data in the buffer is 32bit floats
            const normalize = false;  // don't normalize
            const stride = 0;         // how many bytes to get from one set of values to the next
                                      // 0 = use type and numComponents above
            const offset = 0;         // how many bytes inside the buffer to start from
            //this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.info.buffer);
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
        const viewportU = this.gl.getUniformLocation(this.info.program, "viewport");
        this.gl.uniform2fv(viewportU, [this.canvas.width, this.canvas.height]);
        
        const zoomU = this.gl.getUniformLocation(this.info.program, "zoom");

        //this.gl.uniform2fv(lookatU, [-2, 0]);
        //this.gl.uniform2fv(lookatU, [-Math.E/7.0, -Math.E/20.0]);
        //this.gl.uniform2fv(lookatU, [-0.5, 0]);
       // this.gl.uniform2fv(lookatU, [0, 1]);
        //console.log(-1.0 * Math.E / 7.0);

        let zoom = 1.0;
        let lasttime = Date.now();
        let delta = 0;

        this.lookAt(-0.5, 0.0);

        setInterval(() => {
            delta = (Date.now() - lasttime) / 1000;
            zoom +=  0;
            this.gl.uniform1f(zoomU, zoom);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }, 34)
        setInterval(() => {
            console.log(this.lookat[0]);
            console.log(this.lookat[1]);
            console.log(`10^-${Math.log10(zoom)}`)
        }, 1000);

        //while (0) {

        //}
    }

   /**
     * 
     * @param {number} x
     * @param {number} y
     */
    offsetPoint(x, y) {
        console.log([x, y]);
        this.offset[0] += x;
        this.offset[1] += y;
        this.gl.uniform2fv(this.offsetU, this.offset);
    }

    lookAt(x, y) {
        this.lookat[0] += x;
        this.lookat[1] += y;
        this.gl.uniform2fv(this.lookatU, this.lookat);
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