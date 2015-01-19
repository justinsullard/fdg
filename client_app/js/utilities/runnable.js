/*jslint */
/*global define */
define(["util"], function (util) {
    "use strict";
    function runnable(obj) {
        obj = obj || {};
        var priv = {
            "inner": {
                "start": obj.start || function () { return; },
                "pause": obj.pause || function () { return; },
                "resume": obj.resume || function () { return; },
                "end": obj.end || function () { return; },
                "state": obj.state || function () { return; },
                "runTime": obj.runTime || function () { return; }
            },
            "active": false,
            "running": false,
            "lastRunTime": null,
            "totalRunTime": 0,
            "start": function (message) {
                var ret = false;
                if (priv.active === false && priv.running === false) {
                    priv.lastRunTime = new Date().getTime();
                    priv.active = true;
                    priv.running = true;
                    ret = true;
                }
                if (ret) {
                    priv.inner.start.call(obj, message);
                } else if (message && message.stopPropagation) {
                    message.stopPropagation();
                }
                return ret;
            },
            "pause": function (message) {
                var ret = false;
                if (priv.active === true && priv.running === true) {
                    priv.totalRunTime += new Date().getTime() - priv.lastRunTime;
                    priv.running = false;
                    ret = true;
                    priv.lastRunTime = null;
                }
                if (ret) {
                    priv.inner.pause.call(obj, message);
                } else if (message && message.stopPropagation) {
                    message.stopPropagation();
                }
                return ret;
            },
            "resume": function (message) {
                var ret = false;
                if (priv.active === true && priv.running === false) {
                    priv.lastRunTime = new Date().getTime();
                    priv.running = true;
                    ret = true;
                }
                if (ret) {
                    priv.inner.resume.call(obj, message);
                } else if (message && message.stopPropagation) {
                    message.stopPropagation();
                }
                return ret;
            },
            "end": function (message) {
                var ret = false;
                if (priv.active === true) {
                    if (priv.running) {
                        priv.totalRunTime += new Date().getTime() - priv.lastRunTime;
                    }
                    priv.active = false;
                    priv.running = false;
                    priv.lastRunTime = null;
                    ret = true;
                }
                if (ret) {
                    priv.inner.end.call(obj, message);
                } else if (message && message.stopPropagation) {
                    message.stopPropagation();
                }
                return ret;
            },
            "state": function (message) {
                var ret = "stopped";
                if (priv.active) {
                    ret = priv.running ? "running" : "paused";
                }
                priv.inner.state.call(obj, message, ret);
                return ret;
            },
            "runTime": function (message) {
                var ret = priv.totalRunTime;
                if (priv.running) {
                    ret += new Date().getTime() - priv.lastRunTime;
                }
                priv.inner.runTime.call(obj, message, ret);
                return ret;
            }
        };
        obj.start = priv.start;
        obj.pause = priv.pause;
        obj.resume = priv.resume;
        obj.end = priv.end;
        obj.state = priv.state;
        obj.runTime = priv.runTime;
    }
    util.extend({
        "dest": util,
        "source": {
            "runnable": {
                "make": function (obj) {
                    runnable(obj);
                }
            }
        }
    });
    return util;
});