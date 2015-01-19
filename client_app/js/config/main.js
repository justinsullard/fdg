/*jslint */
/*global define */
define(["config/templates"], function (templates) {
    "use strict";
    return {
        "app": {
            "name": "FDG 2.0",
            "author": "Justin Sullard",
            "timing": {
                "hide": 500,
                "show": 500
            }
        },
        "templates": templates
    };
});