/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../templates/timetree.html',
    'text!../../templates/timetreeoptions.html',
    'timetree/timetreeModel',
    'timetree/timetreeParser',
    'timetree/timetreeDrawer',
    'lifelineModel',
    'timetree/timetreeSlider'
], function ($, _, Backbone, timetreeTemplate, optionsTemplate,
        TimeTreeModels, timetreeParser, timetreeDrawer, lifeline) {
    'use strict';

    var ContainerView, OptionsView, TreeView;

    OptionsView = Backbone.View.extend({
        template: _.template(optionsTemplate),

        initialize: function () {
            this.render();
        },

        toggleCollapse: function () {
            var val;
            val = $("input[name='mode']:checked").val();
            this.model.set('isCollapsed', val === 'collapse');
        },

        renderNewTimeLimits: function () {
            var start, end;
            start = this.$('#tree-start').val();
            end = this.$('#tree-end').val();
            this.model.set({ startTime: parseInt(start, 10), endTime: parseInt(end, 10) });
        },

        events: {
            'change .options input[name="mode"]': 'toggleCollapse',
            'change .options #treelimits input': 'renderNewTimeLimits'
        },

        remakeLegend: function () {
            var tags;
            this.$('svg').remove();
            tags = lifeline.countTags(this.model.get('lifeline'));
            this.$el.append(timetreeDrawer.createLegend(tags, this.$('#treelegend')[0]));
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));

            this.remakeLegend();

            var options = this;
            // note: This is a legacy event handler. Use Backbone style
            // instead.
            this.$("#treelifeline-slide").PPSlider({
                width: 300,
                max: 5,
                initialResolution: 1,
                onChanged: function () {
                    var res;
                    res = $(this).val();
                    options.model.set('resolution', res);
                }
            });

            return this;
        }
    });

    TreeView = Backbone.View.extend({
        initialize: function () {
            this.model.on('change', this.render, this);
            this.render();
        },

        render: function () {
            var treeLifeline;

            // remove lifeline
            this.$('svg').remove();

            treeLifeline = timetreeParser.parse(TimeTreeModels.getRawLifeline(this.model),
                this.model.get('resolution'),
                this.model.get('isCollapsed'), this.model.get('startTime'),
                this.model.get('endTime'));

            // the drawer will take care of appending to this view's element
            timetreeDrawer.draw(treeLifeline, this.model.get('resolution'), this.el);

            return this;
        }
    });

    ContainerView = Backbone.View.extend({
        template: _.template(timetreeTemplate),

        initialize: function (options) {
            this.model = new TimeTreeModels.model({
                lifeline: options.lifeline
            });

            this.render();
        },

        render: function () {
            var treeView, optionsView;

            // Add descriptions
            this.$el.html(this.template({}));

            // Add tree
            treeView = new TreeView({ model: this.model });
            this.$el.append(treeView.el);

            // add options
            optionsView = new OptionsView({ model: this.model });
            this.$el.append(optionsView.el);

            return this;
        }
    });

    return ContainerView;
});

