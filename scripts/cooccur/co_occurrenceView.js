define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../templates/matrix.html',
    'cooccur/co_occurrence'
], function ($, _, Backbone, matrixtemplate, cooccurrence) {
    'use strict';

    var ContainerView;

    ContainerView = Backbone.View.extend({
        template: _.template(matrixtemplate),

        initialize: function () {
            this.render();
        },

        render: function () {
            this.$el.html(this.template());
            cooccurrence.draw(this.$('#cooccur')[0]);
        }
    });

    return ContainerView;

});
