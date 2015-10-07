function AbstractBoard(brdStr) {
    this.boardState = JSON.parse(brdStr);
}

AbstractBoard.prototype.getBoardState = function getBoardState() {
    return this.boardState;
};

AbstractBoard.prototype.setBoardState = function setBoardState(brd) {
    if (typeof brd === 'string') {
        this.boardState = JSON.parse(brd);
    }
    else {
        this.boardState = brd;
    }
};

AbstractBoard.prototype.getCurrentPlayer = function getCurrentPlayer() {
    return this.boardState.currentPlayer;
};

AbstractBoard.prototype.getOpponent = function getOpponent() {
    return this.boardState.currentPlayer === 'player1' ? 'player2' : 'player1';
};

AbstractBoard.prototype.getBoardString = function getBoardString() {
    return JSON.stringify(this.boardState);
};

AbstractBoard.prototype.getPlacedWalls = function getPlacedWalls() {
    return this.boardState.placedWalls;
};

AbstractBoard.prototype.getValidMoves = function getValidMoves() {
    return this.boardState.validMoves;
};

//children are all possible walls and new moves
AbstractBoard.prototype.getChildStates = function getChildStates() {
    var i, child,
        tempState = this.boardState,
        boardString = this.getBoardString(),
        currentPlayer = this.boardState.currentPlayer,
        opponent = this.getOpponent(),
        moves = this.boardState.validMoves,
        walls = this.getPossibleWalls(),
        children = [];

    //add each possible wall and move, recalculate valid moves for new current player
    //subtract 1 wall from current player
    //switch current player
    if (this.boardState[currentPlayer].wallCount > 0) {
        for (i = 0; i < walls.length; i++) {
            child = JSON.parse(boardString);
            child.edge = 'wall ' + walls[i];
            child.placedWalls.push(walls[i]);
            child[currentPlayer].wallCount -= 1;
            child.currentPlayer = opponent;
            this.setBoardState(child);
            child.validMoves = this.findValidMoves(child[opponent].position, false, true);
            children.push(child);
        }
    }
    //Add each move to children set
    for (i = 0; i < moves.length; i++) {
        child = JSON.parse(boardString);
        child.edge = 'move ' + moves[i];
        child[currentPlayer].position = moves[i];
        child.currentPlayer = opponent;
        this.setBoardState(child);
        child.validMoves = this.findValidMoves(child[opponent].position, false, true);
        children.push(child);
    }
    this.setBoardState(tempState);
    return children;
};

AbstractBoard.prototype.findValidMoves = function findValidMoves(posIndex, ignoreJump, discardMoves) {
    var moves = this.getMoveSet(posIndex),
        walls = this.getAdjacentWalls(posIndex, false),
        i, j, k, jumpSpace,
        opponentDirection, opponentMoves, wallOrientation;

    for (i = 0; i < walls.length; i++) {
        //If an obstructive wall has been placed
        if (this.boardState.placedWalls.indexOf(walls[i]) > -1) {
            //Get blocking direction of wall
            wallOrientation = this.getRelativeWallOrientation(posIndex, walls[i]);
            //And remove that direction from moveset
            moves.splice(moves.indexOf(this.getMovePosition(posIndex, wallOrientation)), 1);
        }
    }

    //Check for adjacent player, add valid jump moves
    if (ignoreJump === false) {
        for (i = 0; i < moves.length; i++) {
            //If there is an adjacent player
            if (this.playerIsAtPosition(moves[i]) && moves[i] !== posIndex) {
                //Get opponent direction and walls around its position
                opponentDirection = this.getRelativeDirection(posIndex, moves[i]);
                walls = this.getAdjacentWalls(moves[i], false);
                for (j = 0; j < walls.length; j++) {
                    wallOrientation = this.getRelativeWallOrientation(moves[i], walls[j]);
                    //If wall obstructs jump, add opponent's moveset to current player's
                    if (opponentDirection === wallOrientation) {
                        opponentMoves = this.findValidMoves(moves[i], true, true);
                    }
                }
                //If jump is clear, add jump to moveset
                //remove opponent's position
                //If jump is off the this.boardState (which is an unclear case in the rules!) add opponents moves
                if (typeof opponentMoves === 'undefined') {
                    jumpSpace = this.getMovePosition(moves[i], opponentDirection);
                    if (jumpSpace > -1) {
                        moves.splice(i, 1, jumpSpace);
                    }
                    else {
                        opponentMoves = this.findValidMoves(moves[i], true, true);
                    }
                }
                if (typeof opponentMoves !== 'undefined') {
                    for (k = 0; k < opponentMoves.length; k++) {
                        if (moves.indexOf(opponentMoves[k]) === -1) {
                            moves.push(opponentMoves[k]);
                        }
                    }
                    moves.splice(i, 1);
                }
            }
        }
    }
    if (discardMoves === true) {
        return moves;
    }
    else {
        this.setValidMoves(moves);
    }
};

