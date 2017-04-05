/*jslint node:true, unparam:true, regexp:true, bitwise:true */
(function () {
    "use strict";
    var http = require("http"),
        qs = require("querystring"),
        WebSocketServer = require('websocket').server,
        url = require("url"),
        path = require("path"),
        fs = require("fs"),
        colors = require('colors'),
        port = 4242,
        myWebServer,
        args = process.argv.slice(2),
        appPath = "/client_app/",
        fileRoot,
        myWebSocketServer,
        connections = [],
        totalConnections = 0,
        maxChatter = 30,
        rooms = {};

    colors.setTheme({
        "data": "grey",
        "error": "red",
        "warn": "yellow",
        "proxy": "cyan",
        "info": "blue",
        "debug": "green"
    });

    process.on('SIGINT', function () {
        myWebServer.close();
        console.log("\n");
        console.log("FDG server exiting".info);
        process.exit();
    });

    function guid() {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = (Math.random() * 16) | 0,
                v = c === "x" ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    function getContentType(filename) {
        var contentType = "text/plain";
        if (filename.match(/\.js$/i)) {
            contentType = "text/javascript";
        } else if (filename.match(/\.json$/i)) {
            contentType = "application/json";
        } else if (filename.match(/\.xml$/i)) {
            contentType = "application/xml";
        } else if (filename.match(/\.htm?l$/i)) {
            contentType = "text/html";
        } else if (filename.match(/\.css?$/i)) {
            contentType = "text/css";
        } else if (filename.match(/\.png$/i)) {
            contentType = "image/png";
        } else if (filename.match(/\.woff$/i)) {
            contentType = "application/x-font-woff";
        } else if (filename.match(/\.ttf$/i)) {
            contentType = "application/x-font-ttf";
        }
        return contentType;
    }

    function runIt() {

        fileRoot = path.join(process.cwd(), appPath);

        // Ensure data folders are present
        ["/graphs", "/thumbnails", "/snapshots", "/snapshots/thumbnails"].forEach(function (p) {
            var dir = path.join(fileRoot, p);
            if (!fs.existsSync(dir)) { fs.mkdirSync(dir); }
        });

        function serveFile(filename, res, code) {
            var filestream;
            code = code || 200;
            fs.exists(filename, function (exists) {
                if (!exists) {
                    console.log(("Request: 404: " + filename).warn);
                    filename = path.join(fileRoot, "404.html");
                    serveFile(filename, res, 404);
                } else {
                    fs.stat(filename, function (err, stat) {
                        if (err) {
                            console.log(("Request: File error").error);
                            res.writeHead(500, {
                                "Content-Type": "text/plain"
                            });
                            res.write(err + "\n");
                            res.end();
                        } else {
                            if (stat.isDirectory()) {
                                filename = path.join(filename, "/main.html");
                                serveFile(filename, res);
                            } else {
                                res.writeHead(200, {
                                    "Content-Type": getContentType(filename)
                                });
                                // console.log(("Request: Writing from " + filename).data);
                                filestream = fs.createReadStream(filename);
                                filestream.pipe(res);
                            }
                        }
                    });
                }
            });
        }

        function serveFDGGraph(filename, res, ret) {
            var filestream;
            fs.exists(filename, function (exists) {
                if (!exists) {
                    ret.message = "Invalid request, resource not available";
                    res.writeHead(200, {
                        "Content-Type": "application/json"
                    });
                    res.write(JSON.stringify(ret));
                    res.end();
                } else {
                    fs.stat(filename, function (err, stat) {
                        if (err) {
                            ret.message = "An error was encountered trying to serve your request";
                            res.writeHead(200, {
                                "Content-Type": "application/json"
                            });
                            res.write(JSON.stringify(ret));
                            res.end();
                        } else {
                            if (stat.isDirectory()) {
                                ret.message = "Invalid request, resource not available";
                                res.writeHead(200, {
                                    "Content-Type": "application/json"
                                });
                                res.write(JSON.stringify(ret));
                                res.end();
                            } else {
                                filestream = fs.createReadStream(filename);
                                filestream.setEncoding("utf8");
                                ret.data = "";
                                filestream.on('readable', function () {
                                    var chunk;
                                    chunk = filestream.read();
                                    while (chunk !== null) {
                                        ret.data += chunk;
                                        chunk = filestream.read();
                                    }
                                });
                                filestream.on('end', function () {
                                    try {
                                        ret.data = JSON.stringify(JSON.parse(ret.data));
                                    } catch (e) {
                                        console.error("Error validating graph json", filename, e);
                                    }
                                    ret.success = true;
                                    res.writeHead(200, {
                                        "Content-Type": "application/json"
                                    });
                                    res.write(JSON.stringify(ret));
                                    res.end();
                                });
                            }
                        }
                    });
                }
            });
        }

        myWebServer = http.createServer(function (req, res) {
            var pathname, uri, filename, ret, reqBody, formData, buffer;
            // console.log("Received request", req.url);
            pathname = url.parse(req.url).pathname;
            if (pathname.match(/^\/FDG\??.*/)) {
                reqBody = "";
                ret = {
                    "success": false,
                    "data": [],
                    "message": ""
                };
                if (req.method === "POST") {
                    req.on('data', function (data) {
                        reqBody += data;
                    }).on('end', function () {
                        formData = qs.parse(reqBody);
                        switch (formData.action) {
                        case "saveGraph":
                            filename = path.join(fileRoot, "/graphs/" + formData.label);
                            fs.writeFileSync(filename, formData.graph, "utf8");
                            filename = path.join(fileRoot, "/thumbnails/" + formData.label);
                            if (formData.thumbnail) {
                                try {
                                    buffer = new Buffer(formData.thumbnail, 'base64');
                                    fs.writeFileSync(filename, buffer);
                                } catch (e) {
                                    console.error("Error writing thumbnail file", e);
                                }
                            }
                            ret.message = "FDG Graph " + formData.label + " saved successfully.";
                            ret.success = true;
                            res.writeHead(200, {
                                "Content-Type": "application/json"
                            });
                            res.write(JSON.stringify(ret));
                            res.end();
                            break;
                        case "saveSnapshot":
                            filename = path.join(fileRoot, "/snapshots/" + formData.label);
                            buffer = new Buffer(formData.snapshot, 'base64');
                            fs.writeFileSync(filename, buffer);
                            filename = path.join(fileRoot, "/snapshots/thumbnails/" + formData.label);
                            if (formData.thumbnail) {
                                try {
                                    buffer = new Buffer(formData.thumbnail, 'base64');
                                    fs.writeFileSync(filename, buffer);
                                } catch (e) {
                                    console.error("Error writing thumbnail file", e);
                                }
                            }
                            ret.message = "FDG Snapshot " + formData.label + " saved successfully.";
                            ret.success = true;
                            res.writeHead(200, {
                                "Content-Type": "application/json"
                            });
                            res.write(JSON.stringify(ret));
                            res.end();
                            break;
                        default:
                            ret.message = "Invalid POST request";
                            res.writeHead(500, {
                                "Content-Type": "application/json"
                            });
                            res.write(JSON.stringify(ret));
                            res.end();
                            break;
                        }                        
                    });
                } else {
                    formData = url.parse(req.url, true).query;
                    switch (formData.action) {
                    case "listGraphs":
                        fs.readdir(path.join(fileRoot, "/thumbnails"), function (err, thumbs) {
                            fs.readdir(path.join(fileRoot, "/graphs"), function (err, files) {
                                var i;
                                if (err) {
                                    ret.message = "Error reading graph list" + err;
                                    res.writeHead(500, {
                                        "Content-Type": "application/json"
                                    });
                                    res.write(JSON.stringify(ret));
                                    res.end();
                                } else {
                                    for (i = 0; i < files.length; i += 1) {
                                        if (files[i] !== "previousVersions" && files[i] !== ".DS_Store") {
                                            ret.data.push([files[i], thumbs.indexOf(files[i]) > -1]);
                                        }
                                    }
                                    ret.success = true;
                                    res.writeHead(200, {
                                        "Content-Type": "application/json"
                                    });
                                    res.write(JSON.stringify(ret));
                                    res.end();
                                }
                            });
                        });
                        break;
                    case "listSnapshots":
                        fs.readdir(path.join(fileRoot, "/snapshots/thumbnails"), function (err, thumbs) {
                            fs.readdir(path.join(fileRoot, "/snapshots"), function (err, files) {
                                var i;
                                if (err) {
                                    ret.message = "Error reading snapshot list" + err;
                                    res.writeHead(500, {
                                        "Content-Type": "application/json"
                                    });
                                    res.write(JSON.stringify(ret));
                                    res.end();
                                } else {
                                    for (i = 0; i < files.length; i += 1) {
                                        if (!files[i].match(/^(previousVersions|\.DS_Store|thumbnails)$/)) {
                                            ret.data.push([files[i], thumbs.indexOf(files[i]) > -1]);
                                        }
                                    }
                                    ret.success = true;
                                    res.writeHead(200, {
                                        "Content-Type": "application/json"
                                    });
                                    res.write(JSON.stringify(ret));
                                    res.end();
                                }
                            });
                        });
                        break;
                    case "loadGraph":
                        filename = path.join(fileRoot, "/graphs/" + formData.label);
                        serveFDGGraph(filename, res, ret);
                        break;
                    default:
                        ret.message = "Invalid GET request";
                        break;
                    }
                }
            } else {
                req.on('end', function () {
                    return;
                });
                uri = decodeURIComponent(url.parse(req.url).pathname);
                filename = path.join(fileRoot, uri);
                try {
                    serveFile(filename.replace(/\?\d+$/, ''), res);
                } catch (e) {
                    console.error("Error handling file server request", e);
                    res.writeHead(500, {"Content-Type": "text/plain"});
                    res.end("JUSTIN MESSED SOMETHING UP!");
                }
            }
        });

        myWebServer.on('error', function (err, req, res) {
            console.error("Error in myWebServer:".error, err);
            if (res) {
                res.writeHead(500, {
                    'Content-Type': 'text/plain'
                });
                res.end('JUSTIN MESSED SOMETHING UP! myWebServer.500');
            } else {
                console.error("Response object is missing".error);
            }
        });

        myWebServer.listen(port);

        function sendMessage(message, conn) {
            try {
                message.time = new Date().toISOString();
                conn.sendUTF(JSON.stringify(message));
            } catch (e) {
                console.error("Error sending message to connection", conn.guid, message);
            }
        }
        function sendMessageOthers(message, me) {
            if (me && me.room) {
                me.room.connections.slice().forEach(function (conn) {
                    if (conn !== me) {
                        message.from = me.guid;
                        sendMessage(message, conn);
                    }
                });
            }
        }
        function sendMessageAll(message, me) {
            if (me && me.room) {
                me.room.connections.slice().forEach(function (conn) {
                    message.from = me.guid;
                    sendMessage(message, conn);
                });
            }
        }
        function holdElection(room) {
            if (room.connections.length > 1) {
                room.vote = {};
                room.connections.forEach(function (conn) {
                    sendMessage({"action": "leader-vote"}, conn);
                });
            } else {
                room.leader = room.connections[0];
                sendMessage({"action": "sync-leader"}, room.leader);
            }
        }
        function endElection(room) {
            var min = Number.POSITIVE_INFINITY, c;
            for (c in room.vote) {
                if (room.vote.hasOwnProperty(c)) {
                    if (room.vote[c].perf < min) {
                        min = room.vote[c].perf;
                        room.leader = room.vote[c].connection;
                    }
                }
            }
            sendMessage({"action": "sync-leader"}, room.leader);
            room.vote = null;
        }
        function roomChatter(message, connection) {
            var i, l, chat = {
                "text": message.text,
                "time": new Date().toISOString(),
                "username": connection.username
            };
            connection.room.chatter = connection.room.chatter || [];
            connection.room.chatter.push(chat);
            l = connection.room.chatter.length;
            for (i = l; i > maxChatter; i -= 1) {
                connection.room.chatter.shift();
            }
            message.username = connection.username;
            message.time = chat.time;
            sendMessageAll(message, connection);
        }
        function leaderVote(message, connection) {
            var c, d = 0;
            if (connection.room && connection.room.vote) {
                connection.room.vote[connection.guid] = {
                    "connection": connection,
                    "perf": message.perf || Number.POSITIVE_INFINITY
                };
                for (c in connection.room.vote) {
                    if (connection.room.vote.hasOwnProperty(c)) {
                        d += 0;
                    }
                }
                if (connection.room.connections.length === d) {
                    endElection(connection.room);
                }
            }
        }
        function leaveGraphRoom(conn, close) {
            var i, reason = "Not current in a graph room.", room;
            if (conn.room) {
                i = conn.room.connections.indexOf(conn);
                if (conn.room.leader === conn) {
                    conn.room.leader = null;
                }
                sendMessageOthers({"action": "user-leave"}, conn);
                if (i > -1) {
                    conn.room.connections.splice(i, 1);
                }
                if (!close) {
                    sendMessage({"action": "graph-room-leave-success", "guid": conn.room.guid}, conn);
                }
                if (conn.room.connections.length === 0) {
                    console.log("Room emptied, giving it a minute then removing it.");
                    room = conn.room;
                    conn.room.remover = setTimeout(function () {
                        console.log("Removing empty graph room", room.guid);
                        delete rooms[room.guid];
                    }, 60000);
                } else {
                    holdElection(conn.room);
                }
                conn.room = null;
                return true;
            }
            sendMessage({"action": "graph-room-leave-error", "reason": reason}, conn);
            return false;
        }
        function joinGraphRoom(guid, conn) {
            var reason = "Invalid graph room", others = [];
            if (guid) {
                rooms[guid] = rooms[guid] || {
                    "guid": guid,
                    "leader": null,
                    "connections": [],
                    "chatter": [],
                    "remover": null
                };
                if (rooms[guid].connections.indexOf(conn) < 0) {
                    leaveGraphRoom(conn);
                    clearTimeout(rooms[guid].remover);
                    others = rooms[guid].connections.slice();
                    others = others.map(function (c) { return {"guid": c.guid, "username": c.username}; });
                    rooms[guid].connections.push(conn);
                    conn.room = rooms[guid];
                    sendMessageOthers({"action": "user-join", "username": conn.username}, conn);
                    sendMessage({"action": "graph-room-join-success", "guid": guid, "others": others, "chatter": conn.room.chatter}, conn);
                    holdElection(conn.room);
                    return true;
                }
                reason = "Already a member of graph room.";
            }
            sendMessage({"action": "graph-room-join-error", "guid": guid, "reason": reason}, conn);
            return false;
        }

        myWebSocketServer = new WebSocketServer({"httpServer": myWebServer});
        myWebSocketServer.on("request", function (request) {
            totalConnections += 1;
            var connection = request.accept(null, request.origin);
            connection.room = null;
            connection.guid = guid();
            connection.username = "New User " + totalConnections;
            connection.on("message", function (data) {
                var message;
                if (data.type === "utf8") {
                    try {
                        message = JSON.parse(data.utf8Data);
                        switch (message.action) {
                        case "set-username":
                            console.log(connection.guid, connection.username, "Received set-username");
                            if (typeof message.username === "string") {
                                connection.username = message.username;
                                sendMessage({"action": "set-username-success", "username": connection.username}, connection);
                                sendMessageOthers({"action": "set-username", "username": connection.username}, connection);
                                console.log(connection.guid, connection.username, "Username changed");
                            } else {
                                sendMessage({"action": "set-username-error", "username": connection.username}, connection);
                            }
                            break;
                        case "graph-room-join":
                            console.log(connection.guid, connection.username, "Received graph-room-join");
                            joinGraphRoom(message.guid, connection);
                            break;
                        case "graph-room-leave":
                            console.log(connection.guid, connection.username, "Received graph-room-leave");
                            leaveGraphRoom(connection);
                            break;
                        case "leader-vote":
                            leaderVote(message, connection);
                            sendMessage({"action": "pong", "time": new Date().toISOString()}, connection);
                            break;
                        case "chatter":
                            roomChatter(message, connection);
                            break;
                        case "ping":
                            sendMessage({"action": "pong", "time": new Date().toISOString()}, connection);
                            break;
                        // case "graph-pause":
                        //     sendMessageOthers({"action": "graph-pause"}, connection);
                        //     break;
                        // case "graph-run":
                        //     sendMessageOthers({"action": "graph-run"}, connection);
                        //     break;
                        default:
                            if (!message.from || message.from !== connection.guid) {
                                sendMessageOthers(message, connection);
                            }
                        }
                    } catch (e) {
                        message = "";
                    }
                }
            });
            connection.on("close", function () {
                console.log(connection.guid, connection.username, "Connection closed");
                leaveGraphRoom(connection, true);
                connections.splice(connections.indexOf(connection), 1);
            });
            connections.push(connection);
            sendMessage({"action": "connect", "connection": connection.guid, "username": connection.username}, connection);
            console.log(connection.guid, connection.username, "Socket connection established");
        });

        console.log("FDG server running".info);
        console.log(("Local server running at\n  => http://localhost:" + port + "/").info);
        console.log("\n");
    }

    if (args[0] === "dist") {
        console.log("Checking for dist directory".info);
        fs.exists(path.join(process.cwd(), "/dist/client_app/"), function (exists) {
            if (exists) {
                console.log("Dist exists, switching to dist mode".info);
                appPath = "/dist/client_app/";
            } else {
                console.log("Dist missing, staying in dev mode".info);
            }
            runIt();
        });
    } else {
        console.log("Running in dev mode".info);
        runIt();
    }

}());