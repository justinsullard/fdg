const R = Math.random;

function Vector({ x = 0, y = 0 } = {}) { return { x, y }; }
function VZero(v) {
    v.x = 0;
    v.y = 0;
    return v;
}
function VRand(v = Vector(), w = 100, h = 100, r = 10) {
    v.x = R() * (w - r);
    v.y = R() * (h - r);
    return v;
}
function VAdd(v, o) {
    v.x += o.x;
    v.y += o.y;
    return v;
}
function VSub(v, o) {
    v.x -= o.x;
    v.y -= o.y;
    return v;
}
function VMul(v, m) {
    v.x *= m;
    v.y *= m;
    return v;
}
function VDiv(v, m) {
    v.x /= m;
    v.y /= m;
    return v;
}
function VMag(v) {
    return Math.sqrt((v.x * v.x) + (v.y * v.y));
}
function VNorm(v) {
    return VDiv(v, VMag(v));
}

module.exports = {
    Vector,
    VZero,
    VRand,
    VAdd,
    VSub,
    VMul,
    VDiv,
    VMag,
    VNorm
};
