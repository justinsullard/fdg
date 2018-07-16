/*jslint */
/*global define */
define(["util"], function (util) {
    "use strict";

    const nativeCleanse = (json) => json.replace(/function (\w+)\(\) \{ \[native code\] \}/g, '$1');
    const stringify = function(obj) {
        const placeholder = '____PLACEHOLDER____';
        const fns = [];
        let json = JSON.stringify(obj, function(key, value) {
            if (typeof value === 'function') {
                fns.push(value);
                return placeholder;
            }
            return value;
        }, 2);
        json = nativeCleanse(json.replace(new RegExp(`"${placeholder}"`, 'g'), () => fns.shift()));
        return json;
    };

    util.extend({
        "dest": util,
        "source": {
            "stringify": stringify,
            "nativeCleanse": nativeCleanse
        }
    });
    return util;
});
