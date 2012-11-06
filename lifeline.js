/*jslint nomen: true, browser: true, devel: true*/
/*global _,TagDag,TimeTree,Coocur*/
(function () {
    'use strict';

    function loadLifeline(handler) {
        _.ajaxget('/tagger.json', function (response) {
            handler(JSON.parse(response));
        }, false);
    }

    function windowLoadHandler() {
        loadLifeline(function (lifeline) {
            var timeTreeData = TimeTree.parseLifelineData(lifeline);
            TimeTree.drawLifelineTree(timeTreeData);
        });

        TagDag.draw();
        Coocur.draw();
    }

    window.addEventListener('load', windowLoadHandler, false);

}());

