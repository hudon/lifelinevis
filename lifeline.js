(function () {
    'use strict';
    /*jslint nomen: true, browser: true*/
    /*global _,console,d3*/

    // Vertex: a process thread; Edge: the event of sending/recieving a tag
    function Vertex(pid, tid, time) {
        this.pid = pid;
        this.tid = tid;
        this.time = time;
    }

    function Node(vertex, children) {
        this.vertex = vertex;
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

    var lifeline = [],
        util = {},
        treeLifeline = [],  // tree-like representation of the lifeline
        buckets = [],       // nodes per level
        timePeriod = 1;

    function loadLifeline() {
        util.ajaxget('/lifeline.json', function (response) {
            lifeline = JSON.parse(response);
        }, false);
    }

    // return tree, time
    // finding a parent - check all vertices on the level
    function findParent(vertex, bucket) {
        _.each(bucket, function (bNode) {
            if (vertex.pid === bNode.vertex.pid && vertex.tid === bNode.vertex.tid) {
                return bNode;
            }
        });
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
            });
        }
    }

    function addToBucket(level, vertex, treeNum) {
        var bucket = buckets[level] || [],
            bNode;
        if (bucket.length > 0) {
            _.each(bucket, function (bNode) {
                if (vertex.pid === bNode.vertex.pid && vertex.tid === bNode.vertex.tid) { // check if similar node is already in the bucket
                    bNode.treeNum = treeNum;
                    bNode.vertex.time = vertex.time;
                    return;
                }
            });
        } else {
            buckets[level] = [];
        }
        bNode = new BucketNode(vertex, treeNum);
        buckets[level].push(bNode);
    }

    function parseLifelineData() {
        _.each(lifeline, function (node) {
            var vert = new Vertex(node.dstProcessId, node.dstThreadId, node.time),
                parent = new Vertex(node.srcProcessId, node.srcThreadId, node.time),
                parentBucketNode,
                level = Math.floor(node.time / timePeriod),                           // actual tree level based on time
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

            // have a parent, go to parent in identified tree and add the child -- update parent in bucket
            if (parentBucketNode) {
                tree = treeLifeline[parentBucketNode.treeNum];                 // a root Node
                addTreeChild(tree, 0, level, parentBucketNode.vertex, vert);
                addToBucket(level + 1, vert, parentBucketNode.treeNum);              // add child to the right bucket

                // do not have a parent in our current trees, create a new root == level 0
            } else {
                rootNode = new Node(parent, []);
                rootNode.addChild(vert);
                treeLifeline.push(rootNode);
                addToBucket(0, parent, treeLifeline.length - 1);
                addToBucket(1, vert, treeLifeline.length - 1);
            }
        });
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


        var nodes = tree.nodes(source).reverse(), // result is an array of objs with x and y locations (+vertex info)
            nodeIdentifier,
            nodeEnter,  // the enter set of node elements (i.e. all new nodes on screen)
            link,
            node;       

        // adds id to each obj in nodes, creates element placeholders
        nodeIdentifier = 0;
        node = vis.selectAll("g.node")    // selects elements that don't exist in order to create new ones == empty selection
            .data(nodes, function (d) {   // all nodes data ends up as placeholder nodes for missing elements in enter()
                nodeIdentifier += 1;
                if (!d.id) {
                    d.id = nodeIdentifier;
                }
                return d.id;
            });

        /****** Dealing will all new node elements ******/
        
        // for every node placeholder in enter set, add the missing elements to the SVG
        // returns a list of SVG g elements (with node object in their data attrib)
        nodeEnter = node.enter()
            .append("svg:g")
            .attr("class", "node");

        // to each g elements add a SVG circle element (~~ as a child)
        nodeEnter.append("svg:circle")
            .attr("r", 4.5)
            .style("fill", function (d) { return d._children ? "lightsteelblue" : "#fff"; })
            .on("click", click);

        // to each g element add a SVG text element (~~ another child)
        nodeEnter.append("svg:text")
            .attr("x", -5)//function(d) { return d._children ? -8 : 8; }) --> used by original
            .attr("y", 18)
            .text(function (d) {
                return "process : " + d.pid + " thread : " + d.tid;
            });

        // Transition the g elements to their new position (duration controls speed: higher == slower)
        nodeEnter.transition()
            .duration(animationDuration)
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; }) // translate to nodes x & y pos.
            .style("opacity", 1)
            .select("circle")
            .style("fill", "lightsteelblue");
            
        /****** done with new node elements ******/

        // the update set (I believe)
        node.transition()
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

        // returns an array of objects representing the links from parent to child for each node ({source, target})
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


    function drawLifelineTree() {
        // want to draw from treeLifeline structure
        d3.json("tree_example.json", function (json) {
        
            for (var i=0; i<json.length; i++) {
            
                var w = 800,//960,  the width and height of the whole svg arrea
                    h = 700,//2000;
                    tree = d3.layout.tree().size([h, w - 160]),
                    animationDuration = 500,

                diagonal = d3.svg.diagonal()
                    .projection(function (d) { return [d.y, d.x]; }),

                // creates an SVG canvas
                vis = d3.select("#lifeline")
                    .append("svg:svg")
                    .attr("width", w)
                    .attr("height", h)
                    .append("svg:g")
                    .attr("transform", "translate(20,0)");//moves the initial position of the svg:g element
               
                json[i].x0 = 300;
                json[i].y0 = 0;
                update(json[i], diagonal, tree, animationDuration, vis);
            }

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

