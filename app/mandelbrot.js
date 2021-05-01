export default class Mandelbrot {

    drawRect = [
        -1.0,  -1.0, 0,
        -1.0,  1.0, 0,
        1.0,  1.0, 0,
        1.0, -1.0, 0,
        -1.0,  -1.0, 0,
        1.0,  1.0, 0,
    ]

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
        const float approach = 2.0;
        const float threshold = 0.15;
        uniform float zoom;
        int mandelbrot(vec4, vec2, float);
    `

    maxDepthPrimer = `const int max_depth = %d;`

    gradientFragSrc = `
        void main() {      
            //float zoom = 1.0 + zoomlevel;
            int mandelres = mandelbrot(vec4(0.0), lookat, zoom);
            if(mandelres >= max_depth) {
                gl_FragColor = vec4(vec3(0.0), 1.0);
            } else {
                float mandelf = float(mandelres);
                float intensity = -1.0 * (approach * mandelf) / (mandelf - threshold * float(max_depth));
                gl_FragColor = intensity * vec4(1.0, 0.0, 1.0, 1.0);
            }
        }
    `

    mandelbrotShader = `
        int mandelbrot(vec4 bounds, vec2 point, float zoom) {
            float x_bias = point.x;
            float y_bias = point.y;
            if (bounds[0] == 0.0) {
                //default bounds
                float ratio = viewport.x / viewport.y;
                float default_height = 2.25;
                float width = default_height * ratio;

                bounds = vec4(-1.0 * width / 2.0 / zoom, width / 2.0 / zoom, -1.0 * default_height / 2.0 / zoom, default_height / 2.0 / zoom );
            }
           /* if (zoom == 0.0) {
                zoom = 1.0;
            }*/
            float x =  gl_FragCoord.x / viewport.x * (bounds[1] - bounds[0]) + bounds[0] + x_bias;
            float y = gl_FragCoord.y / viewport.y * (bounds[3] - bounds[2]) + bounds[2] + y_bias;
            float a = 0.0;
            float b = 0.0;
            float temp = 0.0;
            int iter = 0;
            for (int i = 0; i <= max_depth; i++) {
                if (a*a + b*b > 4.0) { break; }
                temp = a*a - b*b + x;
                b = 2.0*a*b + y;
                a = temp;
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


        const lookatU = this.gl.getUniformLocation(this.info.program, "lookat");
        //this.gl.uniform2fv(lookatU, [-2, 0]);
        //this.gl.uniform2fv(lookatU, [-Math.E/7.0, -Math.E/20.0]);
        //this.gl.uniform2fv(lookatU, [-0.5, 0]);
        this.gl.uniform2fv(lookatU, [0, 1]);
        //console.log(-1.0 * Math.E / 7.0);

        let zoom = 1.0;
        let lasttime = Date.now();
        let delta = 0;
        setInterval(() => {
            delta = (Date.now() - lasttime) / 1000;
            zoom += Math.exp(delta);
            this.gl.uniform1f(zoomU, zoom);
            this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
        }, 17)

        //while (0) {

        //}
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