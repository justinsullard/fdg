import UUID from './uuid';
import {
    vector,
    vzero,
    vrand,
    vadd,
    vsub,
    vmul,
    vdiv,
    vnorm,
    vmag
} from './vector';

/*

https://www.html5rocks.com/en/tutorials/webcomponents/imports/
https://www.webcomponents.org/
https://ponyfoo.com/articles/es6-proxies-in-depth

https://www.npmjs.com/package/rollup

*/

function graphTree(graph) {
    const ret = {
        graph,
        nodeIndex: {},
        groupIndex: {},
        connectionIndex: {},
        spreadingPairs: [],
        tree: {}
    };
    return ret;
}

class Graph {
    constructor({
        uuid = UUID(),
        label = `New Graph ${new Date().toISOString()}`,
        notes = '',
        width = 1600,
        height = 1600,
        orbit = 60,
        radius = 10,
        speed = 0.5,
        damping = 0.5,
        running = true,
        spreading = 500,
        spring = 1,
        nodes = [],
        groups = [],
        connections = []
    }) {
        this.uuid = uuid;
        this.label = label;
        this.notes = notes;
        this.width = width;
        this.height = height;
        this.orbit = orbit;
        this.radius = radius;
        this.speed = speed;
        this.damping = damping;
        this.running = running;
        this.spreading = spreading;
        this.spring = spring;
        this.nodes = nodes.map(n => new Node(n, this));
        this.groups = groups.map(g => new Group(g, this));
        this.connections = connections.map(c => new Connection(c, this));
        // Non-stored properties
        this.virtualConnections = [];
        this.spreadingPairs = [];
        this.lastStep = Date.now();
        // Build uuid indexes
        function indexer(m, c) {
            m[c.uuid] = c;
            return m;
        }
        this.indexNodes = this.nodes.reduce(indexer, {});
        this.indexGroups = this.groups.reduce(indexer, {});
        this.indexConnections = this.connections.reduce(indexer, {});
        // Map references for generated objects
        this.groups.forEach(g => {
            g.children = g.children.map(c => this.indexNodes[c] || this.indexGroups[c]);
            if (g.group) { g.group = this.indexGroups[g.group]; }
        });
        this.nodes.forEach(n => {
            if (n.group) { n.group = this.indexGroups[n.group]; }
        });
        this.connections.forEach(c => {
            c.alpha = this.indexNodes[c.alpha];
            c.beta = this.indexNodes[c.beta];
        });
        // compute spreading pairs
        this.computePairs();
    }
    getNode(uuid) { return this.indexNodes[uuid]; }
    getGroup(uuid) { return this.indexGroups[uuid]; }
    getConnection(uuid) { return this.indexConnections[uuid]; }
    addNode(node) {
        if (this.nodes.indexOf(node) > -1) { return; }
        this.nodes.push(node);
        this.indexNodes[node.uuid] = node;
        this.computePairs();
    }
    removeNode(node) {
        const i = this.nodes.indexOf(node);
        if (i < 0) { return; }
        this.nodes.splice(i, 1);
        delete this.indexNodes[node.uuid];
        this.computePairs();
    }
    addGroup(group) {
        if (this.groups.indexOf(group) > -1) { return; }
        this.groups.push(group);
        this.indexGroups[group.uuid] = group;
        this.computePairs();
    }
    removeGroup(group) {
        const i = this.groups.indexOf(group);
        if (i < 0) { return; }
        this.groups.splice(i, 1);
        delete this.indexGroups[group.uuid];
        this.computePairs();
    }
    addConnection(connection) {
        if (this.connections.indexOf(connection) > -1) { return; }
        this.connections.push(connection);
        this.indexConnections[connection.uuid] = connection;
        this.computePairs();
    }
    removeConnection(connection) {
        const i = this.connections.indexOf(connection);
        if (i < 0) { return; }
        this.connections.splice(i, 1);
        delete this.indexConnections[connection.uuid];
        this.computePairs();
    }
    computePairs() {
        this.spreadingPairs = [];
        // Create an array of nodes and groups, filtered to those that are visible
        for (let i = 0, li = this.nodes.length - 1; i < li; i += 1) {
            const alpha = this.nodes[i];
            for (let j = i + 1, l = this.nodes.length; j < l; j += 1) {
                const beta = this.nodes[j];
                const conn = this.connections.find(c => (c.alpha === alpha && c.beta === beta) || (c.alpha === beta && c.beta === alpha));
                if (!conn) { this.spreadingPairs.push([alpha, beta]); }
            }
        }
    }
    animationLoop() {
        if (!this.running) { return; }
        const t = Date.now();
        const mul = this.speed * ((t - this.lastStep) / 100);
        this.lastStep = t;
        this.applySpreading(mul);
        this.applyConnections(mul);
        this.updateNodes(mul);
        this.updateGroups(mul);
        this.updateConnections();
    }
    applySpreading() {}
    applyConnections() {}
    updateNodes() {}
    updateGroups() {}
    updateConnections() {}
    pause() {
        this.running = false;
    }
    play() {
        this.running = true;
        this.lastStep = Date.now();
    }
    visibleTree() {
        const nodes = this.nodes.filter(n => !n.group);
        const groups = this.groups.filter(g => !g.group);
        return [].concat(...[].concat(...nodes, ...groups).map(o => o.visibleTree()));
    }
    toJSON() {
        return {
            uuid: this.uuid,
            label: this.label,
            notes: this.notes,
            width: this.width,
            height: this.height,
            orbit: this.orbit,
            radius: this.radius,
            speed: this.speed,
            damping: this.damping,
            running: this.running,
            spreading: this.spreading,
            spring: this.spring,
            nodes: this.nodes,
            groups: this.groups,
            connections: this.connections
        };
    }
}

