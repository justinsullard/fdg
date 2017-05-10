const El = (type, props = {}, ...children) => { return { type, props, children }; };

const sBoolProp = (el, k, v) => {
    if (v) {
        el.setAttribute(k, v);
        return el[k] = true;
    }
    el[k] = false;
};

const dBoolProp = (el, k) => el[k] = false;

const EV_REGEX = /^on/;
const isEvProp = (k) => EV_REGEX.test(k);

const getEv = (k) => k.slice(2).toLowerCase();

const sProp = (el, k, v) => {
    if (typeof v === 'boolean') { return sBoolProp(el, k, v); }
    el.setAttribute(k, v);
};

const dProp = (el, k, v) => {
    el.removeAttribute(k);
    if (typeof v === 'boolean') { return dBoolProp(el, k); }
};

const sProps = (el, p = {}) => Object.keys(p).forEach(k => sProp(el, k, p[k]));

const uProp = (el, name, newVal, oldVal) => {
    if (!newVal) { return dProp(el, name, oldVal); }
    if (!oldVal || newVal !== oldVal) { sProp(el, name, newVal); }
};

const uProps = (el, n, o = {}) => {
    Object.keys(Object.assign({}, n, o)).forEach(k => {
        uProp(el, k, n[k], o[k]);
    });
};

const addEventListener = (el, props = {}) => Object.keys(props).forEach(k => isEvProp(k) && el.addEventListener(getEv(k), props[k]));

const createElementSVG = (doc, n) => {
    if (typeof n === 'string') { return doc.createTextNode(n); }
    const { props = {}, children = [] } = n;
    const el = doc.createElementNS('http://www.w3.org/2000/svg', n.type);
    sProps(el, props);
    addEventListener(el, props);
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
    addEventListener(el, props);
    children.map(createElement.bind(null, doc)).forEach(el.appendChild.bind(el));
    return el;
};

const changed = (a, b) => typeof a !== typeof b || typeof a === 'string' && a !== b || a.type !== b.type;

const renderSVG = (doc, p, n, o, i = 0) => {
    if (!p) { return console.warn('No parent element provided to renderSVG') }
    if (!o) { return p.appendChild(createElementSVG(n)); }
    if (!n) { return p.removeChild(p.childNodes[i]); }
    if (changed(n, o)) { return p.replaceChild(p.childNodes[i], createElementSVG(n)); }
    if (n.type) {
        uProps(p.childNodes[i], n.props, o.props);
        for (let j = 0, l = Math.max(n.children.length, o.children.length); j < l; j ++) {
            renderSVG(doc, p.childNodes[i], n.children[j], o.children[j], j);
        }
    }
};

const render = (doc, p, n, o, i = 0) => {
    if (!p) { return console.warn('No parent element provided to render') }
    if (!o) { return p.appendChild(createElement(doc, n)); }
    if (!n) { return p.removeChild(p.childNodes[i]); }
    if (changed(n, o)) { return p.replaceChild(p.childNodes[i], createElement(doc, n)); }
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

module.exports = { render, El, uProps };
