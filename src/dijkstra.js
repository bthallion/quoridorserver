/**
 * Javascript implementation of Dijkstra's algorithm
 * Based on: http://en.wikipedia.org/wiki/Dijkstra's_algorithm
 * Author: James Jackson (www.jamesdavidjackson.com)
 * Source: http://github.com/nojacko/dijkstras-js/tree/
 *
 * Useage:
 *	var d = new Dijkstras();
 *	d.setGraph(
 *		[
 *			['A', [['B', 20], ['C', 20]] ],
 *			['B', [['A', 30], ['C', 100]] ],
 *			['C', [['D', 10], ['A', 20]] ],
 *			['D', [['C', 10], ['B', 20]] ]
 *		]
 *	);
 *	var path = d.getPath('A', 'D');
 *
 */
/**
 * Creates a graph from array.
 * Each element in the array should be in the format:
 * 	[NODE NAME, [[NODE NAME, COST], ...] ]
 *
 * For example: 	[
 *		['A', [['B', 20], ['C', 20]] ],
 *		['B', [['A', 30], ['C', 100]] ],
 *		['C', [['D', 10], ['A', 20]] ],
 *		['D', [['C', 10], ['B', 20]] ]
 *	]
 *
 * @param graph Array of nodes and vertices.
 **/
var DijkstrasAlgorithm = (function () {
    function Constructor() {
        var my = {
            graph: [],
            queue: null,
            distance: [],
            previous: []
        };

        this.getMy = function getMy() {
            return my;
        }
    }

    Constructor.prototype.setGraph = function setGraph(graph) {
        var my = this.getMy(),
            node, vertex, edges, i, neighbor, cost;

        for (node in graph) {
            if (graph.hasOwnProperty(node)) {
                vertex = graph[node][0];
                edges = graph[node][1];
                my.graph[vertex] = [];
                for (i in edges) {
                    if (edges.hasOwnProperty(i)) {
                        neighbor = edges[i][0];
                        cost = edges[i][1];
                        my.graph[vertex][neighbor] = cost;
                    }
                }
            }
        }
    };

    /**
     * Find shortest path
     *
     * @param source The starting node.
     * @param target The target node.
     * @return array Path to target, or empty array if unable to find path.
     */
    Constructor.prototype.getPath = function getPath(source, target) {
        var my = this.getMy();
        // Reset all previous values
        my.queue = new MinHeap();
        my.queue.add(source, 0);
        my.previous[source] = null;

        // Loop all nodes
        var u = null;
        while (u = my.queue.shift()) {
            // Reached target
            if (u === target) {
                var path = [];
                while (this.previous[u] != null) {
                    path.unshift(u);
                    u = this.previous[u];
                }
                return path;
            }

            // all remaining vertices are inaccessible from source
            if (this.queue.getDistance(u) == Infinity) {
                return [];
            }

            var uDistance = this.queue.getDistance(u);
            for (var neighbour in this.graph[u]) {
                var nDistance = this.queue.getDistance(neighbour),
                    aDistance = uDistance + this.graph[u][neighbour];

                if (aDistance < nDistance) {
                    this.queue.update(neighbour, aDistance);
                    this.previous[neighbour] = u;
                }
            }
        }

        return [];
    };

    return Constructor;
})();

/*
 // Fibonacci Heap (min first)
 function MinHeap() {
 var my = {
 //Key of minimum node distance
 min: null,
 //Keys of root nodes
 roots: [],
 nodes: []
 };

 function shift() {
 var i, node, distance, lowestDistance,
 minNode = my.min;
 // Current min is null or no more after it
 if (minNode === null || my.roots.length < 1) {\
 return minNode
 }
 // Remove it
 remove(minNode);
 // Consolidate
 if (my.roots.length > 50) {
 consolidate();
 }
 // Get next min
 lowestDistance = Infinity;
 for (i = 0; i < my.roots.length; i++) {
 node = my.roots[i];
 distance = getDistance(node);
 if (distance < lowestDistance) {
 lowestDistance = distance;
 my.min = node;
 }
 }
 return minNode;
 }

 function consolidate() {
 // Consolidate
 var depth, node, i, first, second, newDepth, pos,
 depths = [ [], [], [], [], [], [], [] ],
 maxDepth = depths.length - 1; // 0-index

 // Populate depths array
 for (i = 0; i < my.roots.length; i++) {
 node = my.roots[i];
 depth = my.nodes[node].depth;

 if (depth < maxDepth) {
 depths[depth].push(node);
 }
 }

 // Consolidate
 for (depth = 0; depth <= maxDepth; depth++) {
 while (depths[depth].length > 1) {

 first = depths[depth].shift();
 second = depths[depth].shift();
 newDepth = depth + 1;
 pos = -1;

 if (this.nodes[first].distance < this.nodes[second].distance) {
 this.nodes[first].depth = newDepth;
 this.nodes[first].children.push(second);
 this.nodes[second].parent = first;

 if (newDepth <= maxDepth) {
 depths[newDepth].push(first);
 }

 // Find position in roots where adopted node is
 pos = this.roots.indexOf(second);

 } else {
 this.nodes[second].depth = newDepth;
 this.nodes[second].children.push(first);
 this.nodes[first].parent = second;

 if (newDepth <= maxDepth) {
 depths[newDepth].push(second);
 }

 // Find position in roots where adopted node is
 pos = this.roots.indexOf(first);
 }

 // Remove roots that have been made children
 if (pos > -1) {
 this.roots.splice(pos, 1);
 }
 }
 }
 }

 function add(key, distance) {
 // Add the node
 my.nodes[key] = {
 key: key,
 distance: distance,
 depth: 0,
 parent: null,
 children: []
 };

 // Is it the minimum?
 if (!my.min || distance < my.nodes[my.min].distance) {
 this.min = node;
 }

 // Other stuff
 this.roots.push(node);
 }

 function update(node, distance) {
 remove(node);
 add(node, distance);
 }

 function remove(key) {
 var numChildren, i, child, parent,
 node = my.nodes[key];
 // Move children to be children of the parent
 if (node) {
 numChildren = node.children.length;
 if (numChildren > 0) {
 for (i = 0; i < numChildren; i++) {
 child = my.nodes[node.children[i]];
 child.parent = node.parent;

 // No parent, then add to roots
 if (child.parent === null) {
 my.roots.push(node.children[i]);
 }
 }
 }

 parent = this.nodes[node].parent;

 // Root, so remove from roots
 if (parent == null) {
 var pos = this.roots.indexOf(node);
 if (pos > -1) {
 this.roots.splice(pos, 1);
 }
 } else {
 // Go up the parents and decrease their depth
 while (parent) {
 this.nodes[parent].depth--;
 parent = this.nodes[parent].parent
 }
 }
 }
 }


 function getDistance(key) {
 var node = my.nodes[key];
 if (node) {
 return node.distance;
 }
 return Infinity;
 }
 }
 */