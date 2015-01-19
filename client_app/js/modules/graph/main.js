/*jslint browser: true */
/*global define, require, XMLSerializer, Blob, performance */
define(["FDG"], function (FDG) {
    "use strict";
    FDG = FDG();

    var priv = {
        "loaded": false,
        "graph": null,
        "viewModel": {
            "fps": FDG.ko.observable("... fps"),
            "currentTool": FDG.ko.observable("hand"),
            "graph": FDG.ko.observable(null),
            "loading": FDG.ko.observable(false)
        }
    };

    function Graph(config) {
        var self = this;
        config = config || {};
        FDG.$.extend(self, {
            "label": FDG.ko.observable("New Graph"),
            "guid": FDG.ko.observable(FDG.util.guid.make()),
            "notes": FDG.ko.observable(""),
            "width": FDG.ko.observable(1600).extend({"number": true}),
            "height": FDG.ko.observable(1600).extend({"number": true}),
            "orbit": FDG.ko.observable(60).extend({"number": true}),
            "radius": FDG.ko.observable(10).extend({"number": true}),
            "speed": FDG.ko.observable(0.5).extend({"number": true}),
            "damping": FDG.ko.observable(0.5).extend({"number": true}),
            "running": FDG.ko.observable(true),
            "spreading": FDG.ko.observable(500).extend({"number": true}),
            "spring": FDG.ko.observable(1).extend({"number": true}),
            "dirty": FDG.ko.observable(false)
        });
        self.set(config);
    }
    Graph.prototype.set = function (config) {
        var self = this, c, s, options = FDG.$.extend({}, config);
        for (c in options) {
            if (options.hasOwnProperty(c)) {
                if (FDG.ko.isWritableObservable(self[c])) {
                    self[c](options[c]);
                } else if (self.hasOwnProperty(c)) {
                    self[c] = options[c];
                } else if (c === "settings") {
                    for (s in options[c]) {
                        if (options[c].hasOwnProperty(s)) {
                            if (FDG.ko.isWritableObservable(self[s])) {
                                self[s](options[c][s]);
                            } else if (self.hasOwnProperty(s)) {
                                self[s] = options[c][s];
                            // } else {
                            //     FDG.util.logging.debug("Unknown property", s);
                            }
                        }
                    }
                }
            }
        }
    };
    Graph.prototype.serialize = function () {
        var self = this, i, ret;
        ret = {};
        for (i in self) {
            if (self.hasOwnProperty(i)) {
                if (FDG.ko.isWritableObservable(self[i]) && i !== "dirty") {
                    ret[i] = FDG.ko.toJS(self[i]);
                }
            }
        }
        return ret;
    };

    function getSetting(setting) {
        var ret;
        if (priv.graph) {
            if (FDG.ko.isObservable(priv.graph[setting])) {
                ret = priv.graph[setting]();
            } else if (priv.graph.hasOwnProperty(setting)) {
                ret = priv.graph[setting];
            }
        }
        return ret;
    }
    function animationLoop() {
        window.requestAnimFrame(animationLoop);
        if (priv.graph && priv.graph.running()) {
            FDG.publish({"channel": "fdg-apply-spreading"});
            FDG.publish({"channel": "fdg-apply-connections"});
            FDG.publish({"channel": "fdg-update-nodes"});
            FDG.publish({"channel": "fdg-update-connections"});
        }
    }
    function updateHistory(graph) {
        var tail;
        if (graph === undefined && !window.history.state) {
            window.history.pushState({"graph": null}, document.title, window.location.pathname);
        } else if (graph !== undefined) {
            graph = graph || null;
            tail = priv.graph ? "#" + priv.graph.label() : "";
            FDG.publish({"channel": "fdg-title-request", "title": graph || ""});
            if (window.history.state && window.history.state.graph === null) {
                FDG.util.logging.info("Replacing history state", graph);
                window.history.replaceState({"graph": graph}, document.title, window.location.pathname + tail);
            } else if (graph && (!window.history.state || window.history.state.graph !== graph)) {
                FDG.util.logging.info("Pushing history state", graph);
                window.history.pushState({"graph": graph}, document.title, window.location.pathname + tail);
            // } else {
            //     FDG.util.logging.info("Ignoring history state", graph);
            }
        }
    }
    function onHashChange() {
        var newHash = window.location.hash.slice(1),
            state = window.history.state,
            currGraph = priv.graph ? priv.graph.label() : null;
        // FDG.util.logging.debug("Responding to hashchange", newHash, state);
        if (state && state.graph && state.graph !== currGraph) {
            // FDG.util.logging.debug("Would be trying to load graph", state.graph);
            FDG.publish({"channel": "fdg-graph-load-request", "label": state.graph, "history": true});
        } else if (!newHash && !state && priv.graph) {
            // FDG.util.logging.debug("Closing current graph");
            FDG.publish({"channel": "fdg-graph-close-request"});
        }
    }
    function closeGraph(message) {
        FDG.util.logging.debug("Closing graph");
        priv.graph = null;
        priv.viewModel.graph(priv.graph);
        FDG.publish({"channel": "fdg-graph-close-success"});
        FDG.publish({"channel": "fdg-title-request", "title": ""});
        FDG.$("#FDG-Graph").attr("width", 0).attr("height", 0);
        if (!message || !message.history) {
            updateHistory(null);
        }
        // if (window.history.state && window.history.state.graph === null) {
        //     window.history.replaceState({"graph": null}, document.title, window.location.pathname);
        // } else {
        //     window.history.pushState({"graph": null}, document.title, window.location.pathname);
        // }
    }
    function centerGraph(message) {
        var container = FDG.$('.graphContainer'),
            containerWidth = container.width(),
            containerHeight = container.height(),
            target = message && message.target ? message.target.clone() : FDG.util.node.center(),
            centering = FDG.util.point.make(containerWidth / 2, containerHeight / 2);
        target.subtract(centering);
        FDG.$('.graphContainer').scrollLeft(target.x);
        FDG.$('.graphContainer').scrollTop(target.y);
    }
    function loadGraphSuccess(json, label) {
        var graph;
        function update() {
            FDG.$("#FDG-Graph").attr("width", priv.graph.width()).attr("height", priv.graph.height());
            FDG.publish({"channel": "fdg-title-request", "title": priv.graph.label()});
        }
        if (json && json.data) {
            try {
                graph = JSON.parse(json.data);
                graph.label = graph.label || label;
                priv.graph = new Graph(graph);
                priv.viewModel.graph(priv.graph);
                FDG.$("#FDG-Graph").attr("width", priv.graph.width()).attr("height", priv.graph.height());
                setTimeout(function () {
                    FDG.publish({"channel": "fdg-graph-load-success", "graph": graph});
                    // FDG.publish({"channel": "fdg-title-request", "title": priv.graph.label()});
                    centerGraph();
                    priv.viewModel.loading(false);
                    // priv.graph.dirty(false);
                    FDG.publish({"channel": "fdg-clean"});
                }, 1);
                priv.graph.width.subscribe(update);
                priv.graph.height.subscribe(update);
                priv.graph.label.subscribe(update);
                updateHistory(priv.graph.label());
                // if (window.history.state && window.history.state.graph !== priv.graph.label()) {
                //     window.history.replaceState({"graph": priv.graph.label()}, document.title, window.location.pathname + "#" + priv.graph.label());
                // } else {
                //     window.history.pushState({"graph": priv.graph.label()}, document.title, window.location.pathname + "#" + priv.graph.label());
                // }
                // window.location.hash = "#" + label;
            } catch (err) {
                FDG.util.logging.error("Error parsing graph data", err);
                FDG.util.logging.debug("Received json", json);
                // window.location.hash = "";
                updateHistory(null);
                // if (window.history.state && window.history.state.graph !== null) {
                //     window.history.replaceState({"graph": graph.label}, document.title, window.location.pathname + "#" + graph.label);
                // } else {
                //     window.history.pushState({"graph": graph.label}, document.title, window.location.pathname + "#" + graph.label);
                // }
            }
        } else {
            FDG.util.logging.error("Invalid response from server when loading graph", json, label);
            updateHistory(null);
            // if (window.history.state && window.history.state.graph !== null) {
            //     window.history.replaceState({"graph": graph.label}, document.title, window.location.pathname + "#" + graph.label);
            // } else {
            //     window.history.pushState({"graph": graph.label}, document.title, window.location.pathname + "#" + graph.label);
            // }
        }
    }
    function loadGraphError() {
        window.location.hash = "";
        priv.viewModel.loading(false);
        FDG.util.logging.error("Error loading graph", arguments.slice(0));
    }
    function loadGraph(message) {
        if (message && FDG.util.string.validate(message.label)) {
            if (priv.graph) {
                closeGraph(message);
            }
            priv.viewModel.loading(true);
            setTimeout(function () {
                FDG.$.ajax({
                    "url": "FDG",
                    "dataType": "json",
                    "data": {
                        'action': "loadGraph",
                        'label': message.label
                    },
                    "success": function (json) {
                        loadGraphSuccess(json, message.label);
                    },
                    "error": loadGraphError
                });
            }, 1);
        }
    }
    function newGraph() {
        var graph;
        if (priv.graph) {
            closeGraph();
        }
        function update() {
            FDG.$("#FDG-Graph").attr("width", priv.graph.width()).attr("height", priv.graph.height());
            FDG.publish({"channel": "fdg-title-request", "title": priv.graph.label()});
        }
        graph = new Graph({"label": "Graph " + new Date().toISOString().replace(/\W/g, '_')});
        priv.graph = graph;
        priv.viewModel.graph(priv.graph);
        FDG.$("#FDG-Graph").attr("width", priv.graph.width()).attr("height", priv.graph.height());
        setTimeout(function () {
            FDG.publish({"channel": "fdg-graph-load-success", "graph": graph});
            // FDG.publish({"channel": "fdg-title-request", "title": priv.graph.label()});
            centerGraph();
        }, 1);
        priv.graph.width.subscribe(update);
        priv.graph.height.subscribe(update);
        priv.graph.label.subscribe(update);
        updateHistory(priv.graph.label());
        // window.location.hash = "#" + priv.graph.label();
    }
    function generateThumbnail(canvas) {
        var f, t, c, ret;
        FDG.util.logging.debug("Generating thumbnail from canvas");
        f = Math.sqrt((512 * 512) / (canvas.width * canvas.height));
        t = document.createElement("canvas");
        t.width = Math.floor(canvas.width  * f);
        t.height = Math.floor(canvas.height * f);
        t.style.width = t.width + "px";
        t.style.height = t.height + "px";
        c = t.getContext("2d");
        c.font = "8pt Helvetica";
        c.drawImage(canvas, 0, 0, canvas.width, canvas.height, 0, 0, t.width, t.height);
        t = t.toDataURL("image/png");
        ret = t.replace(/^data:image\/png;base64,/, "");
        // FDG.util.logging.debug("Thumbnail generated");
        return ret;
    }
    function generateSnapshot(cb) {
        var ret = {}, svg, svgString, canvas, ctx, DOMURL, img, url, blob;
        if (priv.graph) {
            // FDG.util.logging.debug("Preparing SVG serialization into image");
            svg = FDG.$("#FDG-Graph");
            svgString = new XMLSerializer().serializeToString(svg.get(0));
            canvas = document.createElement("canvas");
            canvas.width = svg.width() * 2;
            canvas.height = svg.height() * 2;
            ctx = canvas.getContext("2d");
            DOMURL = window.URL || window.webkitURL || window;
            img = new Image();
            blob = new Blob([svgString], {"type": "image/svg+xml;charset=utf-8"});
            url = DOMURL.createObjectURL(blob);
            img.onload = function () {
                // FDG.util.logging.debug("SVG loaded into image, applying to canvas element");
//    c.drawImage(i, 0, 0, i.width, i.height, 0, 0, t.width, t.height);
                ctx.font = "8pt Helvetica";
                ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, canvas.width, canvas.height);
                ret.snapshot = canvas.toDataURL("image/png").replace(/^data:image\/png;base64,/, "");
                ret.thumbnail = generateThumbnail(canvas);
                DOMURL.revokeObjectURL(url);
                // FDG.util.logging.debug("Data URL generated for PNG, preparing callback");
                cb(ret);
            };
            img.src = url;
        }
    }
    function saveGraph() {
        var graph;
        function saveIt(images) {
            // FDG.util.logging.debug("Thumbnail generated, sending save request to server");
            FDG.$.ajax({
                "url": "FDG",
                "dataType": "json",
                "type": "POST",
                "data": {
                    "action": "saveGraph",
                    "label": graph.label,
                    'graph': JSON.stringify(graph),
                    'thumbnail': images.thumbnail
                },
                success: function (json) {
                    if (json) {
                        if (json.message) {
                            FDG.util.logging.debug("[Message from server] " + json.message);
                        }
                        if (json.success) {
                            FDG.util.logging.debug("Successfully saved graph", graph.label);
                            // FDG.publish({"channel": "fdg-title-request", "title": graph.label});
                            updateHistory(priv.graph.label());
                            // if (window.location.hash.slice(1) !== graph.label) {
                            //     window.history.replaceState({"graph": graph.label}, document.title, window.location.pathname + "#" + graph.label);
                            // }
                            FDG.publish({"channel": "fdg-graph-save-success"});
                            FDG.publish({"channel": "fdg-clean"});
                            // priv.graph.dirty(false);
                        }
                    }
                }
            });
        }
        if (priv.graph) {
            graph = priv.graph.serialize();
            graph.nodes = FDG.util.node.store();
            graph.connections = FDG.util.connection.store();
            // FDG.util.logging.debug("Generating thumbnail in preparation for saving graph");
            generateSnapshot(saveIt);
        }
    }
    function pauseGraph(message) {
        if (priv.graph) {
            priv.graph.running(false);
            if (!(message && message.socket)) {
                FDG.publish({"channel": "fdg-graph-pause-success"});
            }
        }
    }
    function runGraph(message) {
        if (priv.graph) {
            priv.graph.running(true);
            if (!(message && message.socket)) {
                FDG.publish({"channel": "fdg-graph-run-success"});
            }
        }
    }
    function onDirty(message) {
        if (priv.graph) {
            priv.graph.dirty(true);
            if (message && !message.action) {
                FDG.util.logging.debug("Sending graph-dirty through socket");
                FDG.publish({"channel": "fdg-send-action", "action": {"action": "graph-dirty"}});
            }
        }
    }
    function onClean(message) {
        if (priv.graph) {
            priv.graph.dirty(false);
            if (message && !message.action) {
                FDG.publish({"channel": "fdg-send-action", "action": {"action": "graph-clean"}});
            }
        }
    }
    function openGraphList() {
        FDG.$.ajax({
            "url": "FDG",
            "dataType": "json",
            "data": {
                "action": "listGraphs"
            },
            "success": function (json) {
                var viewModel = {};
                if (json) {
                    if (json.success) {
                        FDG.$.extend(viewModel, {
                            "selectedGraph": FDG.ko.observable(null),
                            "graphList": FDG.ko.observableArray(json.data),
                            "thumbnail": FDG.ko.observable(),
                            "thumbnailURL": FDG.ko.computed({
                                "read": function () {
                                    var ret = "";
                                    if (viewModel.thumbnail()) {
                                        ret = "url('thumbnails/" + viewModel.thumbnail() + "?" + new Date().getTime() + "')";
                                    }
                                    return ret;
                                },
                                "deferEvaluation": true
                            }),
                            "selectGraph": function (graph) {
                                viewModel.selectedGraph(graph);
                                if (graph[1]) {
                                    viewModel.thumbnail(graph[0]);
                                } else {
                                    viewModel.thumbnail("");
                                }
                            },
                            "openGraph": function () {
                                if (viewModel.selectedGraph()) {
                                    FDG.publish({
                                        "channel": "fdg-graph-load-request",
                                        "label": viewModel.selectedGraph()[0]
                                    });
                                    FDG.publish({"channel": "fdg-close-modal"});
                                }
                            }
                        });
                        FDG.publish({
                            "channel": "fdg-show-modal",
                            "title": "Open Graph",
                            "viewModel": viewModel,
                            "template": "templates.graph.listDialog"
                        });
                    }
                }
            },
            error: function () {
                FDG.util.logging.error('An error occurred trying to load graph list.');
            }
        });
    }
    function openGraphSettings() {
        var viewModel = {
            "graph": priv.graph,
            "smartColoring": function () {
                FDG.publish({"channel": "fdg-smart-coloring"});
            }
        };
        FDG.publish({
            "channel": "fdg-show-modal",
            "title": "Graph Settings",
            "viewModel": viewModel,
            "template": "templates.graph.settings"
        });
    }
    function saveSnapshot() {
        function saveIt(images) {
            FDG.$.ajax({
                "url": "FDG",
                "dataType": "json",
                "type": "POST",
                "data": {
                    "action": "saveSnapshot",
                    "label": priv.graph.label(),
                    'snapshot': images.snapshot,
                    'thumbnail': images.thumbnail
                },
                "success": function (json) {
                    if (json) {
                        if (json.message) {
                            FDG.util.logging.debug("[Message from server] " + json.message);
                        }
                        if (json.success) {
                            FDG.util.logging.debug("Successfully saved snapshot", priv.graph.label());
                            FDG.publish({"channel": "fdg-snapshot-save-success"});
                            // $('#graphLabel').effect("pulsate", { times:3 } );
                        }
                    }
                }
            });
        }
        if (priv.graph) {
            generateSnapshot(saveIt);
        }
    }
    function onFDGStartSuccess() {
        FDG.ko.applyBindings(priv.viewModel, FDG.$('.appMenu').get(0));
        FDG.util.logging.debug("module/graph started");
        if (window.location.hash && window.location.hash.length > 1) {
            FDG.publish({
                "channel": "fdg-graph-load-request",
                "label": window.location.hash.slice(1)
            });
        }
        animationLoop();
        return;
    }

    FDG.subscribe({"channel": "fdg-start-success", "callback": onFDGStartSuccess});
    FDG.subscribe({"channel": "fdg-graph-close-request", "callback": closeGraph});
    FDG.subscribe({"channel": "fdg-graph-load-request", "callback": loadGraph});
    FDG.subscribe({"channel": "fdg-graph-save-request", "callback": saveGraph});
    FDG.subscribe({"channel": "fdg-snapshot-save-request", "callback": saveSnapshot});
    FDG.subscribe({"channel": "fdg-graph-pause", "callback": pauseGraph});
    // FDG.subscribe({"channel": "fdg-graph-play", "callback": runGraph});
    FDG.subscribe({"channel": "fdg-graph-run", "callback": runGraph});
    FDG.subscribe({"channel": "fdg-graph-center", "callback": centerGraph});

    FDG.subscribe({"channel": "fdg-dirty", "callback": onDirty});
    FDG.subscribe({"channel": "fdg-clean", "callback": onClean});
    FDG.subscribe({"channel": "fdg-node-add-success", "callback": onDirty});
    FDG.subscribe({"channel": "fdg-connection-add-success", "callback": onDirty});
    FDG.subscribe({"channel": "fdg-node-remove-success", "callback": onDirty});
    FDG.subscribe({"channel": "fdg-connection-remove-success", "callback": onDirty});


    FDG.subscribe({
        "channel": "fdg-socket-ready",
        "count": 1,
        "callback": function () {
            FDG.util.socket.on("action-graph-dirty", onDirty);
            FDG.util.socket.on("action-graph-clean", onClean);
        }
    });


    FDG.util.extend({
        "dest": FDG.util,
        "source": {
            "graph": {
                "currentTool": function () {
                    return priv.viewModel.currentTool();
                },
                "setting": getSetting,
                "guid": function () {
                    if (priv.graph) {
                        return priv.graph.guid();
                    }
                    return null;
                }
            }
        }
    });

    function menuTooltip(element) {
        FDG.$(element).tooltip({"position": {"my": "center top+4", "at": "center bottom"}});
    }
    FDG.ko.bindingHandlers.newGraph = {
        "init": function (element) {
            FDG.$(element).click(newGraph);
            menuTooltip(element);
        }
    };
    FDG.ko.bindingHandlers.saveGraph = {
        "init": function (element) {
            FDG.$(element).click(saveGraph);
            menuTooltip(element);
        }
    };
    FDG.ko.bindingHandlers.closeGraph = {
        "init": function (element) {
            FDG.$(element).click(closeGraph);
            menuTooltip(element);
        }
    };
    FDG.ko.bindingHandlers.openGraphList = {
        "init": function (element) {
            FDG.$(element).click(openGraphList);
            menuTooltip(element);
        }
    };
    FDG.ko.bindingHandlers.pauseGraph = {
        "init": function (element) {
            FDG.$(element).click(pauseGraph);
            menuTooltip(element);
        }
    };
    FDG.ko.bindingHandlers.runGraph = {
        "init": function (element) {
            FDG.$(element).click(runGraph);
            menuTooltip(element);
        }
    };
    FDG.ko.bindingHandlers.saveSnapshot = {
        "init": function (element) {
            FDG.$(element).click(saveSnapshot);
            menuTooltip(element);
        }
    };
    FDG.ko.bindingHandlers.graphSettings = {
        "init": function (element) {
            FDG.$(element).click(openGraphSettings);
            menuTooltip(element);
        }
    };
    function changeTool(tool) {
        FDG.$('body').removeClass(priv.viewModel.currentTool() + "Tool");
        FDG.$('body').addClass(tool + "Tool");
        priv.viewModel.currentTool(tool);
    }
    // FDG.ko.bindingHandlers.graphFPS = {
    //     "init": function (element) {
    //         var el, sub;
    //         el = FDG.$(element);
    //         function update() {
    //             el.text(priv.viewModel.fps());
    //         }
    //         sub = priv.viewModel.fps.subscribe(update);
    //         update();
    //         FDG.ko.utils.domNodeDisposal.addDisposeCallback(element, function () {
    //             sub.dispose();
    //         });
    //     }
    // };
    FDG.ko.bindingHandlers.handTool = {
        "init": function (element) {
            FDG.$(element).click(function () {
                changeTool("hand");
            });
            menuTooltip(element);
        }
    };
    FDG.ko.bindingHandlers.penTool = {
        "init": function (element) {
            FDG.$(element).click(function () {
                changeTool("pen");
            });
            menuTooltip(element);
        }
    };

    FDG.ko.bindingHandlers.scissorTool = {
        "init": function (element) {
            FDG.$(element).click(function () {
                changeTool("scissor");
            });
            menuTooltip(element);
        }
    };

    window.addEventListener('hashchange', onHashChange);
    updateHistory();

    window.requestAnimFrame = (function () {
        var ret;
        if (window.requestAnimationFrame) {
            ret = window.requestAnimationFrame;
        } else if (window.webkitRequestAnimationFrame) {
            ret = window.webkitRequestAnimationFrame;
        } else if (window.mozRequestAnimationFrame) {
            ret = window.mozRequestAnimationFrame;
        } else {
            ret = function (callback) {
                window.setTimeout(callback, 1000 / 60);
            };
        }
        return ret;
    }());

});
