(function () {
    'use strict';

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

    var lifeline = [];

    window.addEventListener('load', windowLoadHandler, false);

    function windowLoadHandler() {
        loadLifeline();
        redrawLifelineUI();
    }

    function loadLifeline() {
        util.ajaxget('/lifeline.json', function (response) {
            lifeline = JSON.parse(response);
        }, false);
    }

    function redrawLifelineUI() {
        var node, container, i,
                div = document.getElementById('lifeline');
        div.setAttribute('data-records', lifeline);

        /*for (i = 0; i < lifeline.length; i++) {
            node = lifeline[i];

            // create node UI
            container = document.createElement('p');
            container.appendChild(document.createTextNode(JSON.stringify(node)));

            div.appendChild(container);

        }*/
    }

    /* Utilities */

    var util = util ? util : new Object();

    util.ajaxget = function (url, callback, async) {
        var r = util.getAjaxRequest(callback);
        r.open("GET", url, async);
        r.send(null);
    }

    util.getAjaxRequest = function (callback) {
        var ajaxRequest;

        try {
            ajaxRequest = new XMLHttpRequest();
        } catch (e) {
            try {
                ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
            } catch (e) {
                try {
                    ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
                } catch (e){
                    return null;
                }
            }
        }

        ajaxRequest.onreadystatechange = function() {
            if (ajaxRequest.readyState == 4) {
                // Prob want to do some error or response checking, but for 
                // this example just pass the responseText to our callback function
                callback(ajaxRequest.responseText);
            }
        };

        return ajaxRequest;
    }

}());

