/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {
    'use strict';

    var LifelineModel, parseRawShowtags;

    parseRawShowtags = function (data) {
        var results, i, lines;
        lines = data.split('\n');
        results = [];
        // NOTE: This uses a slightly modified showtag scripts, that prints
        // nicer output. Modify to_json according to your showtags.c output
        for (i = 2; i < lines.length; i += 1) {
            var words, result;
            words = lines[i].split(/[ \t]+/);

            // We need at least 6 elements in the array, otherwise it's a
            // garbage row and we ignore it. NOTE: Potentially we can throw an error
            if (words.length < 6) {
                continue;
            }

            result = {};
            result.tagName = words[0];

            // Note: we do not have the process name in raw showtags.c output,
            // so we'll use the process ID
            result.srcProcessName = words[1];

            // If we can't turn the IDs into numbers, then they are invalid
            // and we can ignore this row
            try {
                parseInt(words[1], 10);
                parseInt(words[2], 10);
                parseInt(words[3], 10);
                parseInt(words[4], 10);
                parseInt(words[5], 10);
            } catch (e) {
                continue;
            }

            result.srcProcessId = words[1];
            result.srcThreadId = words[2];
            result.dstProcessName = words[3];
            result.dstProcessId = words[3];
            result.dstThreadId = words[4];
            result.time = parseInt(words[5], 10);

            results.push(result);
        }
        return results;
    };

    LifelineModel = Backbone.Model.extend({
        url: '/data/tagger.json',

        defaults: {
            startTime: 0,
            endTime: Infinity
        },

        updateTimeLimits: function () {
            var lifeline, start, end;
            lifeline = this.get('lifelineOriginal');
            start = this.get('startTime');
            end = this.get('endTime');
            lifeline = _.filter(lifeline, function (node) {
                 return start < node.time && node.time < end;
            });
            this.set({ lifeline: lifeline });
        },

        parseShowtagsC: function (rawLifeline) {
            var errorMsg, newLifeline;
            newLifeline = parseRawShowtags(rawLifeline);
            if (newLifeline.length > 0) {
                this.set({ lifelineOriginal: newLifeline}, { silent: true });
                this.set({ lifeline: newLifeline}, { silent: true });
                this.updateTimeLimits();
            } else {
                errorMsg = 'Error: Could not read provided lifeline data.'
                    + ' Please use output provided by showtag.c';
                throw {
                    name: 'Parse Error',
                    level: 'Warning',
                    message: errorMsg,
                    htmlMessage: errorMsg
                };
            }
        },

        parse: function (response) {
            // we also keep an original copy because we might modify it
            return { lifeline: response, lifelineOriginal: response };
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

