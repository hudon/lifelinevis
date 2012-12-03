/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'underscore',
    'backbone'
], function (_, Backbone) {
    'use strict';

    var PieModel = Backbone.Model.extend({
        defaults: {
            // This collapses duplicate edges into one when set to true
            isCollapsed: false,
            interactions: 'all'
        }
    });

    function getRawLifeline(model) {
        // the timetree model contains a lifeline model
        return model.get('lifeline').get('lifeline');
    }

    return { getRawLifeline: getRawLifeline, model: PieModel };
});

