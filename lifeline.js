(function () {
    'use strict';
    /*jslint browser: true*/

    function Node(pid, tid, pidSource, tidSource, time) {
        if (!(this instanceof Node)) {
            return new Node();
        }
        this.srcProcessId = pidSource;
        this.srcThreadId = tidSource;
        this.dstProcessId = pid;
        this.dstThreadId = tid;
        this.time = time;
    }

    //var node = {}, lifeline = [new Node(0, 1, 1, 1, 10), new Node(2, 0, 1, 1, 12)];
    var lifeline = [], util = {};

    function loadLifeline() {
        util.ajaxget('/lifeline.json', function (response) {
            lifeline = JSON.parse(response);
        }, false);
    }

    function redrawLifelineUI() {
        var node, container, i,
            div = document.getElementById('lifeline');

        for (i = 0; i < lifeline.length; i += 1) {
            node = lifeline[i];

            // create node UI
            container = document.createElement('p');
            container.appendChild(document.createTextNode(JSON.stringify(node)));

            div.appendChild(container);

        }
    }

    function windowLoadHandler() {
        loadLifeline();
        redrawLifelineUI();
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

