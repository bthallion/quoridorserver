//While a. Running in the background or b. Within AI thinking time
//Select most valuable child node
//Simulate until end node reached (alternate high and low board values each ply)
//Backpropagate result and increment visit count to each parent node including root
function MonteCarloTreeSearch(rc) {
    this.redisClient = rc;
    this.subRoot = null;
    this.children = null;
    this.bestChild = null;
    this.childValue = null;
    this.bestValue = -Infinity;
    this.endNodeFound = false;
    this.currentNode = null;
    this.searching = false;
    this.heavy = false;
    this.returnBestValue = null;
    this.nodesEvaluated = 0;
}

MonteCarloTreeSearch.prototype.init = function init(boardString) {
    if (boardString) {
        this.subRoot = new TreeNode(this, this.redisClient, boardString, null, null, false);
    }
    else {
        this.subRoot = new TreeNode(this, this.redisClient);
    }
    this.exploreChildNodes(this.subRoot, true, false, null);
};

MonteCarloTreeSearch.prototype.setRoot = function setRoot(root) {
    this.subRoot = root;
};

MonteCarloTreeSearch.prototype.getRoot = function getRoot() {
    return this.subRoot;
};

MonteCarloTreeSearch.prototype.getClient = function getClient() {
    return this.redisClient;
};

MonteCarloTreeSearch.prototype.exploreHighestUCT = function exploreHighestUCT(node) {
    if (node.onTree()) {
        this.exploreChildNodes(node, true);
    }
    else {
        node.addToGameTree();
        this.exploreChildNodes(node, false, true, null);
    }
};

MonteCarloTreeSearch.prototype.exploreChildNodes = function exploreChildNodes(currentNode, searching, heavy, returnBestValue) {
    var i, children;
    console.log('start explore'+currentNode.toString());
    this.children = currentNode.getChildren(heavy);
    this.searching = searching;
    this.heavy = heavy;
    this.returnBestValue = returnBestValue;
    console.log('processing '+this.children.length+' children. heavy: '+heavy);
    for (i = 0; i < this.children.length; i++) {
        setTimeout(this.processNode.bind(this), 100 + i, this.children[i]);
    }
        //console.log('return: '+returnBestValue);
      //  setTimeout(exploreChildNodes.bind(this), 40, currentNode, searching, heavy, returnBestValue);
};

MonteCarloTreeSearch.prototype.processNode = function processNode(node) {
    console.log(this.nodesEvaluated);
    if (!this.endNodeFound && node.isProcessed()) {
        console.log('start process');
        this.evaluateNode(node);
        if (this.nodesEvaluated === this.children.length) {
            this.nodesEvaluated = 0;
            if (this.searching) {
                console.log('uct chosen');
                this.exploreHighestUCT(this.bestChild);
            }
            else if (this.returnBestValue) {
                console.log('return best');
                this.returnBestValue(this.bestChild);
            }
            else {
                console.log('CURRENT BOARD\n'+bestChild.toString());
                this.exploreChildNodes(this.bestChild, false, true, null);
            }
        }
    }
    else if (!this.endNodeFound) {
        setTimeout(processNode.bind(this), 100, node);
    }
};

MonteCarloTreeSearch.prototype.evaluateNode = function evaluateNode(node) {
    console.log('nodes evald: ' +this.nodesEvaluated);
    if (!this.endNodeFound) {
        if (this.searching) {
            this.childValue = node.getUCTValue();
        }
        else if (this.returnBestValue) {
            this.childValue = node.getBoardValue();
        }
        else {
            this.childValue = node.getNodeValue();
        }
        if (this.bestValue === Number.NEGATIVE_INFINITY || this.childValue > this.bestValue ||
            !this.searching && this.childValue === this.bestValue &&
            node.getOpponentWalls() > this.bestChild.getOpponentWalls()) {
            this.bestChild = node;
            this.bestValue = this.childValue;
        }
        this.nodesEvaluated += 1;
        if (!this.searching && !this.returnBestValue && this.bestValue === Number.POSITIVE_INFINITY) {
            console.log('path end found');
            this.endNodeFound = true;
            //AI IS ALWAYS PLAYER2 FOR NOW
            if (node.getCurrentPlayer() === 'player2') {
                node.backpropagate(1);
            }
            else {
                node.backpropagate(-1);
            }
        }
    }
};

MonteCarloTreeSearch.prototype.setRootNode = function setRootNode(node) {};
