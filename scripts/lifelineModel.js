/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone'
], function ($, _, Backbone, TimeTreeView, DagView) {
    'use strict';

    var LifelineModel;

    LifelineModel = Backbone.Model.extend({
        url: '/data/tagger.json',

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

