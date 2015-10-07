/**
 * Created by ben on 9/30/15.
 */
var ROOT = JSON.stringify({
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

function TreeNode(search, client, brdStr, par, e, hvy) {
    this.board = null;
    this.my = null;
    this.processed = false;
    if (brdStr) {
        this.boardState = JSON.parse(brdStr);
        this.boardString = brdStr;
        this.parent = par;
        this.edge = e;
        this.heavy = hvy;
    }
    else {
        this.boardState = JSON.parse(ROOT);
        this.boardString = ROOT;
        this.parent = null;
        this.edge = null;
        this.heavy = false;
    }
    this.client = client;
    this.search = search;
    client.get(this.boardString, this.buildNode.bind(this));
}

TreeNode.prototype.buildNode = function buildNode(err, reply) {
    if (reply) {
        this.my = JSON.parse(reply);
        if (this.heavy && this.my.nodeValue === null) {
            this.board = new AbstractBoard(this.boardString);
            this.search.exploreChildNodes(this, false, false, this.setNodeValue.bind(this));
        }
        else {
            this.processed = true;
        }
    }
    else {
        this.board = new AbstractBoard(this.boardString);
        this.my = {
            visits: 0,
            outcomes: 0,
            onTree: false,
            boardValue: this.board.getHeuristicValue(),
            nodeValue: null
        };
        if (this.heavy) {
            console.log('heavy process');
            this.search.exploreChildNodes(this, false, false, this.setNodeValue.bind(this));
        }
        else {
            this.processed = true;
            this.client.set(this.boardString, JSON.stringify(this.my));
        }
    }
};

TreeNode.prototype.setNodeValue = function setNodeValue(bestChild) {
    console.log('bc: '+bestChild);
    this.my.nodeValue = this.my.boardValue - bestChild.getBoardValue();
    console.log('heavy node loaded: '+this.my.nodeValue+'\n'+this.toString()+
        '\nbest child: '+ bestChild.getBoardValue()+'\n'+ bestChild.toString());
    this.client.set(this.boardString, JSON.stringify(this.my));
    this.processed = true;
};

TreeNode.prototype.addToGameTree = function addToGameTree() {
    this.processed = true;
    this.my.onTree = true;
};

TreeNode.prototype.backpropagate = function backpropagate(outcome) {
    this.my.visits += 1;
    this.my.outcomes += outcome;
    this.client.set(this.boardString, JSON.stringify(this.my));
    if (this.parent) {
        this.parent.backpropagate(outcome);
    }
    else {
        this.search.exploreChildNodes(this.search.getRoot(), true);
    }
};

TreeNode.prototype.getCurrentPlayer = function getCurrentPlayer() {
    return this.boardState.currentPlayer;
};

TreeNode.prototype.getBoardValue = function getBoardValue() {
    return this.my.boardValue;
};

TreeNode.prototype.isHeavy = function isHeavy() {
    return this.heavy;
};

TreeNode.prototype.onTree = function onTree() {
    return this.my.onTree;
};

TreeNode.prototype.getOpponentWalls = function getOpponentWalls() {
    var player = this.boardState.currentPlayer === 'player1' ? 'player2' : 'player1';
    return this.boardState[player].wallCount;
};

TreeNode.prototype.getEdge = function getEdge() {
    return this.edge;
};

TreeNode.prototype.hasBoard = function hasBoard() {
    return this.board !== null;
};

TreeNode.prototype.isProcessed = function isProcessed() {
   // console.log(this.processed);
    return this.processed;
};

TreeNode.prototype.getNodeValue = function getNodeValue() {
    return this.my.nodeValue;
};

TreeNode.prototype.getNodeVisits = function getNodeVisits() {
    return this.my.visits;
};

TreeNode.prototype.getPathOutcomes = function getPathOutcomes() {
    return this.my.outcomes;
};

TreeNode.prototype.getParent = function getParent() {
    return this.parent;
};

TreeNode.prototype.getBoard = function getBoard() {
    this.board = this.board || new AbstractBoard(this.boardString);
    return this.board;
};

TreeNode.prototype.toString = function toString() {
    return JSON.stringify(this.boardState);
};

TreeNode.prototype.getUCTValue = function getUCTValue() {
    if (this.parent) {
        if (this.my.visits === 0) {
            return Infinity;
        }
        else {
            return (this.my.outcomes / this.my.visits) + Math.sqrt(2) * Math.sqrt(Math.log(this.parent.getNodeVisits()) /
                    this.my.visits) + this.my.boardValue / (this.my.visits + 1);
        }
    }
    else {
        return 0;
    }
};

TreeNode.prototype.getChildren = function getChildren(hvy) {
    var i, child, childStates, edge,
        children = [];
    this.board = this.board || new AbstractBoard(this.boardString);

    childStates = this.board.getChildStates();
    for (i = 0; i < childStates.length; i++) {
        edge = childStates[i].edge;
        childStates[i].edge = undefined;
        child = new TreeNode(this.search, this.client, JSON.stringify(childStates[i]), this, edge, hvy);
        children.push(child);
    }
    return children;
};