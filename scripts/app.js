define([
    'jquery',
    'underscore',
    'backbone',
    'timetree/timetreeView',
    'dag/dagView',
    'lifelineModel',
    'histo/tagHistogramView',
    'cooccur/co_occurrenceView'
], function ($, _, Backbone, TimeTreeView, DagView, lifelineModels, HistogramView,
        CooccurrenceView) {

    var AppView;

    AppView = Backbone.View.extend({
        el: '#graphs',

        initialize: function () {
            this.model = new lifelineModels.model();
            this.model.on('change', this.render, this);
            this.model.fetch();
        },

        addTagStyles: function () {
            var tags, colorGen;
            colorGen = _.generator(["green", "orange", "blue", "teal"]);

            tags = lifelineModels.countTags(this.model);

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

        render: function () {
            var histogram, treeView, dagView;
            treeView = new TimeTreeView({ lifeline: this.model });
            dagView = new DagView({ model: this.model});
            histogram = new HistogramView();
            cooccur = new CooccurrenceView();

            this.$el.append(treeView.el);
            this.$el.append(dagView.el);
            this.$el.append(cooccur.el);
            this.$el.append(histogram.el);

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

