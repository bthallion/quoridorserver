// javascript-astar 0.4.0
// http://github.com/bgrins/javascript-astar
// Freely distributable under the MIT License.
// Implements the astar search algorithm in javascript using a Binary Heap.
// Includes Binary Heap (with modifications) from Marijn Haverbeke.
// http://eloquentjavascript.net/appendix2.html
var module = {};

(function(definition) {
    var exports = definition();
    module.astar = exports.astar;
    module.Graph = exports.Graph;
})(function() {

function pathTo(node){
    var curr = node,
        path = [];
    while(curr.parent) {
        path.push(curr);
        curr = curr.parent;
    }
    return path.reverse();
}

function getHeap() {
    return new BinaryHeap(function(node) {
        return node.f;
    });
}

var astar = {
    /**
    * Perform an A* Search on a graph given a start and end node.
    * @param {Graph} graph
    * @param {GridNode} start
    * @param {Array} end
    */
    search: function search(graph, start, end) {
        graph.cleanDirty();
        var options = {};
        var heuristic = astar.heuristics.manhattan,
            closest = false;

        var openHeap = getHeap(),
            closestNode = start; // set the start node to be the closest if required
        start.h = heuristic(start, end);
        openHeap.push(start);
        while (openHeap.size() > 0) {

            // Grab the lowest f(x) to process next.  Heap keeps this sorted for us.
            var currentNode = openHeap.pop();
          //  console.log('current node '+currentNode+" value: "+currentNode.f);
            // End case -- result has been found, return the traced path.
            if (end === currentNode) {
                return pathTo(currentNode);
            }

            // Normal case -- move currentNode from open to closed, process each of its neighbors.
            currentNode.closed = true;
            graph.markDirty(currentNode);

            // Find all neighbors for the current node.
            var neighbors = graph.neighbors(currentNode);
            //console.log('neighbors: '+neighbors);
            for (var j = 0, il = neighbors.length; j < il; ++j) {
                var neighbor = neighbors[j];

                if (neighbor.closed || neighbor.isWall()) {
                    // Not a valid node to process, skip to next neighbor.
                    continue;
                }

                // The g score is the shortest distance from start to current node.
                // We need to check if the path we have arrived at this neighbor is the shortest one we have seen yet.
                var gScore = currentNode.g + neighbor.getCost(currentNode),
                    beenVisited = neighbor.visited;

                if (!beenVisited || gScore < neighbor.g) {

                    // Found an optimal (so far) path to this node.  Take score for node to see how good it is.
                    neighbor.visited = true;
                    neighbor.parent = currentNode;
                    neighbor.h = neighbor.h || heuristic(neighbor, end);
                    neighbor.g = gScore;
                    neighbor.f = neighbor.g + neighbor.h;
                    graph.markDirty(neighbor);
                    if (closest) {
                        // If the neighbour is closer than the current closestNode or if it's equally close but has
                        // a cheaper path than the current closest node then it becomes the closest node
                        if (neighbor.h < closestNode.h || (neighbor.h === closestNode.h && neighbor.g < closestNode.g)) {
                            closestNode = neighbor;
                        }
                    }

                    if (!beenVisited) {
                        // Pushing to heap will put it in proper place based on the 'f' value.
                        openHeap.push(neighbor);
                    }
                    else {
                        // Already seen the node, but since it has been rescored we need to reorder it in the heap
                        openHeap.rescoreElement(neighbor);
                    }
                }
            }
        }

        if (closest) {
            return pathTo(closestNode);
        }
        // No result was found - empty array signifies failure to find path.
        return [];
    },
    // See list of heuristics: http://theory.stanford.edu/~amitp/GameProgramming/Heuristics.html
    heuristics: {
        //check distance to each goal node, return closest distance
        manhattan: function(posStart, posEnd) {
            return Math.abs(posEnd.x - posStart.x) + Math.abs(posEnd.y - posStart.y);
        },
        diagonal: function(pos0, pos1) {
            var D = 1;
            var D2 = Math.sqrt(2);
            var d1 = Math.abs(pos1.x - pos0.x);
            var d2 = Math.abs(pos1.y - pos0.y);
            return (D * (d1 + d2)) + ((D2 - (2 * D)) * Math.min(d1, d2));
        }
    },
    cleanNode:function(node){
        node.f = 0;
        node.g = 0;
        node.h = 0;
        node.visited = false;
        node.closed = false;
        node.parent = null;
    }
};

/**
* A graph memory structure
* @param {Array} gridIn 2D array of input weights
* @param {Object} [options]
* @param {bool} [options.diagonal] Specifies whether diagonal moves are allowed
*/
function Graph(gridIn, options) {
    options = options || {};
    this.nodes = [];
    this.diagonal = !!options.diagonal;
    this.grid = [];
    for (var x = 0; x < gridIn.length; x++) {
        this.grid[x] = [];

        for (var y = 0, row = gridIn[x]; y < row.length; y++) {
            var node = new GridNode(x, y, row[y]);
            this.grid[x][y] = node;
            this.nodes.push(node);
        }
    }
    this.init();
}

Graph.prototype.init = function() {
    this.dirtyNodes = [];
    for (var i = 0; i < this.nodes.length; i++) {
        astar.cleanNode(this.nodes[i]);
    }
};

Graph.prototype.cleanDirty = function() {
    for (var i = 0; i < this.dirtyNodes.length; i++) {
        astar.cleanNode(this.dirtyNodes[i]);
    }
    this.dirtyNodes = [];
};

Graph.prototype.markDirty = function(node) {
    this.dirtyNodes.push(node);
};


Graph.prototype.neighbors = function(node) {
    var i, k,
        ret = [],
        x = node.x,
        y = node.y,
        grid = this.grid;

    // North
    if(grid[x-2] && grid[x-2][y]) {
        if (!(grid[x-1][y].isWall())) {
            ret.push(grid[x-2][y]);
        }
    }

    // South
    if(grid[x+2] && grid[x+2][y]) {
        if (!(grid[x + 1][y].isWall())) {
            ret.push(grid[x + 2][y]);
        }
    }

    // West
    if(grid[x] && grid[x][y-2]) {
        if (!(grid[x][y - 1].isWall())) {
            ret.push(grid[x][y - 2]);
        }
    }

    //East
    if(grid[x] && grid[x][y+2]) {
        if (!(grid[x][y + 1].isWall())) {
            ret.push(grid[x][y + 2]);
        }
    }
 /*
    if (this.diagonal) {
        // Southwest
        if(grid[x-1] && grid[x-1][y-1]) {
            ret.push(grid[x-1][y-1]);
        }

        // Southeast
        if(grid[x+1] && grid[x+1][y-1]) {
            ret.push(grid[x+1][y-1]);
        }

        // Northwest
        if(grid[x-1] && grid[x-1][y+1]) {
            ret.push(grid[x-1][y+1]);
        }

        // Northeast
        if(grid[x+1] && grid[x+1][y+1]) {
            ret.push(grid[x+1][y+1]);
        }
    }*/

    return ret;
};

Graph.prototype.toString = function(pos1, pos2) {
    var graphString = [],
        nodes = this.grid, // when using grid
        rowDebug, row, y, l,
        p1x, p1y, p2x, p2y;

    p1x = 2 * (pos1 % 9);
    p1y = (2 * (9 - 1)) - 2 * Math.floor(pos1 / 9);

    p2x = 2 * (pos2 % 9);
    p2y = (2 * (9 - 1)) - 2 * Math.floor(pos2 / 9);



    for (var x = 0, len = nodes.length; x < len; x++) {
        rowDebug = [];
        row = nodes[x];
        for (y = 0, l = row.length; y < l; y++) {
            if (x === p1x && y === p1y) {
                rowDebug.push(3);
            }
            else if (x === p2x && y === p2y) {
                rowDebug.push(4);
            }
            else {
                rowDebug.push(row[y].weight);
            }
        }
        graphString.push(rowDebug.join(" "));
    }
    return graphString.join("\n");
};

function GridNode(x, y, weight) {
    this.x = x;
    this.y = y;
    this.weight = weight;
}

GridNode.prototype.toString = function() {
    return "[" + this.x + " " + this.y + "]";
};

GridNode.prototype.getCost = function(fromNeighbor) {
    // Take diagonal weight into consideration.
    if (fromNeighbor && fromNeighbor.x != this.x && fromNeighbor.y != this.y) {
        return this.weight * 1.41421;
    }
    return this.weight;
};

GridNode.prototype.isWall = function() {
    return this.weight === 0;
};

function BinaryHeap(scoreFunction){
    this.content = [];
    this.scoreFunction = scoreFunction;
}

BinaryHeap.prototype = {
    push: function(element) {
        // Add the new element to the end of the array.
        this.content.push(element);

        // Allow it to sink down.
        this.sinkDown(this.content.length - 1);
    },
    pop: function() {
        // Store the first element so we can return it later.
        var result = this.content[0];
        // Get the element at the end of the array.
        var end = this.content.pop();
        // If there are any elements left, put the end element at the
        // start, and let it bubble up.
        if (this.content.length > 0) {
            this.content[0] = end;
            this.bubbleUp(0);
        }
        return result;
    },
    remove: function(node) {
        var i = this.content.indexOf(node);

        // When it is found, the process seen in 'pop' is repeated
        // to fill up the hole.
        var end = this.content.pop();

        if (i !== this.content.length - 1) {
            this.content[i] = end;

            if (this.scoreFunction(end) < this.scoreFunction(node)) {
                this.sinkDown(i);
            }
            else {
                this.bubbleUp(i);
            }
        }
    },
    size: function() {
        return this.content.length;
    },
    rescoreElement: function(node) {
        this.sinkDown(this.content.indexOf(node));
    },
    sinkDown: function(n) {
        // Fetch the element that has to be sunk.
        var element = this.content[n];

        // When at 0, an element can not sink any further.
        while (n > 0) {

            // Compute the parent element's index, and fetch it.
            var parentN = ((n + 1) >> 1) - 1,
                parent = this.content[parentN];
            // Swap the elements if the parent is greater.
            if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                this.content[parentN] = element;
                this.content[n] = parent;
                // Update 'n' to continue at the new position.
                n = parentN;
            }
            // Found a parent that is less, no need to sink any further.
            else {
                break;
            }
        }
    },
    bubbleUp: function(n) {
        // Look up the target element and its score.
        var length = this.content.length,
            element = this.content[n],
            elemScore = this.scoreFunction(element);

        while(true) {
            // Compute the indices of the child elements.
            var child2N = (n + 2) << 1,
                child1N = child2N - 2;
            // This is used to store the new position of the element, if any.
            var swap = null,
                child1Score;
            // If the first child exists (is inside the array)...
            if (child1N < length) {
                // Look it up and compute its score.
                var child1 = this.content[child1N];
                child1Score = this.scoreFunction(child1);

                // If the score is less than our element's, we need to swap.
                if (child1Score < elemScore){
                    swap = child1N;
                }
            }

            // Do the same checks for the other child.
            if (child2N < length) {
                var child2 = this.content[child2N],
                    child2Score = this.scoreFunction(child2);
                if (child2Score < (swap === null ? elemScore : child1Score)) {
                    swap = child2N;
                }
            }

            // If the element needs to be moved, swap it, and continue.
            if (swap !== null) {
                this.content[n] = this.content[swap];
                this.content[swap] = element;
                n = swap;
            }
            // Otherwise, we are done.
            else {
                break;
            }
        }
    }
};

return {
    astar: astar,
    Graph: Graph
};

});
;(function () {
    var client, search, gameOver;

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
            res.sendFile('quoridor.html', {root: '/home/ben/workspace/quoridorserver'});
        });

    })();

