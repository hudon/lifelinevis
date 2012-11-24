/*jslint nomen: true, browser: true, devel: true*/
/*global _,TagDag,TimeTree,Coocur,StackedThreads*/
(function () {
    'use strict';

    function loadLifeline(handler) {
        _.ajaxget('/data/tagger.json', function (response) {
            handler(JSON.parse(response));
        }, false);
    }

    function countTags(taggerData) {
        var tagNames = {};
        _.each(taggerData, function (datum) {
            var n = tagNames[datum.tagName];
            if (typeof n === 'undefined') {
                tagNames[datum.tagName] = 0;
            }
            tagNames[datum.tagName] += 1;
        });
        return tagNames;
    }

    function stylizeTagLinks(tags) {
        var colorGen;
        colorGen = _.generator(["green", "orange", "blue", "teal"]);

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
    }

    function windowLoadHandler() {
        loadLifeline(function (lifeline) {
            var tags, timeTree;

            tags = countTags(lifeline);
            //timeTree = new TimeTree(1, lifeline, tags);

            //timeTree.draw();

            //TagDag.draw(TagDag.parseLifeline(lifeline));

            stylizeTagLinks(tags);
        });

        Coocur.draw();
        StackedThreads.draw();
    }

    window.addEventListener('load', windowLoadHandler, false);

}());

