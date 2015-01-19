/*jslint */
/*global define */
define([
    "text!templates/graph/menu.html",
    "text!templates/graph/listDialog.html",
    "text!templates/graph/settings.html",
    "text!templates/node/list.html",
    "text!templates/node/edit.html",
    "text!templates/connection/connection.xml",
    "text!templates/connection/edit.html",
    "text!templates/dialogs/modal.html",
    "text!templates/socket/control.html"
], function (
    graph_menu,
    graph_list_dialog,
    graph_settings,
    node_list,
    node_edit,
    connection_xml,
    connection_edit,
    dialogs_modal,
    socket_control
) {
    "use strict";
    return {
        "graph": {
            "menu": graph_menu,
            "listDialog": graph_list_dialog,
            "settings": graph_settings
        },
        "node": {
            "list": node_list,
            "edit": node_edit
        },
        "connection" : {
            "xml": connection_xml,
            "edit": connection_edit
        },
        "dialogs": {
            "modal": dialogs_modal
        },
        "socket": {
            "control": socket_control
        }
    };
});