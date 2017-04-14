/* eslint-disable no-bitwise, prefer-template, space-infix-ops, no-mixed-operators */
const guid = (() => {
    const r = Math.random;
    const d = () => (r()*16|0).toString(16); // 0-f
    const b = () => (r()*16|0&0x3|0x8).toString(16); // 8-b
    return function _guid() {
        const t = ('000000000000'+new Date().getTime().toString(16)).slice(-12);
        return t.slice(0, 8)+
            '-'+t.slice(-4)+
            '-6'+d()+d()+d()+
            '-'+b()+d()+d()+d()+
            '-'+d()+d()+d()+d()+d()+d()+d()+d()+d()+d()+d()+d();
    };
})();
/* eslint-enable no-bitwise, prefer-template, space-infix-ops, no-mixed-operators */

function showConnections(lbl) {
    return FDG.util.connection.ofNode(FDG.util.node.search(lbl)[0]).map(c => `${c.alphaNode.label()} -> ${c.betaNode.label()}`).sort();
}

function generateGraph(source, name) {
    const nmap = {};
    const graph = {
        label: name || `graph ${new Date().toISOString()}`,
        guid: guid(),
        notes: '',
        width: 2400,
        height: 2400,
        orbit: 60,
        radius: 10,
        speed: 0.5,
        damping: 0.5,
        running: true,
        spreading: 500,
        spring: 1,
        nodes: [],
        connections: []
    };
    source.nodes.forEach(n => {
        const node = {
            guid: guid(),
            label: n.id,
            description: n.id,
            nodeType: 'model',
            radius: 5 + Math.round(n.r),
            color: '#cccccc',
            colorHighlight: '#aaaaff',
            colorSelected: '#f5f5f5',
            colorAnchored: '#aaaaaa',
            anchored: false,
            selected: false,
            highlighted: false,
            forces: {
                x: 0,
                y: 0
            },
            velocity: {
                x: 0,
                y: 0
            },
            point: {
                x: Math.random() * 2400,
                y: Math.random() * 2400
            },
            properties: []
        };
        nmap[n.id] = node.guid;
        graph.nodes.push(node);
    });
    source.links.forEach(l => {
        graph.connections.push({
            guid: guid(),
            length: 70,
            alpha: nmap[l.source.id],
            beta: nmap[l.target.id],
            description: `${l.source.id} imports ${l.target.id}`,
            connectionType: 'reference',
            multiTypes: []
        });
    });
    return graph;
}