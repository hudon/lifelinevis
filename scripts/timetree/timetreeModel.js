/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'backbone'
], function (Backbone) {
    'use strict';

    var TimeTreeModel = Backbone.Model.extend({
        defaults: {
            // A high resolution means more levels and less things per bucket. A low
            // resolution means more things in 1 bucket
            resolution: 1.0,
            // This collapses duplicate edges into one when set to true
            isCollapsed: false
        }
    });

    function getRawLifeline(model) {
        // the timetree model contains a lifeline model
        return model.get('lifeline').get('lifeline');
    }

    return { getRawLifeline: getRawLifeline, model: TimeTreeModel };
});

