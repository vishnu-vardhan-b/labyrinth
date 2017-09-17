'use strict';
var vertices = [];
var indices = [];
var indicesArrIndex = 0;
var blockLengthInPixel = 15;
var blockLengthH;
var blockLengthV;
var width, height;
var occupiedBlockIDs = [];
var blockCountH;
var blockCountV;
var paddingV;
var paddingH;

var Directions = Object.freeze({
    NORTH : 0,
    EAST : 1,
    SOUTH : 2,
    WEST : 3
});

function BlockIndices(nwIndex, neIndex, seIndex, swIndex) {
    this.nwIndex = nwIndex;
    this.neIndex = neIndex;
    this.seIndex = seIndex;
    this.swIndex = swIndex;
}

function Block(blockIndices, blockID, parentBlock, fromDirection) {
    this.blockIndices = blockIndices;
    this.blockID = blockID;
    this.parentBlock = parentBlock;
    this.directionsToTravel = [];
    for (var directionEnum in Directions) {
        var directionKey = parseInt(Directions[directionEnum]);
        if (!equalDirections(directionKey, fromDirection)) {
            this.directionsToTravel.push(directionKey);
        }
    }
}

Block.prototype.getDirectionToTravel = function() {
    if (this.directionsToTravel.length == 1) {
        return this.directionsToTravel.pop();
    }
    var index = Math.floor(Math.random() * this.directionsToTravel.length);
    var directionToTravel = this.directionsToTravel[index];
    var directions = [];
    for (var directionKeyString in this.directionsToTravel) {
        var directionKey = parseInt(directionKeyString);
        if (!equalDirections(directionKey, directionToTravel)) {
            directions.push(directionKey);
        }
    }
    this.directionsToTravel = directions;
    return directionToTravel;
};

Block.prototype.freeUpMem = function() {
    delete this.directionTravelled;
    delete this.blockID;
    delete this.blockIndices;
}

function BlockID(xCoord,yCoord) {
    this.locH = xCoord;
    this.locV = yCoord;
}

function run(canvasName) {

    var gl = initialize(canvasName);
    reconfigureAspect();
    start(gl);
}

function reconfigureAspect() {
    var maxBlockLengthInPixel = 40;
    var minBlockLengthInPixel = 5;
    var tempBlockLengthInPixel = minBlockLengthInPixel;
    blockLengthInPixel = tempBlockLengthInPixel;
    while (tempBlockLengthInPixel < maxBlockLengthInPixel) {
        if (width % tempBlockLengthInPixel == 0 && width / tempBlockLengthInPixel >= 40
            && height % tempBlockLengthInPixel == 0 && height % tempBlockLengthInPixel >= 20) {
            blockLengthInPixel = tempBlockLengthInPixel;
        }
        tempBlockLengthInPixel++;
    }

    var scaleH = 2 / width;
    var scaleV = 2 / height;
    blockLengthH = blockLengthInPixel * scaleH;
    blockLengthV = blockLengthInPixel * scaleV;

    var factorH = width / blockLengthInPixel;
    var factorV = height / blockLengthInPixel;

    blockCountH = Math.floor(factorH);
    blockCountV = Math.floor(factorV);

    var extraBlockH = factorH % blockCountH;
    var extraBlockV = factorV % blockCountV;

    var extraBlockInPixelH = extraBlockH * blockLengthInPixel;
    var extraBlockInPixelV = extraBlockV * blockLengthInPixel;

    paddingH = extraBlockInPixelH * scaleH;
    paddingV = extraBlockInPixelV * scaleV;

    console.log("blockCountH:" + blockCountH + "|blockCountV:" + blockCountV);
    console.log("width:" + width);
    console.log("factorH:" + factorH + "|factorV:" + factorV);
    console.log("paddingH:" + paddingH + "|paddingV:" + paddingV);
}

function areSameOccupiedBlockIDs(obj1, obj2) {
    return obj1.locH == obj2.locH && obj1.locV == obj2.locV;
}

function equalDirections(obj1, obj2) {
    return obj1 == obj2;
}

function contains(array, obj2, equalsFunc) {
	for(var index = 0; index < array.length; index++) {
        var obj1 = array[index];
  	    if(equalsFunc(obj1, obj2))
            return true;
    }
    return false;
}

function render(gl) {
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.DYNAMIC_DRAW);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.DYNAMIC_DRAW);
    gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT,0);
}

function start(gl) {
    /*start at bottom left (south west) corner*/
    var indexH = -1 - blockLengthH;
    var indexV = -1 + blockLengthV;

    // var nwIndex = registerVertices(indexH, indexV + blockLengthV);
    var neIndex = registerVertices(indexH + blockLengthH + paddingH, indexV + blockLengthV + paddingV);
    var seIndex = registerVertices(indexH + blockLengthH + paddingH, indexV) + paddingV;
    // var swIndex = registerVertices(indexH, indexV);

    var directionToTravel = Directions.EAST;
    var currentBlockIndices = new BlockIndices(null, neIndex, seIndex, null);
    var wallBlockIndices = breakWall(directionToTravel, currentBlockIndices);

    var neighborBlockIndices = getNextBlockIndices(directionToTravel, wallBlockIndices);
    var fromDirection = getDirectionWithRespectToNeighbor(directionToTravel);
    var neighborBlockID = new BlockID(2,2);
    occupiedBlockIDs.push(neighborBlockID);
    var currentBlock = new Block(neighborBlockIndices, neighborBlockID, null, fromDirection);
    visitBlock(currentBlock);
    render(gl);
}

function visitBlock(currentBlock) {
    var neighborBlock;
    while ((neighborBlock = pickANeighbor(currentBlock)) != null) {
        visitBlock(neighborBlock);
    }
    currentBlock.freeUpMem();
}

