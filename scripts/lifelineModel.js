/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone, TimeTreeView, DagView) {
    'use strict';

    var LifelineModel, parseRawShowtags;

    parseRawShowtags = function (data) {
        var results, i, lines;
        lines = data.split('\n');
        results = [];
        // NOTE: This uses a slightly modified showtag scripts, that prints
        // nicer output. Modify to_json according to your showtags.c output
        for (i = 2; i < lines.length; i += 2) {
            var words, result;
            words = lines[i].split(/[ \t]+/);

            result = {};
            result.tagName = words[0];

            // Note: we do not have the process name in raw showtags.c output,
            // so we'll use the process ID
            result.srcProcessName = words[1];

            result.srcProcessId = words[1];
            result.srcThreadId = words[2];
            result.dstProcessName = words[3];
            result.dstProcessId = words[3];
            result.dstThreadId = words[4];
            result.time = parseInt(words[5]);

            results.push(result);
        }
        return results;
    };

    LifelineModel = Backbone.Model.extend({
        url: '/data/tagger.json',

        parseShowtagsC: function (rawLifeline) {
            var newLifeline;
            newLifeline = parseRawShowtags(rawLifeline);
            this.set('lifeline', newLifeline);
        },

        parse: function (response) {
            return { lifeline: response };
        }

    });

    function countTags(model) {
        var tagNames, taggerData;

        tagNames = {};

        if (!model.has('lifeline')) {
            return tagNames;
        }

        taggerData = model.get('lifeline');

        _.each(taggerData, function (datum) {
            var n = tagNames[datum.tagName];
            if (typeof n === 'undefined') {
                tagNames[datum.tagName] = 0;
            }
            tagNames[datum.tagName] += 1;
        });

        return tagNames;
    }

    return { countTags: countTags, model: LifelineModel };
});

