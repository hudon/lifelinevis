/*jslint nomen: true, browser: true, devel: true*/
/*global _,d3*/
var TagDag = (function () {
    //TODO look at:http://bl.ocks.org/1153292

    function tempFunc() {
        var links = [
            {source: "pid: 925735, tid: 2", target: "pid: 20489, tid: 1", type: "tag0", l: "0"},
            {source: "pid: 925735, tid: 2", target: "pid: 20489, tid: 3", type: "tag0", l: "0"},
            {source: "pid: 925735, tid: 2", target: "pid: 20489, tid: 1", type: "tag0", l: "1"},
            {source: "pid: 925735, tid: 2", target: "pid: 20489, tid: 1", type: "tag0", l: "2"},
            {source: "pid: 925735, tid: 2", target: "pid: 20489, tid: 1", type: "tag0", l: "3"},
            {source: "pid: 925735, tid: 2", target: "pid: 20489, tid: 3", type: "tag0", l: "1"},
            {source: "pid: 20489, tid: 1", target: "pid: 925735, tid: 0", type: "tag0", l: "0"},
            {source: "pid: 20489, tid: 1", target: "pid: 925735, tid: 0", type: "tag0", l: "1"},
            {source: "pid: 20489, tid: 1", target: "pid: 925735, tid: 0", type: "tag0", l: "2"},
            {source: "pid: 20489, tid: 3", target: "pid: 925735, tid: 0", type: "tag0", l: "0"},
            {source: "pid: 925735, tid: 0", target: "pid: 20489, tid: 1", type: "tag0", l: "0"},
            {source: "pid: 925735, tid: 0", target: "pid: 925735, tid: 0", type: "tag0", l: "0"},
            {source: "pid: 925735, tid: 0", target: "pid: 20489, tid: 3", type: "tag0", l: "0"},
            {source: "pid: 925735, tid: 0", target: "pid: 925735, tid: 0", type: "tag0", l: "1"},

            {source: "pid: 20489, tid: 3", target: "pid: 925735, tid: 0", type: "tag1", l: "1"},
            {source: "pid: 925735, tid: 0", target: "pid: 20489, tid: 1", type: "tag1", l: "1"},
            {source: "pid: 925735, tid: 0", target: "pid: 925735, tid: 0", type: "tag1", l: "2"},

            {source: "pid: 925735, tid: 0", target: "pid: 20489, tid: 3", type: "tag2", l: "1"},
            {source: "pid: 925735, tid: 0", target: "pid: 925735, tid: 0", type: "tag2", l: "3"},

            {source: "pid: 925735, tid: 1", target: "pid: 20489, tid: 3", type: "tag3", l: "0"},
            {source: "pid: 925735, tid: 1", target: "pid: 20489, tid: 3", type: "tag3", l: "1"},
            {source: "pid: 925735, tid: 1", target: "pid: 20489, tid: 1", type: "tag3", l: "0"},
            {source: "pid: 925735, tid: 1", target: "pid: 20489, tid: 1", type: "tag3", l: "1"},

            {source: "pid: 20489, tid: 1", target: "pid: 925735, tid: 0", type: "tag4", l: "3"},
            {source: "pid: 925735, tid: 0", target: "pid: 20489, tid: 1", type: "tag4", l: "2"},
            {source: "pid: 925735, tid: 0", target: "pid: 925735, tid: 0", type: "tag4", l: "3"},
            {source: "pid: 925735, tid: 0", target: "pid: 20489, tid: 3", type: "tag4", l: "2"},
            {source: "pid: 925735, tid: 0", target: "pid: 925735, tid: 0", type: "tag4", l: "4"},
            {source: "pid: 925735, tid: 0", target: "pid: 20489, tid: 1", type: "tag4", l: "3"},
            {source: "pid: 925735, tid: 0", target: "pid: 925735, tid: 0", type: "tag4", l: "5"},
            {source: "pid: 20489, tid: 3", target: "pid: 925735, tid: 0", type: "tag4", l: "2"},
            // {source: "HTC", target: "Apple", type: "suit", l: "0"},
            // {source: "Kodak", target: "Apple", type: "suit", l: "0"},
            // {source: "Microsoft", target: "Barnes & Noble", type: "suit", l: "0"},
            // {source: "Microsoft", target: "Foxconn", type: "suit", l: "0"},
            // {source: "Oracle", target: "Google", type: "suit", l: "0"},
            // {source: "Apple", target: "HTC", type: "suit", l: "0"},
            // {source: "Microsoft", target: "Inventec", type: "suit", l: "0"},
            // {source: "Samsung", target: "Kodak", type: "resolved", l: "0"},
            // {source: "LG", target: "Kodak", type: "resolved", l: "0"},
            // {source: "RIM", target: "Kodak", type: "suit", l: "0"},
            // {source: "Sony", target: "LG", type: "suit", l: "0"},
            // {source: "Kodak", target: "LG", type: "resolved", l: "0"},
            // {source: "Apple", target: "Nokia", type: "resolved", l: "0"},
            // {source: "Qualcomm", target: "Nokia", type: "resolved", l: "0"},
            // {source: "Apple", target: "Motorola", type: "suit", l: "0"},
            // {source: "Microsoft", target: "Motorola", type: "suit", l: "0"},
            // {source: "Motorola", target: "Microsoft", type: "suit", l: "0"},
            // {source: "Huawei", target: "ZTE", type: "suit", l: "0"},
            // {source: "Ericsson", target: "ZTE", type: "suit", l: "0"},
            // {source: "Ericsson", target: "ZTE", type: "suit", l: "1"},
            // {source: "Ericsson", target: "ZTE", type: "suit", l: "2"},
            // {source: "Ericsson", target: "ZTE", type: "suit", l: "3"},
            // {source: "Ericsson", target: "ZTE", type: "suit", l: "4"},
            // {source: "Ericsson", target: "ZTE", type: "suit", l: "5"},
            // // added self loop:
            // {source: "Ericsson", target: "Ericsson", type: "suit", l: "0"},
            // {source: "Kodak", target: "Samsung", type: "resolved", l: "0"},
            // {source: "Apple", target: "Samsung", type: "suit", l: "0"},
            // // Added duplicate links:
            // {source: "Kodak", target: "RIM", type: "suit", l: "0"},
            // {source: "Kodak", target: "RIM", type: "suit", l: "1"},
            // {source: "Kodak", target: "RIM", type: "suit", l: "2"},
            // {source: "Kodak", target: "RIM", type: "suit", l: "3"},
            // {source: "Kodak", target: "RIM", type: "suit", l: "4"},
            // {source: "Nokia", target: "Qualcomm", type: "suit", l: "0"}
        ];

        var nodes = {};

        // Compute the distinct nodes from the links.
        links.forEach(function(link) {
            link.source = nodes[link.source] || (nodes[link.source] = {name: link.source});
            link.target = nodes[link.target] || (nodes[link.target] = {name: link.target});
        });

        var w = 1260,
            h = 800;

        var force = d3.layout.force()
            .nodes(d3.values(nodes))
            .links(links)
            .size([w, h])           // available layout size - affects the gravitational center & init rand pos
            .linkDistance(350)
            .charge(-80)            // -ve: node repultion; +ve: node attraction
            .friction(0.7)
            .gravity(0.01)
            .on("tick", tick)
            .start();

        var svg = d3.select("#lifeline").append("svg:svg")
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

        var path = svg.append("svg:g").selectAll("path")
            .data(force.links())
            .enter().append("svg:path")
            .attr("class", function(d) { return "link " + d.type; })
            .attr("marker-end", function(d) { return "url(#" + d.type + ")"; });

        var circle = svg.append("svg:g").selectAll("circle")
            .data(force.nodes())
            .enter().append("svg:circle")
            .attr("r", 6)
            .call(force.drag);

        var text = svg.append("svg:g").selectAll("g")
            .data(force.nodes())
            .enter().append("svg:g");

        // A copy of the text with a thick white stroke for legibility.
        text.append("svg:text")
            .attr("x", 18)
            .attr("y", ".35em")
            .attr("class", "shadow")
            .text(function(d) { return d.name; });

        text.append("svg:text")
            .attr("x", 18)
            .attr("y", ".35em")
            .text(function(d) { return d.name; });

        // Use elliptical arc path segments to doubly-encode directionality.
        function tick() {
            path.attr("d", function(d) {
                var dx, dy, dr, a, da, b;

                dx = d.target.x - d.source.x;
                dy = d.target.y - d.source.y;
                dr = Math.sqrt(dx * dx + dy * dy);

                if (d.target.name === d.source.name) {
                    a = Math.atan2(dx, dy);
                    da = 0.4;
                    b = 1;
                    return "M" + d.target.x + "," + d.target.y +
                "q0,45 30,30"
                //"q" + b*Math.sin(a) + "," + b*Math.cos(a) + " " + b*Math.sin(a+da) + "," + b*Math.cos(a+da)
                + " " + " T " + d.target.x + "," + d.target.y;
                } else if (d.l == 0) {
                    return "M" + d.source.x + "," + d.source.y + "A" + dr + ","
                        + dr + " 0 0,1 " + d.target.x+ "," + d.target.y;
                } else {
                    return "M" + d.source.x + "," + d.source.y +
                       "q0," + 5 * d.l + " " + 5 * d.l + "," + 0
                        + " " + " T " + d.target.x + "," + d.target.y;
                }
            });

            circle.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });

            text.attr("transform", function(d) {
                return "translate(" + d.x + "," + d.y + ")";
            });
        }
    }
    return {
        parseLifeline: function (lifeline) {

        },
        draw: tempFunc
        //draw: function (dagData) {
        //}
    };
}());
