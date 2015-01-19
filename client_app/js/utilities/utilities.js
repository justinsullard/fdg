/*jslint regexp:true, browser:true, bitwise:true */
/*global require, define*/
define(function () {
    "use strict";
    var util;
    function extend(dest, source) {
        var config, property, skipProps = false;
        // If no source provided than check if extend is an object and matches the dest, source pattern
        if (source === undefined && util.object.validate(dest) && dest.dest !== undefined && dest.source !== undefined) {
            config = dest;
        } else if (dest !== undefined && source !== undefined) {
            util.logging.debug("util.extend called as two argument method, not with config");
            config = {"dest": dest, "source": source, "functions": true};
        }
        if (config) {
            if (config && config.dest && config.source) {
                config.functions = config.functions !== undefined ? config.functions : true;
                // Handles arrays specially
                if (Object.prototype.toString.call(config.source) === "[object Array]") {
                    if (Object.prototype.toString.call(config.dest) !== "[object Array]") {
                        config.dest = [];
                    }
                    // Iterate through array contents and extend values
                    for (property = 0; property < config.source.length; property += 1) {
                        config.dest[property] = {};
                        extend({
                            "dest": config.dest[property],
                            "source": config.source[property]
                        });
                    }
                // Handle non object/array variables by directly casting to dest
                } else if (Object.prototype.toString.call(config.source) !== "[object Object]" &&
                        (!(config.source[property] instanceof Function) || config.functions)) {
                    config.dest = config.source;
                    skipProps = true;
                }
                // Handle instance properties
                if (!skipProps) {
                    for (property in config.source) {
                        if (config.source.hasOwnProperty(property)) {
                            // Handle object properties
                            if (Object.prototype.toString.call(config.source[property]) === "[object Object]") {
                                if (Object.prototype.toString.call(config.dest[property]) !== "[object Object]") {
                                    config.dest[property] = {};
                                }
                                extend({
                                    "dest": config.dest[property],
                                    "source": config.source[property],
                                    "functions": config.functions
                                });
                            // Handle instance properties
                            } else if (Object.prototype.toString.call(config.source[property]) === "[object Array]") {
                                if (Object.prototype.toString.call(config.dest[property]) !== "[object Array]") {
                                    config.dest[property] = [];
                                }
                                extend({
                                    "dest": config.dest[property],
                                    "source": config.source[property],
                                    "functions": config.functions
                                });
                            // Handle non object/array properties by directly casting to dest property
                            } else if (!(config.source[property] instanceof Function) || config.functions) {
                                try {
                                    config.dest[property] = config.source[property];
                                } catch (e) {
                                    // Not sure what to do here
                                    if (util.logging && util.logging.error) {
                                        util.logging.error("Error extending object", e.message, e.stack);
                                        util.logging.debug(property, config.source, typeof config.source, config.dest, typeof config.dest);
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
    util = {
        "extend": extend,
        "logging": {
            "instance": (function () {
                var ret, funcs, f;
                funcs = {
                    "log": function () { return; },
                    "error": function () { return; },
                    "debug": function () { return; },
                    "info": function () { return; },
                    "warn": function () { return; },
                    "trace": function () { return; }
                };
                if (window.console) {
                    ret = window.console;
                } else {
                    ret = {};
                }
                for (f in funcs) {
                    if (funcs.hasOwnProperty(f)) {
                        if (ret[f] === undefined) {
                            ret[f] = funcs[f];
                        }
                    }
                }
                return ret;
            }()),
            "log": function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(new Date().toISOString());
                util.logging.instance.log.apply(util.logging.instance, args);
            },
            "error": function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(new Date().toISOString());
                util.logging.instance.error.apply(util.logging.instance, args);
            },
            "debug": function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(new Date().toISOString());
                util.logging.instance.debug.apply(util.logging.instance, args);
            },
            "info": function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(new Date().toISOString());
                util.logging.instance.info.apply(util.logging.instance, args);
            },
            "warn": function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(new Date().toISOString());
                util.logging.instance.warn.apply(util.logging.instance, args);
            },
            "fatal": function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(new Date().toISOString());
                util.logging.instance.error.apply(util.logging.instance, args);
            },
            "trace": function () {
                var args = Array.prototype.slice.call(arguments);
                args.unshift(new Date().toISOString());
                util.logging.instance.trace.apply(util.logging.instance, args);
            }
        },

        "array": {
            "make": function () {
                return [];
            },
            "validate": function (val) {
                return Object.prototype.toString.call(val) === "[object Array]";
            },
            "validateArray": function (val) {
                var i, ret = true;
                if (util.array.validate(val) && val.length > 0) {
                    for (i = 0; i < val.length; i += 1) {
                        if (!util.array.validate(val[i])) {
                            ret = false;
                        }
                    }
                } else {
                    ret = false;
                }
                return ret;
            },
            "validateMixed": function (val) {
                var ret = false;
                ret = util.array.validateArray(val) || util.array.validate(val);
                return ret;
            }
        },

        "object": {
            "make": function () {
                return {};
            },
            "validate": function (val) {
                return Object.prototype.toString.call(val) === "[object Object]";
            },
            "validateArray": function (val) {
                var i, ret = true;
                if (util.array.validate(val) && val.length > 0) {
                    for (i = 0; i < val.length; i += 1) {
                        if (!util.object.validate(val[i])) {
                            ret = false;
                        }
                    }
                } else {
                    ret = false;
                }
                return ret;
            },
            "validateMixed": function (val) {
                var ret = false;
                if (util.array.validate(val)) {
                    ret = util.object.validateArray(val);
                } else {
                    ret = util.object.validate(val);
                }
                return ret;
            },
            "entry": function (obj, entry) {
                var ret = true, i, entryList, entryPoint = obj;
                if (entryPoint) {
                    entryList = entry.split(/\./);
                    for (i = 0; i < entryList.length; i += 1) {
                        if (entryPoint[entryList[i]] !== undefined) {
                            entryPoint = entryPoint[entryList[i]];
                        } else {
                            ret = undefined;
                            break;
                        }
                    }
                    if (ret) {
                        ret = entryPoint;
                    }
                } else {
                    ret = undefined;
                }
                return ret;
            }
        },

        "string": {
            "make": function (val) {
                return util.string.getAs(val);
            },
            "validate": function (val) {
                return typeof val === "string" || String(val) === val;
            },
            "validateArray": function (val) {
                var i, ret = true;
                if (util.array.validate(val) && val.length > 0) {
                    for (i = 0; i < val.length; i += 1) {
                        if (!util.string.validate(val[i])) {
                            ret = false;
                        }
                    }
                } else {
                    ret = false;
                }
                return ret;
            },
            "validateMixed": function (val) {
                var ret = false;
                if (util.array.validate(val)) {
                    ret = util.string.validateArray(val);
                } else {
                    ret = util.string.validate(val);
                }
                return ret;
            },
            "getAs": function (val, def) {
                var ret = util.string.validate(def) ? def : "";
                if (util.string.validate(val)) {
                    ret = val;
                }
                return ret;
            },
            "getAsArray": function (config, def) {
                var ret = [], i;
                def = def !== undefined && util.array.validate(def) ? def : [];
                if (util.array.validate(config) && config.length > 0) {
                    for (i = 0; i < config.length; i += 1) {
                        ret.push(util.string.getAs(config[i]));
                    }
                } else {
                    ret = def;
                }
                return ret;
            },
            "toTitleCase": function (str) {
                var ret = str, words;
                if (util.string.validate(str)) {
                    if (ret.match(/^\w+$/)) {
                        words = [];
                        while (ret.length) {
                            // ret.match(/[A-Z][a-z0-9]*$/) || ret.match(/[A-Z]+$/)
                            if (ret.match(/[A-Z][a-z0-9]+$/)) {
                                words.unshift(ret.match(/[A-Z][a-z0-9]+$/)[0]);
                                ret = ret.replace(/_*[A-Z][a-z0-9]+$/, '');
                            } else if (ret.match(/[A-Z]+$/)) {
                                words.unshift(ret.match(/[A-Z]+$/)[0]);
                                ret = ret.replace(/_*[A-Z]+$/, '');
                            } else {
                                ret = ret.replace(/_+/g, ' ');
                                words = ret.split(/ /).concat(words);
                                ret = "";
                            }
                        }
                        words = words.join(" ");
                        ret = words.replace(/\w\S*/g, function (txt) {
                            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                        });
                    } else {
                        ret = str.replace(/\w\S*/g, function (txt) {
                            return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
                            // return txt.charAt(0).toUpperCase() + txt.substr(1);
                        });
                    }
                }
                return ret;
            },
            "toLowerCamelCase": function (str) {
                var ret = str;
                if (util.string.validate(str)) {
                    ret = util.string.toTitleCase(ret).replace(/ /g, '');
                    ret = ret.charAt(0).toLowerCase() + ret.substr(1);
                }
                return ret;
            },
            "toUpperCamelCase": function (str) {
                var ret = str;
                if (util.string.validate(str)) {
                    ret = util.string.toTitleCase(ret).replace(/ /g, '');
                }
                return ret;
            },
            "toLowerUnderscoreCase": function (str) {
                var ret = str;
                if (util.string.validate(str)) {
                    ret = ret.replace(/ +/g, "_").toLowerCase();
                }
                return ret;
            },
            "toUpperUnderscoreCase": function (str) {
                var ret = str;
                if (util.string.validate(str)) {
                    ret = ret.replace(/ +/g, "_").toUpperCase();
                }
                return ret;
            }
        },


        "boolean": {
            "make": function (val) {
                return util.boolean.getAs(val);
            },
            "validate": function (val) {
                var ret = false;
                ret = typeof val === "boolean" ||
                    Boolean(val) === val ||
                    (util.string.validate(val) && val.match(/^true$/i)) ||
                    (util.string.validate(val) && val.match(/^false$/i));
                return ret;
            },
            "validateArray": function (val) {
                var i, ret = true;
                if (util.array.validate(val) && val.length > 0) {
                    for (i = 0; i < val.length; i += 1) {
                        if (!util.boolean.validate(val[i])) {
                            ret = false;
                        }
                    }
                } else {
                    ret = false;
                }
                return ret;
            },
            "validateMixed": function (val) {
                var ret = false;
                if (util.array.validate(val)) {
                    ret = util.boolean.validateArray(val);
                } else {
                    ret = util.boolean.validate(val);
                }
                return ret;
            },
            "getAs": function (val, def) {
                var ret = util.boolean.validate(def) ? util.boolean.getAs(def) : false;
                if (util.boolean.validate(val)) {
                    ret = val;
                } else if (util.string.validate(val) && val.match(/^true$/i)) {
                    ret = true;
                } else if (util.string.validate(val) && val.match(/^false$/i)) {
                    ret = false;
                }
                return ret;
            },
            "getAsArray": function (config, def) {
                var ret = [], i;
                def = def !== undefined && util.array.validate(def) ? def : [];
                if (util.array.validate(config) && config.length > 0) {
                    for (i = 0; i < config.length; i += 1) {
                        ret.push(util.boolean.getAs(config[i]));
                    }
                } else {
                    ret = def;
                }
                return ret;
            }
        },


        "number": {
            "make": function (val) {
                return util.number.getAs(val);
            },
            "validate": function (val) {
                return typeof val === "number" || (typeof val === "string" && val.match(/^\-?\d+(\.\d*)?$/));
            },
            "validateInteger": function (val) {
                return typeof val === "number" || (typeof val === "string" && val.match(/^\-?\d+$/));
            },
            "validateArray": function (val) {
                var i, ret = true;
                if (util.array.validate(val) && val.length > 0) {
                    for (i = 0; i < val.length; i += 1) {
                        if (!util.number.validate(val[i])) {
                            ret = false;
                        }
                    }
                } else {
                    ret = false;
                }
                return ret;
            },
            "validateMixed": function (val) {
                var ret = false;
                if (util.array.validate(val)) {
                    ret = util.number.validateArray(val);
                } else {
                    ret = util.number.validate(val);
                }
                return ret;
            },
            "pad": function (val, num) {
                var ret = String(util.number.getAs(val));
                while (ret.length < num) {
                    ret = "0" + ret;
                }
                return ret;
            },
            "getAs": function (val, def) {
                var ret = util.number.validate(def) ? util.number.getAs(def) : 0;
                if (util.number.validate(val)) {
                    ret = Number(val);
                }
                return ret;
            },
            "getAsInteger": function (val, def) {
                var ret = util.number.validateInteger(def) ? util.number.getAsInteger(def) : 0;
                if (util.number.validateInteger(val)) {
                    ret = Number(val);
                }
                return ret;
            },
            "getAsArray": function (config, def) {
                var ret = [], i;
                def = def !== undefined && util.array.validate(def) ? def : [];
                if (util.array.validate(config) && config.length > 0) {
                    for (i = 0; i < config.length; i += 1) {
                        ret.push(util.number.getAs(config[i], false));
                    }
                } else {
                    ret = def;
                }
                return ret;
            },
            "formatWithCommas": function (val) {
                var ret = util.number.getAs(val);
                ret = ret.toString().split('.');
                ret[0] = ret[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
                return ret.join('.');
            },
            "rotate": function (val, min, max) {
                var ret = util.number.getAs(val), low, high, abs;
                min = util.number.getAs(min);
                max = util.number.getAs(max);
                low = Math.min(min, max);
                high = Math.max(min, max);
                abs = high - low;
                if (low < high && abs) {
                    while (ret > high) {
                        ret -= abs;
                    }
                    while (ret < low) {
                        ret += abs;
                    }
                }
                return ret;
            }
        },

        "guid": {
            "make": function () {
                return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
                    var r = (Math.random() * 16) | 0,
                        v = c === "x" ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                });
            },
            "getAs": function (val, def) {
                var ret = util.guid.validate(def) ? def : util.guid.make();
                if (util.guid.validate(val)) {
                    ret = val;
                }
                return ret;
            },
            "getAsArray": function (config, def) {
                var ret = [], i;
                def = def !== undefined && util.array.validate(def) ? def : [];
                if (util.array.validate(config) && config.length > 0) {
                    for (i = 0; i < config.length; i += 1) {
                        ret.push(util.guid.getAs(config[i]));
                    }
                } else {
                    ret = def;
                }
                return ret;
            },
            "validate": function (guid) {
                var ret = false;
                if (util.string.validate(guid)) {
                    if (guid.match(/^[a-f\d]{8}(-[a-f\d]{4}){3}-[a-f\d]{12}$/i)) {
                        ret = true;
                    }
                }
                return ret;
            },
            "validateArray": function (val) {
                var i, ret = true;
                if (util.array.validate(val) && val.length > 0) {
                    for (i = 0; i < val.length; i += 1) {
                        if (!util.guid.validate(val[i])) {
                            ret = false;
                        }
                    }
                } else {
                    ret = false;
                }
                return ret;
            },
            "validateMixed": function (val) {
                var ret = false;
                if (util.array.validate(val)) {
                    ret = util.guid.validateArray(val);
                } else {
                    ret = util.guid.validate(val);
                }
                return ret;
            }
        },


        "time": {
            "make": function (timestamp) {
                var ret;
                if (timestamp) {
                    ret = new Date(timestamp).getTime();
                } else {
                    ret = new Date().getTime();
                }
                return ret;
            },
            "validate": function (val) {
                var ret = false;
                if (util.number.validate(val)) {
                    if (val >= 0 && Math.round(val) === val) {
                        ret = true;
                    }
                }
                return ret;
            },
            "validateArray": function (val) {
                var i, ret = true;
                if (util.array.validate(val) && val.length > 0) {
                    for (i = 0; i < val.length; i += 1) {
                        if (!util.time.validate(val[i])) {
                            ret = false;
                        }
                    }
                } else {
                    ret = false;
                }
                return ret;
            },
            "validateMixed": function (val) {
                var ret = false;
                if (util.array.validate(val)) {
                    ret = util.time.validateArray(val);
                } else {
                    ret = util.time.validate(val);
                }
                return ret;
            },
            "offsetMilliseconds": function () {
                return new Date().getTimezoneOffset() * util.time.convert.m;
            },
            "today": function () {
                return util.time.dayStart();
            },
            "yesterday": function () {
                return util.time.today() - util.time.convert.d;
            },
            "tomorrow": function () {
                return util.time.today() + util.time.convert.d;
            },
            "dayStart": function (d) {
                var ret = d === undefined ? util.time.make() : d;
                ret -= util.time.offsetMilliseconds();
                ret -= ret % util.time.convert.d;
                ret += util.time.offsetMilliseconds();
                return ret;
            },
            "weekStart": function (d, monStart) {
                var ret, ofWeek = monStart ? -1 : 0;
                ret = d === undefined ? util.time.make() : d;
                ret -= util.time.offsetMilliseconds();
                ret -= ret % util.time.convert.d;
                ret += util.time.offsetMilliseconds();
                ofWeek = (ofWeek + new Date(ret).getDay() + 7) % 7;
                ret -= ofWeek * util.time.convert.d;
                return ret;
            },
            "thisWeekStart": function (monStart) {
                return util.time.weekStart(util.time.make(), monStart);
            },
            "nextWeekStart": function (monStart) {
                return util.time.weekStart(util.time.make(), monStart) + util.time.convert.w;
            },
            "convert": {
                "ms": 1,
                "s": 1000,
                "m": 60000,
                "h": 3600000,
                "d": 86400000,
                "wd": 28800000,
                "w": 604800000,
                "ww": 144000000
            },
            "timeStringToMilliseconds": function (s) {
                var ret = 0, tokens, i, num, type;
                tokens = String(s).match(/(\d+(?:\.\d+)?(?:ms|m|h|s|d|wd|ww|w))/gi);
                if (tokens) {
                    for (i = 0; i < tokens.length; i += 1) {
                        num = Number(tokens[i].replace(/[^0-9\.]+/, ''));
                        type = tokens[i].replace(/[0-9\.]+/, '').toLowerCase();
                        ret += Math.round(num * util.time.convert[type]);
                    }
                }
                return ret;
            },
            "timeStringToHours": function (s, places) {
                var ret = 0;
                places = util.number.getAs(places, 2);
                ret = util.time.timeStringToMilliseconds(s) / util.time.convert.h;
                ret = ret.toFixed(places) + "h";
                return ret;
            },
            "millisecondsToTimeString": function (ms, workTime) {
                var tokens = [], rem = ms, sequence, i;
                if (workTime) {
                    sequence = ["ww", "wd", "h", "m", "s", "ms"];
                } else {
                    sequence = ["w", "d", "h", "m", "s", "ms"];
                }
                for (i = 0; i < sequence.length; i += 1) {
                    if (rem >= util.time.convert[sequence[i]]) {
                        tokens.push(Math.floor(rem / util.time.convert[sequence[i]]) + sequence[i]);
                        rem = rem % util.time.convert[sequence[i]];
                    }
                }
                return tokens.join(" ");
            },
            "simplifyTimeString": function (s, workTime) {
                return util.time.millisecondsToTimeString(util.time.timeStringToMilliseconds(s), workTime);
            },
            "multiplyTimeString": function (s, m, workTime) {
                return m || m === 0 ? util.time.millisecondsToTimeString(util.time.timeStringToMilliseconds(s) * Number(m), workTime) : s;
            },
            "timeStringToObject": function (s, workTime) {
                var ret = {}, ms = util.time.timeStringToMilliseconds(s), rem = ms, sequence, i;
                if (workTime) {
                    sequence = ["ww", "wd", "h", "m", "s", "ms"];
                } else {
                    sequence = ["w", "d", "h", "m", "s", "ms"];
                }
                for (i = 0; i < sequence.length; i += 1) {
                    ret[sequence[i]] = 0;
                    if (rem >= util.time.convert[sequence[i]]) {
                        ret[sequence[i]] = Math.floor(rem / util.time.convert[sequence[i]]);
                        rem = rem % util.time.convert[sequence[i]];
                    }
                }
                return ret;
            },
            "formatTimestamp": function (timestamp, noSeconds) {
                var ret = "", date = new Date(timestamp);
                ret += date.getFullYear();
                ret += "-" + util.number.pad(date.getMonth() + 1, 2);
                ret += "-" + util.number.pad(date.getDate(), 2);
                ret += " " + util.number.pad(date.getHours() % 12, 2).replace(/00/, '12');
                ret += ":" + util.number.pad(date.getMinutes(), 2);
                if (!noSeconds) {
                    ret += ":" + util.number.pad(date.getSeconds(), 2);
                    ret += "." + util.number.pad(date.getMilliseconds(), 3);
                }
                ret += date.getHours() < 12 ? " am" : " pm";
                return ret;
            },
            "addDays": function (day, days) {
                return new Date(new Date(day).getTime() + (days * 24 * 60 * 60 * 1000));
            },
            "diffDays": function (dayA, dayB) {
                return Math.round(Math.abs((new Date(dayA).getTime() - new Date(dayB).getTime()) / (24 * 60 * 60 * 1000)));
            }
        },

        "emitter": {
            "make": function makeEventEmitterF(objtype) {
                if (objtype) {
                    var listeners = {};
                    objtype.on = function onF(actions, listener) {
                        if (util.string.validate(actions) && typeof listener === "function") {
                            actions.split(" ").forEach(function (action) {
                                listeners[action] = listeners[action] || [];
                                if (listeners[action].indexOf(listener) === -1) {
                                    listeners[action].push(listener);
                                }
                            });
                        }
                    };
                    objtype.off = function offF(actions, listener) {
                        if (util.string.validate(actions) && typeof listener === "function") {
                            actions.split(" ").forEach(function (action) {
                                listeners[action] = listeners[action] || [];
                                if (listeners[action].indexOf(listener) > -1) {
                                    listeners[action].splice(listeners[action].indexOf(listener), 1);
                                }
                            });
                        }
                    };
                    objtype.emit = function emitF() {
                        var args = Array.prototype.slice.apply(arguments), action = args.shift();
                        if (listeners[action]) {
                            listeners[action].forEach(function (func) {
                                try {
                                    func.apply(func, args);
                                } catch (e) {
                                    util.logging.error("Error in emitting to listen", action, e);
                                }
                            });
                        }
                    };
                }
            }
        }

    };
    return util;
});
