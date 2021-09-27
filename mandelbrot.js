export default class {
  /**
     *
     * @param {HTMLCanvasElement} canvas
     */
  constructor(canvas) {
    this.drawRect = [
      -1.0, -1.0, 0,
      -1.0, 1.0, 0,
      1.0, 1.0, 0,
      1.0, -1.0, 0,
      -1.0, -1.0, 0,
      1.0, 1.0, 0,
    ];

    this.canDraw = false;

    this.lookatU = null;
    this.lookat = [-0.5, 0.0];

    this.OffsetU = null;
    this.offset = [0.0, 0.0];

    this.centerbiasU = null;
    this.centerbias = [0.0, 0.0];

    this.viewportU = null;
    this.zoomU = 0;
    this.zoom = 1.0;

    /* Colors */
    this.bgColor = [0, 0, 0, 0];
    this.boundaryColorU = null;

    /**
     * @type {HTMLCanvasElement}
     */
    this.canvas = null;

    /**
     * @type {WebGLRenderingContext}
     */
    this.gl = null;

    /**
     * @type {number}
     */
    this.info = {};

    this.canvas = canvas;
    this.canvas.height = this.canvas.parentElement.clientHeight;
    this.canvas.width = this.canvas.parentElement.clientWidth;
    this.gl = canvas.getContext('webgl', { antialias: false });

    if (this.gl === null) {
      throw new Error('WebGL not supported');
    }

    this._initShaders().then((glProg) => {
      this.info.program = glProg;
      this.info.buffer = this._bufferDrawRect();
      this.lookatU = this.gl.getUniformLocation(this.info.program, 'lookat');
      this.offsetU = this.gl.getUniformLocation(this.info.program, 'offset');
      this.viewportU = this.gl.getUniformLocation(this.info.program, 'viewport');
      this.zoomU = this.gl.getUniformLocation(this.info.program, 'zoom');
      this.centerbiasU = this.gl.getUniformLocation(this.info.program, 'centerBias');
      this.boundaryColorU = this.gl.getUniformLocation(this.info.program, 'dColor');

      this.gl.clearColor(...this.bgColor);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT);
      this.gl.clear(this.gl.COLOR_BUFFER_BIT // eslint-disable-line no-bitwise
        | this.gl.DEPTH_BUFFER_BIT);
      this.gl.disable(this.gl.DEPTH_TEST);
      {
        const numComponents = 3;
        const type = this.gl.FLOAT;
        const normalize = false;
        const stride = 0;
        const offset = 0;
        this.gl.vertexAttribPointer(
          this.gl.getAttribLocation(this.info.program, 'vertexPosition'),
          numComponents,
          type,
          normalize,
          stride,
          offset,
        );
        this.gl.enableVertexAttribArray(this.gl.getAttribLocation(this.info.program, 'vertexPosition'));
      }

      this.gl.useProgram(this.info.program);

      this.setViewport(this.canvas.width, this.canvas.height);
      this.lookAt(...this.lookat);
      this.setZoom(this.zoom);
      this.setBoundaryColor([Math.random(), Math.random(), Math.random(), 1.0]);

      this.animate(true);
      setInterval(this.animate.bind(this), 16);
    });
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

  /**
     * Enable continous drawing
     */
  enableDraw() {
    this.canDraw = true;
  }

  /**
     * Disable continous drawing
     */
  disableDraw() {
    this.canDraw = false;
  }

  setViewport(w, h) {
    this.gl.uniform2fv(this.viewportU, [w, h]);
  }

  setBGColor(color) {
    this.gl.clearColor(...color);
  }

  setBoundaryColor(color) {
    this.gl.uniform4fv(this.boundaryColorU, color);
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

  /*
  center() {
    const centerX = this.lookAt[0] - this.offset[0] / this.canvas.width;
  }
  */

  /**
     * Fetch vertex and frag shaders, attach to program, link progrom.
     */
  async _initShaders() {
    const vertShader = this._loadShader(this.gl.VERTEX_SHADER, await (await fetch('shaders/mandelbrot.vert')).text());
    const fragShader = this._loadShader(this.gl.FRAGMENT_SHADER, await (await fetch('shaders/mandelbrot.frag')).text());

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
     * Compile shader of type from source string
     * @param {number} type
     * @param {string} source
     */
  _loadShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    const compileStatus = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (compileStatus !== true) {
      this.gl.deleteShader(shader);
      throw new Error(`${type} shader (${shader}) failed to compile with status: ${compileStatus}`);
    }
    return shader;
  }
}
