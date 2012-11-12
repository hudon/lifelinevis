/*jslint nomen: true, browser: true, devel: true*/
/*global _,d3*/
'use strict';
var TimeTree = (function () {
    // nodes per level
    var buckets = [],
        nodeIdentifier = 0,
        timePeriod = 100,
        Node,
        Vertex;

    // Vertex: a process thread; Edge: the event of sending/receiving a tag
    Vertex = _.makeClass();
    Vertex.prototype.init = function (pid, tid, time, realtime, tagname, name) {
        this.pid = pid;
        this.tid = tid;
        this.time = time;
        this.realtime = realtime;
        this.tagname = tagname;
        this.name = name;
    };

    Node = _.makeClass();
    Node.prototype.init = function (vertex, children) {
        children = children || [];
        this.pid = vertex.pid;
        this.tid = vertex.tid;
        this.name = vertex.name;
        // 'time' might be scaled later for visualization
        this.time = vertex.time;
        // 'realtime' is never scaled
        this.realtime = vertex.realtime;
        // for visualization of different tags in the tree
        this.tagname = vertex.tagname;
        this.children = children;
        this.bucketLevel = 0;
    };
    Node.prototype.addChild = function (childVertex, grandchildren) {
        var childNode = new Node(childVertex, grandchildren);
        this.children.push(childNode);
        return childNode;
    };

    // finding a parent - check all vertices on the level
    function findParent(vertex, bucket) {
        return _.find(bucket, function (bNode) {
            return vertex.pid === bNode.pid && vertex.tid === bNode.tid && vertex.tagname === bNode.tagname;
        });
    }

    function addToBucket(level, node) {
        buckets[level] = buckets[level] || [];
        buckets[level].push(node);
    }

    function drawTimeline(width, graphHeight, graphSVG) {
        var line, lineVis, lineData, level;

        lineData = [];
        for (level = 0; level < buckets.length; level += 1) {
            lineData.push(timePeriod * level * 1.3 + 150);
        }

        lineVis = d3.select("#lifeline")
            .append("svg:svg")
            .attr("width", width)
            .attr("height", 150);

        line = d3.svg.line()
            .x(function (d) { return d; })
            .y(function (d) { return 0; });

        lineVis.selectAll(".timeline")
            .data(lineData)
            .enter().append("svg:path")
            .attr("d", line(lineData))
            .attr("class", "timeline")
            .attr("stroke", "steelblue")
            .attr("stroke-width", 3);

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
            removeSelection();
            update(root, d, diagonal, tree, animationDuration, vis);
        }

        var nodes, nodeEnter, nodeUpdate, nodeExit, link, node, colorGen;

        // result is an array of objs with x and y
        // locations (+vertex info)
        nodes = tree.nodes(root).reverse();

        nodes.forEach(function (d) {
            if (d.parent) {
                d.y = (d.bucketLevel * timePeriod + 100) * 1.3;
            }
        });

        // data returns the "update selection" which contains nodes that exist
        // in DOM and nodes that have not been added to DOM yet
        node = vis.selectAll("g.node")
            .data(nodes, function (d) {
                if (!d.id) {
                    nodeIdentifier += 1;
                    d.id = nodeIdentifier;
                }
                return d.id;
            });

        // enter() gets the "enter selection" from the nodes returned by data().
        // These nodes are not in the DOM yet.
        nodeEnter = node.enter()
            .append("svg:g")
            .attr("class", "node")
            // this transform ensures the new nodes spawn from source
            .attr("transform", function (d) { return "translate(" + source.y0 + "," + source.x0 + ")"; })
            .on("click", click);

        /*
            Select all instances of a process in the tree on hover
            Give selections with different tids different colors
        */

        // green, blue, orange, pink, teal, red,
        colorGen = _.generator(['#009933', '#0000FF', '#CC6600', '#FF4422', '#00FFFF','#CC0000',]);

        function addSelection(p) {
            d3.selectAll(".node text").style("fill", function (d, i) {
                if (p.pid === d.pid) {
                    d3.select(this).style('font-weight', 'bold');
                    return colorGen.getWith(d.tid);
                } else {
                    d3.select(this).style('opacity', '0.15');
                    return 'black';
                }
            });
        }

        function removeSelection() {
            d3.selectAll(".node text").style("fill", 'black')
                .style('font-weight', 'normal').style('opacity', '1');
        }

        //***************

        // to each new g elements add a SVG circle element, colour it if it
        // has children
        nodeEnter.append("svg:circle")
            .attr("r", 1e-6)
            .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; })
            .on("mouseover", addSelection)
            .on("mouseout", removeSelection);

        // to each g element add a SVG text element
        nodeEnter.append("svg:text")
            .attr("x", -5)
            .attr("y", 18)
            .text(function (d) {
                if (!d.pid) { return ""; }
                return "name: " + d.name + ", tid: " + d.tid + ", time: " + d.time;
            });

        // Transition the g elements to their new position (duration controls
        // speed: higher == slower). This transitions all elements (existing
        // and new)
        nodeUpdate = node.transition()
            .duration(animationDuration)
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

        // Re-colour the nodes (since last colouring only affected new ones)
        nodeUpdate.select("circle")
            .attr("r", 4.5)
            .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; });

        // The exit() set is all the elements that were not matched with
        // data() above. We need to remove these.
        node.exit().transition()
            .duration(animationDuration)
            .attr("transform", function () { return "translate(" + source.y + "," + source.x + ")"; })
            .style("opacity", 1e-6)
            .remove();

        /****** Edges ******/

        // returns an array of objects representing the links from parent
        // to child for each node ({source, target})
        link = vis.selectAll("path.treelink")
            .data(tree.links(nodes), function (d) { return d.target.id; });

        // form any new links
        link.enter().insert("svg:path", "g")
            .attr("class", function (d) {
                return "treelink tag" + d.target.tagname;
            })
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

        /****** done with edge construction ******/

        // Stash the old positions for transition.
        nodes.forEach(function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function createLegend(tags) {
        var legendVis, legend, link, tagCount, linkenter, diagonal, id;

        diagonal = d3.svg.diagonal().projection(function (d) {
            return [d.y, d.x];
        });

        legendVis = d3.select("#treelegend")
            .append("svg:svg")
            .attr("width", 200)
            .attr("height", 100);

        legend = [];

        id = 0;
        _.each(tags, function (value, key, list) {
            var tag = {};
            tag.name = key;
            tag.source = {x: 10, y: 30};
            tag.target = {x: 10, y: 140};
            tag.id = id;
            id += 1;
            legend.push(tag);
        });

        link = legendVis.selectAll("path.link").data(legend);

        linkenter = link.enter().append("svg:g")
            .attr("transform", function (d) {
                return "translate(0," + (20 * d.id) + ")";
            });

        linkenter.append("svg:text")
            .attr("x", 0)
            .attr("y", 10)
            .text(function (d) {
                return 'tag "' + d.name + '"';
            });

        linkenter.append("svg:path")
            .attr("class", function (d) {
                return "link tag" + d.name;
            })
            .attr("d", function (d) {
                var o = {x: d.source.x, y: d.source.y};
                return diagonal({source: o, target: o});
            })
            .attr("d", diagonal);
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
                node.realtime = node.time;
                node.time = Math.ceil(node.time / minTime) * 100;
            });

            _.each(lifeline, function (node) {
                // Vertices contain just the event data
                var childVertex, parentVertex,
                    // Nodes contain tree-specific data (children, tree number,
                    // depth, etc.)
                    childNode,
                    parentNode,
                    // Levels represent tree depth (based off time)
                    childLevel,
                    parentLevel,
                    tree,
                    bucket;

                childVertex = new Vertex(node.dstProcessId, node.dstThreadId,
                        node.time, node.realtime, node.tagName, node.dstProcessName);
                parentVertex = new Vertex(node.srcProcessId, node.srcThreadId,
                        node.time, node.realtime, node.tagName, node.srcProcessName);
                parentLevel = childLevel = Math.floor(node.time / timePeriod);

                // find parent process: look through each level down to roots
                while (parentLevel > 0) {
                    parentLevel -= 1;
                    bucket = buckets[parentLevel] || [];
                    parentNode = findParent(parentVertex, bucket);
                    if (parentNode) {
                        break;
                    }
                }

                // have a parent, go to parent in identified tree and add the
                // child -- update parent in bucket
                if (!parentNode) {
                    // we do not have a parent in our current trees,
                    // create a new root at level 0
                    parentNode = new Node(parentVertex, []);
                    parentNode.time = 0;
                    treeLifeline.push(parentNode);
                    addToBucket(0, parentNode);
                }
                childNode = parentNode.addChild(childVertex);
                childNode.bucketLevel = childLevel;
                addToBucket(childLevel, childNode);
            });

            return treeLifeline;
        },
        drawLifelineTree: function (treeLifeline, tags) {
            // To pull tree lifeline from a sample json file instead,
            // uncomment these two lines:
            //d3.json("tree_example.json", function (json) {
            //_.each(json, function (jsonTree) {

            var dummyNode,
                w = 1760, // the width and height of the whole svg arrea
                h = 800,//2000;
                tree = d3.layout.tree().size([h, w - 760]),
                animationDuration = 500,
                diagonal,
                vis;

            dummyNode = new Node(new Vertex());
            _.each(treeLifeline, function (tree) {
                dummyNode.addChild(tree, tree.children);
            });

            diagonal = d3.svg.diagonal().projection(function (d) {
                return [d.y, d.x];
            });

            // creates an SVG canvas
            vis = d3.select("#treelifeline")
                .append("svg:svg")
                .attr("width", w)
                .attr("height", h)
                 //moves the initial position of the svg:g element
                .attr("transform", "translate(20,0)");

            dummyNode.x0 = 300;//800;
            dummyNode.y0 = 0;

            update(dummyNode, dummyNode, diagonal, tree, animationDuration, vis);
            createLegend(tags);
        }
    };
}());
