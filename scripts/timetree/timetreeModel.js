define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone) {
    'use strict';

    function countTags(taggerData) {
        var tagNames = {};
        _.each(taggerData, function (datum) {
            var n = tagNames[datum.tagName];
            if (typeof n === 'undefined') {
                tagNames[datum.tagName] = 0;
            }
            tagNames[datum.tagName] += 1;
        });
        return tagNames;
    }

    function maxTime(lifeline) {
        var times = _.pluck(lifeline, 'time');
        return _.max(times);
    }

    var TimeTreeModel = Backbone.Model.extend({
        url: '/data/tagger.json',

        parse: function (response) {
            var endTime, tags;
            tags = countTags(response);
            endTime = maxTime(response);

            return { endTime: endTime, tags: tags, lifeline: response };
        },

        defaults: {
            // A high resolution means more levels and less things per bucket. A low
            // resolution means more things in 1 bucket
            resolution: 1.0,
            // This collapses duplicate edges into one when set to true
            isCollapsed: false,
            startTime: 0,
            endTime: Infinity,
            // The raw lifeline data
            lifeline: [],
            tags: {}
        }
    });

    return TimeTreeModel;
});