AbstractBoard.prototype.getPossibleWalls = function getPossibleWalls() {
    var i,
        that = this,
        walls = [];

    for (i = 0; i < this.boardState.totalWalls; i++) {
        walls.push(i);
    }

    return walls.filter(function (el) {
        if (that.wallIsValid(el)) {
            return that.boardState.placedWalls.indexOf(el) === -1;
        }
        return false;
    });
};

AbstractBoard.prototype.moveIsOnBoard = function moveIsOnBoard(pos1, pos2) {
    var direction = this.getRelativeDirection(pos1, pos2);
    switch (direction) {
        //North is valid if not on top edge
        case 0:
            return (Math.floor(pos1 / this.boardState.dimension) > 0);
        //East is valid if not on right edge
        case 1:
            return ((pos1 % this.boardState.dimension) < 8);
        //South
        case 2:
            return (Math.floor(pos1 / this.boardState.dimension) < 8);
        //West
        case 3:
            return ((pos1 % this.boardState.dimension) > 0);
        default:
            return false;
    }
};

//Returned values:
//0:Top 1:Right 2:Bottom 3:Left
AbstractBoard.prototype.getAdjacentBoardEdges = function getAdjacentBoardEdges(pos) {
        var i,
            edges = [];

        //Check if moves are on this.boardState
        for (i = 0; i < 4; i++) {
            if (this.getMovePosition(pos, i) === -1) {
                edges.push(i);
            }
        }

        return edges;
};

AbstractBoard.prototype.wallIntersects = function wallIntersects(wallIndex) {
    var i, conflictWalls;

    if ((wallIndex % 2) === 0) {
        conflictWalls = [
            wallIndex,
            wallIndex + 1,
            wallIndex + 2,
            wallIndex - 2
        ];
        if (wallIndex % ((this.boardState.dimension - 1) * 2) === (((this.boardState.dimension - 1) * 2) - 2)) {
            conflictWalls.splice(2, 1);
        }
        if (wallIndex % ((this.boardState.dimension - 1) * 2) === 0) {
            conflictWalls.splice(3, 1);
        }
    }
    else {
        conflictWalls = [
            wallIndex,
            wallIndex - 1,
            wallIndex - (this.boardState.dimension - 1) * 2,
            wallIndex + (this.boardState.dimension - 1) * 2
        ];
    }

    for (i = 0; i < conflictWalls.length; i++) {
        if (this.boardState.placedWalls.indexOf(conflictWalls[i]) > -1) {
            return true;
        }
    }
    return false;
};

AbstractBoard.prototype.wallIsValid = function wallIsValid(wallIndex) {
    return wallIndex > -1 && !this.wallIntersects(wallIndex) &&
        this.playersHavePaths(wallIndex) &&
        wallIndex < this.boardState.totalWalls;
};

AbstractBoard.prototype.moveIsValid = function moveIsValid(movePosition) {
    if (this.boardState.validMoves.length > 0) {
        return (this.boardState.validMoves.indexOf(movePosition) !== -1);
    }
    else {
        return false;
    }
};

