/*jslint nomen: true, browser: true, devel: true*/
/*global $,_,d3*/
'use strict';

var TimeTree;

TimeTree = _.makeClass();

TimeTree.prototype.init = function (resolution, lifeline, tags) {
    // A high resolution means more levels and less things per bucket. A low
    // resolution means more things in 1 bucket
    this.resolution = resolution;
    this.lifeline = lifeline;
    this.tags = tags;
};

// Prepares the lifeline data to be displayed as a tree
TimeTree.prototype.parseTreeData = (function () {
    var Node;

    // Every bucket is a group of nodes that we will be aligning vertically
    // because their timings are similar
    Node = _.makeClass();
    Node.prototype.init = function (pname, pid, tid, vistime,
            time, tagname, children) {
        children = children || [];
        this.pid = pid;
        this.pname = pname;
        this.tid = tid;
        this.time = time;
        // Vis time is the time used for visualization (scaled or translated
        // real time)
        this.vistime = vistime;
        // for visualization of different tags in the tree
        this.tagname = tagname;
        this.children = children;
        this.bucketLevel = 0;

        // This is the weight of the edge from this node to the parent. A
        // weight of X means that there were X identical edges found while
        // building the tree.
        this.numConnections = 1;
    };
    Node.prototype.addChild = function (childNode, grandchildren) {
        this.children.push(childNode);
    };

    // finding a parent - check all nodes on the level
    function findParent(node, bucket) {
        return _.find(bucket, function (bNode) {
            return node.pid === bNode.pid && node.tid === bNode.tid && node.tagname === bNode.tagname;
        });
    }

    function findNode(node, container, nodeLevel) {
        return _.find(container, function (cNode) {
            return node.pid === cNode.pid && node.tid === cNode.tid &&
                node.tagname === cNode.tagname && nodeLevel === cNode.bucketLevel;
        });
    }

    function addToBucket(buckets, level, node) {
        buckets[level] = buckets[level] || [];
        buckets[level].push(node);
    }

    function parseLifelineData(lifeline, resolution, mode, start, end) {
        var minTime, treeLifeline, buckets, dummyNode, startTime, endTime;

        treeLifeline = [];
        buckets = [];

        lifeline = _.sortBy(lifeline, function (node) {
            return node.time;
        });

        minTime = _.min(lifeline, function (node) {
            return node.time;
        }).time;

        // Save original time and copy a scaled version of it so that we
        // can deal with smaller numbers.
        _.each(lifeline, function (node) {
            node.vistime = node.time / minTime;
        });

        if ((typeof start !== 'undefined') && (typeof end !== 'undefined')) {
            startTime = parseInt(start);
            endTime = parseInt(end);

            if (startTime > 0 && endTime >= startTime) {
                lifeline = _.filter(lifeline, function (node) {
                    return startTime < node.time && node.time < endTime;
                });
            } else {
                // TODO error
            }
        }

        _.each(lifeline, function (node) {
            var existingChildren, existingNode, existingParent, childNode,
                parentNode, childLevel, parentLevel, tree, bucket;

            childNode = new Node(node.dstProcessName, node.dstProcessId, node.dstThreadId,
                    node.vistime, node.time, node.tagName);

            // Technically, the 'vistime' and the 'time' here would be wrong
            // since they are at the parent. However, this node will only
            // be used if we are not able to find an existing node in the
            // tree to act as parent. Child nodes have the correct time on them (the time
            // at which a tag was received)
            parentNode = new Node(node.srcProcessName, node.srcProcessId, node.srcThreadId,
                    undefined, undefined, node.tagName);

            // Decide which bucket the child should be in based off of how
            // many time periods (buckets) fit before it.
            parentLevel = childLevel = Math.round(node.vistime * resolution);

            // find parent process: look through each level down to roots
            while (parentLevel > 0) {
                // Levels represent tree depth (based off time)
                parentLevel -= 1;
                // select bucket and ensure one exists
                bucket = buckets[parentLevel] || [];
                // there might exist a prent already
                existingParent = findParent(parentNode, bucket);
                if (typeof existingParent !== 'undefined') {
                    parentNode = existingParent;
                    break;
                }
            }

            // If we're not using the existing parent, there is additional
            // setup to do for the new parent
            if (typeof existingParent === 'undefined') {
                parentNode.bucketLevel = childLevel - 1;
                addToBucket(buckets, parentNode.bucketLevel, parentNode);
                treeLifeline.push(parentNode);
            }

            if (mode === "collapse") {
                existingChildren = parentNode.children;
                existingNode = findNode(childNode, existingChildren, childLevel);

                // If we find a node, this means we have found a duplication
                // parent-child relationship, so we'll just increment the
                // weight of the edge
                if (typeof existingNode !== 'undefined') {
                    existingNode.numConnections += 1;
                } else {
                    parentNode.addChild(childNode);
                    childNode.bucketLevel = childLevel;
                    addToBucket(buckets, childLevel, childNode);
                }
            } else {
                parentNode.addChild(childNode);
                childNode.bucketLevel = childLevel;
                addToBucket(buckets, childLevel, childNode);
            }
        });

        dummyNode = new Node();
        _.each(treeLifeline, function (tree) {
            dummyNode.addChild(tree, tree.children);
        });

        return dummyNode;
    }

    return parseLifelineData;
}());

