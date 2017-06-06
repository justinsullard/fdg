const {
    Vector,
    // VZero,
    // VRand,
    VAdd,
    // VSub,
    VMul,
    // VDiv,
    // VMag,
    VNorm
} = require('./vector');

const { emitter } = require('./emitter.js');

const { Tree } = require("./tree.js");

const { Observable } = require('./observable.js');

const fdg = new Observable(null);

emitter.on('fdg:graph:loaded', (graph) => fdg.next(Tree(graph)));

const pause = () => {
    if (!fdg.value) { return; }
    fdg.value.data.running = false;
    fdg.next(fdg.value);
};
emitter.on('fdg:pause', pause);

const play = () => {
    if (!fdg.value) { return; }
    fdg.value.data.running = true;
    fdg.next(fdg.value);
};
emitter.on('fdg:play', play);

const toggle = () => {
    if (!fdg.value) { return; }
    fdg.value.data.running = !fdg.value.data.running;
    fdg.next(fdg.value);
};
emitter.on('fdg:toggle', toggle);

let cycle = Date.now();
const renderLoop = () => {
    requestAnimationFrame(renderLoop);
    const tree = fdg.value;
    if (tree && tree.data.running) {
        const { width, height } = tree.data;
        const step = Date.now() - cycle;
        const shifter = VMul(VNorm(Vector({ x: 1, y: 1 })), 25 / step);
        tree.visible.forEach((c) => {
            if (c.type === 'connection') { return; }
            const { data: { point } } = c;
            VAdd(point, shifter);
            point.x %= width;
            point.y %= height;
        });
        fdg.next(tree);
    }
    cycle = Date.now();
};

renderLoop();

module.exports = {
    fdg
};
