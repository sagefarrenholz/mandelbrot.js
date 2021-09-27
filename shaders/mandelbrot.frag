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

void main() {      
    int mandelres = mandelbrot(lookat, zoom);
    float mandelf = float(mandelres);
    float intensity = -1.0 * (approach * mandelf) / (mandelf - threshold * float(max_depth));
    gl_FragColor = intensity * dColor;
    /*if(mandelres >= max_depth) {    // If iterations maxed out or not
        gl_FragColor = vec4(vec3(0.0), 1.0);
    } else {
        float mandelf = float(mandelres);
        float intensity = -1.0 * (approach * mandelf) / (mandelf - threshold * float(max_depth));
        gl_FragColor = intensity * dColor;
    } */
}

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