/**
 * Created by ben on 9/7/15.
 */
(function () {
    var client, search;

    (function () {
        'use strict';
        var PORT = 9000,
            express = require('express'),
            app = express(),
            server = app.listen(PORT, function () {
                console.log('Listening on port: %s', PORT);
            }),
            io = require('socket.io').listen(server);
            client = require('redis').createClient();

        client.on('connect', function () {
            console.log('connected to redis');
            search = monteCarloTreeSearch();
            search.init();
        });

        io.on('connection', function (socket) {
            console.log('connected to ' + socket.id);

            socket.on('getData', function (key, callback) {
                console.log("data: " + key);
                callback("data");
            });

        });

        app.use(express.static('.'));
        app.get('/', function (req, res) {
            res.sendFile('quoridor.html', {root: '/home/ben/WebstormProjects/quoridor_server'});
        });

    })();

//While a. Running in the background or b. Within AI thinking time
//Select most valuable child node
//Simulate until endnode reached (alternate high and low board values each ply)
//Backpropagate result and increment visit count to each parent node including root

    function monteCarloTreeSearch() {
        'use strict';

        var root = new TreeNode(JSON.stringify({
            dimension: 9,
            totalWalls: 128,
            placedWalls: [],
            validMoves: [67, 77, 75],
            currentPlayer: 'player1',
            player1: {
                position: 76,
                winRange: [0, 8],
                wallCount: 10
            },
            player2: {
                position: 4,
                winRange: [72, 80],
                wallCount: 10
            }
        }), undefined);

        function init() {
            var bestNode;
            bestNode = selectChild(root);
        }

        function selectChild(node) {
            var i, bestChild, boardHeuristic,
                children = node.getChildren();
            for (i = 0; i < children.length; i++) {

            }
        }

        function TreeNode(brdStr, par) {
            var my,
                parentNode = par,
                board = new AbstractBoard(brdStr);

            client.get(brdStr, function (err, reply) {
                if (reply) {
                    my = JSON.parse(reply);
                }
                else {
                    my = {
                        visits: null,
                        outcomes: null,
                        boardValue: board.getHeuristicValue(),
                        onTree: false
                    };
                    client.set(brdStr, JSON.stringify(my));
                }
            });

            this.getNodeVisits = function getNodeVisits() {
                return my.visits;
            };

            this.getPathOutcomes = function getPathOutcomes() {
                return my.outcomes;
            };

            this.getUCTValue = function getUCTValue() {
                return (my.outcomes / my.visits) + Math.sqrt(2) * Math.sqrt(Math.log(parentNode.getNodeVisits()) / my.visits) +
                        my.boardValue / (my.visits + 1);
            };

            this.getChildren = function getChildren() {
                var i, child,
                    children = [],
                    childrenBoards = board.getChildren();


                for (i = 0; i < childrenBoards.length; i++) {
                    child = new TreeNode(JSON.stringify(childrenBoards[i]), this);
                    children.push(child);
                }
                return children;
            };

            this.getBoard = function getBoard() {
                return board;
            };
        }

        function setRootNode(node) {

        }

        return {
            setRootNode: setRootNode,
            init: init
        };
    }

    function AbstractBoard(brdStr) {
        'use strict';
        var my = JSON.parse(brdStr);

        this.getOpponent = function getOpponent() {
            return my.currentPlayer === 'player1' ? 'player2' : 'player1';
        };

        this.getBoardString = function getBoardString() {
            return brdStr;
        };

        //children are all possible walls and new moves
        this.getChildren = function getChildren() {
            var i, moves, child, currentPlayerPos,
                walls = getPossibleWalls(),
                children = [];


            currentPlayerPos = my[my.currentPlayer].position;
            i = my.validMoves.indexOf(currentPlayerPos);
            if (i > -1) {
                moves = my.validMoves.splice(i, 1);
            }
            else {
                moves = my.validMoves.slice();
            }
            //add each possible wall and move, recalculate valid moves for new current player
            //subtract 1 wall from current player
            //switch current player
            for (i = 0; i < walls.length; i++) {
                child = JSON.parse(brdStr);

                if (child.currentPlayer === 'player1' && child.player1.wallCount > 0) {
                    child.placedWalls.push(walls[i]);
                    child.player1.wallCount -= 1;
                    child.currentPlayer = 'player2';
                    child.validMoves = findValidMoves(child.player2.position, false, true);
                    children.push(child);
                }
                else if (child.player2.wallCount > 0) {
                    child.placedWalls.push(walls[i]);
                    child.player2.wallCount -= 1;
                    child.currentPlayer = 'player1';
                    child.validMoves = findValidMoves(child.player1.position, false, true);
                    children.push(child);
                }
            }

            for (i = 0; i < moves.length; i++) {
                child = JSON.parse(brdStr);
                if (child.currentPlayer === 'player1') {
                    child.player1.position = moves[i];
                    child.currentPlayer = 'player2';
                    child.validMoves = findValidMoves(child.player2.position, false, true);
                }
                else {
                    child.player2.position = moves[i];
                    child.currentPlayer = 'player1';
                    child.validMoves = findValidMoves(child.player1.position, false, true);
                }
                children.push(child);
            }
            return children;
        };

        function getPossibleWalls() {
            var i,
                walls = [];

            for (i = 0; i < my.totalWalls; i++) {
                walls.push(i);
            }

            return walls.filter(function (el) {
                if (wallIsValid(el)) {
                    return my.placedWalls.indexOf(el) === -1;
                }
                return false;
            });
        }

        //Returned values:
        //0:Top 1:Right 2:Bottom 3:Left
        function getAdjacentBoardEdges(pos) {
            var i,
                edges = [];

            //Check if moves are on board
            for (i = 0; i < 4; i++) {
                if (getMovePosition(pos, i) === -1) {
                    edges.push(i);
                }
            }

            return edges;
        }

        function moveIsOnBoard(pos1, pos2) {
            var direction = getRelativeDirection(pos1, pos2);

            switch (direction) {
                //North is valid if not on top edge
                case 0:
                    return (Math.floor(pos1 / my.dimension) > 0);
                //East is valid if not on right edge
                case 1:
                    return ((pos1 % my.dimension) < 8);
                //South
                case 2:
                    return (Math.floor(pos1 / my.dimension) < 8);
                //West
                case 3:
                    return ((pos1 % my.dimension) > 0);
                default:
                    return false;
            }
        }

        function wallIntersects(wallIndex) {
            var i,
                conflictWalls;

            if ((wallIndex % 2) === 0) {
                conflictWalls = [
                    wallIndex,
                    wallIndex + 1,
                    wallIndex + 2,
                    wallIndex - 2
                ];
                if (wallIndex % ((my.dimension - 1) * 2) === (((my.dimension - 1) * 2) - 2)) {
                    conflictWalls.splice(2, 1);
                }
                if (wallIndex % ((my.dimension - 1) * 2) === 0) {
                    conflictWalls.splice(3, 1);
                }
            }
            else {
                conflictWalls = [
                    wallIndex,
                    wallIndex - 1,
                    wallIndex - (my.dimension - 1) * 2,
                    wallIndex + (my.dimension - 1) * 2
                ];
            }

            for (i = 0; i < conflictWalls.length; i++) {
                if (my.placedWalls.indexOf(conflictWalls[i]) > -1) {
                    return true;
                }
            }
            return false;
        }

        function wallIsValid(wallIndex) {
            return wallIndex > -1 && !wallIntersects(wallIndex) &&
                playersHavePaths(wallIndex) &&
                wallIndex < my.totalWalls;
        }

        function moveIsValid(movePosition) {
            if (my.validMoves.length > 0) {
                return (my.validMoves.indexOf(movePosition) !== -1);
            }
            else {
                return false;
            }
        }

        function playersHavePaths(wallIndex) {
            return (positionHasPathToEnd(my.player1.position, my.player1.winRange, wallIndex) &&
            positionHasPathToEnd(my.player2.position, my.player2.winRange, wallIndex));
        }

        function positionHasPathToEnd(pos, wr, includeWall) {
            var i, node, moves,
                winRange = wr,
                positionQueue = [pos],
                examinedPositions = new Array(Math.pow(my.dimension, 2) - 1)
                    .join('0').split('').map(parseFloat);

            if (includeWall > -1) {
                my.placedWalls.push(includeWall);
            }

            do {
                node = positionQueue.shift();
                if (node >= winRange[0] && node <= winRange[1]) {
                    my.placedWalls.splice(my.placedWalls.length - 1, 1);
                    return true;
                }
                moves = findValidMoves(node, false, true);
                for (i = 0; i < moves.length; i++) {
                    if (examinedPositions[moves[i]] !== 1) {
                        examinedPositions[moves[i]] = 1;
                        positionQueue = positionQueue.concat(findValidMoves(moves[i], false, true));
                    }
                }
            } while (positionQueue.length > 0);
            my.placedWalls.splice(my.placedWalls.length - 1, 1);
            return false;
        }

        function playerIsAtPosition(pos) {
            return (my.player1.position === pos || my.player2.position === pos);
        }

        function findValidMoves(posIndex, ignoreJump, discardMoves) {
            var moves = getMoveSet(posIndex),
                walls = getAdjacentWalls(posIndex, false),
                i, j, k, jumpSpace,
                opponentDirection, opponentMoves, wallOrientation;

            for (i = 0; i < walls.length; i++) {
                //If an obstructive wall has been placed
                if (my.placedWalls.indexOf(walls[i]) > -1) {
                    //Get blocking direction of wall
                    wallOrientation = getRelativeWallOrientation(posIndex, walls[i]);
                    //And remove that direction from moveset
                    moves.splice(moves.indexOf(getMovePosition(posIndex, wallOrientation)), 1);
                }
            }

            //Check for adjacent player, add valid jump moves
            if (ignoreJump === false) {
                for (i = 0; i < moves.length; i++) {
                    //If there is an adjacent player
                    if (playerIsAtPosition(moves[i]) && moves[i] !== posIndex) {
                        //Get opponent direction and walls around its position
                        opponentDirection = getRelativeDirection(posIndex, moves[i]);
                        walls = getAdjacentWalls(moves[i], false);
                        for (j = 0; j < walls.length; j++) {
                            wallOrientation = getRelativeWallOrientation(moves[i], walls[j]);
                            //If wall obstructs jump, add opponent's moveset to current player's
                            if (opponentDirection === wallOrientation) {
                                opponentMoves = findValidMoves(moves[i], true, true);
                            }
                        }
                        //If jump is clear, add jump to moveset
                        //remove opponent's position
                        //If jump is off the board (which is an unclear case in the rules!) add opponents moves
                        if (typeof opponentMoves === 'undefined') {
                            jumpSpace = getMovePosition(moves[i], opponentDirection);
                            if (jumpSpace > -1) {
                                moves.splice(i, 1, jumpSpace);
                            }
                            else {
                                opponentMoves = findValidMoves(moves[i], true, true);
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
                setValidMoves(moves);
            }
        }

        function setValidMoves(moves) {
            if (moves.constructor === Array) {
                my.validMoves = moves.slice();
            }
            else {
                my.validMoves = [];
            }
        }

        function getAdjacentWalls(posIndex, includePotentialWalls) {
            var i,
            //0,1:Southeast 2,3:Southwest 4,5:Northwest 6,7:Northeast Wall Vertices
                unboundedWalls = getUnboundedAdjacentWalls(posIndex),
                walls = unboundedWalls.slice(),
                edges = getAdjacentBoardEdges(posIndex),
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
                    if (my.placedWalls.indexOf(walls[i]) === -1) {
                        invalidWalls.push(walls[i]);
                    }
                }
                for (i = 0; i < invalidWalls.length; i++) {
                    walls.splice(walls.indexOf(invalidWalls[i]), 1);
                }
                return walls;
            }
        }

        //Direction indexes
        //0:North 1:East 2:South 3:West
        function getMovePosition(pos, dir) {
            var moves = [
                (pos - my.dimension),
                (pos + 1),
                (pos + my.dimension),
                (pos - 1)
            ];
            if (moveIsOnBoard(pos, moves[dir])) {
                return moves[dir];
            }
            else {
                return -1;
            }
        }

        //Returned values:
        //0 is North
        //1 is East
        //2 is South
        //3 is West
        //4 is Identical
        //-1 is non-cardinal or non-adjacent
        function getRelativeDirection(pos1, pos2) {
            var i,
                moves = getUnboundedMoveSet(pos1);
            for (i = 0; i < moves.length; i++) {
                if (moves[i] === pos2) {
                    return i;
                }
            }
            return -1;
        }

        //Returned values:
        //0 is Horizontal Top
        //1 is Vertical Right
        //2 is Horizontal Bottom
        //3 is Vertical Left
        //-1 is Non-adjacent
        function getRelativeWallOrientation(posIndex, wallIndex) {
            var unboundedWalls = getUnboundedAdjacentWalls(posIndex),
                i;
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
        }

        //Returns moveset with respect to board position, ignores walls
        function getMoveSet(pos) {
            var i,
                unboundedMoveset = getUnboundedMoveSet(pos),
                moveset = unboundedMoveset.slice(),
                edges = getAdjacentBoardEdges(pos);

            for (i = 0; i < edges.length; i++) {
                moveset.splice(moveset.indexOf(unboundedMoveset[edges[i]]), 1);
            }

            return moveset;
        }

        //0:North 1:East 2:South 3:West
        function getUnboundedMoveSet(pos) {
            return [
                (pos - my.dimension),
                (pos + 1),
                (pos + my.dimension),
                (pos - 1)
            ];
        }

        //Returns surrounding wall indexes regardless of position on board
        function getUnboundedAdjacentWalls(pos) {
            var wall,
                walls = [];

            //Bottom right wall vertex
            wall = (pos % my.dimension) * 2 +
                Math.floor(pos / my.dimension) * (my.dimension - 1) * 2;
            walls.push(wall, (wall + 1));

            //Bottom left
            wall -= 2;
            walls.push(wall, (wall + 1));

            //Top left
            wall -= (my.dimension - 1) * 2;
            walls.push(wall, (wall + 1));

            //Top right
            wall += 2;
            walls.push(wall, (wall + 1));

            return walls;
        }

        this.getGridArray = function getGridArray() {
            var i, k, x, y,
                wallDim = 2 * (my.dimension - 1),
                gridDim = (my.dimension * 2) - 1,
                grid = [];

            for (i = 0; i < gridDim; i++) {
                for (k = 0; k < gridDim; k++) {
                    if (!grid[i]) {
                        grid[i] = [];
                    }
                    grid[i].push(1);
                }
            }
            //console.log('placed walls ' +my.placedWalls);
            for (i = 0; i < my.placedWalls.length; i++) {
                x = my.placedWalls[i] % wallDim;
                y = Math.floor(my.placedWalls[i] / wallDim) * 2;
                if (my.placedWalls[i] % 2 === 0) {
                    y += 1;
                    for (k = x; k < x + 3; k++) {
                        grid[y][k] = 0;
                    }
                }
                else {
                    for (k = y; k < y + 3; k++) {
                        grid[k][x] = 0;
                    }
                }
            }
            //console.log(grid);
            return grid;

        };

        this.positionToGridCoordinates = function positionToGridCoordinates(pos) {
            var x, y;
            x = 2 * (pos % my.dimension);
            y = 2 * Math.floor(pos / my.dimension);
            return [x, y];
        };

        this.getHeuristicValue = function getHeuristicValue() {
            var i, path1, path2, start, coors, end, winRange,
                that = this,
                graph = new module.Graph(this.getGridArray());

            path1 = pathLength(my[my.currentPlayer].position, my.currentPlayer);
            path2 = pathLength(my[this.getOpponent()].position, this.getOpponent());

            console.log('board value: '+Number(path2 - path1));

            return path2 - path1;


            function pathLength(pos, player) {
                var path;
                winRange = my[player].winRange;
               // console.log('winRange '+winRange);
                coors = that.positionToGridCoordinates(pos);
                start = graph.grid[coors[0]][coors[1]];
                console.log('start '+start);
                end = [];
                for (i = winRange[0]; i <= winRange[winRange.length - 1]; i++) {
                    //console.log('i '+i);
                    coors = that.positionToGridCoordinates(i);
                    end.push(graph.grid[coors[0]][coors[1]]);
                }
                path = module.astar.search(graph, start, end);
                console.log('path: '+path);

                return path.length;
            }

        };
    }
})();