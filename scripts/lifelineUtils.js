/*jslint nomen: true, browser: true, devel: true*/
/*global _,TagDag,TimeTree,Coocur,StackedThreads*/
define([
    'jquery',
    'underscore'
], function ($, _) {
    'use strict';

    // assume model has the key 'lifeline'
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

    return { countTags: countTags };
});

