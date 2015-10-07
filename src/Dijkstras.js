/**
 * Usage:
 *	var d = new DijkstrasAlgorithm([
 *			['A', [['B', 20], ['C', 20]] ],
 *			['B', [['A', 30], ['C', 100]] ],
 *			['C', [['D', 10], ['A', 20]] ],
 *			['D', [['C', 10], ['B', 20]] ]
 *		]);
 *	var path = d.getPath('A', 'D');
 *
 */
var DijkstrasAlgorithm = (function () {
    var Heap = require('heap');

    function Constructor(graphArray) {
        var my = {
            graph: this.parseGraph(graphArray)
        };

        this.getGraph = function getGraph() {
            return my.graph;
        };
    }

    Constructor.prototype.parseGraph = function parseGraph(graphArray) {
        var graph = [],
            node, vertex, edges, i, neighbor, cost;

        for (node in graphArray) {
            if (graphArray.hasOwnProperty(node)) {
                vertex = graphArray[node][0];
                edges = graphArray[node][1];
                graph[vertex] = [];
                for (i in edges) {
                    if (edges.hasOwnProperty(i)) {
                        neighbor = edges[i][0];
                        cost = edges[i][1];
                        graph[vertex][neighbor] = cost;
                    }
                }
            }
        }
        return graph;
    };

/**
 * Find shortest path
 * @param source The starting node.
 * @param target The target node.
 * @return integer path length to target, -1 if impossible
 */
    Constructor.prototype.getPathLength = function getPath(source, target) {
        var vertex, closestVertex, neighbor, altPath, pathLength,
            my = {
                distance: [],
                previous: [],
                graph: this.getGraph()
            };

        my.distance[source] = 0;
        my.previous[source] = null;
        my.queue = new Heap(function compare(a, b) {
            return (my.distance[a] - my.distance[b]);
        });

        for (vertex in my.graph) {
            if (my.graph.hasOwnProperty(vertex)) {
                if (vertex != source) {
                    my.distance[vertex] = Infinity;
                    my.previous[vertex] = null;
                }
                my.queue.push(vertex);
            }
        }

        while (!my.queue.empty()) {
            closestVertex = my.queue.pop();
            //If we've reached the target
            if (closestVertex === target) {
                vertex = target;
                pathLength = 0;
                //Count back vertices until the source is reached
                while (my.previous[vertex]) {
                    pathLength++;
                    vertex = my.previous[vertex];
                }
                return pathLength;
            }
            //For each neighboring vertex
            for (neighbor in my.graph[closestVertex]) {
                if (my.graph[closestVertex].hasOwnProperty(neighbor)) {
                    //Recalculate the distance from the source
                    //to the neighbor using the current node
                    altPath = my.distance[closestVertex] +
                        my.graph[closestVertex][neighbor];
                    if (altPath < my.distance[neighbor]) {
                        //If the distance is shorter
                        //Set the current node as the neighbor's
                        //previous node, and update the neighbor's distance
                        my.distance[neighbor] = altPath;
                        my.previous[neighbor] = closestVertex;
                    }
                }
            }
        }
        return -1;
    };
    return Constructor;
})();