AbstractBoard.prototype.playersHavePaths = function playersHavePaths(wallIndex) {
    return (this.positionHasPathToEnd(this.boardState.player1.position, this.boardState.player1.winRange, wallIndex) &&
    this.positionHasPathToEnd(this.boardState.player2.position, this.boardState.player2.winRange, wallIndex));
};

AbstractBoard.prototype.positionHasPathToEnd = function positionHasPathToEnd(pos, wr, includeWall) {
    var i, moves, player, tempPos,
        winRange = wr,
        positionQueue = [pos],
        examinedPositions = new Array(Math.pow(this.boardState.dimension, 2) - 1)
            .join('0').split('').map(parseFloat);

    switch (pos) {
        case this.boardState.player1.position:
            player = 'player1';
            break;
        case this.boardState.player2.position:
            player = 'player2';
            break;
    }
    tempPos = this.boardState[player].position;
    if (includeWall > -1) {
        this.boardState.placedWalls.push(includeWall);
    }

    do {
        this.boardState[player].position = positionQueue.shift();
        if (this.boardState[player].position >= winRange[0] && this.boardState[player].position <= winRange[1]) {
            if (includeWall > -1) {
                this.boardState.placedWalls.splice(this.boardState.placedWalls.length - 1, 1);
            }
            this.boardState[player].position = tempPos;
            return true;
        }
        moves = this.findValidMoves(this.boardState[player].position, false, true);
        for (i = 0; i < moves.length; i++) {
            if (examinedPositions[moves[i]] !== 1) {
                examinedPositions[moves[i]] = 1;
                this.boardState[player].position = moves[i];
                positionQueue = positionQueue.concat(this.findValidMoves(moves[i], false, true));
            }
        }
    } while (positionQueue.length > 0);
    if (includeWall > -1) {
        this.boardState.placedWalls.splice(boardState.placedWalls.length - 1, 1);
    }
    this.boardState[player].position = tempPos;
    return false;
};

AbstractBoard.prototype.playerIsAtPosition = function playerIsAtPosition(pos) {
    return (this.boardState.player1.position === pos || this.boardState.player2.position === pos);
};

AbstractBoard.prototype.setValidMoves = function setValidMoves(moves) {
    if (moves.constructor === Array) {
        this.boardState.validMoves = moves.slice();
    }
    else {
        this.boardState.validMoves = [];
    }
};

AbstractBoard.prototype.getAdjacentWalls = function getAdjacentWalls(posIndex, includePotentialWalls) {
    var i,
        //0,1:Southeast 2,3:Southwest 4,5:Northwest 6,7:Northeast Wall Vertices
        unboundedWalls = this.getUnboundedAdjacentWalls(posIndex),
        walls = unboundedWalls.slice(),
        edges = this.getAdjacentBoardEdges(posIndex),
        invalidWalls = [];

    function removeWalls(wallIndexes) {
        var spliceIndex, k;

        for (k = 0; k < wallIndexes.length; k++) {
            spliceIndex = walls.indexOf(unboundedWalls[wallIndexes[k]]);
            if (spliceIndex !== -1) {
                walls.splice(spliceIndex, 2);
            }
        }
    }

    //Remove invalid edge walls
    for (i = 0; i < edges.length; i++) {
        switch (edges[i]) {
            //Top edge
            case 0:
                removeWalls([4, 6]);
                break;
            //Right edge
            case 1:
                removeWalls([6, 0]);
                break;
            //Bottom edge
            case 2:
                removeWalls([0, 2]);
                break;
            //Left edge
            case 3:
                removeWalls([2, 4]);
                break;
        }
    }

    if (includePotentialWalls === true) {
        //Regardless of currently placed walls, solely based on position
        return walls;
    }
    else {
        for (i = 0; i < walls.length; i++) {
            if (this.boardState.placedWalls.indexOf(walls[i]) === -1) {
                invalidWalls.push(walls[i]);
            }
        }
        for (i = 0; i < invalidWalls.length; i++) {
            walls.splice(walls.indexOf(invalidWalls[i]), 1);
        }
        return walls;
    }
};

