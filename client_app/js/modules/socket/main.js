/*jslint browser:true, regexp:true, unparam:true */
/*global define, WebSocket */
define(["FDG"], function (FDG) {
    "use strict";
    FDG = FDG();

    var socket, now;

    if (window.performance) {
        now = function (v) { return window.performance.now() - (v || 0); };
    } else {
        now = function (v) { return new Date().getTime() - (v || 0); };
    }

    function getNotification(message) {
        FDG.util.logging.info(message);
        var self = {
            "message": message,
            "state": FDG.ko.observable("added")
        };
        setTimeout(function () {
            setTimeout(function () {
                self.state("shown");
                setTimeout(function () {
                    self.state("hiding");
                    setTimeout(function () {
                        socket.notifications.remove(self);
                    }, 500);
                }, 2000);
            }, 500);
        }, 1);
        try {
            socket.notifications.push(self);
        } catch (e) {
            FDG.util.logging.error("Error getting notification");
        }
    }


    // $('#flux').bind('scroll', function() {
    //     if($(this).scrollTop() + $(this).innerHeight() >= this.scrollHeight) {
    //         alert('end reached');
    //     }
    // })
    socket = {
        "url": window.location.origin.replace(/^http/, 'ws'),
        "connection": null,
        "guid": null,
        "username": FDG.ko.observable(null),
        "usernameInput": FDG.ko.observable(""),
        "others": FDG.ko.observableArray([]),
        "chatter": FDG.ko.observableArray([]),
        "unreadChatter": FDG.ko.observable(0),
        "chatInput": FDG.ko.observable(""),
        "chatVisible": FDG.ko.observable(false),
        "connected": FDG.ko.observable(false),
        "scrollLock": FDG.ko.observable(true),
        "notifications": FDG.ko.observableArray([]),
        "maxChatter": 30,
        "syncTime": 10000, // 10 seconds to sync spreading
        "maxSyncTimes": 100, // Only do it 100 times, after that resign and request another election
        "syncInterval": null,
        "reconnectTime": 2000, // 2 second
        "reconnectTimeout": null,
        "emptySendQueueTimeout": null,
        "pingTime": 30000, // 30 seconds
        "pingInterval": null,
        "lastPong": 0,
        "onopen": function () {
            FDG.util.logging.debug("Socket connected");
            clearTimeout(socket.reconnectTimeout);
            socket.pingInterval = setInterval(socket.ping, socket.pingTime);
            socket.emit('open');
            socket.emptySendQueue();
        },
        "onclose": function () {
            FDG.util.logging.debug("Socket disconnected");
            socket.connected(false);
            socket.connection = null;
            socket.guid = null;
            socket.others([]);
            socket.chatter([]);
            clearTimeout(socket.reconnectTimeout);
            clearInterval(socket.pingInterval);
            clearInterval(socket.syncInterval);
            socket.reconnectTimeout = setTimeout(socket.connect, socket.reconnectTime);
            socket.emit('close');
        },
        "onerror": function (e, data) {
            FDG.util.logging.error("Socket error", e);
            socket.emit('error', e, data);
        },
        "onmessage": function (res) {
            var message;
            try {
                message = JSON.parse(res.data);
                if (message && message.action) {
                    socket.emit('action-' + message.action, message);
                    if (message.action === "pong") {
                        socket.lastPong = message.time;
                    }
                } else {
                    socket.onerror(new Error("Invalid message received"));
                }
            } catch (e) {
                socket.onerror(e, res.data);
            }

        },
        "ping": function () {
            if (socket.connection) {
                socket.send({"action": "ping"});
            }
        },
        "sendQueue": [],
        "emptySendQueue": function () {
            var i, retry = false, l = socket.sendQueue.length;
            clearInterval(socket.emptySendQueueTimeout);
            if (l) {
                FDG.util.logging.debug("Emptying", l, "queued messages");
            }
            for (i = 0; i < l; i += 1) {
                // FDG.util.logging.debug("Emptying message", socket.sendQueue[i]);
                if (socket.send(socket.sendQueue[i])) {
                    socket.sendQueue.splice(i, 1);
                    i -= 1;
                    l -= 1;
                } else {
                    retry = true;
                }
            }
            if (retry) {
                socket.emptySendQueueTimeout = setTimeout(socket.emptySendQueue, socket.reconnectTime);
            }
        },
        "send": function (message) {
            var ret = false;
            if (socket.connection && FDG.util.object.validate(message)) {
                message.time = new Date().toISOString();
                try {
                    socket.connection.send(JSON.stringify(message));
                    ret = true;
                } catch (ignore) {}
            }
            // if (!ret && FDG.util.object.validate(message) && socket.sendQueue.indexOf(message) === -1) {
            //     message.queueTime = new Date().toISOString();
            //     socket.sendQueue.push(message);
            //     FDG.util.logging.debug("Enqueing message", message);
            // }
            return ret;
        },
        "connect": function () {
            if (socket.url) {
                try {
                    FDG.util.logging.debug("Attempting socket connection.");
                    socket.connection = new WebSocket(socket.url);
                    socket.connection.onopen = socket.onopen;
                    socket.connection.onclose = socket.onclose;
                    socket.connection.onmessage = socket.onmessage;
                    socket.connection.onerror = socket.onerror;
                } catch (e) {
                    socket.onerror(e);
                }
            } else {
                socket.onerror(new Error("Invalid socket connection url."));
            }
        }
    };
    FDG.util.emitter.make(socket);



    // FDG mediator listeners
    function setUsername(message) {
        if (FDG.util.string.validate(message.username)) {
            socket.username(message.username);
            socket.usernameInput(socket.username());
            localStorage.setItem("fdg-username", socket.username());
            socket.send({"action": "set-username", "username": socket.username()});
        }
    }
    function onGraphLoad() {
        if (FDG.util.graph.guid()) {
            socket.send({"action": "graph-room-join", "guid": FDG.util.graph.guid()});
        } else {
            FDG.util.logging.warn("Socket unable to determine which graph room to join");
        }
    }
    function onGraphClose() {
        socket.send({"action": "graph-room-leave"});
    }
    function onPauseGraph() {
        socket.send({"action": "graph-pause"});
    }
    function onRunGraph() {
        socket.send({"action": "graph-run"});
    }
    function onFDGStartSuccess() {
        FDG.ko.applyBindings({
            "connected": socket.connected,
            "others": socket.others,
            "chatter": socket.chatter,
            "chatInput": socket.chatInput,
            "chatVisible": socket.chatVisible,
            "changeUsername": function () {
                setUsername({"username": socket.usernameInput()});
            },
            "resetUsername": function () {
                socket.usernameInput(socket.username());
            },
            "toggleChat": function () {
                socket.chatVisible(!socket.chatVisible());
                if (socket.chatVisible()) {
                    FDG.$(".chatInput").focus();
                }
                // FDG.util.logging.debug("Chat visibility:", socket.chatVisible());
            },
            "chat": function () {
                var message = {"action": "chatter", "text": socket.chatInput()};
                socket.chatInput("");
                FDG.util.logging.debug("Sending chatter", message.text);
                socket.send(message);
            },
            "unreadChatter": socket.unreadChatter,
            "scrollLock": socket.scrollLock,
            "username": socket.usernameInput,
            "notifications": socket.notifications
        }, FDG.$('.appSocket').get(0));
        FDG.util.logging.debug("module/socket started");
        FDG.publish({"channel": "fdg-socket-ready"});
        socket.username(localStorage.getItem("fdg-username") || null);
        socket.usernameInput(socket.username());
        socket.connect();
        return;
    }
    function onSendAction(message) {
        if (FDG.util.object.validate(message.action) && FDG.util.string.validate(message.action.action)) {
            socket.send(message.action);
        }
    }

    FDG.subscribe({"channel": "fdg-start-success", "callback": onFDGStartSuccess});
    FDG.subscribe({"channel": "fdg-set-username", "callback": setUsername});
    FDG.subscribe({"channel": "fdg-graph-load-success", "callback": onGraphLoad});
    FDG.subscribe({"channel": "fdg-graph-close-success", "callback": onGraphClose});
    FDG.subscribe({"channel": "fdg-graph-pause-success", "callback": onPauseGraph});
    FDG.subscribe({"channel": "fdg-graph-run-success", "callback": onRunGraph});
    FDG.subscribe({"channel": "fdg-send-action", "callback": onSendAction});

    // Socket action listeners
    function getOtherUser(message) {
        var ret, i, others = socket.others().slice();
        for (i = 0; i < others.length; i += 1) {
            if (others[i].guid === message.from) {
                ret = others[i];
                break;
            }
        }
        return ret;
    }

    socket.on("action-connect", function (message) {
        socket.guid = message.guid;
        if (socket.username() !== message.username) {
            socket.send({"action": "set-username", "username": socket.username()});
        } else {
            socket.username(message.username);
            socket.usernameInput(socket.username());
        }
        socket.connected(true);
        if (FDG.util.graph.guid()) {
            socket.send({"action": "graph-room-join", "guid": FDG.util.graph.guid()});
        }
    });
    socket.on("action-graph-room-join-success", function (message) {
        var note = "Started graph room.", el;
        if (FDG.util.array.validate(message.others)) {
            if (message.others.length) {
                note = "Joined graph room with " + message.others.length + " others.";
            }
            socket.others(message.others);
            socket.chatter(message.chatter || []);
            if (socket.scrollLock()) {
                el = FDG.$(".chatterMessages");
                el.scrollTop(el[0].scrollHeight);
            }
        }
        getNotification(note);
    });
    socket.on("action-graph-room-leave-success", function () {
        FDG.util.logging.info("Left graph room successfully.");
        socket.others([]);
        socket.chatter([]);
        socket.unreadChatter(0);
    });
    socket.on("action-user-leave", function (message) {
        var other = getOtherUser(message);
        if (other) {
            getNotification("User " + other.username + " has left the graph room.");
            socket.others.remove(other);
        }
    });
    socket.on("action-user-join", function (message) {
        var i, others = socket.others().slice(), found = false;
        for (i = 0; i < others.length; i += 1) {
            if (others[i].guid === message.guid) {
                found = true;
                break;
            }
        }
        if (!found) {
            socket.others.push({"guid": message.from, "username": message.username});
            getNotification("User " + message.username + " has joined the graph room.");
        }
    });
    socket.on("action-leader-election", function () {
        clearInterval(socket.syncInterval);
        var start = now();
        FDG.util.node.sync();
        socket.send({"action": "leader-vote", "perf": now(start)});
    });
    socket.on("action-sync-leader", function () {
        socket.syncInterval = setInterval(function () {
            if (FDG.util.graph.setting("running") && socket.others().length) {
                socket.send({"action": "sync", "nodes": FDG.util.node.sync()});
            }
        }, socket.syncTime);
        getNotification("You have been elected sync leader.");
    });
    socket.on("action-sync", function (message) {
        if (FDG.util.array.validate(message.nodes)) {
            FDG.publish({"channel": "fdg-node-sync", "nodes": message.nodes});
            getNotification("Synced");
        }
    });
    socket.on("action-set-username", function (message) {
        var i, others = socket.others().slice();
        for (i = 0; i < others.length; i += 1) {
            if (others[i].guid === message.from) {
                getNotification("User " + others[i].username + " has changed their name to " + message.username + ".");
                // FDG.util.logging.info("User", others[i].username, "has changed their name to " + message.username + ".");
                others[i].username = message.username;
                socket.others.valueHasMutated();
                break;
            }
        }
    });
    socket.on("action-graph-pause", function (message) {
        var other = getOtherUser(message);
        if (other) {
            getNotification(other.username + " paused the graph.");
        }
        FDG.publish({"channel": "fdg-graph-pause", "socket": true});
    });
    socket.on("action-graph-run", function (message) {
        var other = getOtherUser(message);
        if (other) {
            getNotification(other.username + " ran the graph.");
        }
        FDG.publish({"channel": "fdg-graph-run", "socket": true});
    });
    socket.on("action-chatter", function (message) {
        var len, i, el;
        socket.chatter.push({"time": message.time, "username": message.username, "text": message.text});
        len = socket.chatter().length;
        for (i = len; i > socket.maxChatter; i -= 1) {
            socket.chatter.shift();
        }
        if (socket.scrollLock()) {
            el = FDG.$(".chatterMessages");
            el.scrollTop(el[0].scrollHeight);
        }
        if (socket.chatVisible()) {
            socket.unreadChatter(0);
        } else {
            socket.unreadChatter(socket.unreadChatter() + 1);
        }
    });

    FDG.ko.bindingHandlers.enterkey = {
        "init": function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor();
            FDG.$(element).keypress(function (event) {
                var keyCode = event.which || event.keyCode;
                if (keyCode === 13) {
                    allBindings.enterkey.call(viewModel);
                    return false;
                }
                return true;
            });
        }
    };
    FDG.ko.bindingHandlers.esckey = {
        "init": function (element, valueAccessor, allBindingsAccessor, viewModel) {
            var allBindings = allBindingsAccessor();
            FDG.$(element).keyup(function (event) {
                var keyCode = event.which || event.keyCode;
                if (keyCode === 27) {
                    allBindings.esckey.call(viewModel);
                    return false;
                }
                return true;
            });
        }
    };
    FDG.ko.bindingHandlers.scrollLock = {
        "init": function (element, valueAccessor) {
            var attr = valueAccessor(), $el = FDG.$(element);
            if (FDG.ko.isWritableObservable(attr)) {
                $el.bind("scroll", function () {
                    if ($el.scrollTop() + $el.innerHeight() >= element.scrollHeight) {
                        attr(true);
                    } else {
                        attr(false);
                    }
                });
            }
        }
    };

    FDG.util.extend({
        "dest": FDG.util,
        "source": {
            "socket": {
                "on": socket.on,
                "off": socket.off,
                "emit": socket.emit,
                "getOtherUser": getOtherUser,
                "getNotification": getNotification
            }
        }
    });

});
