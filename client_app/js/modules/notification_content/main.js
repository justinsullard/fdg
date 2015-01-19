/*jslint browser: true */
/*global define, require, exports, module */
/**
 * Notification controller. Manages requests to change content in the notification_content area
 * 
 * @module Notification
 * @requires core
 * 
 */
define(["core", "modules/notification_content/config.notification_content"], function (core, config) {
    "use strict";

    core = core();

    var priv = {
        "pages": [],
        "delayTime": 2000
    };

    function onNotificationContentShowRequest(message) {
        var page = {
            "hidden": false,
            "$el": null
        };
        function updatePage(pg) {
            setTimeout(function () {
                pg.$el.removeClass('showing');
            }, 1);
            setTimeout(function () {
                pg.hidden = true;
                pg.hideTime = new Date().getTime();
                pg.$el.addClass('hidden');
            }, priv.delayTime);
        }
        if (core.$(".notification_content")) {
            page.$el = core.$("<div class='notification showing'></div>");
            core.util.logging.debug("NOTIFICATION:", message.message);
            page.$el.text(message.message);
            if (message.type) {
                page.$el.addClass(message.type);
            }
            core.$(".notification_content").prepend(page.$el);
            priv.pages.push(page);
            updatePage(page);
        }
    }

    function clearHiddenComponents() {
        var i, now = new Date().getTime(), then;
        for (i = 0; i < priv.pages.length; i += 1) {
            then = priv.pages[i].hideTime + core.util.number.getAs(core.config("timing.hide"), 1000);
            if (priv.pages[i].hidden && then <= now) {
                priv.pages[i].$el.remove();
                priv.pages.splice(i, 1);
                i -= 1;
            }
        }
    }

    function testNotifications() {
        var i, types = ["empty", "error", "success", "debug", "alert"];
        function getTestFunc(x) {
            return function () {
                core.publish({
                    "channel": "notification-content-show-request",
                    "message": "Test Notification Message: " + x,
                    "type": types[x] || ""
                });
            };
        }
        for (i = 1; i <= 10; i += 1) {
            setTimeout(getTestFunc(i), i * core.util.number.getAs(core.config("timing.hide"), 1000));
        }
    }

    function onCoreStartSuccess() {
        if (!core.registerConfig("notification_content_config", config)) {
            core.util.logging.warn("Failed to load notification_content configuration");
        }
        priv.delayTime = core.util.number.getAsInteger(
            core.config("notification_content_config.displayTime"),
            priv.delayTime
        );
        setInterval(clearHiddenComponents, 500);
        core.util.logging.debug("module/notification_content started");
        if (core.config("notification_content_config.runTest") === true) {
            testNotifications();
        }
        return;
    }

    core.subscribe({"channel": "core-start-success", "callback": onCoreStartSuccess});
    core.subscribe({"channel": "notification-content-show-request", "callback": onNotificationContentShowRequest});

});
