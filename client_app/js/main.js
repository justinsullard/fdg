/*

Here we establish the base requirejs configuration.

*/
/*global require */
(function () {
    "use strict";
    require.config({
        "paths": {
            "jquery": "vendor/jquery-2.1.1.min",
            "text": "vendor/requirejs-text",
            "knockout": "vendor/knockout-3.2.0",
            "util": "utilities/utilities",
            "utils": "utilities",
            "templates": "../templates",
            "jquerysvg": "vendor/jquery.svg.min",
            "jqueryui": "vendor/jquery-ui.min"
        },
        "shim": {
            "jqueryui": {
                "deps": ['jquery'],
                "exports": "jqueryui"
            },
            "jquerysvg": {
                "deps": ['jqueryui'],
                "exports": "jquerysvg"
            }
        },
        "deps": [
            "jquery",
            "FDG",
            "require",
            "text",
            "utils/point",
            "utils/color",
            "jquerysvg",
            "modules/kostringtemplates/main",
            "modules/graph/main",
            "modules/node/main",
            "modules/connection/main",
            "modules/dialogs/main",
            "modules/socket/main"
        ],
        "callback": function ($, FDG) {
            $('document').ready(function () {
                FDG().publish({"channel": "fdg-start-request"});
            });
        }
    });
}());