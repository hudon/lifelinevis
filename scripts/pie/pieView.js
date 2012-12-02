/*jslint nomen:true,browser:true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../templates/interactionsPie.html',
    'pie/pieParser',
    'pie/pieDrawer',
    'lifelineModel'
], function ($, _, Backbone, pieTemplate, pieParser, pieDrawer, lifeline) {
    'use strict';
    var ContainerView, PieView;

    PieView = Backbone.View.extend({
        template: _.template(pieTemplate),

        initialize: function() {
            this.render();
        },

        render: function() {
            var data;
            this.$el.html(this.template());
            data = pieParser.parse(this.model.get('lifeline'));
            pieDrawer.draw(data, this.$('#interactionsPie')[0]);
            return this;
        }
    });

    ContainerView = Backbone.View.extend({
        initialize: function () {
            this.render();
        },

        render: function () {
            var pieView = new PieView({ model: this.model });
            this.$el.append(pieView.el);

            return this;
        }
    });

    return ContainerView;
});
