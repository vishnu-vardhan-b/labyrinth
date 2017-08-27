var vertices = [];
var indices = [];
var indicesArrIndex = 0;
var cubeLengthInPixel = 10;
var cubeLengthH = 10;
var cubeLengthV = 10;
var width, height;
var occupiedBlocks = [];
var restrictedBlocks = [];
var cubeCountH;
var cubeCountV;

var Directions = Object.freeze({
    NORTH : 0,
    EAST : 1,
    SOUTH : 2,
    WEST : 3
});

function run(canvasName) {

    gl = initialize(canvasName);
    reconfigureAspect();
    start(gl);
}

function reconfigureAspect() {
    cubeLengthH = (2 / width) * cubeLengthInPixel;
    cubeLengthV = (2 / height) * cubeLengthInPixel;

    cubeCountH = width / cubeLengthInPixel;
    cubeCountV = height / cubeLengthInPixel;
}

function pushCubeCoords(nwIndex, neIndex, seIndex, swIndex) {
    indices.push(nwIndex, neIndex, seIndex);
    console.log("indices:" + "(" + (nwIndex*2) + "," + neIndex + "," + seIndex + "," + swIndex + ")");
    console.log("Triangle 1:NW:" + vertices[nwIndex * 2] + "," + vertices[nwIndex * 2 + 1] +
                "|NE:" + vertices[neIndex * 2] + "," + vertices[neIndex * 2 + 1] + "|SE:" +
                vertices[seIndex * 2] + "," + vertices[seIndex * 2 + 1] + "|SW:" +
                vertices[swIndex * 2] + "," + vertices[swIndex * 2 + 1]);
    indices.push(seIndex, swIndex, nwIndex);
}

function OccupiedBlock(xCoord,yCoord) {
    this.locH = xCoord;
    this.locV = yCoord;
}

function areEqualsOccupiedBlock(obj1, obj2) {
    return obj1.locH == obj2.locH && obj1.locV == obj2.locV;
}

function contains(array, obj) {
	for(index = 0; index < array.length; index++) {
  	     var current = array[index];
  	      if(areEqualsOccupiedBlock(current, obj))
    	     return true;
    }
    return false;
}

function numberOfOcccupiedNeighbors(occupiedBlocks, prospectiveBlock) {
    neighborBlocks = [];
    neighborBlocks.push(new OccupiedBlock(prospectiveBlock.locH - 1, prospectiveBlock.locV));
    neighborBlocks.push(new OccupiedBlock(prospectiveBlock.locH, prospectiveBlock.locV + 1));
    neighborBlocks.push(new OccupiedBlock(prospectiveBlock.locH + 1, prospectiveBlock.locV));
    neighborBlocks.push(new OccupiedBlock(prospectiveBlock.locH, prospectiveBlock.locV - 1));
    var counter = 0;

    for (var i = 0; i < neighborBlocks.length && counter < 2; i++) {
        var neighbor = neighborBlocks[i];
        if (contains(occupiedBlocks, neighbor)) {
            counter++;
        }
    }
    return counter;
}

function render(gl) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
}

