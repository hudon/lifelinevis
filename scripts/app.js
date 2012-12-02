/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'timetree/timetreeView',
    'dag/dagView',
    'pie/pieView',
    'lifelineModel',
    'histo/tagHistogramView',
    'cooccur/co_occurrenceView',
    'text!../templates/apptabs.html',
    'controls',
    'text!../templates/graphsContainer.html'
], function ($, _, Backbone, TimeTreeView, DagView, PieView, lifeline,
        HistogramView, CooccurrenceView, tabsTemplate, ControlsView,
        containerTemplate) {
    'use strict';

    var TabsView, AppView;

    TabsView = Backbone.View.extend({
        template: _.template(tabsTemplate),

        initialize: function () {
            this.model.on('change', this.render, this);
            this.model.fetch();
        },

        events: {
            'click #tabs ul li a': 'tabClick'
        },

        addTagStyles: function () {
            var tags, colorGen;
            $('.tagStyle').remove();
            colorGen = _.generator(["green", "orange", "blue", "teal"]);

            tags = lifeline.countTags(this.model);

            _.each(tags, function (values, key, list) {
                var style = document.createElement('style');
                style.type = 'text/css';
                style.innerHTML = '.tag' + key + ' { stroke:'
                    + colorGen.getWith(key) + ' } ';
                if (Math.random() > 0.7) {
                    style.innerHTML += '.tag' + key + ' { stroke-dasharray:15,5 } ';
                }
                $(style).addClass('tagStyle').appendTo('head');
            });
        },

        tabClick: function (e) {
            // Make only clicked tab 'active'
            this.$('#tabs > ul > li').removeClass('active');
            this.$(e.currentTarget).parent().addClass('active');
            // Hide all immediate divs except for first one (tab list)
            $('#tab-content > div').hide();
            var currentTab = this.$(e.currentTarget).attr('href');
            this.$(currentTab).show();
            return false;
        },

        render: function () {
            var treeView, dagView, histogram, cooccur, controls, pie;

            // add tabs
            this.$('#tabs').remove();
            this.$('#tab-content').remove();
            this.$el.html(this.template());

            treeView = new TimeTreeView({ lifeline: this.model });
            dagView = new DagView({ model: this.model });
            histogram = new HistogramView();
            cooccur = new CooccurrenceView();
            pie = new PieView({ lifeline: this.model });
            controls = new ControlsView({ model: this.model });

            treeView.$el.attr('id', 'tab-1');
            dagView.$el.attr('id', 'tab-2');
            cooccur.$el.attr('id', 'tab-3');
            histogram.$el.attr('id', 'tab-4');
            pie.$el.attr('id', 'tab-5');
            controls.$el.attr('id', 'tab-6');


            this.$('#tab-content').append(treeView.$el.hide())
                .append(dagView.$el.hide())
                .append(cooccur.$el.hide())
                .append(histogram.$el.hide())
                .append(pie.$el.hide())
                .append(controls.$el.hide());

            this.$('#tabs > ul > li > a').first().click();

            // Add style to target all elements using a .tag<name> class
            // this also removes old styles
            this.addTagStyles();
            return this;
        }
    });

    AppView = Backbone.View.extend({
        el: '#graphs',

        template: _.template(containerTemplate),

        initialize: function () {
            this.model = new lifeline.model();
            this.render();
        },

        render: function () {
            var controlsView, tabsView;

            //controlsView = new ControlsView({ model: this.model });
            tabsView = new TabsView({ model: this.model });

            this.$el.html(this.template());
            //this.$el.append(controlsView.el);
            this.$el.append(tabsView.el);

            return this;
        }
    });

    return AppView;

});
