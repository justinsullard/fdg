/*jslint unparam: true */
/*global define */
define(["util"], function (util) {
    "use strict";

    function toHex(v) {
        return v.toString(16).replace(/^(\w)$/, '0$1');
    }

    function adjustHex(v, ratio, forceValue) {
        var ret;
        ratio = ratio || 1;
        if (forceValue) {
            ret = toHex(Math.min(255, Math.round(Math.max(parseInt(v, 16), forceValue) * ratio)));
        } else {
            ret = toHex(Math.min(255, Math.round(parseInt(v, 16) * ratio)));
        }
        return ret;
    }

    function lightenColor(color, ratio) {
        ratio = ratio || 1.2;
        return color.replace(/[0-9a-f]{2}/ig, function (c) {
            return adjustHex(c, ratio);
        });
    }

    function darkenColor(color, ratio) {
        ratio = ratio || 5 / 6;
        return color.replace(/[0-9a-f]{2}/ig, function (c) {
            return adjustHex(c, ratio);
        });
    }

    function toBlue(color) {
        var ratioA, ratioB;
        ratioA = 85 / 102;
        ratioB = 1.5;
        return color.replace(/([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i, function (c, p1, p2, p3) {
            return adjustHex(p1, ratioA) + adjustHex(p2, ratioA) + adjustHex(p3, ratioB, 64);
        });
    }

    util.extend({
        "dest": util,
        "source": {
            "color": {
                "lighten": lightenColor,
                "darken": darkenColor,
                "toBlue": toBlue
            }
        }
    });
    return util;
});
