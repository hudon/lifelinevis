/*jslint nomen: true,browser:true*/
/*global _*/
(function () {
    _.mixin({
        // makeClass - By John Resig (MIT Licensed)
        makeClass: function () {
            return function (args) {
                if (this instanceof arguments.callee) {
                    if (typeof this.init == "function") {
                        this.init.apply(this,
                            (typeof args != 'undefined') && args.callee ? args : arguments);
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
}());
