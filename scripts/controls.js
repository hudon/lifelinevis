/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'text!../templates/controls.html'
], function ($, _, Backbone, controlsTmpl) {
    'use strict';

    var ControlsView;

    ControlsView = Backbone.View.extend({
        template: _.template(controlsTmpl),

        className: 'globalControls',

        initialize: function () {
            this.reader = new FileReader();
            this.render();
        },

        events: {
            'change input#file': 'readFile',
            'click #lifelineform > input[type="submit"]': 'readTextArea',
            'click #timecontrols > input[type="submit"]': 'renderNewTimeLimits'
        },

        renderNewTimeLimits: function (e) {
            var start, end;

            e.preventDefault();

            start = this.$('#tree-start').val();
            end = this.$('#tree-end').val();
            this.model.set({ startTime: parseInt(start, 10), endTime: parseInt(end, 10) });
            this.model.updateTimeLimits();
        },

        render: function () {
            this.$el.html(this.template(this.model.toJSON()));
            this.$('.error').hide();
            return this;
        },

        parse: function (text) {
            this.$('.error').hide();
            try {
                this.model.parseShowtagsC(text);
            } catch (e) {
                this.$('.error').text(e.message).show();
            }
        },

        readTextArea: function (e) {
            e.preventDefault();
            parse(this.$('#lifelineform > textarea').val());
        },

        readFile: function (ev) {
            var parentView, fileList;
            fileList = ev.currentTarget.files;

            parentView = this;
            this.reader.readAsText(fileList[0], 'UTF-8');
            this.reader.onloadend = function () {
                var text;
                text = parentView.reader.result;
                parentView.parse(text);
            }
        }

    });

    return ControlsView;

});
