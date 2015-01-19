/*jslint browser: true */
/*global define, require, exports, module */
/**
 * An API Services handler
 * A Universal Module Definition.
 * 
 * @module API
 * @requires Core
 * 
 */
define(["core", "modules/api/config.api"], function (core, config) {
    "use strict";
    var priv = {
        "authToken": null,
        "expires": {
            "code": 403,
            "pattern": /Invalid token/
        }
    };
    core = core();

    function isAuth() {
        return priv.authToken && priv.authToken.expires >= new Date();
    }

    function Request(routeConfig, options, promise) {
        var i;
        this.routeConfig = routeConfig;
        this.options = options;
        this.promise = promise;
        this.params = {};
        if (this.routeConfig.params) {
            for (i in this.routeConfig.params) {
                if (this.routeConfig.params.hasOwnProperty(i)) {
                    if (this.options.hasOwnProperty(i)) {
                        this.params[i] = this.options[i];
                    } else {
                        this.params[i] = this.routeConfig.params[i];
                    }
                }
            }
        }
    }
    Request.prototype.uri = function () {
        var self = this, ret = core.config("api_config.prefix");
        //"uri": "auth",
        ret += this.routeConfig.uri.replace(/\{\w+\}/g, function (c) {
            var p = "";
            c = c.replace(/\W+/g, '');
            if (self.options.hasOwnProperty(c)) {
                p = self.options[c];
            }
            return p;
        });
        ret = ret.replace(/\/\/+/g, "/");
        return ret;
    };
    Request.prototype.execute = function () {
        var self = this, ajax;
        ajax = {
            "url": this.uri(),
            "type": this.routeConfig.method,
            "contentType": "application/json",
            "dataType": "json",
            "data": this.params,
            "success": function (data) {
                self.success(data);
            },
            "error": function (xhr) {
                try {
                    self.error(JSON.parse(xhr.responseText), xhr.status);
                } catch (e) {
                    core.util.logging.error("Error parsing JSON responseText from failed api request.");
                    self.error(xhr.responseText, xhr.status);
                }
            }
        };
        if (isAuth()) {
            ajax.headers = {};
            ajax.headers[priv.authToken.header_name] = priv.authToken.header_token;
        }
        if (this.routeConfig.contentType) {
            ajax.contentType = this.routeConfig.contentType;
        }
        core.$.ajax(ajax);
    };
    Request.prototype.success = function (data) {
        if (!this.promise.returned) {
            this.promise.returned = true;
            this.promise.success = true;
            if (this.options.success) {
                this.options.success(data);
            }
        }
    };
    Request.prototype.authExpireCheck = function (data, status) {
        var msg;
        if (status === priv.expires.statusCode) {
            if (core.util.string.validate(data)) {
                msg = data;
            } else {
                msg = core.util.string.getAs(data.message, "");
            }
            if (msg.match(priv.expires.pattern)) {
                core.publish({
                    "channel": "session-expired",
                    "message": msg
                });
            }
        }
    };
    Request.prototype.error = function (data, status) {
        if (!this.promise.returned) {
            this.promise.returned = true;
            this.promise.success = false;
            this.authExpireCheck(data, status);
            if (this.options.error) {
                this.options.error(data, status);
            }
        }
    };

    function Promise(routeConfig, options) {
        var my = {
            "returned": false,
            "success": false,
            "request": null,
            "results": null
        };
        my.request = new Request(routeConfig, options, my);
        this.returned = function () {
            return my.returned;
        };
        this.success = function () {
            return my.success;
        };
        this.results = function () {
            return my.results;
        };
        if (core.config("api_config.artificialDelay")) {
            setTimeout(function () {
                my.request.execute();
            }, core.config("api_config.artificialDelay"));
        } else {
            my.request.execute();
        }
    }

    function onSessionStart(message) {
        priv.authToken = core.$.extend(true, {}, message.authToken);
        priv.authToken.expires = new Date(priv.authToken.expires);
    }

    function onSessionEnd() {
        priv.authToken = null;
    }

    function onCoreStartSuccess() {
        if (!core.registerConfig("api_config", config)) {
            core.util.logging.warn("Failed to load api routes configuration");
        }
        priv.expires.statusCode = core.config("api_config.auth.expiresStatusCode") || priv.expires.statusCode;
        priv.expires.pattern = core.config("api_config.auth.expiresPattern") || priv.expires.pattern;
        core.util.logging.debug("module/api started");
        return;
    }
    function onAPIRequest(message) {
        var ret, routeConfig = core.config("api_config.routes." + message.route);
        if (core.util.object.validate(routeConfig)) {
            if (routeConfig.requiresAuth === false || isAuth()) {
                ret = new Promise(routeConfig, message);
            } else {
                core.util.logging.warn("Request requires authToken, cannot create promise");
            }
        } else {
            core.util.logging.warn("Invalid api request", "api_config.routes." + message.route);
        }
        return ret;
    }

    core.subscribe({"channel": "core-start-success", "callback": onCoreStartSuccess});
    core.subscribe({"channel": "api-request", "callback": onAPIRequest});
    core.subscribe({"channel": "session-start", "callback": onSessionStart});
    core.subscribe({"channel": "session-end", "callback": onSessionEnd});
});
