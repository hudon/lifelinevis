/*jslint nomen: true, browser: true, devel: true*/
/*global _,TagDag,TimeTree,Coocur,StackedThreads*/
(function () {
    'use strict';

    function loadLifeline(handler) {
        _.ajaxget('/tagger.json', function (response) {
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
        var colorGen = _.generator(["green", "orange", "blue", "teal"]);
        _.each(tags, function (values, key, list) {
            var style = document.createElement('style');
            style.type = 'text/css';
            style.innerHTML = '.tag' + key + ' { stroke:'
                + colorGen.getWith(key) + ' }';
            document.getElementsByTagName('head')[0].appendChild(style);
        });
    }

    function windowLoadHandler() {
        loadLifeline(function (lifeline) {
            var tags, timeTreeData;
            timeTreeData = TimeTree.parseLifelineData(lifeline);
            tags = countTags(lifeline);

            TimeTree.drawLifelineTree(timeTreeData, tags);

            TagDag.draw();

            stylizeTagLinks(tags);
        });

        Coocur.draw();
        StackedThreads.draw();

    }

    window.addEventListener('load', windowLoadHandler, false);

}());