function start(gl) {
    /*start at bottom left (south west) corner*/
    var indexH = -1;
    var indexV = -1;
    // var indexH = 0;
    // var indexV = 0;

    var nwCoordX = indexH;
    var nwCoordY = indexV + cubeLengthV;
    var swCoordX = indexH;
    var swCoordY = indexV;
    var neCoordX = indexH + cubeLengthH;
    var neCoordY = indexV + cubeLengthV;
    var seCoordX = indexH + cubeLengthH;
    var seCoordY = indexV;
    var nwIndex;
    var neIndex;
    var seIndex;
    var swIndex;

    vertices.push(nwCoordX, nwCoordY);
    nwIndex = indicesArrIndex++;
    vertices.push(neCoordX, neCoordY);
    neIndex = indicesArrIndex++;
    vertices.push(seCoordX, seCoordY);
    seIndex = indicesArrIndex++;
    vertices.push(swCoordX, swCoordY);
    swIndex = indicesArrIndex++;
    pushCubeCoords(nwIndex, neIndex, seIndex, swIndex);
    /*restrict to one block for now*/
    var occupiedBlock = new OccupiedBlock(0, 0);
    occupiedBlocks.push(occupiedBlock);

    render(gl);

    var latestCubeH = 0;
    var latestCubeV = 0;
    var newCubeH;
    var newCubeV;
    var attempts = 0;
    while (true) {
        var direction = Math.floor(Math.random() * 4);
        switch (direction) {
            case Directions.NORTH:
                newCubeH = latestCubeH;
                newCubeV = latestCubeV + 1;
                break;
            case Directions.EAST:
                newCubeH = latestCubeH + 1;
                newCubeV = latestCubeV;
                break;
            case Directions.SOUTH:
                newCubeH = latestCubeH;
                newCubeV = latestCubeV - 1;
                break;
            case Directions.WEST:
                newCubeH = latestCubeH - 1;
                newCubeV = latestCubeV;
                break;
        }
        console.log("choice:" + direction);
        prospectiveBlock = new OccupiedBlock(newCubeH, newCubeV);
        if (newCubeV >= 0 && newCubeH >= 0 &&
            newCubeV < cubeCountV && newCubeH < cubeCountH &&
            !contains(occupiedBlocks, prospectiveBlock) &&
            numberOfOcccupiedNeighbors(occupiedBlocks, prospectiveBlock) <= 1) {
            console.log("used:" + direction);
            console.log("before|NW:" + nwIndex + "|NE:" + neIndex + "|SE:" + seIndex + "|SW:" + swIndex);
            switch (direction) {
                case Directions.NORTH:
                    seIndex = neIndex;
                    swIndex = nwIndex;

                    nwCoordX = vertices[nwIndex * 2];
                    nwCoordY = vertices[(nwIndex * 2) + 1] + cubeLengthV;
                    vertices.push(nwCoordX, nwCoordY);
                    nwIndex = indicesArrIndex++;

                    neCoordX = vertices[neIndex * 2];
                    neCoordY = vertices[(neIndex * 2) + 1] + cubeLengthV;
                    vertices.push(neCoordX, neCoordY);
                    neIndex = indicesArrIndex++;
                    break;
                case Directions.EAST:
                    nwIndex = neIndex;
                    swIndex = seIndex;

                    neCoordX = vertices[neIndex * 2] + cubeLengthH;
                    neCoordY = vertices[(neIndex * 2) + 1];
                    vertices.push(neCoordX, neCoordY);
                    neIndex = indicesArrIndex++;

                    seCoordX = vertices[seIndex * 2] + cubeLengthH;
                    seCoordY = vertices[(seIndex * 2) + 1];
                    vertices.push(seCoordX, seCoordY);
                    seIndex = indicesArrIndex++;
                    break;
                case Directions.SOUTH:
                    neIndex = seIndex;
                    nwIndex = swIndex;

                    swCoordX = vertices[swIndex * 2];
                    swCoordY = vertices[(swIndex * 2) + 1] - cubeLengthV;
                    vertices.push(swCoordX, swCoordY);
                    swIndex = indicesArrIndex++;

                    seCoordX = vertices[seIndex * 2];
                    seCoordY = vertices[(seIndex * 2) + 1] - cubeLengthV;
                    vertices.push(seCoordX, seCoordY);
                    seIndex = indicesArrIndex++;
                    break;
                case Directions.WEST:
                    neIndex = nwIndex;
                    seIndex = swIndex;

                    nwCoordX = vertices[nwIndex * 2] - cubeLengthH;
                    nwCoordY = vertices[(nwIndex * 2) + 1];
                    vertices.push(nwCoordX, nwCoordY);
                    nwIndex = indicesArrIndex++;

                    swCoordX = vertices[swIndex * 2] - cubeLengthH;
                    swCoordY = vertices[(swIndex * 2) + 1];
                    vertices.push(swCoordX, swCoordY);
                    swIndex = indicesArrIndex++;
                    break;
            }
            console.log("after|NW:" + nwIndex + "|NE:" + neIndex + "|SE:" + seIndex + "|SW:" + swIndex);
            pushCubeCoords(nwIndex, neIndex, seIndex, swIndex);
            latestCubeV = newCubeV;
            latestCubeH = newCubeH;
            occupiedBlocks.push(prospectiveBlock);
            render(gl);
        }
        if (attempts == 38000) {
            break;
        }
        attempts++;
    }
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
