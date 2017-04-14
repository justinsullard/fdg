const R = Math.random;
export function vector({ x = 0, y = 0 } = {}) { return { x, y }; }
export function vzero(v) {
    v.x = 0;
    v.y = 0;
    return v;
}
export function vrand(v = vector(), w = 100, h = 100, r = 10) {
    v.x = R() * (w - r);
    v.y = R() * (h - r);
    return v;
}
export function vadd(v, o) {
    v.x += o.x;
    v.y += o.y;
    return v;
}
export function vsub(v, o) {
    v.x -= o.x;
    v.y -= o.y;
    return v;
}
export function vmul(v, m) {
    v.x *= m;
    v.y *= m;
    return v;
}
export function vdiv(v, m) {
    v.x /= m;
    v.y /= m;
    return v;
}
export function vmag(v) {
    return Math.sqrt((v.x * v.x) + (v.y * v.y));
}
export function vnorm(v) {
    return vdiv(v, vmag(v));
}
