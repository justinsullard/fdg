const defd = (x) => x !== null && x !== undefined;

const flatten = (arr) => {
    const flat = [].concat(arr);
    for (let i = 0; i < flat.length; i++) {
        if (Array.isArray(flat[i])) { flat.splice(i, 1, ...flat[i--]); }
    }
    return flat.filter(defd);
};

const El = (type, props = {}, ...children) => ({ type, props, children: flatten(children) });

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

const sProp = (el, k, v) => {
    if (isEvProp(k)) { return el[k] = v; }
    if (typeof v === 'boolean') { return sBoolProp(el, k, v); }
    el.setAttribute(k, v);
    if (k === 'value') { el[k] = v; }
};

const dProp = (el, k, v) => {
    if (isEvProp(k)) { return el[k] = null; }
    el.removeAttribute(k);
    if (typeof v === 'boolean') { dBoolProp(el, k); }
};

const sProps = (el, p = {}) => {
    for (k in p) { sProp(el, k, p[k]); }
};

const uProp = (el, name, newVal, oldVal) => {
    if (!defd(newVal) || (typeof newVal === 'boolean' && !newVal)) { return dProp(el, name, oldVal); }
    if (!defd(oldVal) || (typeof oldVal === 'boolean' && !oldVal) || newVal !== oldVal) { sProp(el, name, newVal); }
};

const uProps = (el, n, o = {}) => {
    const m = Object.assign({}, n, o);
    for (k in m) { uProp(el, k, n[k], o[k]); }
};

// ["a", "altGlyph", "altGlyphDef", "altGlyphItem", "animate", "animateMotion", "animateTransform", "circle", "clipPath", "color-profile", "cursor", "defs", "desc", "ellipse", "feBlend", "g", "image", "line", "linearGradient", "marker", "mask", "path", "pattern", "polygon", "polyline", "radialGradient", "rect", "stop", "svg", "text", "tref", "tspan", "use"]
// ["SVGMPathElement", "SVGDiscardElement", "SVGAnimationElement", "SVGViewElement", "SVGUseElement", "SVGTitleElement", "SVGTextPositioningElement", "SVGTextPathElement", "SVGTextElement", "SVGTextContentElement", "SVGTSpanElement", "SVGSymbolElement", "SVGSwitchElement", "SVGStyleElement", "SVGStopElement", "SVGSetElement", "SVGScriptElement", "SVGSVGElement", "SVGRectElement", "SVGRadialGradientElement", "SVGPolylineElement", "SVGPolygonElement", "SVGPatternElement", "SVGPathElement", "SVGMetadataElement", "SVGMaskElement", "SVGMarkerElement", "SVGLinearGradientElement", "SVGLineElement", "SVGImageElement", "SVGGraphicsElement", "SVGGradientElement", "SVGGeometryElement", "SVGGElement", "SVGForeignObjectElement", "SVGFilterElement", "SVGFETurbulenceElement", "SVGFETileElement", "SVGFESpotLightElement", "SVGFESpecularLightingElement", "SVGFEPointLightElement", "SVGFEOffsetElement", "SVGFEMorphologyElement", "SVGFEMergeNodeElement", "SVGFEMergeElement", "SVGFEImageElement", "SVGFEGaussianBlurElement", "SVGFEFuncRElement", "SVGFEFuncGElement", "SVGFEFuncBElement", "SVGFEFuncAElement", "SVGFEFloodElement", "SVGFEDropShadowElement", "SVGFEDistantLightElement", "SVGFEDisplacementMapElement", "SVGFEDiffuseLightingElement", "SVGFEConvolveMatrixElement", "SVGFECompositeElement", "SVGFEComponentTransferElement", "SVGFEColorMatrixElement", "SVGFEBlendElement", "SVGEllipseElement", "SVGDescElement", "SVGDefsElement", "SVGComponentTransferFunctionElement", "SVGClipPathElement", "SVGCircleElement", "SVGAnimateTransformElement", "SVGAnimateMotionElement", "SVGAnimateElement", "SVGAElement"]
const SVGNS = 'http://www.w3.org/2000/svg';
const HTMLNS = 'http://www.w3.org/1999/xhtml'
const namespaces = { svg: SVGNS, foreignObject: HTMLNS };
const createElement = (doc, n, pns = HTMLNS) => {
    if (typeof n === 'string') { return doc.createTextNode(n); }
    const { type } = n;
    const { props = {}, children = [] } = n;
    const ns = namespaces[type] || pns;
    const el = doc.createElementNS(ns, type);
    sProps(el, props);
    const l = children.length;
    for (let i = 0; i < l; i++) {
        el.appendChild(createElement(doc, children[i], ns));
    }
    return el;
};

const changed = (a, b) => typeof a !== typeof b || (typeof a === 'string' && a !== b) || a.type !== b.type;

const render = (doc, p, n, o, i = 0) => {
    if (i === 0 && !defd(o)) { p.innerText = ''; }
    if (!defd(p)) { throw new Error('No parent element provided to render'); }
    const ns = p.namespaceURI || HTMLNS;
    if (!defd(o)) { return p.appendChild(createElement(doc, n, ns)); }
    if (!defd(n)) { return p.lastChild.remove(); }
    if (changed(n, o)) { return p.replaceChild(createElement(doc, n, ns), p.childNodes[i]); }
    if (typeof n !== 'string' && n.type) {
        uProps(p.childNodes[i], n.props, o.props);
        const l = Math.max(n.children.length, o.children.length);
        for (let j = 0; j < l; j++) {
            render(doc, p.childNodes[i], n.children[j], o.children[j], j);
        }
    }
};

module.exports = {
    render,
    El,
    uProps
};