function pickANeighbor(currentBlock) {
    var neighborBlockID;
    var directionToTravel;
    do {
        if (currentBlock.directionsToTravel.length < 1) {
            return null;
        }
        directionToTravel = currentBlock.getDirectionToTravel();
        neighborBlockID = getNeighborBlockID(directionToTravel, currentBlock.blockID);
    } while (!canVisitNeighbor(neighborBlockID));
    var neighborBlock = null;
    var wallBlockIndices = breakWall(directionToTravel, currentBlock.blockIndices);
    var neighborBlockIndices = getNextBlockIndices(directionToTravel, wallBlockIndices);
    var fromDirection = getDirectionWithRespectToNeighbor(directionToTravel);
    occupiedBlockIDs.push(neighborBlockID);
    return new Block(neighborBlockIndices, neighborBlockID, currentBlock, fromDirection);
}

function breakWall(directionToTravel, currentBlockIndices) {
    return getNextBlockIndices(directionToTravel, currentBlockIndices);
}

function registerVertices(coordX, coordY) {
    vertices.push(coordX, coordY);
    return indicesArrIndex++;
}

function registerBlockIndices(blockIndices) {
    indices.push(blockIndices.nwIndex, blockIndices.neIndex, blockIndices.seIndex);
    indices.push(blockIndices.seIndex, blockIndices.swIndex, blockIndices.nwIndex);
}

function getNextBlockIndices(directionToTravel, currentBlockIndices, isForNeighbor) {
    var nwIndex, neIndex, seIndex, swIndex, coordX, coordY;
    switch (directionToTravel) {
        case Directions.NORTH:
            seIndex = currentBlockIndices.neIndex;
            swIndex = currentBlockIndices.nwIndex;

            coordX = vertices[currentBlockIndices.nwIndex * 2];
            coordY = vertices[(currentBlockIndices.nwIndex * 2) + 1] + blockLengthV;
            nwIndex = registerVertices(coordX, coordY);

            coordX = vertices[currentBlockIndices.neIndex * 2];
            coordY = vertices[(currentBlockIndices.neIndex * 2) + 1] + blockLengthV;
            neIndex = registerVertices(coordX, coordY);
            break;
        case Directions.EAST:
            nwIndex = currentBlockIndices.neIndex;
            swIndex = currentBlockIndices.seIndex;

            coordX = vertices[currentBlockIndices.neIndex * 2] + blockLengthH;
            coordY = vertices[(currentBlockIndices.neIndex * 2) + 1];
            neIndex = registerVertices(coordX, coordY);

            coordX = vertices[currentBlockIndices.seIndex * 2] + blockLengthH;
            coordY = vertices[(currentBlockIndices.seIndex * 2) + 1];
            seIndex = registerVertices(coordX, coordY);
            break;
        case Directions.SOUTH:
            neIndex = currentBlockIndices.seIndex;
            nwIndex = currentBlockIndices.swIndex;

            coordX = vertices[currentBlockIndices.swIndex * 2];
            coordY = vertices[(currentBlockIndices.swIndex * 2) + 1] - blockLengthV;
            swIndex = registerVertices(coordX, coordY);

            coordX = vertices[currentBlockIndices.seIndex * 2];
            coordY = vertices[(currentBlockIndices.seIndex * 2) + 1] - blockLengthV;
            seIndex = registerVertices(coordX, coordY);
            break;
        case Directions.WEST:
            neIndex = currentBlockIndices.nwIndex;
            seIndex = currentBlockIndices.swIndex;

            coordX = vertices[currentBlockIndices.nwIndex * 2] - blockLengthH;
            coordY = vertices[(currentBlockIndices.nwIndex * 2) + 1];
            nwIndex = registerVertices(coordX, coordY);

            coordX = vertices[currentBlockIndices.swIndex * 2] - blockLengthH;
            coordY = vertices[(currentBlockIndices.swIndex * 2) + 1];
            swIndex = registerVertices(coordX, coordY);
            break;
    }
    var blockIndices = new BlockIndices(nwIndex, neIndex, seIndex, swIndex);
    registerBlockIndices(blockIndices);
    return blockIndices;
}

function getNeighborBlockID(directionToTravel, currentBlockId) {
    var newBlockH, newBlockV;
    switch (directionToTravel) {
        case Directions.NORTH:
            newBlockH = currentBlockId.locH;
            newBlockV = currentBlockId.locV + 2;
            break;
        case Directions.EAST:
            newBlockH = currentBlockId.locH + 2;
            newBlockV = currentBlockId.locV;
            break;
        case Directions.SOUTH:
            newBlockH = currentBlockId.locH;
            newBlockV = currentBlockId.locV - 2;
            break;
        case Directions.WEST:
            newBlockH = currentBlockId.locH - 2;
            newBlockV = currentBlockId.locV;
            break;
    }
    return new BlockID(newBlockH, newBlockV);
}

function getDirectionWithRespectToNeighbor(directionToTravel) {
    switch (directionToTravel) {
        case Directions.NORTH:
            return Directions.SOUTH;
        case Directions.SOUTH:
            return Directions.NORTH;
        case Directions.EAST:
            return Directions.WEST;
        case Directions.WEST:
            return Directions.EAST;
    }
}

function canVisitNeighbor(neighborBlockID) {
    if (neighborBlockID.locH >= blockCountH) {
        console.log("max:" + neighborBlockID.locH);
    }
    return neighborBlockID.locH > 0 && neighborBlockID.locV > 0 &&
        neighborBlockID.locV < blockCountV && neighborBlockID.locH < blockCountH
        && !contains(occupiedBlockIDs, neighborBlockID, areSameOccupiedBlockIDs);
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
