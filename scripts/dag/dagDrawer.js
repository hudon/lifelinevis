/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'd3'
], function ($, _, d3) {
    'use strict';

    function drawDag(links, domElement) {
        var colorGen, nodes, w, h, force, path, linkLabel, svg, circle, text;

        // Use elliptical arc path segments to doubly-encode directionality.
        function tick() {
            path.attr("d", function (d) {
                var num, dx, dy, dr, a, da, b;

                dx = d.target.x - d.source.x;
                dy = d.target.y - d.source.y;
                dr = Math.sqrt(dx * dx + dy * dy);
                num = d.type;

                if (d.target.name === d.source.name) {
                    a = Math.atan2(dx, dy);
                    da = 0.4;
                    b = 1;
                    return "M" + d.target.x + "," + d.target.y + "q0,45 30,30"
                        //"q" + b*Math.sin(a) + "," + b*Math.cos(a) + " " + b*Math.sin(a+da) + "," + b*Math.cos(a+da)
                        + " " + " T " + d.target.x + "," + d.target.y;
                }

                // TODO: don't hardcode '2'
                // multiple edges from one node for multiple tags
                if (num === '2') {
                    return "M" + d.source.x + "," + d.source.y + "A" + dr + ","
                        + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                }

                // TODO: don't use num
                return "M" + d.source.x + "," + d.source.y +
                    "q0," + 5 * num + " " + 5 * num + ",0 " +
                    " T " + d.target.x + "," + d.target.y;

            });

            circle.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            text.attr("transform", function (d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        }

        // green, blue, orange, pink, teal, red,
        colorGen = _.generator(['#009933', '#0000FF', '#FF9933', '#FF4422', '#00FFFF', '#FF0000']);

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

        // Compute the distinct nodes from the links.
        _.each(links, function (link) {
            if (nodes[link.source]) {
                link.source = nodes[link.source];
            } else {
                link.source = nodes[link.source] = {
                    name: link.source,
                    pname: link.sourceName
                };
            }

            if (nodes[link.target]) {
                link.target = nodes[link.target];
            } else {
                link.target = nodes[link.target] = {
                    name: link.target,
                    pname: link.targetName
                };
            }
        });

        w = 860;
        h = 600;

        force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([w, h])           // available layout size - affects the gravitational center & init rand pos
            .linkDistance(267)
            .linkStrength(0.30)
            .charge(-150)            // -ve: node repultion; +ve: node attraction
            .friction(0.1)
            .gravity(0.02)
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
            .attr("class", function (d) { return "link tag" + d.type; })
            .attr("marker-end", function (d) { return "url(#dir)"; })
            .attr("id", function (d, i) { return "p" + i; });

        linkLabel = svg.append("svg:g")
            .selectAll("text")
            .data(force.links())
            .enter().append("svg:text")
            .attr("class", function (d) {
                return "link-label-tag" + d.type;
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