// This redraws the tree and the legend
TimeTree.prototype.drawTree = (function () {
    var visBucketSize;

    // visBucketSize is how big a bucket is visually. This value with
    // some computation will result in the distance between two levels.
    visBucketSize = 130;

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
            tag.source = {x: 10, y: 60};
            tag.target = {x: 10, y: 160};
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

    /**
     * Updates the tree visualization
     * @param root - The root node of the tree
     * @param source - The source node of the update
    */
    // TODO break this function up...
    function update(root, source, diagonal, tree, animationDuration, vis) {
        var nodeIdentifier, nodes, nodeEnter,
            nodeUpdate, nodeExit, link, node, colorGen, tooltip;

        // Remove the highlighting of nodes on mouseout
        function removeSelection() {
            tooltip.transition()
                   .duration(500)
                   .style("opacity", -1);

            d3.selectAll(".node circle")
                .style("fill", function(d) {
                    if (d.children == null) {
                        return "#b0c4de";
                    } else {
                        return "white";
                    }
                })
                .style('opacity', '1');
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
            removeSelection();
            update(root, d, diagonal, tree, animationDuration, vis);
        }

        // result is an array of objs with x and y
        // locations (+vertex info)
        nodes = tree.nodes(root).reverse();

        nodes.forEach(function (d) {
            if (d.parent) {
                d.y = d.bucketLevel * visBucketSize + visBucketSize;
            }
        });

        // data returns the "update selection" which contains nodes that exist
        // in DOM and nodes that have not been added to DOM yet
        nodeIdentifier = 0;
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
            .attr("transform", function (d) {
                return "translate(" + source.y0 + "," + source.x0 + ")";
            })
            .on("click", click);

        // Single tooltip used to display extra information about a node
        tooltip = document.getElementsByClassName("tooltip");
        if (tooltip.length) {
            tooltip = d3.select("#treelifeline .tooltip");
        } else {
            tooltip = d3.select("#treelifeline").append("div")
                .attr("class", "tooltip")
                .style("opacity", -1);
        }


        // green, blue, orange, pink, teal, red,
        colorGen = _.generator(['#009933', '#0000FF', '#FF9933', '#FF4422', '#00FFFF', '#FF0000']);

        // Select all instances of a process (the nodes/circles) in the tree on hover
        // Give selections with different tids different colors
        function addSelection(p) {
            var tooltiptext;
            // do not put tooltip on root node (will not have pid)
            if (p.pid) {
                tooltiptext = "name: " + p.pname + " pid: " + p.pid +
                        " tid: " + p.tid;
                if (p.time) {
                    tooltiptext += " time: " + p.time;
                }
                //tooltiptext += " level: " + p.bucketLevel; //debugging
                //tooltiptext += " connections: " + p.numConnections; //debugging
                tooltip.text(tooltiptext)
                    .transition()
                    .duration(300)
                    .style("opacity", 1);

                tooltip.style("left", d3.event.pageX - 55 +  "px")
                    .style("top", d3.event.pageY - 35 + "px");

            }

            d3.selectAll(".node circle").style("fill", function (d, i) {
                if (p.pid === d.pid) {
                    return colorGen.getWith(d.tid);
                }
                d3.select(this).style('opacity', '0.15');
                return 'black';
            });
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
            .attr("x", -2)
            .attr("y", 18)
            .text(function (d) {
                if (!d.pid) { return ""; }
                return d.pname;
            });

        // Transition the g elements to their new position (duration controls
        // speed: higher == slower). This transitions all elements (existing
        // and new)
        nodeUpdate = node.transition()
            .duration(animationDuration)
            .attr("transform", function (d) { return "translate(" + d.y + "," + d.x + ")"; });

        // Re-colour the nodes (since last colouring only affected new ones)
        nodeUpdate.select("circle")
            .attr("r", 6.5)
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
            .data(tree.links(nodes), function (d) {
                return d.target.id;
            });



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

        var labels = vis.selectAll("text.connection")
            .data(tree.links(nodes), function (d) {
                return d.target.id;
            });

        labels.enter().append("text")
            .text(function(d) {
                if (d.target.numConnections > 1)
                    return d.target.numConnections;
            })
            .attr('class', 'connection')
            .transition()
            .duration(animationDuration)
            .attr("transform", function (d) {
                return "translate(" + (d.target.y + d.source.y - 6) / 2 + "," +
                    (d.target.x + d.source.x - 6) / 2 + ")";
            });

        labels.transition()
            .duration(animationDuration)
            .attr("transform", function (d) {
                return "translate(" + (d.target.y + d.source.y - 6) / 2 + "," +
                    (d.target.x + d.source.x - 6) / 2 + ")";
            });

        labels.exit().remove();




        /****** done with edge construction ******/

        // Stash the old positions for transition.
        _.each(nodes, function (d) {
            d.x0 = d.x;
            d.y0 = d.y;
        });
    }

    function getMaxLevel(tree) {
        var childLevels;
        if (typeof tree.children === 'undefined' || tree.children.length === 0) {
            return tree.bucketLevel;
        }
        childLevels = _.map(tree.children, function (child) {
            return getMaxLevel(child);
        });
        return _.max(childLevels);
    }

    function drawLifelineTree(tags, treeLifeline, mode) {
        var w, h, tree, animationDuration, diagonal, vis, maxLevel;

        maxLevel = getMaxLevel(treeLifeline);

        // set the width dynamically
        w = (maxLevel + 1) * visBucketSize + visBucketSize;
        h = 900;

        tree = d3.layout.tree().size([h, w - 760]);
        animationDuration = 500;

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

        treeLifeline.x0 = 300;
        treeLifeline.y0 = 0;

        update(treeLifeline, treeLifeline, diagonal, tree, animationDuration, vis);
        createLegend(tags);
    }

    return drawLifelineTree;
}());

// Draws entire canvas. This should just be called once, whereas users might
// want to redraw (.drawTree) the tree/legend if the resolution or data changes.
TimeTree.prototype.draw = function () {
    var timeTree, treeLifeline, mode, resolution, start, end;

    timeTree = this;

    function update() {
        // remove lifeline
        d3.select("#treelifeline svg").remove("svg:svg");

        // remove legend
        d3.select("#treelegend svg").remove("svg:svg");

        treeLifeline = timeTree.parseTreeData(timeTree.lifeline,
            timeTree.resolution, mode, start, end);
        timeTree.drawTree(timeTree.tags, treeLifeline, mode);
    }

    $("#treelifeline-slide").PPSlider({
        width: 300,
        max: 5,
        initialResolution: 1,
        onChanged: function () {
            var res;
            res = $(this).val();
            if (timeTree.resolution !== res) {
                timeTree.resolution = res;
                update();
            }
        }
    });

    $("input[name='mode']").change(function () {
        var val;
        val = $("input[name='mode']:checked").val();
        if (val !== mode) {
            mode = val;
            update();
        }
    });

    $('#treelimits #tree-start').change(function (e) {
        var val;
        val = e.target.value;
        if (val !== start) {
            start = val;
            update();
        }
    });

    $('#treelimits #tree-end').change(function (e) {
        var val;
        val = e.target.value;
        if (val !== end) {
            end = val;
            update();
        }
    });

    // draw the initial tree
    treeLifeline = this.parseTreeData(this.lifeline, this.resolution);
    this.drawTree(this.tags, treeLifeline, this.resolution);
};


