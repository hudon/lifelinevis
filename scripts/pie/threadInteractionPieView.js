/*jslint nomen:true,browser:true*/
/*global define*/
define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../templates/threadInteractionPie.html',
    'pie/threadInteractionPie'
], function ($, _, Backbone, pieTemplate, threadInteractionPie) {
    'use strict';
    var ContainerView;

    ContainerView = Backbone.View.extend({
        template: _.template(pieTemplate),

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(this.template());
            threadInteractionPie.draw(this.$('#threadInteractionPie')[0]);
        }
    });

    return ContainerView;
});
