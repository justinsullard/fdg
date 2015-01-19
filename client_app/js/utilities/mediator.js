/*jslint regexp:true, browser:true, devel:true */
/*global require, define */
define(["util"], function (util) {
    'use strict';
    var channels = {};
    function error() {
        var args = arguments, params = ["mediator"], i;
        for (i = 0; i < args.length; i += 1) {
            params.push(args[i]);
        }
        util.logging.error.apply(util.logging.error, params);
    }
    function Subscription(options) {
        var self = this;
        self.guid = util.guid.make();
        self.channel = options.channel;
        self.callback = options.callback;
        self.expired = false;
        if (options.context) {
            self.context = options.context;
        } else {
            self.context = false;
        }
        if (options.count) {
            self.count = options.count;
        }
    }
    function Message(options) {
        var self = this, i;
        self.guid = util.guid.make();
        self.propagationStopped = false;
        self.results = [];
        for (i in options) {
            if (options.hasOwnProperty(i)) {
                self[i] = options[i];
            }
        }
    }
    Message.prototype.stopPropagation = function () {
        var self = this;
        self.propagationStopped = true;
    };
    function find(filter) {
        var subs = [], c, s, f, match;
        if (filter) {
            for (c in channels) {
                if (channels.hasOwnProperty(c)) {
                    for (s = 0; s < channels[c].length; s += 1) {
                        match = true;
                        if (filter instanceof Subscription) {
                            if (channels[c][s] !== filter) {
                                match = false;
                            }
                        } else {
                            for (f in filter) {
                                if (filter.hasOwnProperty(f)) {
                                    if (channels[c][s].hasOwnProperty(f)) {
                                        if (channels[c][s][f] !== filter[f]) {
                                            match = false;
                                            break;
                                        }
                                    } else {
                                        match = false;
                                        break;
                                    }
                                }
                            }
                        }
                        if (match) {
                            subs.push(channels[c][s]);
                        }
                    }
                }
            }
        }
        return subs;
    }
    function subscribe(options) {
        var sub = false;
        if (util.string.validate(options.channel) && typeof options.callback === "function") {
            if (find({"channel": options.channel, "callback": options.callback}).length === 0) {
                sub = new Subscription(options);
                if (channels[sub.channel] === undefined) {
                    channels[sub.channel] = [];
                }
                channels[sub.channel].push(sub);
            }
        }
        return sub;
    }
    function unsubscribe(options) {
        var ret = false, subs = find(options), s, i;
        if (subs.length) {
            for (s = 0; s < subs.length; s += 1) {
                subs[s].expired = true;
                i = channels[subs[s].channel].indexOf(subs[s]);
                channels[subs[s].channel].splice(i, 1);
                ret = true;
                if (channels[subs[s].channel].length === 0) {
                    delete channels[subs[s].channel];
                }
            }
        }
        return ret;
    }
    function publish(options) {
        var ret = false, message, subs, result, expired = [], s;
        if (util.string.validate(options.channel) && options.propagationStopped === undefined && options.stopPropagation === undefined && options.results === undefined && options.guid === undefined) {
            subs = find({"channel": options.channel});
            ret = message = new Message(options);
            if (subs.length > 0) {
                for (s = 0; s < subs.length; s += 1) {
                    try {
                        result = subs[s].callback.apply(subs[s].context, [message]);
                    } catch (e) {
                        error("Mediator publish error for channel", options.channel, e.stack);
                        result = e;
                    }
                    message.results.push(result);
                    if (util.number.validate(subs[s].count)) {
                        subs[s].count -= 1;
                        if (subs[s].count === 0) {
                            expired.push(subs[s]);
                        }
                    }
                    if (message.propagationStopped) {
                        break;
                    }
                }
                for (s = 0; s < expired.length; s += 1) {
                    unsubscribe(expired[s]);
                }
            }
        }
        return ret;
    }
    util.extend({
        "dest": util,
        "source": {
            "mediator": {
                "subscribe": subscribe,
                "unsubscribe": unsubscribe,
                "publish": publish
            }
        }
    });
    return util;
});