//Direction indexes
//0:North 1:East 2:South 3:West
AbstractBoard.prototype.getMovePosition = function getMovePosition(pos, dir) {
    var moves = [
        (pos - this.boardState.dimension),
        (pos + 1),
        (pos + this.boardState.dimension),
        (pos - 1)
    ];

    if (this.moveIsOnBoard(pos, moves[dir])) {
        return moves[dir];
    }
    else {
        return -1;
    }
};

//Returned values:
//0 is North
//1 is East
//2 is South
//3 is West
//4 is Identical
//-1 is non-cardinal or non-adjacent
AbstractBoard.prototype.getRelativeDirection = function getRelativeDirection(pos1, pos2) {
    var i,
        moves = this.getUnboundedMoveSet(pos1);
    for (i = 0; i < moves.length; i++) {
        if (moves[i] === pos2) {
            return i;
        }
    }
    return -1;
};

//Returned values:
//0 is Horizontal Top
//1 is Vertical Right
//2 is Horizontal Bottom
//3 is Vertical Left
//-1 is Non-adjacent
AbstractBoard.prototype.getRelativeWallOrientation = function getRelativeWallOrientation(posIndex, wallIndex) {
    var i,
        unboundedWalls = this.getUnboundedAdjacentWalls(posIndex);
    for (i = 0; i < unboundedWalls.length; i++) {
        if (unboundedWalls[i] === wallIndex) {
            switch (i) {
                case 4:
                case 6:
                    return 0;
                case 1:
                case 7:
                    return 1;
                case 0:
                case 2:
                    return 2;
                case 3:
                case 5:
                    return 3;
            }
        }
    }
    return -1;
};

//Returns moveset with respect to this.boardState position, ignores walls
AbstractBoard.prototype.getMoveSet = function getMoveSet(pos) {
    var i,
        unboundedMoveset = this.getUnboundedMoveSet(pos),
        moveset = unboundedMoveset.slice(),
        edges = this.getAdjacentBoardEdges(pos);

    for (i = 0; i < edges.length; i++) {
        moveset.splice(moveset.indexOf(unboundedMoveset[edges[i]]), 1);
    }

    return moveset;
};

//0:North 1:East 2:South 3:West
AbstractBoard.prototype.getUnboundedMoveSet = function getUnboundedMoveSet(pos) {
    return [
        (pos - this.boardState.dimension),
        (pos + 1),
        (pos + this.boardState.dimension),
        (pos - 1)
    ];
};

//Returns surrounding wall indexes regardless of position on this.boardState
AbstractBoard.prototype.getUnboundedAdjacentWalls = function getUnboundedAdjacentWalls(pos) {
    var wall,
        walls = [];

    //Bottom right wall vertex
    wall = (pos % this.boardState.dimension) * 2 +
        Math.floor(pos / this.boardState.dimension) * (this.boardState.dimension - 1) * 2;
    walls.push(wall, (wall + 1));

    //Bottom left
    wall -= 2;
    walls.push(wall, (wall + 1));

    //Top left
    wall -= (this.boardState.dimension - 1) * 2;
    walls.push(wall, (wall + 1));

    //Top right
    wall += 2;
    walls.push(wall, (wall + 1));

    return walls;
};