// class Property {
//     // TODO: Add this when it's time, used by nodes
// }

const nodeTypes = ['model', 'view', 'controller', 'lookup', 'module', 'config', 'group'];
class Node {
    static get nodeTypes() { return nodeTypes; }
    constructor({
        uuid = UUID(),
        label = 'New Node',
        description = '',
        nodeType = 'model',
        point = null,
        radius = 10,
        color = '#cccccc',
        colorAnchored = '#aaaaaa',
        colorHighlight = '#aaaaff',
        colorSelected = '#f5f5f5',
        selected = false,
        highlighted = false,
        forces = vector(),
        velocity = vector(),
        // properties = [],
        group = null
    }, graph) {
        this.uuid = uuid;
        this.label = label;
        this.description = description;
        this.nodeType = nodeTypes.indexOf(nodeType) ? nodeType : 'model';
        this.point = point ? vector(point) : vector();
        this.radius = radius;
        this.color = color;
        this.colorAnchored = colorAnchored;
        this.colorHighlight = colorHighlight;
        this.colorSelected = colorSelected;
        this.selected = selected;
        this.highlighted = highlighted;
        this.forces = vector(forces);
        this.velocity = vector(velocity);
        // this.properties = properties.map(p => new Property(p));
        this.group = group;
        // Randomize point if necessary
        if (!point) { rand(this.point, graph.width, graph.height, this.radius); }
    }
    path() {
        if (this.group) {
            return [...this.group.path(), this];
        }
        return [this];
    }
    visibleTree() { return [this]; }
    visibleBranch() {
        let r;
        if (this.group) { r = this.group.visibleBranch(); }
        return r || this;
    }
    toJSON() {
        return {
            uuid: this.uuid,
            label: this.label,
            description: this.description,
            nodeType: this.nodeType,
            point: this.point,
            radius: this.radius,
            color: this.color,
            colorAnchored: this.colorAnchored,
            colorHighlight: this.colorHighlight,
            colorSelected: this.colorSelected,
            selected: this.selected,
            highlighted: this.highlighted,
            forces: this.forces,
            velocity: this.velocity,
            group: this.group ? this.group.uuid : null
        };
    }
}
class Group extends Node {
    constructor(cfg, graph) {
        const {
            label = 'New Group',
            children = [],
            collapsed = false,
            radius = null,
            point
        } = cfg;
        super(cfg, graph);
        this.label = label;
        this.children = children;
        this.collapsed = collapsed;
        this.children.forEach(c => {
            if (typeof c === 'string') { return; }
            c.group = this;
        });
        this.graph = graph;
        // Initialize radius and randomize point if necessary
        if (!radius) { this.computeRadius(); }
        if (!point && this.children.length === 0) { rand(this.point, graph.width, graph.height, this.radius); }
    }
    computeRadius() {
        const area = this.children.reduce((s, c) => Math.PI * (c.radius ** 2), 0);
        this.radius = Math.max(Math.min(20, Math.sqrt(area / Math.PI)), 10);
    }
    addChild(child) {
        if (this.children.indexOf(child) > -1) { return; }
        this.children.push(child);
        child.group = this;
        this.computeRadius();
    }
    removeChild(child) {
        const i = this.children.indexOf(child);
        if (i < 0) { return; }
        this.children.splice(i, 1);
        if (child.group === this) { this.child.group = null; }
        this.computeRadius();
    }
    visibleTree() {
        if (this.collapsed) { return [this]; }
        return [].concat(...this.children.map(c => [].concat(c.visibleTree())));
    }
    visibleBranch() {
        let r;
        if (this.group) { r = this.group.visibleBranch(); }
        if (!r && this.collapsed) { r = this; }
        return r;
    }
    toggle() {
        this.collapsed = !this.collapsed;
        if (this.collapsed) {
            // Get average point of children and make that my point
        }
        this.graph.computePairs();
    }
    toJSON() {
        return {
            uuid: this.uuid,
            label: this.label,
            description: this.description,
            nodeType: this.nodeType,
            point: this.point,
            radius: this.radius,
            color: this.color,
            colorAnchored: this.colorAnchored,
            colorHighlight: this.colorHighlight,
            colorSelected: this.colorSelected,
            selected: this.selected,
            highlighted: this.highlighted,
            forces: this.forces,
            velocity: this.velocity,
            group: this.group ? this.group.uuid : null,
            collapsed: this.collapsed,
            children: this.children.map(c => c.uuid)
        };
    }
}
class Connection {
    constructor({}) {

    }
}

export default {
    Graph,
    Node,
    Group,
    Connection
};

/*
const bob = new Graph({});
const nodes = [
    new Node({ label: 'Node 1' }, bob),
    new Node({ label: 'Node 2' }, bob),
    new Node({ label: 'Node 3' }, bob),
    new Node({ label: 'Node 4' }, bob)
];
nodes.map(bob.addNode.bind(bob));
const groups = [
    new Group({ label: 'Group 1', children: [nodes[0], nodes[1]], collapsed: true }, bob),
    new Group({ label: 'Group 2', children: [nodes[3]] }, bob)
];
groups.push(new Group({ label: 'Group 3', children: [groups[0], groups[1]] }, bob));
groups.map(bob.addGroup.bind(bob));
*/