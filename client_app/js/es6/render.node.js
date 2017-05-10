const { El, uProps } = require('./vdom.js');

const FONT_SIZE = 10;

const txtCache = new Map();
const txtCacheTime = new Map();

const svgEl = (tag, props = {}) => {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
    uProps(el, props);
    return el;
};

const sizer = svgEl('svg', {
    width: 0,
    height: 0,
    viewbox: '0 0 1000 1000'
});

const sizeText = (txt) => {
    let cache = txtCache.get(txt);
    if (!cache) {
        const text = svgEl('text', {
            x: 0,
            y: 20,
            class: 'fdg-svg-node-label-text',
            'font-size': FONT_SIZE,
            'alignment-baseline': 'middle'
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
            ty: 0,
            rx: (width / -2) - 2,
            ry: (height / -2) - 2,
            rwidth: width + 4,
            rheight: height + 4
        };
        txtCache.set(txt, cache);
    }
    txtCacheTime.set(txt, Date.now());
    return cache;
};

const renderNode = (node) => {
    const { uuid, data: { point: { x, y }, radius, label, color } } = node;
    const cache = sizeText(label);
    return El(
        'g',
        {
            class: 'fdg-svg-node',
            uuid: uuid,
            // style: `transform: translate3D(${x}px, ${y}px, 0);`
            transform: `translate(${x} ${y})`
        },
        El(
            'circle',
            {
                class: 'fdg-svg-node-circle',
                cx: 0,
                cy: 0,
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
                    x: cache.rx,
                    y: cache.ry,
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
                    'font-size': FONT_SIZE,
                    'text-anchor': 'middle',
                    'alignment-baseline': 'middle'
                },
                label
            )
        )
    );
};

document.body.appendChild(sizer);

module.exports = { renderNode, sizer, sizeText };
