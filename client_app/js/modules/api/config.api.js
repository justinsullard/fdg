/*jslint */
/*global define */
define(function () {
    "use strict";
    return {
        "routes": {
            "auth-post-employee": {
                "uri": "auth",
                "method": "post",
                "requiresAuth": false,
                "contentType": "application/x-www-form-urlencoded; charset=UTF-8",
                "params": {
                    "type": "employee",
                    "username": "",
                    "password": "",
                    "role": "web"
                }
            },
            "auth-delete": {
                "uri": "/{auth}",
                "method": "delete",
                "requiresAuth": true,
                "contentType": "application/x-www-form-urlencoded; charset=UTF-8"
            },
            "employee-get-list": {
                "uri": "employee?venue={venue}",
                "method": "get",
                "requiresAuth": true
            },
            "employee-get": {
                "uri": "/{employee}",
                "method": "get",
                "requiresAuth": true
            },
            "employee-permission-get": {
                "uri": "/{employee}/permission",
                "method": "get",
                "requiresAuth": true
            },
            "employee-limits-get": {
                "uri": "/{employee}/limits",
                "method": "get",
                "requiresAuth": true
            },
            "employee-roles-get": {
                "uri": "role?employee={employee}",
                "method": "get",
                "requiresAuth": true
            },
            "merchant-get-list": {
                "uri": "merchant",
                "method": "get",
                "requiresAuth": true
            },
            "merchant-get": {
                "uri": "/{merchant}",
                "method": "get",
                "requiresAuth": true
            },
            "venue-get-list": {
                "uri": "venue",
                "method": "get",
                "requiresAuth": true
            },
            "venue-get-list-by-merchant": {
                "uri": "venue?merchant={merchant}",
                "method": "get",
                "requiresAuth": true
            },
            "venue-get": {
                "uri": "/{venue}",
                "method": "get",
                "requiresAuth": true
            },
            "device-get-list-by-venue": {
                "uri": "device?venue={venue}",
                "method": "get",
                "requiresAuth": true
            },
            "device-get": {
                "uri": "/{device}",
                "method": "get",
                "requiresAuth": true
            },
            "form_of_payment-get-list-by-merchant": {
                "uri": "form_of_payment?merchant={merchant}",
                "method": "get",
                "requiresAuth": true
            },
            "form_of_payment-get": {
                "uri": "/{form_of_payment}",
                "method": "get",
                "requiresAuth": true
            },
            "currency-get": {
                "uri": "/{currency}",
                "method": "get",
                "requiresAuth": true
            }
        },
        "sockets": {
            "send": {
                "ping": {},
                "set-username": {},
                "graph-room-join": {},
                "graph-room-leave": {}
            },
            "receive": {
                "connect": {},
                "pong": {},
                "set-username-success": {},
                "set-username-error": {},
                "set-username": {},
                "graph-room-join-success": {},
                "graph-room-join-error": {},
                "graph-room-leave-success": {},
                "graph-room-leave-error": {},
                "user-join": {},
                "user-leave": {}
            }
/*

                        case "set-username":
                            console.log("Received set-username");
                            if (typeof message.username === "string") {
                                connection.username = message.username;
                                sendMessageOthers({"action": "set-username-success", "username": connection.username});
                            }
                            // joinGraphRoom(message.guid, connection);
                            break;
                        case "graph-room-join":
                            console.log("Received graph-room-join");
                            joinGraphRoom(message.guid, connection);
                            break;
                        case "graph-room-leave":
                            console.log("Received graph-room-leave");
                            leaveGraphRoom(connection);
                            break;
                        case "ping":
                            sendMessage({"action": "pong", "time": new Date().toISOString()});
                            break;


 */
        }
        "prefix": "/api/",
        "auth" : {
            "expiresStatusCode": 403,
            "expiredPattern": /Invalid token in header/
        },
        "artificialDelay": false //1000,
    };
});
