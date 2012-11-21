define([
    'jquery',
    'underscore',
    'backbone',
    'timetree/timetreeView'
], function ($, _, Backbone, TimeTreeView) {

    var AppView = Backbone.View.extend({
        el: '#timetree',

        initialize: function () {
            this.treeView = new TimeTreeView();
            this.render();
        },

        render: function () {
            this.$el.html(this.treeView.el);
            return this;
        }
    });

    return AppView;

});
