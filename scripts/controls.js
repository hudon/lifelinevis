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

        initialize: function () {
            this.reader = new FileReader();
            this.render();
        },

        events: {
            'change input#file': 'readFile',
            'click #lifelineform > input': 'readTextArea'
        },

        render: function () {
            this.$el.html(this.template());
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
