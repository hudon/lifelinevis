define([
    'jquery',
    'underscore',
    'backbone',
    'text!../../templates/dag.html',
    'text!../../templates/dagoptions.html',
    'dag/dagParser',
    'dag/dagDrawer',
    'lifelineModel'
], function ($, _, Backbone, dagTemplate, optionsTemplate, dagParser, dagDrawer, lifeline) {
    var ContainerView, DagOptionsView, DagModel, DagView;

    DagOptionsView = Backbone.View.extend({
        template: _.template(optionsTemplate),

        initialize: function (model) {
            this.render();
        },

        toggleTag: function(e) {
            var tagVal, links, checkbox, linkLabels;
            checkbox = e.target;
            tagVal = checkbox.value;
            links = document.getElementsByClassName('link tag' + tagVal);
            linkLabels = document.getElementsByClassName('link-label-tag' + tagVal);

            if (checkbox.checked) {
                _.each(links, function (l, i) {
                    l.style.display = "block";
                    linkLabels[i].style.display = "block";
                });
            } else {
                _.each(links, function (l, i) {
                    l.style.display = "none";
                    linkLabels[i].style.display = "none";
                });
            }
        },

        events: {
            'change #dagcheckboxes > input': 'toggleTag'
        },

        getTags: function () {
            var tags;
            tags = _.union(_.pluck(this.model.get('lifeline'), 'tagName'));
            return tags;
        },

        render: function () {
            this.$el.html(this.template({tags: this.getTags() }));
            return this;
        }
    });

    DagView = Backbone.View.extend({
        initialize: function () {
            this.render();
        },

        render: function () {
            var dagData;

            tagData = dagParser.parse(this.model.get('lifeline'));

            dagDrawer.draw(tagData, this.el);

            return this;
        }

    });

    ContainerView = Backbone.View.extend({
        template:  _.template(dagTemplate),

        initialize: function () {
            this.render();
        },

        render: function () {
            var optionsView, dagView;

            this.$el.html(this.template());

            dagView = new DagView({ model: this.model });
            this.$el.append(dagView.el);

            optionsView = new DagOptionsView({ model: this.model });
            this.$el.append(optionsView.el);

            return this;
        }
    });

    return ContainerView;
});

