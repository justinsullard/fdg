/*jslint browser: true, regexp: true */
/*global define, require, exports, module */
define(["FDG"], function (FDG) {
    "use strict";
    FDG = FDG();

    var priv = {
        "renderIndex": FDG.ko.observable(0),
        "index": {},
        "propertyTypes": [
            "uuid",
            "int",
            "string",
            "char",
            "varchar",
            "text",
            "blob",
            "date",
            "time",
            "datetime",
            "boolean",
            "decimal",
            "function",
            "address",
            "json",
            "function",
            "custom"
        ],
        "nodeTypes": [
            "model",
            "view",
            "controller",
            "lookup",
            "module",
            "singleton",
            "config",
            "custom"
        ],
        "spreadingPairs": [],
        "nodes": FDG.ko.observableArray(),
        "nodesSorted": FDG.ko.computed({
            "read": function () {
                return priv.nodes().sort(function (a, b) {
                    // var ret = a.name() === b.name() ? 0 : (a.name() < b.name() ? 1 : -1);
                    var ret = a.label() === b.label() ? 0 : (a.label() < b.label() ? -1 : 1);
                    if (!ret) {
                        ret = a.nodeType() === b.nodeType() ? 0 : (a.nodeType() < b.nodeType() ? -1 : 1);
                    }
                    return ret;
                });
            },
            "deferEvaluation": true
        })
    };

    function Property(config) {
        var self = this;
        config = config || {};
        FDG.$.extend(self, {
            "name": FDG.ko.observable("New Property"),
            "description": FDG.ko.observable(""),
            "value": FDG.ko.observable(""),
            "type": FDG.ko.observable("text"),
            "formatDetails": FDG.ko.observable(""),
            "scope": FDG.ko.observable("instance"),
            "nullable": FDG.ko.observable(false),
            "accessControlled": FDG.ko.observable(false),
            "primaryKey": FDG.ko.observable(false),
            "indexed": FDG.ko.observable(false),
            "typeShortname": FDG.ko.computed({
                "read": function () {
                    return self.type().replace(/^(\w+).*$/, '$1');
                },
                "deferEvaluation": true
            })
        });
        self.set(config);
    }
    Property.prototype.serialize = function () {
        var self = this, i, ret = {};
        for (i in self) {
            if (self.hasOwnProperty(i)) {
                if (FDG.ko.isWritableObservable(self[i])) {
                    ret[i] = self[i]();
                }
            }
        }
        return ret;
    };
    Property.prototype.set = function (config) {
        var self = this, c, options = FDG.$.extend({}, config);
        for (c in options) {
            if (options.hasOwnProperty(c)) {
                if (FDG.ko.isWritableObservable(self[c])) {
                    self[c](options[c]);
                } else if (c === "label") {
                    self.name(options[c]);
                }
            }
        }
    };

    function Node(config) {
        var self = this;
        config = config || {};
        FDG.$.extend(self, {
            "pos": FDG.ko.observable(0),
            "guid": FDG.ko.observable(FDG.util.guid.make()),
            "label": FDG.ko.observable("New Node"),
            "description": FDG.ko.observable(""),
            "nodeType": FDG.ko.observable("model"),
            "radius": FDG.ko.observable(FDG.util.graph.setting("radius")).extend({"number": true}),
            "color": FDG.ko.observable("#cccccc"),
            "colorHighlight": FDG.ko.observable("#aaaaff"),
            "colorSelected": FDG.ko.observable("#f5f5f5"),
            "colorAnchored": FDG.ko.observable("#aaaaaa"),
            "anchored": FDG.ko.observable(false),
            "selected": FDG.ko.observable(false),
            "highlighted": FDG.ko.observable(false),
            "forces": FDG.util.point.make(),
            "velocity": FDG.util.point.make(),
            "point": FDG.util.point.make(),
            "properties": FDG.ko.observableArray([]),
            "currentColor": FDG.ko.computed({
                "read": function () {
                    var ret;
                    if (self.selected()) {
                        ret = self.colorSelected();
                    } else if (self.highlighted()) {
                        ret = self.colorHighlight();
                    } else if (self.anchored()) {
                        ret = self.colorAnchored();
                    } else {
                        ret = self.color();
                    }
                    return ret;
                },
                "deferEvaluation": true
            }),
            "currentStrokeColor": FDG.ko.computed({
                "read": function () {
                    return self.currentColor().replace(/[0-9a-f]{2}/ig, function (c) {
                        return Math.min(255, Math.round(parseInt(c, 16) * 0.833)).toString(16).replace(/^(\w)$/, '0$1');
                    });
                },
                "deferEvaluation": true
            }),
            "currentStrokeWidth": FDG.ko.computed({
                "read": function () {
                    return self.anchored() ? 1.5 : 1;
                },
                "deferEvaluation": true
            }),
            "currentX": FDG.ko.computed({
                "read": function () {
                    priv.renderIndex();
                    self.pos();
                    return self.point.x;
                },
                "deferEvaluation": true
            }),
            "currentY": FDG.ko.computed({
                "read": function () {
                    priv.renderIndex();
                    self.pos();
                    return self.point.y;
                },
                "deferEvaluation": true
            })
        });
        self.set(config);
    }
    Node.prototype.serialize = function () {
        var self = this, i, ret;
        ret = {};
        for (i in self) {
            if (self.hasOwnProperty(i)) {
                if (FDG.ko.isWritableObservable(self[i]) && i !== "pos") {
                    ret[i] = FDG.ko.toJS(self[i]);
                } else if (self[i].serialize) {
                    ret[i] = self[i].serialize();
                }
            }
        }
        return ret;
    };
    Node.prototype.addProperties = function (properties) {
        var self = this, i;
        if (FDG.util.array.validate(properties)) {
            for (i = 0; i < properties.length; i += 1) {
                self.addProperty(properties[i]);
            }
        } else if (FDG.util.object.validate(properties)) {
            for (i in properties) {
                if (properties.hasOwnProperty(i)) {
                    properties[i].name = i;
                    self.addProperty(properties[i]);
                }
            }
        } else {
            FDG.util.logging.warn("Unable to parse properties", properties);
        }
        return self;
    };
    Node.prototype.addProperty = function (property) {
        var self = this;
        self.properties.push(new Property(property));
        return self;
    };
    Node.prototype.set = function (config) {
        var self = this, c, C, options = FDG.$.extend({}, config);
        function colorReplacer(l) {
            return l.replace(/_/, '').toUpperCase();
        }
        for (c in options) {
            if (options.hasOwnProperty(c)) {
                if (FDG.ko.isWritableObservable(self[c])) {
                    if (c === "properties") {
                        self.addProperties(options[c]);
                    } else {
                        self[c](options[c]);
                    }
                } else if (self.hasOwnProperty(c)) {
                    if (c === "forces" || c === "velocity" || c === "point") {
                        self[c] = FDG.util.point.make(options[c]);
                        // self[c].zero().add(FDG.util.point.make(options[c]));
                    } else if (c === "properties") {
                        self.addProperties(options[c]);
                    } else {
                        FDG.util.logging.debug("Unknown property", c);
                    }
                } else if (c.match(/^color_/)) {
                    C = c.replace(/(_[a-z])/, colorReplacer);
                    if (FDG.ko.isWritableObservable(self[C])) {
                        self[C](options[c]);
                    }
                }
            }
        }
    };

    function smartColor(node, singular) {
        var color;
        color = node.color();
        if (color === "#cccccc" && node.colorAnchored() !== "#aaaaaa") {
            color = node.colorAnchored();
        }
        node.color(color);
        node.colorAnchored(FDG.util.color.darken(color));
        node.colorSelected(FDG.util.color.lighten(color));
        node.colorHighlight(FDG.util.color.toBlue(color));
        if (singular) {
            node.pos(node.pos() + 1);
            FDG.publish({"channel": "fdg-dirty"});
        }
    }
    function editNode(node) {
        var clone = new Node(node.serialize());
        clone.properties([]);
        clone.forces = FDG.util.point.make();
        clone.velocity = FDG.util.point.make();
        clone.point = FDG.util.point.make();
        FDG.publish({
            "channel": "fdg-show-modal",
            "title": "Edit Node",
            "viewModel": {
                // "node": node,
                "node": clone,
                "nodeTypes": priv.nodeTypes,
                "smartColor": smartColor,
                "saveAndCloseModal": function (context) {
                    var props = clone.serialize();
                    delete props.point;
                    delete props.forces;
                    delete props.velocity;
                    delete props.highlighted;
                    delete props.anchored;
                    delete props.selected;
                    clone.highlighted(node.highlighted());
                    node.set(props);
                    node.pos(node.pos() + 1);
                    context.closeModal.apply(this, arguments);
                    FDG.publish({
                        "channel": "fdg-send-action",
                        "action": {
                            "action": "node-set",
                            "node": node.guid(),
                            "properties": props
                        }
                    });
                    FDG.publish({"channel": "fdg-dirty"});
                }
            },
            "template": "templates.node.edit"
        });
    }

    function clearNodes() {
        priv.index = {};
        priv.spreadingPairs = [];
        priv.nodes.removeAll();
        // FDG.ko.cleanNode(FDG.$('.nodeGroup').get(0));
        // FDG.ko.cleanNode(FDG.$('.nodeList').get(0));
    }
    function getNode(guid) {
        return priv.index[guid];
    }
    function searchNodes(label) {
        return FDG.ko.utils.arrayFilter(priv.nodes(), function (node) {
            return node.label() === label;
        });
    }
    function onRenderStepComplete() {
        priv.renderIndex(priv.renderIndex() + 1);
    }

    function updateSpreadingPairs() {
        var i, j, nodes = priv.nodes(), l = nodes.length;
        priv.spreadingPairs = [];
        for (i = 0; i < l - 1; i += 1) {
            for (j = i + 1; j < l; j += 1) {
                if (FDG.util.connection.ofNode(nodes[i], nodes[j]).length === 0) {
                    priv.spreadingPairs.push([nodes[i], nodes[j]]);
                }
            }
        }
        // FDG.util.logging.debug(priv.spreadingPairs.length, "spreading pairs identified for", priv.nodes().length, "nodes");
    }
    function onGraphLoadSuccess(message) {
        var i, nodes = [], node;
        if (FDG.util.object.validate(message.graph)) {
            clearNodes();
            if (FDG.util.array.validate(message.graph.nodes)) {
                for (i = 0; i < message.graph.nodes.length; i += 1) {
                    node = new Node(message.graph.nodes[i]);
                    priv.index[node.guid()] = node;
                    nodes.push(node);
                }
            }
            priv.nodes(nodes);
            FDG.publish({"channel": "fdg-node-load-success", "graph": message.graph});
            updateSpreadingPairs();
        }
    }

    function onMoveAllNodes(message) {
        var i, nodes = priv.nodes(), l = nodes.length;
        if (FDG.util.point.validate(message.point)) {
            for (i = 0; i < l; i += 1) {
                nodes[i].point.add(message.point);
                nodes[i].pos(nodes[i].pos() + 1);
            }
            FDG.publish({"channel": "fdg-dirty"});
        }
    }
    function flipNodesHorizontal(message) {
        var i,
            nodes = priv.nodes(),
            l = nodes.length,
            offset,
            target = FDG.util.point.validate(message.target) ? message.target.clone() : FDG.util.node.center();
        for (i = 0; i < l; i += 1) {
            offset = nodes[i].point.clone().subtract(target);
            offset.x *= -1;
            offset.add(target);
            nodes[i].point = offset;
            nodes[i].forces.x *= -1;
            nodes[i].velocity.x *= -1;
            nodes[i].pos(nodes[i].pos() + 1);
        }
        FDG.publish({"channel": "fdg-dirty"});
    }
    function flipNodesVertical(message) {
        var i,
            nodes = priv.nodes(),
            l = nodes.length,
            offset,
            target = FDG.util.point.validate(message.target) ? message.target.clone() : FDG.util.node.center();
        for (i = 0; i < l; i += 1) {
            offset = nodes[i].point.clone().subtract(target);
            offset.y *= -1;
            offset.add(target);
            nodes[i].point = offset;
            nodes[i].forces.y *= -1;
            nodes[i].velocity.y *= -1;
            nodes[i].pos(nodes[i].pos() + 1);
        }
        FDG.publish({"channel": "fdg-dirty"});
    }

    function applySpreading() {
        var i, pairs = priv.spreadingPairs, l = pairs.length, dir, mag, settings;
        settings = {
            "spreading": FDG.util.graph.setting("spreading"),
            "orbit": FDG.util.graph.setting("orbit")
        };
        for (i = 0; i < l; i += 1) {
            dir = pairs[i][0].point.clone().subtract(pairs[i][1].point);
            mag = dir.magnitude();
            dir.normalize().multiply(settings.spreading / (mag * mag / settings.orbit) / 2);
            pairs[i][0].forces.add(dir);
            pairs[i][1].forces.subtract(dir);
        }
        // for (i = 0; i < l - 1; i += 1) {
        //     for (j = i + 1; j < l; j += 1) {
        //         if (FDG.util.connection.ofNode(nodes[i], nodes[j]).length === 0) {
        //             dir = nodes[i].point.clone().subtract(nodes[j].point);
        //             mag = dir.magnitude();
        //             dir.normalize().multiply(settings.spreading / (mag * mag / settings.orbit) / 2);
        //             nodes[i].forces.add(dir);
        //             nodes[j].forces.subtract(dir);
        //         }
        //     }
        // }
    }

    function updateNodes(message) {
        var i, nodes = priv.nodes(), l = nodes.length, settings;
        settings = message.settings || {
            "speed": FDG.util.graph.setting("speed"),
            "damping": FDG.util.graph.setting("damping"),
            "width": FDG.util.graph.setting("width"),
            "height": FDG.util.graph.setting("height")

        };
        for (i = 0; i < l; i += 1) {
            if (nodes[i].selected() || nodes[i].anchored()) {
                nodes[i].velocity.zero();
            } else {
                nodes[i].velocity.add(nodes[i].forces.multiply(settings.speed)).multiply(settings.damping);
                nodes[i].point.add(nodes[i].velocity.clone().multiply(settings.speed));
            }
            nodes[i].point.x = Math.max(nodes[i].point.x, nodes[i].radius());
            nodes[i].point.x = Math.min(nodes[i].point.x, settings.width - nodes[i].radius());
            nodes[i].point.y = Math.max(nodes[i].point.y, nodes[i].radius());
            nodes[i].point.y = Math.min(nodes[i].point.y, settings.height - nodes[i].radius());
            nodes[i].forces.zero();
        }
        priv.renderIndex(priv.renderIndex() + 1);
    }

    function onFDGStartSuccess() {
        var $graph = FDG.$('#FDG-Graph'), svg = $graph[0], $body = FDG.$('body');
        FDG.$('.nodeListToggle').click(function () {
            $body.toggleClass("nodeListHidden");
        });

        function makeNewNode(e) {
            var newNode, pnt, ctm, config;
            if (FDG.util.graph.currentTool() === "pen") {
                if (
                    FDG.$(e.originalEvent.target).closest(".node").length === 0 &&
                        svg === e.target
                ) {
                    pnt = svg.createSVGPoint();
                    pnt.x = e.clientX;
                    pnt.y = e.clientY;
                    ctm = svg.getScreenCTM();
                    pnt = pnt.matrixTransform(ctm.inverse());
                    config = {
                        "label": "New Node " + priv.nodes().length
                    };
                    newNode = new Node(config);
                    newNode.point.add(FDG.util.point.make(pnt.x, pnt.y));
                    priv.index[newNode.guid()] = newNode;
                    priv.nodes.push(newNode);
                    FDG.publish({"channel": "fdg-node-add-success"});
                    editNode(newNode);
                }
            }
        }
        $graph.on("dblclick", makeNewNode).on('dragstart', function (e) { e.preventDefault(); });
        FDG.ko.applyBindings({"nodes": priv.nodesSorted}, FDG.$('.nodeGroup').get(0));
        FDG.ko.applyBindings({"nodes": priv.nodesSorted}, FDG.$('.nodeList').get(0));
        FDG.util.logging.debug("module/node started");
        return;
    }

    function serializeAll() {
        var ret = [], i, nodes = priv.nodes(), l = nodes.length;
        for (i = 0; i < l; i += 1) {
            ret.push(nodes[i].serialize());
        }
        return ret;
    }

    function getSpreadingSync() {
        return priv.nodes().map(function (n) { return {"guid": n.guid(), "point": n.point}; });
    }

    function averagePoint() {
        var ret = FDG.util.point.make(), i, nodes = priv.nodes(), l = nodes.length;
        for (i = 0; i < l; i += 1) {
            ret.add(nodes[i].point);
        }
        ret.divide(l);
        return ret;
    }

    function smartColoring() {
        var i, nodes = priv.nodes(), l = nodes.length;
        for (i = 0; i < l; i += 1) {
            smartColor(nodes[i]);
        }
        priv.renderIndex(priv.renderIndex() + 1);
        FDG.publish({"channel": "fdg-dirty"});
    }
    function removeNode(message) {
        var i, conns = [];
        if (message.node && priv.index[message.node.guid()]) {
            conns = FDG.util.connection.ofNode(message.node);
            delete priv.index[message.node.guid()];
            priv.nodes.remove(message.node);
            FDG.publish({"channel": "fdg-connection-remove-request", "connections": conns});
            FDG.publish({"channel": "fdg-node-remove-success"});
        } else if (FDG.util.array.validate(message.nodes)) {
            for (i = 0; i < message.nodes.length; i += 1) {
                if (priv.index[message.nodes[i].guid()]) {
                    conns = conns.concat(FDG.util.connection.ofNode(message.nodes[i]));
                    delete priv.index[message.nodes[i].guid()];
                    priv.nodes.remove(message.nodes[i]);
                }
            }
            FDG.publish({"channel": "fdg-connection-remove-request", "connections": conns});
            FDG.publish({"channel": "fdg-node-remove-success"});
        }
    }
    function moveNode(message) {
        var node = priv.index[message.node];
        if (node && FDG.util.object.validate(message.point)) {
            node.point = FDG.util.point.make(message.point);
            node.pos(node.pos() + 1);
        }
    }
    function selectNode(message) {
        var node = priv.index[message.node];
        if (node) { node.selected(true); }
    }
    function deselectNode(message) {
        var node = priv.index[message.node];
        if (node) { node.selected(false); }
    }
    function toggleNode(message) {
        var node = priv.index[message.node];
        if (node && FDG.util.boolean.validate(message.anchored)) {
            node.anchored(FDG.util.boolean.getAs(message.anchored));
        }
    }
    function nodeSync(message) {
        message.nodes.forEach(function (obj) {
            var node = priv.index[obj.guid];
            if (node) {
                node.point = FDG.util.point.make(obj.point);
            }
        });
        priv.renderIndex(priv.renderIndex + 1);
    }
    function nodeSet(message) {
        var node = priv.index[message.node];
        if (node && FDG.util.object.validate(message.properties)) {
            node.set(message.properties);
            node.pos(node.pos() + 1);
        }
    }

    FDG.subscribe({"channel": "fdg-start-success", "callback": onFDGStartSuccess});
    FDG.subscribe({"channel": "fdg-render-step-complete", "callback": onRenderStepComplete});
    FDG.subscribe({"channel": "fdg-graph-load-success", "callback": onGraphLoadSuccess});
    FDG.subscribe({"channel": "fdg-apply-spreading", "callback": applySpreading});
    FDG.subscribe({"channel": "fdg-update-nodes", "callback": updateNodes});
    FDG.subscribe({"channel": "fdg-graph-close-success", "callback": clearNodes});
    FDG.subscribe({"channel": "fdg-smart-coloring", "callback": smartColoring});
    FDG.subscribe({"channel": "fdg-node-remove-request", "callback": removeNode});

    FDG.subscribe({"channel": "fdg-node-add-success", "callback": updateSpreadingPairs});
    FDG.subscribe({"channel": "fdg-move-all-nodes", "callback": onMoveAllNodes});
    FDG.subscribe({"channel": "fdg-flip-nodes-horizontal", "callback": flipNodesHorizontal});
    FDG.subscribe({"channel": "fdg-flip-nodes-vertical", "callback": flipNodesVertical});
    FDG.subscribe({"channel": "fdg-connection-add-success", "callback": updateSpreadingPairs});
    FDG.subscribe({"channel": "fdg-connection-remove-success", "callback": updateSpreadingPairs});

    // FDG.subscribe({"channel": "fdg-move-node", "callback": moveNode});
    // FDG.subscribe({"channel": "fdg-select-node", "callback": selectNode});
    // FDG.subscribe({"channel": "fdg-deselect-node", "callback": deselectNode});
    // FDG.subscribe({"channel": "fdg-toggle-node", "callback": toggleNode});
    // FDG.subscribe({"channel": "fdg-node-sync", "callback": nodeSync});

    FDG.subscribe({
        "channel": "fdg-socket-ready",
        "count": 1,
        "callback": function () {
            FDG.util.socket.on("action-move-node", moveNode);
            FDG.util.socket.on("action-select-node", selectNode);
            FDG.util.socket.on("action-deselect-node", deselectNode);
            FDG.util.socket.on("action-toggle-node", toggleNode);
            FDG.util.socket.on("action-node-sync", nodeSync);
            FDG.util.socket.on("action-node-set", nodeSet);
        }
    });

    FDG.ko.bindingHandlers.nodeLabel = {
        "init":  function (element, valueAccessor) {
            var node, subs = [], text, rect, dim, width;
            node = valueAccessor();
            function updateLabel() {
                var x = node.currentX(), y = node.currentY();
                // Do stuff here
                text.setAttribute("x", x - (dim.width / 2));
                text.setAttribute("y", y + 2.5);
                rect.setAttribute("width", width);
                rect.setAttribute("height", dim.height + 2);
                rect.setAttribute("x", x - (width / 2));
                rect.setAttribute("y", y - (dim.height / 2) - 1);
            }
            function updateDim() {
                text.textContent = node.label();
                dim = text.getBBox();
                width = Math.max(dim.width + 4, node.radius() * 2 + 4);
                updateLabel();
            }
            text = element.getElementsByTagName('text')[0];
            rect = element.getElementsByTagName('rect')[0];
            subs.push(node.label.subscribe(updateDim));
            subs.push(node.radius.subscribe(updateDim));
            subs.push(node.pos.subscribe(updateLabel));
            subs.push(priv.renderIndex.subscribe(updateLabel));
            // subs.push(node.currentX.subscribe(updateLabel));
            // subs.push(node.currentY.subscribe(updateLabel));
            FDG.ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                var i;
                for (i = 0; i < subs.length; i += 1) {
                    subs[i].dispose();
                }
            });
            updateDim();
        }
    };
    FDG.ko.bindingHandlers.nodeControl = {
        "init": function (element, valueAccessor) {
            var node, dragging = false, offsetX = 0, offsetY = 0, circle, dummy, $el = FDG.$(element), $body = FDG.$('body'), $graph = FDG.$('#FDG-Graph');
            node = valueAccessor();
            circle = element.getElementsByTagName('circle')[0];
            function dragUpdate(e) {
                var pnt, ctm;
                if (dragging) {
                    pnt = circle.nearestViewportElement.createSVGPoint();
                    pnt.x = e.clientX;
                    pnt.y = e.clientY;
                    ctm = circle.getScreenCTM();
                    pnt = pnt.matrixTransform(ctm.inverse());
                    // node.point.x = pnt.x - offsetX;
                    // node.point.y = pnt.y - offsetY;
                    node.point.x = Math.max(pnt.x - offsetX, node.radius());
                    node.point.x = Math.min(node.point.x, FDG.util.graph.setting("width") - node.radius());
                    node.point.y = Math.max(pnt.y - offsetY, node.radius());
                    node.point.y = Math.min(node.point.y, FDG.util.graph.setting("height") - node.radius());
                    FDG.publish({
                        "channel": "fdg-send-action",
                        "action": {
                            "action": "move-node",
                            "node": node.guid(),
                            "point": node.point
                        }
                    });
                    node.pos(node.pos() + 1);
                } else if (FDG.util.graph.currentTool() === "pen" && dummy) {
                    pnt = circle.nearestViewportElement.createSVGPoint();
                    pnt.x = e.clientX;
                    pnt.y = e.clientY;
                    ctm = circle.getScreenCTM();
                    pnt = pnt.matrixTransform(ctm.inverse());
                    // node.point.x = pnt.x - offsetX;
                    // node.point.y = pnt.y - offsetY;
                    dummy.point.x = Math.max(pnt.x - offsetX, dummy.radius());
                    dummy.point.x = Math.min(dummy.point.x, FDG.util.graph.setting("width") - dummy.radius());
                    dummy.point.y = Math.max(pnt.y - offsetY, node.radius());
                    dummy.point.y = Math.min(dummy.point.y, FDG.util.graph.setting("height") - dummy.radius());
                    dummy.pos(dummy.pos() + 1);
                    FDG.publish({"channel": "fdg-pen-connection-update"});
                }
            }
            function dragStop() {
                dragging = false;
                node.selected(false);
                dummy = null;
                FDG.publish({
                    "channel": "fdg-send-action",
                    "action": {"action": "deselect-node", "node": node.guid()}
                });
                $body.off('mousemove', dragUpdate).off('mouseup', dragStop).off('mouseleave', dragStop);
                FDG.publish({"channel": "fdg-dirty"});
            }
            function negligiblePenUp(e) {
                if (FDG.util.graph.currentTool() === "pen") {
                    // Check the originalEvent target
                    if (FDG.$(e.originalEvent.target).closest(".node").length === 0) {
                        FDG.publish({"channel": "fdg-pen-connection-cancel"});
                    }
                }
                $graph.off('mousemove', dragUpdate).off('mouseup', negligiblePenUp).off('mouseleave', negligiblePenUp);
                return true;
            }
            function dragStart(e) {
                var pnt, ctm;
                if (FDG.util.graph.currentTool() === "hand") {
                    if (!node.selected()) {
                        dragging = true;
                        node.selected(true);
                        node.highlighted(false);
                        pnt = circle.nearestViewportElement.createSVGPoint();
                        pnt.x = e.clientX;
                        pnt.y = e.clientY;
                        ctm = circle.getScreenCTM();
                        pnt = pnt.matrixTransform(ctm.inverse());
                        offsetX = pnt.x - node.point.x;
                        offsetY = pnt.y - node.point.y;
                        FDG.publish({
                            "channel": "fdg-send-action",
                            "action": {"action": "select-node", "node": node.guid()}
                        });
                        FDG.$('body').on('mousemove', dragUpdate).on('mouseup', dragStop).on('mouseleave', dragStop);
                    }
                } else if (FDG.util.graph.currentTool() === "pen") {
                    dummy = new Node();
                    dummy.point.add(node.point);
                    pnt = circle.nearestViewportElement.createSVGPoint();
                    pnt.x = e.clientX;
                    pnt.y = e.clientY;
                    ctm = circle.getScreenCTM();
                    pnt = pnt.matrixTransform(ctm.inverse());
                    offsetX = pnt.x - node.point.x;
                    offsetY = pnt.y - node.point.y;
                    FDG.publish({
                        "channel": "fdg-pen-connection-start",
                        "node": node,
                        "dummyNode": dummy
                    });
                    $graph.on('mousemove', dragUpdate).on('mouseup', negligiblePenUp).on('mouseleave', negligiblePenUp);
                }
                event.preventDefault();
            }
            function penUp() {
                if (FDG.util.graph.currentTool() === "pen") {
                    dummy = null;
                    FDG.publish({
                        "channel": "fdg-pen-connection-end",
                        "node": node
                    });
                }
            }
            function returnToNormal() {
                node.highlighted(false);
            }
            function highlight() {
                node.highlighted(true);
            }
            function toggleAnchored() {
                if (FDG.util.graph.currentTool() === "hand") {
                    node.anchored(!node.anchored());
                    FDG.publish({"channel": "fdg-dirty"});
                    FDG.publish({
                        "channel": "fdg-send-action",
                        "action": {"action": "toggle-node", "node": node.guid(), "anchored": node.anchored()}
                    });
                } else if (FDG.util.graph.currentTool() === "pen") {
                    editNode(node);
                } else if (FDG.util.graph.currentTool() === "scissor") {
                    FDG.publish({"channel": "fdg-node-remove-request", "node": node});
                }
            }
            $el.on('mouseover', highlight).on('mouseout', returnToNormal).on('mouseleave', returnToNormal);
            element.addEventListener("mousedown", dragStart);
            element.addEventListener("mouseup", penUp);
            element.addEventListener("dblclick", toggleAnchored);
            FDG.ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                dummy = null;
                $el.off('mouseover', highlight).off('mouseout', returnToNormal).off('mouseleave', returnToNormal);
                $body.off('mousemove', dragUpdate).off('mouseup', dragStop).off('mouseleave', dragStop).off('mouseleave', negligiblePenUp);
                element.removeEventListener("mousedown", dragStart);
                element.removeEventListener("mouseup", penUp);
                element.removeEventListener("dblclick", toggleAnchored);
            });
        }
    };

    FDG.ko.bindingHandlers.expandable = {
        "init": function (element) {
            FDG.$(element).find('.expander').click(function () { FDG.$(element).toggleClass('expanded'); });
        }
    };

    FDG.ko.bindingHandlers.editNode = {
        "init": function (element, valueAccessor) {
            function editIt() {
                editNode(valueAccessor());
            }
            FDG.$(element).on('click', editIt);
            FDG.ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                FDG.$(element).off('click', editIt);
            });
        }
    };

    FDG.ko.bindingHandlers.centerOnNode = {
        "init": function (element, valueAccessor) {
            var node = valueAccessor(),
                $el = FDG.$(element);
            function centerIt() {
                FDG.publish({
                    "channel": "fdg-graph-center",
                    "target": valueAccessor().point.clone()
                });
            }
            function returnToNormal() {
                node.highlighted(false);
            }
            function highlight() {
                node.highlighted(true);
            }
            $el.on('mouseover', highlight).on('mouseout', returnToNormal).on('mouseleave', returnToNormal);
            $el.on('click', centerIt);
            FDG.ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
                $el.off('click', centerIt);
            });
        }
    };

    FDG.util.extend({
        "dest": FDG.util,
        "source": {
            "node": {
                "get": getNode,
                "search": searchNodes,
                "store": serializeAll,
                "center": averagePoint,
                "sync": getSpreadingSync
            }
        }
    });

// REFERENCE FOR A COLOR PICKER:
// http://tech.pro/tutorial/653/javascript-interactive-color-picker

});
