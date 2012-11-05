/*jslint nomen: true, browser: true, devel: true*/
/*global TagDag,TimeTree,Coocur*/
(function () {
    'use strict';

    var util = {};

    function loadLifeline(handler) {
        util.ajaxget('/tagger.json', function (response) {
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

    /* Utilities */

    util.ajaxget = function (url, callback, async) {
        var r = util.getAjaxRequest(callback);
        r.open("GET", url, async);
        r.send(null);
    };

    util.getAjaxRequest = function (callback) {
        var ajaxRequest;

        try {
            ajaxRequest = new XMLHttpRequest();
        } catch (e) {
            /*global ActiveXObject*/
            try {
                ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e2) {
                try {
                    ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e3) {
                    return null;
                }
            }
        }

        ajaxRequest.onreadystatechange = function () {
            if (ajaxRequest.readyState === 4) {
                // TODO error response checking
                callback(ajaxRequest.responseText);
            }
        };

        return ajaxRequest;
    };
}());

