/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore'
], function ($, _) {
    'use strict';

    function parseLifeline(lifeline) {
        var links, multiOccurrences, processNames;

        links = [];
        multiOccurrences = {};
        processNames = {};

        // First, we calculate all the multiple occurrences of edges
        _.each(lifeline, function (lifeEvent) {
            var source, target, tagname, multiOccKey;

            source = 'pid: ' + lifeEvent.srcProcessId + ' tid: ' + lifeEvent.srcThreadId;
            processNames[source] = lifeEvent.srcProcessName;

            target = 'pid: ' + lifeEvent.dstProcessId + ' tid: ' + lifeEvent.dstThreadId;
            processNames[target] = lifeEvent.dstProcessName;

            tagname = lifeEvent.tagName;

            // An edge will be considered a duplicate if it has the same
            // source node, target node, and tagname
            multiOccKey = [source, target, tagname].join(',');

            if (!_.has(multiOccurrences, multiOccKey)) {
                multiOccurrences[multiOccKey] = 0;
            }

            multiOccurrences[multiOccKey] += 1;
        });

        // Second, we build the actual links
        _.each(multiOccurrences, function (numLinks, key) {
            var link, linkSource, linkTarget, linkData, tagname;

            link = {};

            // This will contain source, target, and tagname
            linkData = key.split(',');

            linkSource = linkData[0];
            linkTarget = linkData[1];
            tagname = linkData[2];

            // The key unique identifies a node (processId, threadId)
            link.sourceKey = linkSource;
            // Source contains the actual source node data (including the key)
            link.source = { name: linkSource, pname: processNames[linkSource] };

            link.targetKey = linkTarget;
            link.target = { name: linkTarget, pname: processNames[linkTarget] };

            link.tagname = tagname;
            link.occurrenceNumber = numLinks;

            links.push(link);
        });

        return links;
    }

    return { parse: parseLifeline };

});

