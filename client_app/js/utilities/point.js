/*jslint */
/*global define */
define(["util"], function (util) {
    "use strict";

    function Point(x, y) {
        if (util.object.validate(x)) {
            y = x.y;
            x = x.x;
        }
        this.x = util.number.getAs(x);
        this.y = util.number.getAs(y);
    }
    Point.prototype.zero = function () {
        this.x = 0;
        this.y = 0;
        return this;
    };
    Point.prototype.clone = function () {
        return new Point(this.x, this.y);
    };
    Point.prototype.randomize = function (w, h, r) {
        w = util.number.getAs(w, 100);
        h = util.number.getAs(h, 100);
        r = util.number.getAs(r, 10);
        this.x = Math.random() * (w - r);
        this.y = Math.random() * (h - r);
        return this;
    };
    Point.prototype.normalize = function () {
        return this.divide(this.magnitude());
    };
    Point.prototype.add = function (p) {
        if (p instanceof Point) {
            this.x += p.x;
            this.y += p.y;
        }
        return this;
    };
    Point.prototype.subtract = function (p) {
        if (p instanceof Point) {
            this.x -= p.x;
            this.y -= p.y;
        }
        return this;
    };
    Point.prototype.magnitude = function () {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    };
    Point.prototype.multiply = function (m) {
        this.x *= util.number.getAs(m, 1);
        this.y *= util.number.getAs(m, 1);
        return this;
    };
    Point.prototype.divide = function (m) {
        this.x /= util.number.getAs(m, 1);
        this.y /= util.number.getAs(m, 1);
        return this;
    };
    Point.prototype.describe = function () {
        return "(" + this.x + ", " + this.y + ")";
    };
    Point.prototype.serialize = function () {
        var ret = {};
        ret.x = parseFloat(this.x.toFixed(10));
        ret.y = parseFloat(this.y.toFixed(10));
        return ret;
    };

    util.extend({
        "dest": util,
        "source": {
            "point": {
                "make": function (x, y) {
                    return new Point(x, y);
                },
                "validate": function (val) {
                    return val instanceof Point;
                }
            }
        }
    });
    return util;
});
