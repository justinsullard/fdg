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

const { emitter } = require('./emitter.js');

const { Tree } = require("./tree.js");

const fdg = {
    tree: null
};

const graphLoaded = (graph) => {
    fdg.tree = Tree(graph);
    emitter.emit('fdg:render');
}
emitter.on('fdg:graph:loaded', graphLoaded);

const pause = () => {
    if (!fdg.tree) { return; }
    fdg.tree.data.running = false;
};
emitter.on('fdg:pause', pause);

const play = () => {
    if (!fdg.tree) { return; }
    fdg.tree.data.running = true;
};
emitter.on('fdg:play', play);

const toggle = () => {
    if (!fdg.tree) { return; }
    fdg.tree.data.running = !fdg.tree.data.running;
};
emitter.on('fdg:toggle', toggle);

let cycle = Date.now();
const renderLoop = () => {
    requestAnimationFrame(renderLoop);
    const { tree } = fdg;
    if (tree && tree.data.running) {
        const { width, height } = tree.data;
        const step = Date.now() - cycle;
        const shifter = VMul(VNorm(Vector({ x: 1, y: 1 })), step / 1000 * 25);
        tree.visible.forEach(c => {
            if (c.type === 'connection') { return; }
            const { data: { radius, point } } = c;
            VAdd(point, shifter);
            point.x %= width;
            point.y %= height;
        });
        emitter.emit('fdg:render');
    }
    cycle = Date.now();
};

renderLoop();

module.exports = {
    fdg
};
