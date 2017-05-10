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

const {
    render,
    El
} = require('./vdom.js');

let cycle = Date.now();

const renderLoop = (g) => {
    requestAnimationFrame(() => renderLoop(g));
    if (g.data.running) {
        const { width, height } = g.data;
        const step = Date.now() - cycle;
        const shifter = VMul(VNorm(Vector({ x: 1, y: 1 })), step / 1000 * 25);
        g.visible.forEach(c => {
            if (!c.data) { return; }
            const { data: { radius, point } } = c;
            VAdd(point, shifter);
            point.x %= width;
            point.y %= height;
        });
        process.emit('fdg:render');
    }
    cycle = Date.now();
};
const bob = require('./bob.js');

renderLoop(bob);