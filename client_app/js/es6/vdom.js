const flatten = (arr) => {
    const flat = [].concat(arr);
    for (let i = 0; i < flat.length; i++) {
        if (Array.isArray(flat[i])) {
            flat.splice(i, 1, ...flat[i--]);
        }
    }
    return flat;
};

const El = (type, props = {}, ...children) => ({ type, props, children: flatten(children) });

const sBoolProp = (el, k, v) => {
    if (v) {
        el.setAttribute(k, v);
        el[k] = true;
        return;
    }
    el[k] = false;
};

const dBoolProp = (el, k) => el[k] = false;

const sProp = (el, k, v) => {
    if (typeof v === 'boolean') {
        sBoolProp(el, k, v);
        return;
    }
    el.setAttribute(k, v);
};

const dProp = (el, k, v) => {
    el.removeAttribute(k);
    if (typeof v === 'boolean') { dBoolProp(el, k); }
};

const sProps = (el, p = {}) => {
    for (k in p) {
        sProp(el, k, p[k]);
    }
};

const uProp = (el, name, newVal, oldVal) => {
    if (!newVal) {
        dProp(el, name, oldVal);
        return;
    }
    if (!oldVal || newVal !== oldVal) { sProp(el, name, newVal); }
};

const uProps = (el, n, o = {}) => {
    const m = Object.assign({}, n, o)
    for (k in m) {
        uProp(el, k, n[k], o[k]);
    }
};

const createElementSVG = (doc, n) => {
    if (typeof n === 'string') { return doc.createTextNode(n); }
    const { props = {}, children = [] } = n;
    const el = doc.createElementNS('http://www.w3.org/2000/svg', n.type);
    sProps(el, props);
    children.map(createElementSVG.bind(null, doc)).forEach(el.appendChild.bind(el));
    return el;
};

const createElement = (doc, n) => {
    if (typeof n === 'string') { return doc.createTextNode(n); }
    const { type } = n;
    if (type === 'svg') { return createElementSVG(doc, n); }
    const { props = {}, children = [] } = n;
    const el = doc.createElement(type);
    sProps(el, props);
    children.map(createElement.bind(null, doc)).forEach(el.appendChild.bind(el));
    return el;
};

const changed = (a, b) => typeof a !== typeof b || typeof a === 'string' && a !== b || a.type !== b.type;

const renderSVG = (doc, p, n, o, i = 0) => {
    if (!p) { throw new Error('No parent element provided to renderSVG'); }
    if (!o) {
        p.appendChild(createElementSVG(n));
        return;
    }
    if (!n) {
        p.removeChild(p.childNodes[i]);
        return;
    }
    if (changed(n, o)) {
        p.replaceChild(p.childNodes[i], createElementSVG(n));
        return;
    }
    if (n.type) {
        uProps(p.childNodes[i], n.props, o.props);
        for (let j = 0, l = Math.max(n.children.length, o.children.length); j < l; j ++) {
            renderSVG(doc, p.childNodes[i], n.children[j], o.children[j], j);
        }
    }
};

const render = (doc, p, n, o, i = 0) => {
    if (!p) { throw new Error('No parent element provided to render'); }
    if (!o) {
        p.appendChild(createElement(doc, n));
        return;
    }
    if (!n) {
        p.removeChild(p.childNodes[i]);
        return;
    }
    if (changed(n, o)) {
        p.replaceChild(p.childNodes[i], createElement(doc, n));
        return;
    }
    if (n.type) {
        if (n.type === 'svg') {
            renderSVG(doc, p, n, o, i);
        } else {
            uProps(p.childNodes[i], n.props, o.props);
            for (let j = 0, l = Math.max(n.children.length, o.children.length); j < l; j ++) {
                render(doc, p.childNodes[i], n.children[j], o.children[j], j);
            }
        }
    }
};

module.exports = {
    render,
    El,
    uProps
};
