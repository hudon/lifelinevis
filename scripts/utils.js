/*jslint nomen: true, browser: true*/
/*global define*/
define([
    'vendorUnderscore'
], function (_) {
    String.prototype.hashCode = function () {
        var char, i, hash = 0;
        if (this.length === 0) {
            return hash;
        }
        for (i = 0; i < this.length; i += 1) {
            char = this.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return hash;
    };
    _.mixin({
        // makeClass - By John Resig (MIT Licensed)
        makeClass: function () {
            return function (args) {
                if (this instanceof arguments.callee) {
                    if (typeof this.init === "function") {
                        this.init.apply(this,
                            (typeof args !== 'undefined') && args.callee ? args : arguments);
                    }
                } else {
                    return new arguments.callee(arguments);
                }
            };
        },
        // Passes "this" as an argument
        passThis: function (targetFunction) {
            return function () {
                var args = Array.prototype.slice.call(arguments);
                args.push(this);
                return targetFunction.apply(this, args);
            };
        },
        generator: function (elements) {
            var defaultElem = elements[0];

            return {
                getWith: function (num) {
                    if (typeof num === 'string') {
                        num = num.hashCode();
                    }
                    var i = parseInt(num, 10) % elements.length;
                    if (elements.length === 0) {
                        return defaultElem;
                    }
                    return elements[i];
                },
                popRand: function () {
                    if (elements.length === 0) {
                        return defaultElem;
                    }
                    elements = _.shuffle(elements);
                    return elements.pop();
                }
            };
        },
        ajaxget: function (url, callback, async) {
            var r = _.getAjaxRequest(callback);
            r.open("GET", url, async);
            r.send(null);
        },
        getAjaxRequest: function (callback) {
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
        }
    });

    return _;
});
