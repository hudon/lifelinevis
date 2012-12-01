/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'd3'
], function ($, _, d3) {
    'use strict';

    function drawDag(links, tags, domElement) {
        var colorGen, nodes, w, h, force, path, linkLabel, svg, circle, text;

        // Use elliptical arc path segments to doubly-encode directionality.
        function tick() {
            path.attr("d", function (d) {
                var num, dx, dy, dr, a, da, b;

                dx = d.target.x - d.source.x;
                dy = d.target.y - d.source.y;
                dr = Math.sqrt(dx * dx + dy * dy);
                var tagName = d.tagname;

                // If a vertex has an edge that points to itself, we still
                // want to display it:
                if (d.target.name === d.source.name) {
                    a = Math.atan2(dx, dy);
                    da = 0.4;
                    b = 1;
                    return "M" + d.target.x + "," + d.target.y + "q0,45 30,30"
                        //"q" + b*Math.sin(a) + "," + b*Math.cos(a) + " " + b*Math.sin(a+da) + "," + b*Math.cos(a+da)
                        + " " + " T " + d.target.x + "," + d.target.y;
                }

                // multiple edges from one node for multiple tags
                var tagIndex = tags.indexOf(tagName);

                if (tagIndex === 0) {
                    return "M" + d.source.x + "," + d.source.y + "A" + dr + ","
                        + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                } else {
                    return "M" + d.source.x + "," + d.source.y +
                        "q0," + 5 * tagIndex + " " + 5 * tagIndex + ",0 " +
                        " T " + d.target.x + "," + d.target.y;
                }
            });

            circle.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            text.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        }

        // green, blue, orange, pink, teal, red,
        //colorGen = _.generator(['#009933', '#0000FF', '#FF9933', '#FF4422', '#00FFFF', '#FF0000']);
        // blue
        colorGen = _.generator(['#0000FF']);

        // Select all instances of a process (the nodes/circles) in the tree on hover
        // Give selections with different tids different colors
        function addSelection(p) {
            d3.select(domElement).selectAll("circle").style("fill", function (d, i) {
                if (p.pname === d.pname) {
                    return colorGen.getWith(i);
                }
                d3.select(this).style('opacity', '0.15');
                return 'black';
            });
        }

        function removeSelection() {
            d3.select(domElement).selectAll("circle")
                .style("fill", function (d) {
                    return "white";
                })
                .style('opacity', '1');
        }

        nodes = {};

        w = 860;
        h = 600;

        // Compute the distinct nodes from the links.
        _.each(links, function (link) {
            // If the processId,threadId node exists already, then overwrite
            // the link's source to the source that exists already (since
            // we're only keeping distinct nodes).
            if (nodes[link.sourceKey]) {
                link.source = nodes[link.sourceKey];
            } else {
                // Otherwise, store the first node of its kind
                nodes[link.sourceKey] = link.source;
                nodes[link.sourceKey].x = w / 2;
                nodes[link.sourceKey].y = h / 2;
            }

            if (nodes[link.targetKey]) {
                link.target = nodes[link.targetKey];
            } else {
                nodes[link.targetKey] = link.target;
                nodes[link.targetKey].x = w / 2;
                nodes[link.targetKey].y = h / 2;
            }
        });

        force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            // available layout size - affects the gravitational center & init rand pos
            .size([w, h])
            .linkDistance(267)
            // A small link strength means it's very flexible and won't move nodes too much
            .linkStrength(0.15)
            // for charge, -ve: node repulsion; +ve: node attraction
            .charge(-300)
            .friction(0.09)
             // The gravity is the amount of force pulling everything towards the center
            .gravity(0.01)
            .on("tick", tick)
            .start();

        svg = d3.select(domElement).append("svg:svg")
            .attr("width", w)
            .attr("height", h);

        // TODO: make marker color correspond to edge color
        svg.append("svg:defs").selectAll("marker")
                .data(["dir"])
            .enter().append("svg:marker")
                .attr("id", String)
                .attr("viewBox", "0 -5 10 10")
                .attr("refX", 15)
                .attr("refY", -1.5)
                .attr("markerWidth", 6)
                .attr("markerHeight", 6)
                .attr("orient", "auto")
            .append("svg:path")
                .attr("d", "M0,-5L10,0L0,5");

        path = svg.append("svg:g").selectAll("path")
            .data(force.links())
            .enter().append("svg:path")
            .attr("class", function (d) { return "link tag" + d.tagname; })
            .attr("marker-end", function (d) { return "url(#dir)"; })
            .attr("id", function (d, i) { return "p" + i; });

        linkLabel = svg.append("svg:g")
            .selectAll("text")
            .data(force.links())
            .enter().append("svg:text")
            .attr("class", function (d) {
                return "link-label-tag" + d.tagname;
            })
            .attr("font-size", 10)
            .attr("text-anchor", "middle")
            .append("svg:textPath")
            .attr("startOffset", "50%")
            .attr("xlink:xlink:href", function (d, i) {
                return "#p" + i;
            })
            .text(function (d) { return d.occurrenceNumber; });

        circle = svg.append("svg:g").selectAll("circle")
            .data(force.nodes())
            .enter().append("svg:circle")
            .attr("r", 6)
            .call(force.drag)
            .on("mouseover", addSelection)
            .on("mouseout", removeSelection);

        text = svg.append("svg:g").selectAll("text")
            .data(force.nodes())
            .enter().append("svg:text")
            .attr("x", 10)
            .attr("y", ".35em")
            .text(function (d) { return d.pname; });

    }

    return { draw: drawDag };

});

