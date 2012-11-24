/*jslint nomen: true, browser: true, devel: true*/
/*global $,_,d3*/
define([
    'jquery',
    'underscore'
], function ($, _) {
    'use strict';

    function parseLifeline(lifeline) {
        var links = [];
        var multiOccurrences = {};
        var processNames = {};

        _.each(lifeline, function (lifeEvent) {
            var source = 'pid: ' + lifeEvent.srcProcessId + ', tid: ' + lifeEvent.srcThreadId;
            processNames[source] = lifeEvent.srcProcessName;

            var target = 'pid: ' + lifeEvent.dstProcessId + ', tid: ' + lifeEvent.dstThreadId;
            processNames[target] = lifeEvent.dstProcessName;

            var type = lifeEvent.tagName;

            // multioccurences -> link.source -> link.target -> number of
            // occurrences for that edge
            if (!_.has(multiOccurrences, source)) {
                multiOccurrences[source] = {};
            }
            if (!_.has(multiOccurrences[source], target)) {
                multiOccurrences[source][target] = {};
            }

            if (!_.has(multiOccurrences[source][target], type)) {
                multiOccurrences[source][target][type] = 0;
            }

            multiOccurrences[source][target][type] += 1;
        });

        var linkSource, linkTarget;

        _.each(multiOccurrences, function(source, skey) {
            linkSource = skey;

            _.each(source, function(target, tkey) {
                linkTarget = tkey;

                _.each(target, function(numLinks, tag) {
                    var link = {};

                    link.source = linkSource;
                    link.sourceName = processNames[linkSource];

                    link.target = linkTarget;
                    link.targetName = processNames[linkTarget];

                    link.type = tag;
                    link.occurrenceNumber = numLinks;

                    links.push(link);
                })
            })
        });

        return links;
    }

    return { parse: parseLifeline };

});

