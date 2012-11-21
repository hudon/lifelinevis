define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../templates/timetree.html',
    'text!../../templates/timetreeoptions.html',
    'timetree/timetreeModel',
    'timetree/timetreeParser',
    'timetree/timetreeDrawer',
    'timetree/timetreeSlider'
], function ($, _, Backbone, timetreeTemplate, optionsTemplate,
        TimeTreeModel, timetreeParser, timetreeDrawer) {
    'use strict';

    var TimeTreeView, OptionsView, TreeView;

    OptionsView = Backbone.View.extend({
        template: _.template(optionsTemplate),

        initialize: function (model) {
            this.model = model;
            this.model.on('change:tags', this.remakeLegend, this);
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
            this.model.set({ startTime: parseInt(start), endTime: parseInt(end) });
        },

        events: {
            'change .options input[name="mode"]': 'toggleCollapse',
            'change .options #treelimits input': 'renderNewTimeLimits'
        },

        remakeLegend: function () {
            this.$('svg').remove();
            this.$el.append(timetreeDrawer.createLegend(this.model.get('tags')));
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));

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
        initialize: function (model) {
            this.model = model;
            this.model.on('change', this.render, this);
            this.model.fetch();
        },

        render: function () {
            var treeLifeline;

            // remove lifeline
            //d3.select("#treelifeline svg").remove("svg:svg");
            this.$('svg').remove();

            treeLifeline = timetreeParser.parse(this.model.get('lifeline'),
                this.model.get('resolution'),
                this.model.get('isCollapsed'), this.model.get('startTime'),
                this.model.get('endTime'));

            // the drawer will take care of appending to this view's element
            timetreeDrawer.draw(this.model.get('tags'), treeLifeline,
                   this.model.get('resolution'), this.el);

            return this;
        }
    });

    TimeTreeView = Backbone.View.extend({
        template: _.template(timetreeTemplate),

        model: new TimeTreeModel,

        initialize: function () {
            this.render();
        },

        render: function () {
            var treeView, optionsView;

            // Add descriptions
            this.$el.html(this.template({}));

            // Add tree
            treeView = new TreeView(this.model);
            this.$el.append(treeView.el);

            // add options
            optionsView = new OptionsView(this.model)
            this.$el.append(optionsView.render().el);

            return this;
        }
    });

    return TimeTreeView;
});

