const { El, uProps } = require('./vdom.js');

const txtCache = new Map();
const txtCacheTime = new Map();

const svgEl = (tag, props = {}) => {
    console.debug('svgEl');
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    uProps(el, props);
    return el;
};

const sizer = svgEl('svg', { width: 1000, height: 1000, viewbox: '0 0 1000 1000' });

const sizeText = (txt) => {
    const now = Date.now();
    let cache = txtCache.get(txt);
    if (!cache) {
        const text = svgEl('text', {
            x: 0, y: 0, 'font-family': 'monospace', 'font-size': 10, fill: '#000'
        });
        text.appendChild(document.createTextNode(txt));
        sizer.appendChild(text);
        bbox = text.getBBox();
        const { width, height } = bbox;
        sizer.removeChild(text);
        cache = {
            width,
            height,
            tx: width / -2,
            ty: 2.5, // Yes, this is correct
            rx: (width / -2) - 2,
            ry: (height / -2) - 3,
            rwidth: width + 2,
            rheight: height + 4
        };
        txtCache.set(txt, cache);
        console.debug('sizeText', { txt, now, width, height, text, sizer, bbox });
    }
    txtCacheTime.set(txt, now);
    return cache;
};

const renderNode = (node) => {
    const { guid, data: { point: { x, y }, radius, label, color } } = node;
    const cache = sizeText(label);
    return El(
        'g',
        {
            class: 'fdg-svg-node',
            guid: guid
        },
        El(
            'circle',
            {
                class: 'fdg-svg-node-circle',
                cx: x,
                cy: y,
                r: radius,
                stroke: '#000000',
                fill: color,
                'stroke-width': 1
            }
        ),
        El(
            'g',
            {
                class: 'fdg-svg-node-label'
            },
            El(
                'rect',
                {
                    class: 'fdg-svg-node-label-rect',
                    x: x + cache.rx,
                    y: y + cache.ry,
                    rx: 4,
                    ry: 4,
                    width: cache.rwidth,
                    height: cache.rheight
                }
            ),
            El(
                'text',
                {
                    class: 'fdg-svg-node-label-text',
                    x: x + cache.tx,
                    y: y + cache.ty
                },
                label
            )
        )
    );
};

module.exports = { renderNode, sizer };
