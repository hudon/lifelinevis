/*jslint nomen:true,browser:true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../templates/interactionsPie.html',
    'text!../../templates/pieoptions.html',
    'pie/pieModel',
    'pie/pieParser',
    'pie/pieDrawer',
    'lifelineModel'
], function ($, _, Backbone, pieTemplate, optionsTemplate, pieModel, pieParser, pieDrawer, lifeline) {
    'use strict';
    var ContainerView, PieView, PieOptionsView;

    PieOptionsView = Backbone.View.extend({
        template: _.template(optionsTemplate),

        initialize: function (model) {
            this.render();
        },

        togglePieCollapse: function () {
            var val;
            val = $("input[name='mode']:checked").val();
            this.model.set('isCollapsed', val === 'collapse');
        },

        togglePieInteractions: function () {
            var val;
            val = $("input[name='interactions']:checked").val();
            this.model.set('interactions', val);
        },

        events: {
            'change .options.pie input[name="mode"]': 'togglePieCollapse',
            'change .options.pie input[name="interactions"]': 'togglePieInteractions'
        },

        render: function () {
            this.$el.html(this.template);
            return this;
        }
    });

    PieView = Backbone.View.extend({
        template: _.template(pieTemplate),

        initialize: function() {
            this.model.on('change', this.render, this);
            this.render();
        },

        render: function() {
            var data;
            this.$el.html(this.template());
            data = pieParser.parse(pieModel.getRawLifeline(this.model),
                this.model.get('isCollapsed'),
                this.model.get('interactions'));

            pieDrawer.draw(data, this.$('#interactionsPie')[0]);
            return this;
        }
    });

    ContainerView = Backbone.View.extend({
        initialize: function (options) {
            this.model = new pieModel.model({
                lifeline: options.lifeline
            });
            this.render();
        },

        render: function () {
            var pieView, optionsView;

            pieView = new PieView({ model: this.model });
            optionsView = new PieOptionsView({ model: this.model });

            this.$el.append(pieView.el);
            this.$el.append(optionsView.el);

            return this;
        }
    });

    return ContainerView;
});
