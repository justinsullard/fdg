/*jslint regexp:true, unparam: true, browser: true */
/*global define */
define([
    "jquery",
    "util",
    "utils/mediator",
    "config/main",
    "utils/runnable",
    "knockout",
    "utils/extras",
    "utils/postgres",
    "utils/stringify",
    "utils/services"
], function (
    $,
    util,
    mediator,
    config,
    runnable,
    ko,
    extras
) {
    "use strict";
    var priv, FDG, facade;
    priv = {
        "ready": false,
        "loading": true,
        "loadingTime": new Date().getTime(),
        "subscriptions": [],
        "start": function () {
            if (!priv.ready) {
                priv.ready = true;
                document.title = FDG.config("app.name");
                util.logging.debug("FDG started");
                util.mediator.publish({
                    "channel": "fdg-start-success",
                    "timestamp": util.time.make()
                });
            }
            return true;
        },
        "pause": function () {
            util.mediator.publish({
                "channel": "fdg-pause-success",
                "timestamp": util.time.make()
            });
            return true;
        },
        "resume": function () {
            util.mediator.publish({
                "channel": "fdg-resume-success",
                "timestamp": util.time.make()
            });
            return true;
        },
        "end": function () {
            util.mediator.publish({
                "channel": "fdg-end-success",
                "timestamp": util.time.make()
            });
            return true;
        },
        "getConfig": function (entry) {
            var returner, entryPoint = util.object.entry(priv.config, entry);
            if (entryPoint) {
                if (typeof entryPoint === "object") {
                    if (util.array.validate(entryPoint)) {
                        returner = [];
                    } else {
                        returner = {};
                    }
                    $.extend(true, returner, entryPoint);
                } else {
                    returner = entryPoint;
                }
            }
            return returner;
        },
        "registerConfig": function (namespace, cfg) {
            var ret = false, src = {};
            if (!priv.config.hasOwnProperty(namespace)) {
                src[namespace] = cfg;
                $.extend(true, priv.config, src);
                ret = true;
            }
            return ret;
        },
        "config": {}
    };

    function onFDGTitleRequest(message) {
        if (util.string.validate(message.title)) {
            if (message.title) {
                document.title = FDG.config("app.name") + " - " + message.title;
            } else {
                document.title = FDG.config("app.name");
            }
        }
    }

    util.runnable.make(priv);
    FDG = {
        "util": util,
        "config": priv.getConfig,
        "registerConfig": priv.registerConfig,
        "state": priv.state,
        "runTime": priv.runTime,
        "ko": ko,
        "$": $,
        "extras": extras
    };

    priv.subscriptions.push(util.mediator.subscribe({"channel": "fdg-start-request", "callback": priv.start, "context": FDG}));
    priv.subscriptions.push(util.mediator.subscribe({"channel": "fdg-pause-request", "callback": priv.pause, "context": FDG}));
    priv.subscriptions.push(util.mediator.subscribe({"channel": "fdg-resume-request", "callback": priv.resume, "context": FDG}));
    priv.subscriptions.push(util.mediator.subscribe({"channel": "fdg-end-request", "callback": priv.end, "context": FDG}));
    priv.subscriptions.push(util.mediator.subscribe({"channel": "fdg-title-request", "callback": onFDGTitleRequest, "context": FDG}));

    $.extend(true, priv.config, config);
    $.extend(util, {"config": priv.getConfig});
    $.extend(FDG, util.mediator);
    $.noConflict();

    FDG.ko.bindingHandlers.rangeValue = {
        "init": function (element, valueAccessor) {
            var el = $(element), attr = valueAccessor();//, func;
            // func = FDG.ko.isWriteableObservable(attr) ? attr : function (val) { attr = val; };
            function change() {
                FDG.util.logging.debug("rangeValue changed", +el.val(), FDG.ko.unwrap(attr));
                attr(+el.val());
            }
            el.on('change update', change);
            FDG.ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                el.off('change update', change);
            });
        },
        "update": function (element, valueAccessor) {
            var el = $(element), attr = valueAccessor();
            el.val(FDG.ko.unwrap(attr));
        }
    };

    FDG.ko.extenders.number = function (target, precision) {
        var result = FDG.ko.pureComputed({
            "read": target,
            "write": function (newValue) {
                var current = target(),
                    newValueAsNum = isNaN(newValue) ? 0 : parseFloat(+newValue);
                if (newValueAsNum !== current) {
                    target(newValueAsNum);
                } else {
                    if (newValue !== current) {
                        target.notifySubscribers(newValueAsNum);
                    }
                }
            }
        }).extend({"notify": 'always'});
        result(target());
        return result;
    };
    facade = function () {
        var ret = {};
        if (!priv.ready) {
            $.extend(ret, FDG);
            // $.extend(true, ret, FDG);
        }
        return ret;
    };

    window.FDG = facade();
    return facade;
});