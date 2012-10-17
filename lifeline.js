(function () {
    'use strict';
    /*jslint browser: true*/

    // Vertex: a process thread; Edge: the event of sending/recieving a tag
    function Vertex(pid, tid, time) {
        this.pid = pid;
        this.tid = tid;
        this.time = time;
    }

    function Node(vertex, children) {
        this.vertex = vertex;
        this.children = children;

        this.addChild = addChild;
        function addChild(childVertex) {
            var childNode = new Node(childVertex, []);
            this.children.push(childNode);
        }
    }

    function BucketNode(vertex, treeNum) {
        this.vertex = vertex;
        this.treeNum = treeNum;
    }

    var lifeline = [], util = {};

    window.addEventListener('load', windowLoadHandler, false);

    function loadLifeline() {
        util.ajaxget('/lifeline.json', function (response) {
            lifeline = JSON.parse(response);
        }, false);
    }

    var treeLifeline = [];  // tree-like representation of the lifeline
    var buckets = [];       // nodes per level
    var timePeriod = 1;

    function parseLifelineData() {
        _.each(lifeline, function (node) {
            var vert = new Vertex(node.dstProcessId, node.dstThreadId, node.time);
            var parent = new Vertex(node.srcProcessId, node.srcThreadId, node.time);
            var p_bucket_node;

            var level = Math.floor(node.time/timePeriod);                           // actual tree level based on time
            // find parent process: look through each level down to roots
            while (level >= 0) {
                var bucket = buckets[level] ? buckets[level] : []; 
                p_bucket_node = findParent(level, parent, bucket);
                if (p_bucket_node) break;
                level -= 1;
            }

            // have a parent, go to parent in identified tree and add the child -- update parent in bucket
            if (p_bucket_node) {
                var tree = treeLifeline[p_bucket_node.treeNum];                 // a root Node
                addTreeChild(tree, 0, level, p_bucket_node.vertex, vert);
                addToBucket(level+1, vert, p_bucket_node.treeNum);              // add child to the right bucket

                // do not have a parent in our current trees, create a new root == level 0
            } else {
                var rootNode = new Node(parent, []);
                rootNode.addChild(vert);
                treeLifeline.push(rootNode);
                addToBucket(0, parent, treeLifeline.length-1);
                addToBucket(1, vert, treeLifeline.length-1);
            }
        }
    }
    // return tree, time
    // finding a parent - check all vertices on the level
    function findParent(level, vertex, bucket) {
        _.each(bucket, function (bNode) {
            if (vertex.pid === bNode.vertex.pid && vertex.tid === bNode.vertex.tid) {
                return bNode;
            }
        }
        return 0;
    }

    function addTreeChild(tree, curLevel, goalLevel, parentVertex, childVertex) {
        if (curLevel === goalLevel) {
            var vertex = tree.vertex;
            if (vertex.pid === parentVertex.pid && vertex.tid === parentVertex.tid && vertex.time === parentVertex.time) {
                tree.addChild(childVertex);
                return;
            }
        } else {
            _.each(tree.children, function (child) {
                addTreeChild(child, curLevel + 1, goalLevel, parentVertex, childVertex);
            }
        }
    }

    function addToBucket(level, vertex, treeNum) {
        var bucket = buckets[level] ? buckets[level] : [];
        if (bucket.length > 0) {
            _.each(bucket, function (bNode) {
                if (vertex.pid === bNode.vertex.pid && vertex.tid === bNode.vertex.tid) { // check if similar node is already in the bucket
                    bNode.treeNum = treeNum;
                    bNode.vertex.time = vertex.time;
                    return;
                }
            }
        } else {
            buckets[level] = [];
        }
        var bNode = new BucketNode(vertex, treeNum);
        buckets[level].push(bNode);
    }

    // TODO: remove these vars (reduce global state)
    var duration = 500,
        i = 0,
        root,
        tree,
        diagonal,
        vis;

    function update(source) {
        var nodes = tree.nodes(root).reverse();
        console.log(nodes);

        // creates as many g.node as vertices in tree
        var node = vis.selectAll("g.node")
            .data(nodes, function(d) { return d.id || (d.id = ++i); });

        // creating vertices in the tree (g with circle and text) 
        var nodeEnter = node.enter()
            .append("svg:g")
            .attr("class", "node");

        nodeEnter.append("svg:circle")
            .attr("r", 4.5)
            .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
            .on("click", click);

        nodeEnter.append("svg:text")
            .attr("x", -5)//function(d) { return d._children ? -8 : 8; }) --> used by original
            .attr("y", 18)
            .text(function(d) { 
                return "process : " + d.pid + " thread : " + d.tid; 
            });

        // Transition nodes to their new position (duration controls speed: higher == slower)
        nodeEnter.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1)
            .select("circle")
            .style("fill", "lightsteelblue");

        node.transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; })
            .style("opacity", 1);

        node.exit().transition()
            .duration(duration)
            .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
            .style("opacity", 1e-6)
            .remove();

        // form the edges between the vertices
        var link = vis.selectAll("path.link")
            .data(tree.links(nodes), function(d) { return d.target.id; });

        // Enter any new links at the parent's previous position.
        link.enter().insert("svg:path", "g")
            .attr("class", "link")
            .attr("d", function(d) {
                var o = {x: source.x0, y: source.y0};
                return diagonal({source: o, target: o});
            })
        .transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition links to their new position.
        link.transition()
            .duration(duration)
            .attr("d", diagonal);

        // Transition exiting nodes to the parent's new position.
        link.exit().transition()
            .duration(duration)
            .attr("d", function(d) {
                var o = {x: source.x, y: source.y};
                return diagonal({source: o, target: o});
            })
        .remove();

        // Stash the old positions for transition.
        nodes.forEach(function(d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    // Toggle children on click.
    function click(d) {
        if (d.children) {
            d._children = d.children;
            d.children = null;
        } else {
            d.children = d._children;
            d._children = null;
        }
        update(d);
    }

    function drawLifelineTree() {
        var w = 800,//960,  the width and height of the whole svg arrea
            h = 700;//2000;

        tree = d3.layout.tree()
            .size([h, w - 160]);

        diagonal = d3.svg.diagonal()
            .projection(function(d) { return [d.y, d.x]; });

        // creates an SVG canvas
        vis = d3.select("#lifeline")
            .append("svg:svg")
            .attr("width", w)
            .attr("height", h)
            .append("svg:g")
            .attr("transform", "translate(20,0)");//moves the initial position of the svg:g element

        // want to draw from treeLifeline structure
        d3.json("tree_example.json", function(json) {
            json.x0 = 300;//800;
            json.y0 = 0;
            root = json;
            update(json);
        });
    }

    function windowLoadHandler() {
        loadLifeline();
        parseLifelineData();
        drawLifelineTree();
    }

    window.addEventListener('load', windowLoadHandler, false);

    /* Utilities */

    util.ajaxget = function (url, callback, async) {
        var r = util.getAjaxRequest(callback);
        r.open("GET", url, async);
        r.send(null);
    };

    util.getAjaxRequest = function (callback) {
        var ajaxRequest;

        try {
            ajaxRequest = new XMLHttpRequest();
        } catch (e) {
            /*global ActiveXObject*/
            try {
                ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e2) {
                try {
                    ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e3) {
                    return null;
                }
            }
        }

        ajaxRequest.onreadystatechange = function () {
            if (ajaxRequest.readyState === 4) {
                // TODO error response checking
                callback(ajaxRequest.responseText);
            }
        };

        return ajaxRequest;
    };

}());

