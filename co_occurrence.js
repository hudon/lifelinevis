/*jslint nomen: true, browser: true, devel: true*/
/*global _,d3*/
'use strict';
var Coocur = (function () {
    function drawFunc() {
        var margin, width, height, x, z, c, svg;

        margin = {top: 120, right: 0, bottom: 10, left: 180};
        width = 320;
        height = 320;

        x = d3.scale.ordinal().rangeBands([0, width]);
        z = d3.scale.linear().domain([0, 4]).clamp(true);
        c = d3.scale.category10().domain(d3.range(10));

        svg = d3.select("#cooccur").append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .style("margin-left", -margin.left + "px")
            .append("g")
            .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

        d3.json("co_occurrence_data.json", function (procs) {
            var matrix, nodes, n, orders, row, column, timeout;

            function mouseover(p) {
                d3.selectAll(".row .axis_label").classed("active", function (d, i) { return i === p.y; });
                d3.selectAll(".column .axis_label").classed("active", function (d, i) { return i === p.x; });
            }

            function mouseout() {
                d3.selectAll("text").classed("active", false);
            }

            function prepareRow(row, i, j, domElem) {
                var cell = d3.select(domElem).selectAll(".cell")
                    .data(row.filter(function (d) { return d.z; }))
                    .enter().append("rect")
                    .attr("class", "cell")
                    .attr("x", function (d) { return x(d.x); })
                    .attr("width", x.rangeBand())
                    .attr("height", x.rangeBand())
                    .style("fill-opacity", function (d) {
                        return z(d.z);
                    })
                    .style("fill", function (d) {
                        return nodes[d.x].group === nodes[d.y].group ? c(nodes[d.x].group) : null;
                    })
                    .on("mouseover", mouseover)
                    .on("mouseout", mouseout)
                    .text(function(d, i) {
                        return d.z;
                    });

                d3.select(domElem).selectAll("text")
                    .data(row.filter(function (d) { return d.z; }))
                    .enter().append("text")
                    .attr("class", "cell")
                    .attr("class", "cell_text")
                    .text(function(d, i) {
                        return d.z;
                    }).attr("x", function (d) { return x(d.x) + x.rangeBand() / 2.3; })
                    .attr("y", function (d) { return x.rangeBand() / 1.8; });
            }

            matrix = [];
            nodes = procs.nodes;
            n = nodes.length;

            // Compute index per node.
            nodes.forEach(function (node, i) {
                node.index = i;
                node.count = 0;
                matrix[i] = d3.range(n).map(function (j) { return {x: j, y: i, z: 0}; });
            });

            // Convert links to matrix; count character occurrences.
            procs.links.forEach(function (link) {
                matrix[link.source][link.target].z += link.value;
                nodes[link.source].count += link.value;
            });

            // Precompute the orders.
            orders = {
                name: d3.range(n).sort(function (a, b) { return d3.ascending(nodes[a].name, nodes[b].name); }),
                count: d3.range(n).sort(function (a, b) { return nodes[b].count - nodes[a].count; }),
                group: d3.range(n).sort(function (a, b) { return nodes[b].group - nodes[a].group; })
            };

            // The default sort order.
            x.domain(orders.name);

            svg.append("rect")
                .attr("class", "background")
                .attr("width", width)
                .attr("height", height);

            row = svg.selectAll(".row")
                .data(matrix)
                .enter().append("g")
                .attr("class", "row")
                .attr("transform", function (d, i) { return "translate(0," + x(i) + ")"; })
                .each(_.passThis(prepareRow));

            row.append("line")
                .attr("x2", width);

            row.append("text")
                .attr("x", -6)
                .attr("y", x.rangeBand() / 2)
                .attr("dy", ".32em")
                .attr("text-anchor", "end")
                .attr("class", "axis_label")
                .text(function (d, i) { return nodes[i].name; });

            column = svg.selectAll(".column")
                .data(matrix)
                .enter().append("g")
                .attr("class", "column")
                .attr("transform", function (d, i) { return "translate(" + x(i) + ")rotate(-90)"; });

            column.append("line")
                .attr("x1", -width);

            column.append("text")
                .attr("x", 6)
                .attr("y", x.rangeBand() / 2)
                .attr("dy", ".32em")
                .attr("text-anchor", "start")
                .attr("class", "axis_label")
                .text(function (d, i) { return nodes[i].name; });

            function order(value) {
                x.domain(orders[value]);

                var t = svg.transition().duration(2500);

                t.selectAll(".row")
                    .delay(function (d, i) { return x(i) * 4; })
                    .attr("transform", function (d, i) { return "translate(0," + x(i) + ")"; })
                    .selectAll(".cell")
                    .delay(function (d) { return x(d.x) * 4; })
                    .attr("x", function (d) { return x(d.x); });

                t.selectAll(".column")
                    .delay(function (d, i) { return x(i) * 4; })
                    .attr("transform", function (d, i) { return "translate(" + x(i) + ")rotate(-90)"; });
            }

            /*timeout = setTimeout(function () {
                order("group");
                d3.select("#order").property("selectedIndex", 2).node().focus();
            }, 5000);*/

            d3.select("#order").on("change", function () {
                clearTimeout(timeout);
                order(this.value);
            });
        });
    }
    return {
        parseLifeline: function (lifeline) {

        },
        draw: drawFunc
        //draw: function (dagData) {
        //}
    };

}());
