const {
    Vector,
    VZero,
    VRand,
    VAdd,
    VSub,
    VMul,
    VDiv,
    VMag,
    VNorm
} = require('./vector');
const { Tree } = require('./tree.js');
const {
    Svg,
    G,
    Circle,
    Rect,
    Text,
    Path
} = require('./dom.svg.js');

const {
    render,
    El
} = require('./vdom.js');

var bob = require('./bob.js');
/*
function setProps(el, props) {
    Object.keys(props).forEach(k => {
        el.setAttribute(k, props[k]);
    });
}

function updateNodeLabel({ data: { point: { x, y }, radius }, rect, text }) {
    const { width, height } = text.getBBox();
    const w = Math.max(width + 4, radius * 2 + 4);
    setProps(text, {
        x: x - (width / 2),
        y: y + 2.5
    });
    setProps(rect, {
        width: w + 2,
        height: height + 4,
        x: x - (w / 2) - 2,
        y: y - (height / 2) - 3
    });
}
function updateNode(node) {
    const { circle, data: { point: { x, y }, radius, color } } = node;
    setProps(circle, {
        fill: color,
        cx: x,
        cy: y,
        r: radius
    });
    updateNodeLabel(node);
}
function renderNode(node, container) {
    const { guid, data: { point: { x, y }, radius, label, color } } = node;
    const rect = Rect({
        class: 'fdg-svg-node-label-rect',
        x,
        y,
        rx: 4,
        ry: 4,
        // 'stroke-width': 0.5,
        width: radius,
        // height: 13
    });
    const text = Text({
        class: 'fdg-svg-node-label-text',
        x,
        y,
        'font-family': 'monospace',
        'font-size': 10,
        fill: '#444'
    }, [label]);
    const circle = Circle({
        cx: x,
        cy: y,
        r: radius,
        stroke: '#000000',
        fill: color,
        'stroke-width': 1
    });    
    const g = G({
        class: 'fdg-svg-node',
        style: 'user-select:none;cursor:pointer;',
        guid: guid
    }, [
        circle,
        G({
            class: 'fdg-svg-node-label',
            style: 'pointer-events:none;user-select:none;'
        }, [
            rect,
            text
        ])
    ]);
    node.g = g;
    node.circle = circle;
    node.rect = rect;
    node.text = text;
    node.update = updateNode;
    node.container = container;
    container.appendChild(g);
    return node;
}
function renderGraph(graph, target) {
    const index = new Map();
    let locked = false;
    const connectionGroup = G({ class: 'fdg-svg-connection-list' });
    const nodeGroup = G({ class: 'fdg-svg-node-list' });
    const svg = Svg({
        id: `graph-${graph.guid}`,
        height: graph.data.height,
        width: graph.data.width,
        viewbox: `0 0 ${graph.data.height} ${graph.data.width}`,
        style: 'background-color: #fff;'
    }, [
        connectionGroup,
        nodeGroup
    ]);

    const observer = new MutationObserver(mutations => {
        if (locked) { return; }
        locked = true;
        mutations.forEach(m => {
            m.addedNodes.forEach(n => {
                const o = index.get(n.getAttribute('guid'));
                if (o) { o.update(o); }
            });
        });
        locked = false;
    });
    observer.observe(svg, { childList: true, subtree: true });
    const renderLoop = () => {
        requestAnimationFrame(renderLoop);
        // Here we would normally do spreading, etc.
        // This is also where a change log would be ideal for dealing with ONLY changes
        // Instead we're going to just move nodes around and do an update
        graph.visible.forEach(c => {
            if (!c.data) { return; }
            if (!c.container) {
                renderNode(c, nodeGroup);
                index.set(c.guid, c);
            } else if (!index.get(c.guid)) {
                nodeGroup.appendChild(c);
                index.set(c.guid, c);
            }
            if (graph.data.running) {
                VAdd(c.data.point, VMul(VNorm(VRand()), Math.random() > 0.5 ? 1 : -1));
                c.update(c);
            }
        });
    };
    graph.visible.forEach(c => {
        if (!c.data) {
            return;
            renderConnection(c);
            connectionGroup.appendChild(c.g);
            index.set(c.guid, c);
        }
        renderNode(c, nodeGroup);
        index.set(c.guid, c);
    });
    requestAnimationFrame(renderLoop);
    target.appendChild(svg);
    return {
        svg,
        disconnect: () => {
            observer.disconnect();
            target.removeChild(svg);
        }
    };
}
*/
// TESTING WITH VDOM
const { renderGraph, sizer } = require('./render.graph.js');

// document.body.appendChild(sizer);

const frame = (data) => {
    // console.time('render svg');
    document.body.innerHTML = '';
    const rendered = render(document, document.body, renderGraph(data));
    // console.timeEnd('render svg');
};

let cycle = 0;
const transform = (g) => {
    if (!cycle) {
        cycle = Date.now();
        return;
    }
    const { width, height } = g.data;
    cycle = Date.now() - cycle;
    // console.debug('transform', {g, width, height});
    // Rando
    // g.visible.forEach(c => {
    //     if (!c.data) { return; }
    //     VAdd(c.data.point, VMul(VNorm(VRand()), Math.random() > 0.5 ? 1 : -1));
    // });
    // Smooth sailing
    // g.visible.forEach(c => {
    //     // console.log();
    //     if (!c.data) { return; }
    //     const { point, velocity } = c.data;
    //     VNorm( VAdd( velocity, Vector( {
    //         x: Math.abs(Math.cos( cycle )),
    //         y: Math.abs(Math.sin( cycle ))
    //         // y: 1
    //     } ) ) );
    //     VAdd( point, velocity );1
    //     let { x , y } = point;
    //     // VAdd(
    //     //     point,
    //     //     Vector(
    //     //         {
    //     //             x: (x + width) % width,
    //     //             y: (y + height) % height
    //     //         }
    //     //     )
    //     // )
    //     // console.log( point, velocity );
    //     // if (point.x < 0 || point.y || )
    // });
};

let changes = true;
    const renderLoop = (g) => {
    requestAnimationFrame(() => renderLoop(g));
    // TODO: changes = whatever();
    if (g.data.running || changes) {
        transform(g);
        frame(bob);
    }
};

frame(bob);
renderLoop(bob);