//While a. Running in the background or b. Within AI thinking time
//Select most valuable child node
//Simulate until endnode reached (alternate high and low board values each ply)
//Backpropagate result and increment visit count to each parent node including root

    function monteCarloTreeSearch() {
        'use strict';

        var subRoot,
            root = JSON.stringify({
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
            });

        function init() {
            subRoot = new TreeNode(root, null, null, false);
            exploreChildNodes(subRoot, true, false, null);
        }

        function highestUCTFound(node) {
            if (node.onTree()) {
                exploreChildNodes(node, true);
            }
            else {
                node.addToGameTree();
                console.log('CURRENT BOARD\n'+node.toString());
                exploreChildNodes(node, false, true, null);
            }
        }

        function exploreChildNodes(currentNode, searching, heavy, returnBestValue) {
            var i, bestChild, childValue,
                nodesEvaluated = 0,
                bestValue = -Infinity,
                children = currentNode.getChildren(heavy);
            console.log('processing '+children.length+' children. heavy: '+heavy);
            function processNode(node) {
                if (!gameOver && node.isProcessed()) {
                    evaluateNode(node);
                    if (nodesEvaluated === children.length) {
                        nodesEvaluated = 0;
                        if (searching) {
                            console.log('uct chosen');
                            highestUCTFound(bestChild);
                        }
                        else if (returnBestValue) {
                            returnBestValue(bestChild);
                        }
                        else {
                            console.log('CURRENT BOARD\n'+bestChild.toString());
                            exploreChildNodes(bestChild, false, true, null);
                        }
                    }
                }
                else if (!gameOver) {
                    setTimeout(processNode, 20, node);
                }
            }

            function evaluateNode(node) {
                if (searching) {
                    childValue = node.getUCTValue();
                }
                else if (returnBestValue) {
                    childValue = node.getBoardValue();
                }
                else {
                    childValue = node.getNodeValue();
                }
                if (bestValue === Number.NEGATIVE_INFINITY || childValue > bestValue ||
                    !searching && childValue === bestValue && node.getOpponentWalls() > bestChild.getOpponentWalls()) {

                    bestChild = node;
                    bestValue = childValue;
                }
                nodesEvaluated += 1;
                if (!searching && !returnBestValue && bestValue === Number.POSITIVE_INFINITY) {
                    console.log('path end found');
                    gameOver = true;
                    bestChild = null;
                    bestValue = -Infinity;
                    nodesEvaluated = 0;
                    if (node.getCurrentPlayer() === 'player2') {
                        node.backpropagate(1);
                    }
                    else {
                        node.backpropagate(-1);
                    }
                }
            }

            for (i = 0; i < children.length; i++) {
                processNode(children[i]);
            }
        }

        function TreeNode(brdStr, par, e, heavy) {
            var my,
                boardString = brdStr,
                boardJSON = JSON.parse(boardString),
                edge = e,
                parentNode = par,
                board = new AbstractBoard(boardString),
                that = this;

            client.get(boardString, function (err, reply) {
                if (reply) {
                    my = JSON.parse(reply);
                    if (heavy && my.nodeValue === undefined) {
                        findNodeValue();
                    }
                }
                else {
                    my = {
                        visits: 0,
                        outcomes: 0,
                        onTree: false
                    };
                    my.boardValue = board.getHeuristicValue();
                    if (heavy) {
                        findNodeValue();
                    }
                    else {
                        client.set(boardString, JSON.stringify(my));
                    }
                }

                function findNodeValue() {
                    exploreChildNodes(that, false, false, function setNodeValue(v) {
                        my.nodeValue = my.boardValue - v.getBoardValue();
                        console.log('heavy node loaded: '+my.nodeValue+'\n'+that.toString()+
                            '\nbest child: '+ v.getBoardValue()+'\n'+ v.toString());
                        client.set(boardString, JSON.stringify(my));
                    });
                }
            });

            this.toString = function toString() {
                return board.toString();
            };

            this.getCurrentPlayer = function getCurrentPlayer() {
                return boardJSON.currentPlayer;
            };

            this.addToGameTree = function addToGameTree() {
                my.onTree = true;
            };

            this.backpropagate = function backpropagate(outcome) {
                my.visits += 1;
                my.outcomes += outcome;
                client.set(boardString, JSON.stringify(my));
                if (parentNode) {
                    parentNode.backpropagate(outcome);
                }
                else {
                    gameOver = false;
                    subRoot = new TreeNode(root, null, null, false);
                    exploreChildNodes(subRoot, true);
                }
            };

            this.getBoardValue = function getBoardValue() {
                return my.boardValue;
            };

            this.onTree = function onTree() {
                return my.onTree;
            };

            this.getOpponentWalls = function getOpponentWalls() {
                var player = boardJSON.currentPlayer === 'player1' ? 'player2' : 'player1';
                return boardJSON[player].wallCount;
            };

            this.getEdge = function getEdge() {
                return edge;
            };

            this.isProcessed = function isProcessed() {
                if (!heavy) {
                    return my !== undefined;
                }
                else {
                    return my !== undefined && !isNaN(my.nodeValue);
                }
            };

            this.getNodeValue = function getNodeValue() {
                return my.nodeValue;
            };

            this.getNodeVisits = function getNodeVisits() {
                return my.visits;
            };

            this.getPathOutcomes = function getPathOutcomes() {
                return my.outcomes;
            };

            this.getUCTValue = function getUCTValue() {
                if (parentNode) {
                    if (my.visits === 0) {
                        return Infinity;
                    }
                    else {
                        return (my.outcomes / my.visits) + Math.sqrt(2) * Math.sqrt(Math.log(parentNode.getNodeVisits()) / my.visits) +
                            my.boardValue / (my.visits + 1);
                    }
                }
                else {
                    return 0;
                }
            };

            this.getChildren = function getChildren(hvy) {
                var i, child, childrenBoards, edge,
                    children = [];

                board = board || new AbstractBoard(boardString);
                childrenBoards = board.getChildren();


                for (i = 0; i < childrenBoards.length; i++) {
                    edge = childrenBoards[i].edge;
                    childrenBoards[i].edge = undefined;
                    child = new TreeNode(JSON.stringify(childrenBoards[i]), this, edge, hvy);
                    children.push(child);
                }
                return children;
            };

            this.getParent = function getParent() {
                return parentNode;
            };

            this.getBoard = function getBoard() {
                board = board || new AbstractBoard(boardString);
                return board;
            };

            this.toString = function toString() {
                board = board || new AbstractBoard(boardString);
                return board.toString();
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
        var my = JSON.parse(brdStr),
            that = this;

        this.getCurrentPlayer = function getCurrentPlayer() {
            return my.currentPlayer;
        };

        this.getOpponent = function getOpponent() {
            return my.currentPlayer === 'player1' ? 'player2' : 'player1';
        };

        this.getBoardString = function getBoardString() {
            return brdStr;
        };

        //children are all possible walls and new moves
        this.getChildren = function getChildren() {
            var i, moves, child, currentPlayerPos, myTemp,
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
                    child.edge = 'wall ' + walls[i];
                    child.placedWalls.push(walls[i]);
                    child.player1.wallCount -= 1;
                    child.currentPlayer = 'player2';
                    myTemp = my;
                    my = child;
                    child.validMoves = findValidMoves(child.player2.position, false, true);
                    my = myTemp;
                    children.push(child);
                }
                else if (child.currentPlayer === 'player2' && child.player2.wallCount > 0) {
                    child.edge = 'wall ' + walls[i];
                    child.placedWalls.push(walls[i]);
                    child.player2.wallCount -= 1;
                    child.currentPlayer = 'player1';
                    myTemp = my;
                    my = child;
                    child.validMoves = findValidMoves(child.player1.position, false, true);
                    my = myTemp;
                    children.push(child);
                }
            }

            for (i = 0; i < moves.length; i++) {
                child = JSON.parse(brdStr);
                if (child.currentPlayer === 'player1') {
                    child.edge = 'move ' + moves[i];
                    child.player1.position = moves[i];
                    child.currentPlayer = 'player2';
                    myTemp = my;
                    my = child;
                    child.validMoves = findValidMoves(child.player2.position, false, true);
                    my = myTemp;
                }
                else {
                    child.player2.position = moves[i];
                    child.edge = 'move ' + moves[i];
                    child.currentPlayer = 'player1';
                    myTemp = my;
                    my = child;
                    child.validMoves = findValidMoves(child.player1.position, false, true);
                    my = myTemp;
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
            var i, node, moves, player, tempPos,
                winRange = wr,
                positionQueue = [pos],
                examinedPositions = new Array(Math.pow(my.dimension, 2) - 1)
                    .join('0').split('').map(parseFloat);

            switch (pos) {
                case my.player1.position:
                    player = 'player1';
                    break;
                case my.player2.position:
                    player = 'player2';
                    break;
            }
            tempPos = my[player].position;
            if (includeWall > -1) {
                my.placedWalls.push(includeWall);
            }

            do {
                my[player].position = positionQueue.shift();
                if (my[player].position >= winRange[0] && my[player].position <= winRange[1]) {
                    if (includeWall > -1) {
                        my.placedWalls.splice(my.placedWalls.length - 1, 1);
                    }
                    my[player].position = tempPos;
                    return true;
                }
                moves = findValidMoves(my[player].position, false, true);
                for (i = 0; i < moves.length; i++) {
                    if (examinedPositions[moves[i]] !== 1) {
                        examinedPositions[moves[i]] = 1;
                        my[player].position = moves[i];
                        positionQueue = positionQueue.concat(findValidMoves(moves[i], false, true));
                    }
                }
            } while (positionQueue.length > 0);
            if (includeWall > -1) {
                my.placedWalls.splice(my.placedWalls.length - 1, 1);
            }
            my[player].position = tempPos;
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

            for (i = 0; i < my.placedWalls.length; i++) {
                x = my.placedWalls[i] % wallDim;
                y = wallDim - 2 * Math.floor(my.placedWalls[i] / wallDim);
                if (my.placedWalls[i] % 2 === 0) {
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

        this.getPlacedWalls = function getPlacedWalls() {
            return my.placedWalls;
        };

        this.getValidMoves = function getValidMoves() {
            return my.validMoves;
        };


        this.positionToGridCoordinates = function positionToGridCoordinates(pos) {
            var x, y;
            x = 2 * (pos % my.dimension);
            y = (2 * (my.dimension - 1)) - 2 * Math.floor(pos / my.dimension);
            return [x, y];
        };

        this.getHeuristicValue = function getHeuristicValue() {
            var i, path1, path2, start, coors, end, winRange,
                opponent = this.getOpponent(),
                opponentPosition = my[opponent].position,
                that = this,
                graph = new module.Graph(this.getGridArray());

            path1 = pathLength(my[my.currentPlayer].position, my.currentPlayer);
            path2 = pathLength(opponentPosition, opponent);
            winRange = my[opponent].winRange;
            if (opponentPosition >= winRange[0] && opponentPosition <= winRange[1]) {
                return Infinity;
            }
            else {
                return path1 - path2;
            }


            function pathLength(pos, player) {
                var path, length = Infinity;
                winRange = my[player].winRange;
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

        this.toString = function toString() {
            return new module.Graph(this.getGridArray()).toString(my.player1.position, my.player2.position);
        };
    }
})();