AbstractBoard.prototype.getGraphArray = function getGraphArray() {
    var key, distance,
        node = null,
        neighbors = null,
        edges = null,
        unprocessed = [],
        processed = [],
        player1 = this.boardState.player1,
        player2 = this.boardState.player2,
        currentPos = this.boardState[this.boardState.currentPlayer].position,
        nodes = [];
    do {
        neighbors = [];
        edges = [];
        if (currentPos >= player1.winRange[0] && currentPos <= player1.winRange[1]) {
            neighbors.push('p1Win');
        }
        else if (currentPos >= player2.winRange[0] && currentPos <= player2.winRange[1]) {
            neighbors.push('p2Win');
        }
        node = [currentPos];
        //console.log('validmoves: '+this.findValidMoves(currentPos, true, true));
        neighbors = neighbors.concat(this.findValidMoves(currentPos, true, true));
        for (key in neighbors) {
            if (neighbors.hasOwnProperty(key)) {
                distance = (typeof neighbors[key] === 'string') ? 0 : 1;
                edges.push([neighbors[key], distance]);
                if (unprocessed.indexOf(neighbors[key]) === -1 &&
                    typeof neighbors[key] !== 'string' && processed.indexOf(neighbors[key]) === -1) {
                    unprocessed.push(neighbors[key]);
                }
            }
        }
        node.push(edges);
        nodes.push(node);
        processed.push(currentPos);
      //  console.log('unprocessed: '+unprocessed);
        currentPos = unprocessed.pop();
    } while (currentPos !== undefined);
  //  console.log('return: '+nodes);
    return nodes;
};

AbstractBoard.prototype.getHeuristicValue = function getHeuristicValue() {
    var search = new DijkstrasAlgorithm(this.getGraphArray());
    return 1;
};



/*
function AbstractBoard(brdStr) {
'use strict';
var this.boardState = JSON.parse(brdStr),
    that = this;


this.getGridArray = function getGridArray() {
    var i, k, x, y,
        wallDim = 2 * (this.boardState.dimension - 1),
        gridDim = (this.boardState.dimension * 2) - 1,
        grid = [];

    for (i = 0; i < gridDim; i++) {
        for (k = 0; k < gridDim; k++) {
            if (!grid[i]) {
                grid[i] = [];
            }
            grid[i].push(1);
        }
    }

    for (i = 0; i < this.boardState.placedWalls.length; i++) {
        x = this.boardState.placedWalls[i] % wallDim;
        y = wallDim - 2 * Math.floor(boardState.placedWalls[i] / wallDim);
        if (this.boardState.placedWalls[i] % 2 === 0) {
            y -= 1;
            for (k = x; k < x + 3; k++) {
                grid[k][y] = 0;
            }
        }
        else {
            for (k = y; k > y - 3; k--) {
                grid[x][k] = 0;
            }
        }
    }
    return grid;

};

























this.positionToGridCoordinates = function positionToGridCoordinates(pos) {
    var x, y;
    x = 2 * (pos % this.boardState.dimension);
    y = (2 * (this.boardState.dimension - 1)) - 2 * Math.floor(pos / this.boardState.dimension);
    return [x, y];
};

 this.getHeuristicValue = function getHeuristicValue() {
 var i, path1, path2, start, coors, winRange,
 opponent = this.getOpponent(),
 opponentPosition = this.boardState[opponent].position,
 that = this,
 graph = new module.Graph(this.getGridArray());

 path1 = pathLength(boardState[boardState.currentPlayer].position, this.boardState.currentPlayer);
 path2 = pathLength(opponentPosition, opponent);
 winRange = this.boardState[opponent].winRange;
 if (opponentPosition >= winRange[0] && opponentPosition <= winRange[1]) {
 return Infinity;
 }
 else {
 return path1 - path2;
 }


 function pathLength(pos, player) {
 var path, length = Infinity;
 winRange = this.boardState[player].winRange;
 coors = that.positionToGridCoordinates(pos);
 start = graph.grid[coors[0]][coors[1]];
 for (i = winRange[0]; i < winRange[winRange.length - 1]; i++) {
 coors = that.positionToGridCoordinates(i);
 path = module.astar.search(graph, start, graph.grid[coors[0]][coors[1]]);
 if (path.length > 0 && path.length < length) {
 length = path.length;
 }
 }
 return length;
 }

 };

this.getHeuristicValue = function getHeuristicValue() {

};

this.toString = function toString() {
    return new module.Graph(this.getGridArray()).toString(boardState.player1.position, this.boardState.player2.position);
};
}*/