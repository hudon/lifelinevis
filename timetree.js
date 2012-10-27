/*jslint nomen: true, browser: true, devel: true*/
/*global _,d3*/
var TimeTree = (function () {
    'use strict';

    // nodes per level
    var buckets = [],
        timePeriod = 100;

    // Vertex: a process thread; Edge: the event of sending/receiving a tag
    function Vertex(pid, tid, time) {
        this.pid = pid;
        this.tid = tid;
        this.time = time;
    }

    function Node(vertex, children) {
        this.pid = vertex.pid;
        this.tid = vertex.tid;
        this.time = vertex.time;
        this.children = children;

        this.addChild = function addChild(childVertex) {
            var childNode = new Node(childVertex, []);
            children.push(childNode);
        };
    }

    function BucketNode(vertex, treeNum) {
        this.vertex = vertex;
        this.treeNum = treeNum;
    }

    // return tree, time
    // finding a parent - check all vertices on the level
    function findParent(vertex, bucket) {
        return _.find(bucket, function (bNode) {
            return vertex.pid === bNode.vertex.pid && vertex.tid === bNode.vertex.tid;
        });
    }

    function addTreeChildHelper(node, currLevel, goalLevel, parentVertex, childVertex) {
        if (currLevel === goalLevel) {
            if (node.pid === parentVertex.pid
                    && node.tid === parentVertex.tid
                    && node.time === parentVertex.time) {
                node.addChild(childVertex);
            }
        } else {
            _.each(node.children, function (child) {
                addTreeChildHelper(child, currLevel + 1, goalLevel, parentVertex, childVertex);
            });
        }
    }

    function addTreeChild(tree, parentLevel, parentVertex, childVertex) {
        addTreeChildHelper(tree, 0, parentLevel, parentVertex, childVertex);
    }

    function addToBucket(level, vertex, treeNum) {
        var bucket,
            bNode;

        buckets[level] = buckets[level] || [];
        bucket = buckets[level];

        // check if similar node is already in the bucket
        bNode = _.find(bucket, function (bucketNode) {
            return vertex.pid === bucketNode.vertex.pid && vertex.tid === bucketNode.vertex.tid;
        });

        if (!bNode) {
            bNode = new BucketNode(vertex, treeNum);
        } else {
            bNode.treeNum = treeNum;
            bNode.vertex.time = vertex.time;
        }

        buckets[level].push(bNode);
    }

    /**
     * Updates the tree visualization
     * @param {Object} root - The root node of the tree
     * @param {Object} source - The source node of the update
    */
    function update(root, source, diagonal, tree, animationDuration, vis) {
        // Toggle children on click.
        function click(d) {
            if (d.children) {
                d._children = d.children;
                d.children = null;
            } else {
                d.children = d._children;
                d._children = null;
            }
            update(root, d, diagonal, tree, animationDuration, vis);
        }


        // result is an array of objs with x and y
        // locations (+vertex info)
        var nodes = tree.nodes(root).reverse(),
            nodeIdentifier,
            // the enter set of node elements (i.e. all new nodes on screen)
            nodeEnter,
            nodeUpdate,
            nodeExit,
            link,
            node;

        // when we have more than 1 tree, needs more support in other parts of code
        /*for (var i=0; i<source.length; i++) {
            if (nodes) {
                _.each(tree.nodes(source[i]).reverse(), function(node) { nodes.push(node) });
            } else {
                nodes = tree.nodes(source[i]).reverse();
            }
        }*/
        //TODO didn't normalize

        // creates as many g.node as vertices in tree
        nodeIdentifier = 0;
        // selects elements that don't exist in order to create
        // new ones == empty selection
        node = vis.selectAll("g.node")
            // all nodes data ends up as placeholder nodes
            // for missing elements in enter()
            .data(nodes, function (d) {
                if (!d.id) {
                    nodeIdentifier += 1;
                    d.id = nodeIdentifier;
                }
                return d.id;
            });

        /****** Dealing will all new node elements ******/

        // for every node placeholder in enter set, add the missing elements to the SVG
        // returns a list of SVG g elements (with node object in their data attrib)
        nodeEnter = node.enter()
            .append("svg:g")
            .attr("class", "node")
            //TODO didn't transform
            .on("click", click);

        // to each g elements add a SVG circle element (~~ as a child)
        nodeEnter.append("svg:circle")
            .attr("r", 1e-6)
            .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; });

        // to each g element add a SVG text element (~~ another child)
        nodeEnter.append("svg:text")
            .attr("x", -5)//function(d) { return d._children ? -8 : 8; }) //--> used by original
            .attr("y", 18)
            .text(function (d) {
                return "(pid : " + d.pid + ", tid : " + d.tid + ")";
            });

        // Transition the g elements to their new position (duration controls
        // speed: higher == slower)
        nodeUpdate = node.transition()
            .duration(animationDuration)
             // translate nodes to x & y pos.
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; })
            /*.style("opacity", 1)
            .select("circle")
            .style("fill", "lightsteelblue");*/

        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; })

        /****** done with new node elements ******/

        // the update set (I believe)
        nodeExit = node.transition()
            .duration(animationDuration)
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1);

        // The exit set -- remove any elements we don't need from screen
        node.exit().transition()
            .duration(animationDuration)
            .attr("transform", function () { return "translate(" + source.y + "," + source.x + ")"; })
            .style("opacity", 1e-6)
            .remove();

        /****** Vertex connection edges ******/

        // returns an array of objects representing the links from parent
        // to child for each node ({source, target})
        link = vis.selectAll("path.link")
            .data(tree.links(nodes), function (d) { return d.target.id; });

        // form any new links
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function () {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
            .transition()
            .duration(animationDuration)
            .attr("d", diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(animationDuration)
            .attr("d", diagonal);

        // remove any of the links that are no longer necessary
        link.exit().transition()
            .duration(animationDuration)
            .attr("d", function () {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
            .remove();

        /****** done with link construction ******/

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    return {
        parseLifelineData: function (lifeline) {
            var minTime, treeLifeline;

            treeLifeline = [];

            minTime = _.min(lifeline, function (node) {
                return node.time;
            }).time;

            // normalize the timestamps on the nodes
            _.each(lifeline, function (node) {
                node.time = Math.ceil(node.time / minTime) * 100;
            });

            _.each(lifeline, function (node) {
                var vert = new Vertex(node.dstProcessId, node.dstThreadId, node.time),
                    parent = new Vertex(node.srcProcessId, node.srcThreadId, node.time),
                    parentBucketNode,
                    // actual tree level based on time
                    level = Math.floor(node.time / timePeriod),
                    tree,
                    rootNode,
                    bucket;

                // find parent process: look through each level down to roots
                while (level >= 0) {
                    bucket = buckets[level] || [];
                    parentBucketNode = findParent(parent, bucket);
                    if (parentBucketNode) {
                        break;
                    }
                    level -= 1;
                }

                // have a parent, go to parent in identified tree and add the
                // child -- update parent in bucket
                if (parentBucketNode) {
                    // tree is a root Node
                    tree = treeLifeline[parentBucketNode.treeNum];
                    addTreeChild(tree, level, parentBucketNode.vertex, vert);
                    // add child to the right bucket
                    addToBucket(level + 1, vert, parentBucketNode.treeNum);

                } else {
                    // we do not have a parent in our current trees,
                    // create a new root at level 0
                    rootNode = new Node(parent, []);
                    rootNode.addChild(vert);
                    treeLifeline.push(rootNode);
                    addToBucket(0, parent, treeLifeline.length - 1);
                    addToBucket(1, vert, treeLifeline.length - 1);
                }
            });

            return treeLifeline;
        },

        drawLifelineTree: function (treeLifeline) {
            // To pull tree lifeline from a sample json file instead,
            // uncomment these two lines:
            //d3.json("tree_example.json", function (json) {
            //_.each(json, function (jsonTree) {

            _.each(treeLifeline, function (jsonTree) {

                var w = 960, // the width and height of the whole svg arrea
                    h = 700,//2000;
                    tree = d3.layout.tree().size([h, w - 260]),
                    animationDuration = 500,
                    diagonal,
                    vis;

                diagonal = d3.svg.diagonal().projection(function (d) {
                    return [d.y, d.x];
                });

                // creates an SVG canvas
                vis = d3.select("#lifeline")
                    .append("svg:svg")
                    .attr("width", w)
                    .attr("height", h)
                    .append("svg:g")
                    .attr("transform", "translate(20,0)"); //moves the initial position of the svg:g element

                jsonTree.x0 = 300;//800;
                jsonTree.y0 = 0;
                update(jsonTree, jsonTree, diagonal, tree, animationDuration, vis);
            });
        }
    };
}());
