/*jslint browser: true, continue:true */
/*global define, require, exports, module */
define(["FDG"], function (FDG) {
    "use strict";
    FDG = FDG();

    var priv = {
        "renderIndex": FDG.ko.observable(0),
        "index": {},
        "connectionTypes": [
            "reference",
            "inheritance",
            "extension",
            "mixin",
            "multi"
        ],
        "connections": FDG.ko.observableArray(),
        "connectionsSorted": FDG.ko.computed({
            "read": function () {
                return priv.connections().sort(function (a, b) {
                    var ret = a.label === b.label ? 0 : (a.label < b.label ? 1 : -1);
                    if (!ret) {
                        ret = a.type === b.type ? 0 : (a.type < b.type ? 1 : -1);
                    }
                    return ret;
                });
            },
            "deferEvaluation": true
        }),
        "penConnection": FDG.ko.observable(null)
    };
    // Load standard entity connection types
    (function () {
        var types = ["Zero", "One", "Only", "Many", "Any"], i, j, type;
        for (i = types.length - 1; i >= 0; i -= 1) {
            for (j = types.length - 1; j >= 0; j -= 1) {
                type = types[i].toLowerCase() + "To" + types[j];
                priv.connectionTypes.unshift(type);
            }
        }
    }());

    function Connection(config) {
        var self = this;
        config = config || {};
        FDG.$.extend(self, {
            "pos": FDG.ko.observable(0),
            "guid": FDG.ko.observable(FDG.util.guid.make()),
            "length": FDG.ko.observable(50),
            "alpha": FDG.ko.observable(""),
            "beta": FDG.ko.observable(""),
            "description": FDG.ko.observable(""),
            "alphaNode": null,
            "betaNode": null,
            "connectionType": FDG.ko.observable('oneToMany'), // Defaulting to assume one to many relationships because that's the most frequently used.
            "hovered": FDG.ko.observable(false),
            "multiTypes": FDG.ko.observableArray([]),
            "anchored": FDG.ko.computed({
                "read": function () {
                    priv.renderIndex();
                    self.pos();
                    self.alphaNode.pos();
                    self.betaNode.pos();
                    return self.alphaNode.anchored() || self.betaNode.anchored();
                },
                "deferEvaluation": true
            }),
            "selected": FDG.ko.computed({
                "read": function () {
                    priv.renderIndex();
                    self.pos();
                    self.alphaNode.pos();
                    self.betaNode.pos();
                    return self.alphaNode.selected() || self.betaNode.selected();
                },
                "deferEvaluation": true
            }),
            "highlighted": FDG.ko.computed({
                "read": function () {
                    priv.renderIndex();
                    self.pos();
                    self.alphaNode.pos();
                    self.betaNode.pos();
                    return self.alphaNode.highlighted() || self.betaNode.highlighted();
                },
                "deferEvaluation": true
            }),
            "magnitude": FDG.ko.computed({
                "read": function () {
                    priv.renderIndex();
                    self.pos();
                    self.alphaNode.pos();
                    self.betaNode.pos();
                    return self.alphaNode.point.clone().subtract(self.betaNode.point).magnitude();
                },
                "deferEvaluation": true
            }),
            "angle": FDG.ko.computed({
                "read": function () {
                    priv.renderIndex();
                    self.pos();
                    self.alphaNode.pos();
                    self.betaNode.pos();
                    return Math.atan2(
                        self.betaNode.point.y - self.alphaNode.point.y,
                        self.betaNode.point.x - self.alphaNode.point.x
                    );
                },
                "deferEvaluation": true
            }),
            "alphaLabel": FDG.ko.computed({
                "read": function () {
                    self.alpha();
                    return self.alphaNode.label();
                },
                "deferEvaluation": true
            }),
            "betaLabel": FDG.ko.computed({
                "read": function () {
                    self.beta();
                    return self.betaNode.label();
                },
                "deferEvaluation": true
            }),
            "alphaX": FDG.ko.computed({
                "read": function () {
                    // x1p = x1 + (Math.cos(radAngle) * rad1),
                    // y1p = y1 + (Math.sin(radAngle) * rad1);
                    // priv.renderIndex();
                    return self.alphaNode.point.x + (Math.cos(self.angle()) * self.alphaNode.radius());
                },
                "deferEvaluation": true
            }),
            "alphaY": FDG.ko.computed({
                "read": function () {
                    // priv.renderIndex();
                    return self.alphaNode.point.y + (Math.sin(self.angle()) * self.alphaNode.radius());
                },
                "deferEvaluation": true
            }),
            "betaX": FDG.ko.computed({
                "read": function () {
                    // priv.renderIndex();
                    return self.betaNode.point.x - (Math.cos(self.angle()) * self.betaNode.radius());
                },
                "deferEvaluation": true
            }),
            "betaY": FDG.ko.computed({
                "read": function () {
                    // priv.renderIndex();
                    return self.betaNode.point.y - (Math.sin(self.angle()) * self.betaNode.radius());
                },
                "deferEvaluation": true
            }),
            "path": FDG.ko.computed({
                "read": function () {
                    // priv.renderIndex();
                    var path = "M";
                    path += self.alphaX() + "," + self.alphaY();
                    path += "L" + self.betaX() + "," + self.betaY();
                    return path + "Z";
                },
                "deferEvaluation": true
            }),
            "currentColor": FDG.ko.computed({
                "read": function () {
                    return self.selected() || self.hovered() ? "#aa4444" : "#444";
                },
                "deferEvaluation": true
            }),
            "currentRotateTransform": FDG.ko.computed({
                "read": function () {
                    return self.angle() * 180 / Math.PI;
                },
                "deferEvaluation": true
            }),
            "currentAlphaTransform": FDG.ko.computed({
                "read": function () {
                    // priv.renderIndex();
                    var transform = "matrix(";
                    transform += Math.cos(-self.angle());
                    transform += "," + (-Math.sin(-self.angle()));
                    transform += "," + Math.sin(-self.angle());
                    transform += "," + Math.cos(-self.angle());
                    transform += "," + self.alphaX();
                    transform += "," + self.alphaY() + ")";
                    return transform;
                },
                "deferEvaluation": true
            }),
            "currentBetaTransform": FDG.ko.computed({
                "read": function () {
                    // priv.renderIndex();
                    var transform = "matrix(";
                    transform += Math.cos(-self.angle());
                    transform += "," + (-Math.sin(-self.angle()));
                    transform += "," + Math.sin(-self.angle());
                    transform += "," + Math.cos(-self.angle());
                    transform += "," + self.betaX();
                    transform += "," + self.betaY() + ")";
                    return transform;
                },
                "deferEvaluation": true
            })
        });
        self.set(config);
    }
    Connection.prototype.serialize = function () {
        var self = this, i, ret = {};
        for (i in self) {
            if (self.hasOwnProperty(i)) {
                if (FDG.ko.isWritableObservable(self[i]) && i !== "pos" && i !== "hovered") {
                    ret[i] = self[i]();
                }
            }
        }
        return ret;
    };
    Connection.prototype.flip = function () {
        var self = this, alpha = self.alphaNode, beta = self.betaNode;
        self.betaNode = alpha;
        self.alphaNode = beta;
        self.alpha(self.alphaNode.guid());
        self.beta(self.betaNode.guid());
        self.pos(self.pos() + 1);
        FDG.publish({
            "channel": "fdg-send-action",
            "action": {
                "action": "connection-set",
                "connection": self.guid(),
                "properties": self.serialize()
            }
        });
        FDG.publish({"channel": "fdg-dirty"});
    };
    Connection.prototype.set = function (config) {
        var self = this, c, options = FDG.$.extend({}, config);
        for (c in options) {
            if (options.hasOwnProperty(c)) {
                if (FDG.ko.isWritableObservable(self[c])) {
                    if (c === "multiTypes") {
                        // Here we have to do some trickery to figure out what we want to do
                        // FDG.util.logging.debug("multiTypes has been stubbed but is handling is not ready");
                        continue;
                    }
                    if (c === "alpha" || c === "beta") {
                        self[c](options[c]);
                        self[c + "Node"] = FDG.util.node.get(options[c]);
                    } else {
                        self[c](options[c]);
                    }
                } else if (self.hasOwnProperty(c)) {
                    self[c] = options[c];
                } else {
                    FDG.util.logging.debug("Unknown property", c);
                }
            }
        }
    };

    function editConnection(connection) {
        var clone = new Connection(connection.serialize());
        FDG.publish({
            "channel": "fdg-show-modal",
            "title": "Edit Connection",
            "viewModel": {
                "connection": clone,
                "flipConnection": function () { clone.flip(); },
                "connectionTypes": priv.connectionTypes,
                "saveAndCloseModal": function (context) {
                    connection.set(clone.serialize());
                    connection.pos(connection.pos() + 1);
                    context.closeModal.apply(this, arguments);
                    FDG.publish({
                        "channel": "fdg-send-action",
                        "action": {
                            "action": "connection-set",
                            "connection": connection.guid(),
                            "properties": connection.serialize()
                        }
                    });
                    FDG.publish({"channel": "fdg-dirty"});
                }
            },
            "template": "templates.connection.edit"
        });
    }
    function clearConnections() {
        priv.index = {};
        priv.connections.removeAll();
        // FDG.ko.cleanNode(FDG.$('.connectionGroup').get(0));
    }
    function getConnection(guid) {
        return priv.index[guid];
    }
    function getConnections(nodeA, nodeB) {
        return FDG.ko.utils.arrayFilter(priv.connections(), function (connection) {
            var ret = false;
            ret = connection.alphaNode === nodeA || connection.betaNode === nodeA;
            if (nodeB) {
                ret = ret && (connection.alphaNode === nodeB || connection.betaNode === nodeB);
            }
            return ret;
        });
    }
    function onRenderStepComplete() {
        priv.renderIndex(priv.renderIndex() + 1);
    }

    function onNodeLoadSuccess(message) {
        var i, connections = [], connection;
        if (FDG.util.object.validate(message.graph)) {
            clearConnections();
            if (FDG.util.array.validate(message.graph.connections)) {
                for (i = 0; i < message.graph.connections.length; i += 1) {
                    connection = new Connection(message.graph.connections[i]);
                    priv.index[connection.guid()] = connection;
                    connections.push(connection);
                }
            }
            priv.connections(connections);
            // FDG.util.logging.debug(connections.length, "connections loaded");
        }
    }

    function applyConnections() {
        var i, connections = priv.connections(), l = connections.length, dir, mag, displacement;
        for (i = 0; i < l; i += 1) {
            dir = connections[i].betaNode.point.clone().subtract(connections[i].alphaNode.point);
            displacement = connections[i].length() - dir.magnitude();
            mag = dir.normalize().multiply(FDG.util.graph.setting("spring") * displacement * 0.5);
            connections[i].alphaNode.forces.subtract(mag);
            connections[i].betaNode.forces.add(mag);
        }
    }
    function updateConnections() {
        priv.renderIndex(priv.renderIndex() + 1);
    }

    function onFDGStartSuccess() {
        FDG.ko.applyBindings({
            "connections": priv.connectionsSorted,
            "penConnection": priv.penConnection
        }, FDG.$('.connectionGroup').get(0));
        FDG.util.logging.debug("module/connection started");
        return;
    }

    function testConnectionTypes(message) {
        var i, l, connections;
        if (message && message.type && priv.connectionTypes.indexOf(message.type) > -1) {
            connections = priv.connections();
            l = connections.length;
            for (i = 0; i < l; i += 1) {
                connections[i].connectionType(message.type);
            }
            updateConnections();
        }
    }

    function serializeAll() {
        var ret = [], i, connections = priv.connections(), l = connections.length;
        for (i = 0; i < l; i += 1) {
            ret.push(connections[i].serialize());
        }
        return ret;
    }
    function smartConnectionGrowth() {
        // var i, alpha, beta, connections = priv.connections(), l = connections.length, len, magFact;
        var i, alpha, beta, connections = priv.connections(), l = connections.length, len;
        for (i = 0; i < l; i += 1) {
            // magFact = connections[i].length() / connections[i].magnitude();
            alpha = getConnections(connections[i].alphaNode).length;
            beta = getConnections(connections[i].betaNode).length;
            len = FDG.util.graph.setting("orbit");
            len += alpha * connections[i].alphaNode.radius() / 2 || 0;
            len += beta * connections[i].betaNode.radius() / 2 || 0;
            // 3 / 4; 4 / 5
            // len /= magFact;
            connections[i].length(len);
        }
        FDG.util.logging.debug("Smart connection growth completed for", priv.connections().length, "connections");
        updateConnections();
        FDG.publish({"channel": "fdg-dirty"});
    }
    function flipAllConnections() {
        var i, connections = priv.connections(), l = connections.length;
        for (i = 0; i < l; i += 1) {
            connections[i].flip();
        }
        updateConnections();
        FDG.publish({"channel": "fdg-dirty"});
    }

    function removeConnection(message) {
        var i;
        if (message.connection && priv.index[message.connection.guid()]) {
            delete priv.index[message.connection.guid()];
            priv.connections.remove(message.connection);
            FDG.publish({"channel": "fdg-connection-remove-success"});
        } else if (FDG.util.array.validate(message.connections)) {
            for (i = 0; i < message.connections.length; i += 1) {
                if (priv.index[message.connections[i].guid()]) {
                    delete priv.index[message.connections[i].guid()];
                    priv.connections.remove(message.connections[i]);
                }
            }
            FDG.publish({"channel": "fdg-connection-remove-success"});
        }
    }

    function penConnectionStart(message) {
        var conn;
        if (!priv.penConnection()) {
            conn = new Connection();
            conn.alpha = message.node.guid();
            conn.alphaNode = message.node;
            conn.beta = message.dummyNode.guid();
            conn.betaNode = message.dummyNode;
            priv.penConnection(conn);
            priv.penConnection().pos(priv.penConnection().pos() + 1);
        }
    }
    // function penConnectionUpdate(message) {

    // }
    function penConnectionCancel() {
        priv.penConnection(null);
    }
    function penConnectionEnd(message) {
        var conn, prev, config;
        if (priv.penConnection() && message.node) {
            // Check for previously existing connections
            prev = getConnections(priv.penConnection().alphaNode, message.node);
            if (prev.length === 0 && priv.penConnection().alphaNode !== message.node) {
                config = {
                    "connectionType": priv.penConnection().connectionType(),
                    "alpha": priv.penConnection().alphaNode.guid(),
                    "beta": message.node.guid()
                };
                priv.penConnection(null);
                conn = new Connection(config);
                priv.index[conn.guid()] = conn;
                priv.connections.push(conn);
                FDG.publish({"channel": "fdg-connection-add-success"});
                // smartConnectionGrowth();
            } else {
                priv.penConnection(null);
            }
        }
    }

    function moveConnection(message) {
        var connection = priv.index[message.connection];
        if (connection && FDG.util.object.validate(message.alpha) && FDG.util.object.validate(message.beta)) {
            connection.alphaNode.point = FDG.util.point.make(message.alpha);
            connection.alphaNode.pos(connection.alphaNode.pos() + 1);
            connection.betaNode.point = FDG.util.point.make(message.beta);
            connection.betaNode.pos(connection.betaNode.pos() + 1);
            connection.pos(connection.pos() + 1);
        }
    }
    function selectConnection(message) {
        var connection = priv.index[message.connection];
        if (connection) {
            connection.alphaNode.selected(true);
            connection.betaNode.selected(true);
        }
    }
    function deselectConnection(message) {
        var connection = priv.index[message.connection];
        if (connection) {
            connection.alphaNode.selected(false);
            connection.betaNode.selected(false);
        }
    }
    function connectionSet(message) {
        var connection = priv.index[message.connection];
        if (connection && FDG.util.object.validate(message.properties)) {
            connection.set(message.properties);
            connection.pos(connection.pos() + 1);
        }
    }


    FDG.subscribe({"channel": "fdg-start-success", "callback": onFDGStartSuccess});
    FDG.subscribe({"channel": "fdg-render-step-complete", "callback": onRenderStepComplete});
    FDG.subscribe({"channel": "fdg-node-load-success", "callback": onNodeLoadSuccess});
    FDG.subscribe({"channel": "fdg-apply-connections", "callback": applyConnections});
    FDG.subscribe({"channel": "fdg-update-connections", "callback": updateConnections});
    FDG.subscribe({"channel": "fdg-test-connection-types", "callback": testConnectionTypes});
    FDG.subscribe({"channel": "fdg-graph-close-success", "callback": clearConnections});
    FDG.subscribe({"channel": "fdg-smart-connection-growth", "callback": smartConnectionGrowth});
    FDG.subscribe({"channel": "fdg-flip-all-connections", "callback": flipAllConnections});
    FDG.subscribe({"channel": "fdg-pen-connection-start", "callback": penConnectionStart});
    // FDG.subscribe({"channel": "fdg-pen-connection-update", "callback": penConnectionUpdate});
    FDG.subscribe({"channel": "fdg-pen-connection-cancel", "callback": penConnectionCancel});
    FDG.subscribe({"channel": "fdg-pen-connection-end", "callback": penConnectionEnd});
    FDG.subscribe({"channel": "fdg-connection-remove-request", "callback": removeConnection});
    FDG.subscribe({"channel": "fdg-connection-add-success", "callback": smartConnectionGrowth});
    FDG.subscribe({"channel": "fdg-connection-remove-success", "callback": smartConnectionGrowth});

    // FDG.subscribe({"channel": "fdg-move-connection", "callback": moveConnection});
    // FDG.subscribe({"channel": "fdg-select-connection", "callback": selectConnection});
    // FDG.subscribe({"channel": "fdg-deselect-connection", "callback": deselectConnection});

    FDG.subscribe({
        "channel": "fdg-socket-ready",
        "count": 1,
        "callback": function () {
            FDG.util.socket.on("action-move-connection", moveConnection);
            FDG.util.socket.on("action-select-connection", selectConnection);
            FDG.util.socket.on("action-deselect-connection", deselectConnection);
            FDG.util.socket.on("action-connection-set", connectionSet);
        }
    });


    FDG.util.extend({
        "dest": FDG.util,
        "source": {
            "connection": {
                "get": getConnection,
                "ofNode": getConnections,
                "store": serializeAll
            }
        }
    });

    FDG.ko.bindingHandlers.connectionControl = {
        "init": function (element, valueAccessor) {
            var connection = valueAccessor(),
                dragging = false,
                lastX = 0,
                lastY = 0,
                offsetX = 0,
                offsetY = 0,
                $body = FDG.$('body'),
                $el = FDG.$(element);
            function dragUpdate(e) {
                var pnt, ctm;
                if (dragging) {
                    pnt = element.nearestViewportElement.createSVGPoint();
                    pnt.x = e.clientX;
                    pnt.y = e.clientY;
                    ctm = element.getScreenCTM();
                    pnt = pnt.matrixTransform(ctm.inverse());

                    offsetX = pnt.x - lastX;
                    offsetY = pnt.y - lastY;
                    lastX = pnt.x;
                    lastY = pnt.y;
                    connection.alphaNode.point.x += offsetX;
                    connection.alphaNode.point.y += offsetY;
                    connection.alphaNode.pos(connection.alphaNode.pos() + 1);
                    connection.betaNode.point.x += offsetX;
                    connection.betaNode.point.y += offsetY;
                    connection.betaNode.pos(connection.betaNode.pos() + 1);
                    connection.pos(connection.pos() + 1);
                    FDG.publish({
                        "channel": "fdg-send-action",
                        "action": {
                            "action": "move-connection",
                            "connection": connection.guid(),
                            "alpha": connection.alphaNode.point,
                            "beta": connection.betaNode.point
                        }
                    });
                }
            }
            function dragStop() {
                dragging = false;
                if (FDG.util.graph.currentTool() === "hand") {
                    connection.alphaNode.selected(false);
                    connection.betaNode.selected(false);
                    $body.off('mousemove', dragUpdate).off('mouseup', dragStop).off('mouseleave', dragStop);
                    FDG.publish({
                        "channel": "fdg-send-action",
                        "action": {"action": "deselect-connection", "connection": connection.guid()}
                    });
                    FDG.publish({"channel": "fdg-dirty"});
                }
            }
            function dragStart(e) {
                var pnt, ctm;
                if (FDG.util.graph.currentTool() === "hand") {
                    dragging = true;
                    connection.alphaNode.selected(true);
                    connection.betaNode.selected(true);
                    pnt = element.nearestViewportElement.createSVGPoint();
                    pnt.x = e.clientX;
                    pnt.y = e.clientY;
                    ctm = element.getScreenCTM();
                    pnt = pnt.matrixTransform(ctm.inverse());

                    offsetX = pnt.x - lastX;
                    offsetY = pnt.y - lastY;
                    lastX = pnt.x;
                    lastY = pnt.y;
                    FDG.publish({
                        "channel": "fdg-send-action",
                        "action": {"action": "select-connection", "connection": connection.guid()}
                    });
                    $body.on('mousemove', dragUpdate).on('mouseup', dragStop).on('mouseleave', dragStop);
                }
            }
            function returnToNormal() {
                connection.hovered(false);
            }
            function highlight() {
                connection.hovered(true);
            }
            $el.on('mouseover', highlight).on('mouseout', returnToNormal).on('mouseleave', returnToNormal);
            function flipConnection() {
                if (FDG.util.graph.currentTool() === "hand") {
                    connection.flip();
                } else if (FDG.util.graph.currentTool() === "pen") {
                    editConnection(connection);
                } else if (FDG.util.graph.currentTool() === "scissor") {
                    FDG.publish({"channel": "fdg-connection-remove-request", "connection": connection});
                }
            }
            element.addEventListener("mousedown", dragStart, false);
            element.addEventListener("dblclick", flipConnection, false);
            FDG.ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $body.off('mousemove', dragUpdate).off('mouseup', dragStop).off('mouseleave', dragStop);
                element.removeEventListener("mousedown", dragStart);
                element.removeEventListener("dblclick", flipConnection);
            });
        }
    };
    FDG.ko.bindingHandlers.editConnection = {
        "init": function (element, valueAccessor) {
            function editIt() {
                editConnection(valueAccessor());
            }
            FDG.$(element).on('click', editIt);
            FDG.ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                FDG.$(element).off('click', editIt);
            });
        }
    };

});
