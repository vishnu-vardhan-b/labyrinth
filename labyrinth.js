var vertices = [];
var indices = [];
var cubeLengthInPixel = 15;
var cubeLengthH;
var cubeLengthV;
var width, height;
var occupiedBlocks = [];

function run(canvasName) {

    gl = initialize(canvasName);
    reconfigureAspect();
    start(gl);
}

function reconfigureAspect() {
    cubeLengthH = (2 / width) * cubeLengthInPixel;
    cubeLengthV = (2 / height) * cubeLengthInPixel;
}

function start(gl) {

    var indexH = 0;
    var indexV = 0;

    nwCoordX = indexH;
    nwCoordY = indexV + cubeLengthV;
    swCoordX = indexH;
    swCoordY = indexV;
    neCoordX = indexH + cubeLengthH;
    neCoordY = indexV + cubeLengthV;
    seCoordX = indexH + cubeLengthH;
    seCoordY = indexV;

    vertices.push(nwCoordX, nwCoordY);
    vertices.push(neCoordX, neCoordY);
    vertices.push(seCoordX, seCoordY);
    vertices.push(swCoordX, swCoordY);

    indices.push(0,1,2);
    indices.push(0,2,3);
    /*restrict to one block for now*/

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
}

function initialize(canvasName) {

    var canvas = document.getElementById(canvasName);
    var gl = canvas.getContext("experimental-webgl");

    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    width = canvas.width;
    height = canvas.height;

    var vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

    var index_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, index_buffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

    var vertCode =
    "attribute vec2 coordinates;" +
    "void main(void) {" + " gl_Position = vec4(coordinates,0.0, 1.0);}";
    var vertShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertShader, vertCode);
    gl.compileShader(vertShader);

    var fragCode = "void main(void) {" + "gl_FragColor = vec4(0.0, 255.0, 0.0, 1.0);" + "}";
    var fragShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragShader, fragCode);
    gl.compileShader(fragShader);

    var shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertShader);
    gl.attachShader(shaderProgram, fragShader);
    gl.linkProgram(shaderProgram);
    gl.useProgram(shaderProgram);

    var coord = gl.getAttribLocation(shaderProgram, "coordinates");
    gl.vertexAttribPointer(coord, 2, gl.FLOAT, false, 8, 0);
    gl.enableVertexAttribArray(coord);

    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    gl.enable(gl.DEPTH_TEST);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.viewport(0,0,width,height);

    return gl;
}
