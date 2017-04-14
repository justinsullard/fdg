function vector({ x, y } = { x: 0, y: 0 }) { return { x, y }; }
function zero(v) {
    v.x = 0;
    v.y = 0;
    return v;
}
function rand(v = vector(), w = 100, h = 100, r = 10) {
    v.x = Math.random() * (w - r);
    v.y = Math.random() * (h - r);
    return v;
}
function add(v, o) {
    v.x += o.x;
    v.y += o.y;
    return v;
}
function sub(v, o) {
    v.x -= o.x;
    v.y -= o.y;
    return v;
}
function mul(v, m = 1) {
    v.x *= m;
    v.y *= m;
    return v;
}
function div(v, m = 1) {
    v.x /= m;
    v.y /= m;
    return v;
}
function mag(v) {
    return Math.sqrt((v.x * v.x) + (v.y * v.y));
}
function norm(v) {
    return div(v, mag(v));
}
class Point {
    constructor({ x, y } = { x: 0, y: 0 }) {
        this.x = x;
        this.y = y;
    }
    zero() {
        this.x = 0;
        this.y = 0;
        return this;
    }
    clone() {
        return new Point(this);
    }
    rand(w = 100, h = 100, r = 10) {
        this.x = Math.random() * (w - r);
        this.y = Math.random() * (h - r);
        return this;
    }
    add({ x, y }) {
        this.x += x;
        this.y += y;
        return this;
    }
    sub({ x, y }) {
        this.x -= x;
        this.y -= y;
        return this;
    }
    mul(m = 1) {
        this.x *= m;
        this.y *= m;
        return this;
    }
    div(m = 1) {
        this.x /= m;
        this.y /= m;
        return this;
    }
    norm() {
        return this.div(this.mag());
    }
    mag() {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }
}


function perf(x = 10000) {
    console.time('vector perf');
    // Harder to read what is happening, but shorter, and faster
    for (let i = x; i--;) {
        norm(mul(div(add(sub(rand(), rand()), rand()), 1.2), 3.4));
    }
    console.timeEnd('vector perf');

    console.time('Point perf');
    for (let i = x; i--;) {
        // Easier for humans to read, longer and slower to execute
        new Point().rand().sub(new Point().rand()).add(new Point().rand()).div(1.2).mul(3.4).norm();
    }
    console.timeEnd('Point perf');
    // Average of 14 runs each at 100000 cycles was 21.18ms and 45ms respectively
}
perf();