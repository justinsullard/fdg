function elHtml(tag = 'div', props = {}, children = []) {
    const el = document.createElement(tag);
    Object.keys(props).forEach(k => {
        el.setAttribute(k, props[k]);
    });
    children.forEach(c => {
        if (typeof c === 'string') {
            el.appendChild(document.createTextNode(c));
        } else if (c) {
            el.appendChild(c);
        }
    });
    return el;
}

const Div = elHtml.bind(null, 'div');

module.exports = {
    elHtml,
    Div
};