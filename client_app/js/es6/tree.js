const { UUID } = require('./uuid');

const { Graph } = require('./graph.js');
const { Group } = require('./group');
const { Node } = require('./node.js');
const { Connection } = require('./connection.js');

function Branch(o, type) {
    return {
        type,
        uuid: o.uuid,
        data: o,
        group: o.group || null,
        children: new Set(),
        connections: new Set()
    };
}

function updateVisual(tree, leaf) {
    if (!leaf) {
        tree.visible.clear();
        tree.children.forEach(tree.updateVisual);
        // connection updates here
        tree.connections.forEach(conn => {
            conn.v_alpha = tree.getVisibleRoot(conn.alpha, conn);
            conn.v_beta = tree.getVisibleRoot(conn.beta, conn);
            if (conn.v_alpha !== conn.v_beta) {
                tree.visible.add(conn);
            }
        });
        return;
    }
    if (leaf.data.type !== 'group' || leaf.data.collapsed) {
        tree.visible.add(leaf);
        return;
    }
    leaf.children.forEach(tree.updateVisual);
}

function getVisibleRoot(tree, leaf, src) {
    if (!leaf.data.group || tree.visible.has(leaf)) { return leaf; }
    return tree.getVisibleRoot(leaf.group, leaf);
}

function addGroup(tree, cfg) {
    if (tree.groups.get(cfg.uuid)) { return; }
    const group = Group(cfg);
    const branch = Branch(group);
    tree.data.groups.push(group);
    tree.groups.set(branch.uuid, branch);
    tree.index.set(branch.uuid, branch);
    if (group.group) {
        branch.group = tree.index.get(group.group);
    } else {
        tree.children.add(branch);
    }
    group.children.forEach(child => {
        const leaf = tree.index.get(child);
        const prev = leaf.group || tree;
        prev.children.delete(leaf);
        if (prev.data.type === 'group') {
            prev.data.children.splice(prev.data.children.indexOf(child), 1);
        }
        leaf.data.group = group.uuid;
        leaf.group = branch;
        branch.children.add(leaf);
    });
    tree.updateVisual();
}

function Tree(cfg) {
    graph = Graph(cfg);
    graph.groups = graph.groups.map(Group);
    graph.nodes = graph.nodes.map(Node);
    graph.connections = graph.connections.map(Connection);
    const tree = Branch(graph, 'graph');
    tree.groups = new Map(graph.groups.map(o => [o.uuid, Branch(o, 'group')]));
    tree.groups.forEach((group, uuid) => {
        if (!group.group) { return; }
        group.group = tree.groups.get(group.group);
        group.group.children.add(group);
    });
    tree.nodes = new Map(graph.nodes.map(o => [o.uuid, Branch(o, 'node')]));
    tree.nodes.forEach((node, uuid) => {
        if (!node.group) { return; }
        node.group = tree.groups.get(node.group);
        node.group.children.add(node);
    });
    tree.index = new Map([ ...tree.groups, ...tree.nodes ]);
    tree.connections = new Map(graph.connections.map(o => [
        o.uuid,
        {
            type: 'connection',
            data: o,
            alpha: tree.index.get(o.alpha),
            beta: tree.index.get(o.beta),
            v_alpha: tree.index.get(o.alpha),
            v_beta: tree.index.get(o.beta)
        }
    ])),
    graph.nodes.filter(n => !n.group).forEach(n => tree.children.add(tree.index.get(n.uuid)));
    graph.groups.filter(n => !n.group).forEach(n => tree.children.add(tree.index.get(n.uuid)));

    tree.visible = new Set();

    tree.addGroup = addGroup.bind(null, tree);
    tree.getVisibleRoot = getVisibleRoot.bind(null, tree);

    tree.updateVisual = updateVisual.bind(null, tree);
    tree.updateVisual();

    return tree;
}

module.exports = {
    Tree
};
