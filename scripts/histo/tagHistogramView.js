define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../templates/histogram.html',
    'histo/tagHistogram'
], function ($, _, Backbone, histotemplate, tagHistogram) {
    'use strict';
    var ContainerView;

    ContainerView = Backbone.View.extend({
        template: _.template(histotemplate),

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(this.template());
            tagHistogram.draw(this.$('#stackedThreads')[0]);
        }
    });

    return ContainerView;
});
