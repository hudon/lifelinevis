/*jslint nomen: true, browser: true, devel: true*/
/*global $,_,d3*/
var TagDag = (function () {
    'use strict';

    var dagCheckboxTempl;

    function toggleTag(e) {
        var tagVal, links, checkbox;
        checkbox = e.target;
        tagVal = checkbox.value;
        links = document.getElementsByClassName('link tag' + tagVal);
        if (checkbox.checked) {
            _.each(links, function (l) {
                l.style.display = "block";
            });
        } else {
            _.each(links, function (l) {
                l.style.display = "none";
            });
        }
    }

    dagCheckboxTempl = _.template('<input type="checkbox" value="<%= tagname %>"'
           + ' checked> <span> tag:<%= tagname %> </span>');

    function drawCheckboxes(links) {
        var uniqueTagNames;
        uniqueTagNames = _.union(_.pluck(links, 'type'));
        _.each(uniqueTagNames, function (tagName) {
            var form, checkbox;
            form = document.getElementById('dagcheckboxes');
            checkbox = dagCheckboxTempl({ tagname: tagName });
            form.innerHTML += checkbox;
        });
        $('#dagcheckboxes>input').change(toggleTag);
    }

    function drawDag(links) {
        var nodes, w, h, force, path, svg, circle, text;

        // Use elliptical arc path segments to doubly-encode directionality.
        function tick() {
            path.attr("d", function (d) {
                var num, dx, dy, dr, a, da, b;

                dx = d.target.x - d.source.x;
                dy = d.target.y - d.source.y;
                dr = Math.sqrt(dx * dx + dy * dy);
                num = d.occurrenceNumber;

                if (d.target.name === d.source.name) {
                    a = Math.atan2(dx, dy);
                    da = 0.4;
                    b = 1;
                    return "M" + d.target.x + "," + d.target.y + "q0,45 30,30"
                        //"q" + b*Math.sin(a) + "," + b*Math.cos(a) + " " + b*Math.sin(a+da) + "," + b*Math.cos(a+da)
                        + " " + " T " + d.target.x + "," + d.target.y;
                }
                if (num === 0) {
                    return "M" + d.source.x + "," + d.source.y + "A" + dr + ","
                        + dr + " 0 0,1 " + d.target.x + "," + d.target.y;
                }
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

        nodes = {};

        // Compute the distinct nodes from the links.
        _.each(links, function (link) {
            if (nodes[link.source]) {
                link.source = nodes[link.source];
            } else {
                link.source = nodes[link.source] = {name: link.source};
            }
            if (nodes[link.target]) {
                link.target = nodes[link.target];
            } else {
                link.target = nodes[link.target] = {name: link.target};
            }
        });

        w = 1060;
        h = 600;

        force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([w, h])           // available layout size - affects the gravitational center & init rand pos
            .linkDistance(250)
            .charge(-80)            // -ve: node repultion; +ve: node attraction
            .friction(0.7)
            .gravity(0.01)
            .on("tick", tick)
            .start();

        svg = d3.select("#daglifeline").append("svg:svg")
            .attr("width", w)
            .attr("height", h);

        // Per-type markers, as they don't inherit styles.
        svg.append("svg:defs").selectAll("marker")
            .data(["suit", "licensing", "resolved"])
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
            .attr("marker-end", function (d) { return "url(#" + d.type + ")"; });

        circle = svg.append("svg:g").selectAll("circle")
            .data(force.nodes())
            .enter().append("svg:circle")
            .attr("r", 6)
            .call(force.drag);

        text = svg.append("svg:g").selectAll("g")
            .data(force.nodes())
            .enter().append("svg:g");

        // A copy of the text with a thick white stroke for legibility.
        text.append("svg:text")
            .attr("x", 18)
            .attr("y", ".35em")
            .attr("class", "shadow")
            .text(function (d) { return d.name; });

        text.append("svg:text")
            .attr("x", 18)
            .attr("y", ".35em")
            .text(function (d) { return d.name; });

        drawCheckboxes(links);
    }

    function parseLifeline(lifeline) {
        var links, multiOccurrences;
        multiOccurrences = {};
        links = _.map(lifeline, function (lifeEvent) {
            var link = {};
            link.source = 'pid: ' + lifeEvent.srcProcessId + ', tid: ' + lifeEvent.srcThreadId;
            link.target = 'pid: ' + lifeEvent.dstProcessId + ', tid: ' + lifeEvent.dstThreadId;
            link.type = lifeEvent.tagName;

            // multioccurences -> link.source -> link.target -> number of
            // occurrences for that edge
            if (!_.has(multiOccurrences, link.source)) {
                multiOccurrences[link.source] = {};
            }
            if (!_.has(multiOccurrences[link.source], link.target)) {
                multiOccurrences[link.source][link.target] = 0;
            }
            link.occurrenceNumber = multiOccurrences[link.source][link.target];
            multiOccurrences[link.source][link.target] += 1;

            return link;
        });
        return links;
    }

    return {
        parseLifeline: parseLifeline,
        draw: drawDag
    };
}());
