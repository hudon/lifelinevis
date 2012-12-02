/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'timetree/timetreeView',
    'dag/dagView',
    'lifelineModel',
    'histo/tagHistogramView',
    'cooccur/co_occurrenceView',
    'text!../templates/apptabs.html',
    'controls'
], function ($, _, Backbone, TimeTreeView, DagView, lifeline, HistogramView,
        CooccurrenceView, tabsTemplate, ControlsView) {
    'use strict';

    var AppView;

    AppView = Backbone.View.extend({
        el: '#graphs',

        template: _.template(tabsTemplate),

        initialize: function () {
            this.model = new lifeline.model();
            this.model.on('change', this.render, this);

            // this.controlsView = new ControlsView({ model: this.model });
            // this.$el.html(this.controlsView.el);

            this.model.fetch();
        },

        addTagStyles: function () {
            var tags, colorGen;
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
                document.getElementsByTagName('head')[0].appendChild(style);
            });
        },

        events: {
            'click #tabs ul li a': 'tabClick'
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
            var treeView, dagView, histogram, cooccur, controls;

            // add tabs
            this.$('#tabs').remove();

            this.$('#tab-content').remove();
            this.$el.append(this.template());

            treeView = new TimeTreeView({ lifeline: this.model });
            dagView = new DagView({ model: this.model});
            histogram = new HistogramView();
            cooccur = new CooccurrenceView();
            controls = new ControlsView({ model: this.model });

            treeView.$el.attr('id', 'tab-1');
            dagView.$el.attr('id', 'tab-2');
            cooccur.$el.attr('id', 'tab-3');
            histogram.$el.attr('id', 'tab-4');
            controls.$el.attr('id', 'tab-5');

            this.$('#tab-content').append(treeView.$el.hide())
                .append(dagView.$el.hide())
                .append(cooccur.$el.hide())
                .append(histogram.$el.hide())
                .append(controls.$el.hide());

            this.$('#tabs > ul > li > a').first().click();

            // Add style to target all elements using a .tag<name> class
            // TODO We will need to recreate the <style> tag this generates
            // when we allow the raw lifeline data to change (uploading, copy
            // pasting, ...)
            this.addTagStyles();
            return this;
        }
    });

    return AppView;

});

