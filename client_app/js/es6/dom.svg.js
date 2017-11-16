function elSvg(tag = 'svg', props = {}, children = []) {
    const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
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

const Svg = elSvg.bind(null, 'svg');
const G = elSvg.bind(null, 'g');
const Circle = elSvg.bind(null, 'circle');
const Rect = elSvg.bind(null, 'rect');
const Text = elSvg.bind(null, 'text');
const Path = elSvg.bind(null, 'path');

module.exports = {
    elSvg,
    Svg,
    G,
    Circle,
    Rect,
    Text,
    Path
};

/*

document.body.innerHTML = '';
document.body.appendChild(Svg({
    id: 'fake-FDG-Graph',
    height: 1600,
    width: 1600,
    viewbox: '0 0 1600 1600',
    style: 'background-color: #fff;'
}, [
    G({ id: 'fake-FDG-Connection-Group', class: 'connectionGroup' }, [
        G({
            class: 'connection',
            style: 'user-select:none;cursor:pointer;'
        }, [
            Path({
                fill: 'none',
                stroke: '#444',
                d: 'M241.458,288.656L152.801,290.974Z',
                'stroke-width': 4,
                'stroke-linejoin': 'round',
                opacity: 0
            }),
            Path({
                fill: 'none',
                stroke: '#444',
                d: 'M241.458,288.656L152.801,290.974Z',
                'stroke-width': 1,
                'stroke-linejoin': 'round',
                opacity: 1
            }),
            Path({
                fill: '#444',
                d: 'm 0,0 l -10,-5 l 2.5,5 l -2.5,5 z',
                transform: 'matrix(-0.999,0.0261,-0.026,-0.999,152.801,290.974)'
            })
        ])
    ]),
    G({ id: 'fake-FDG-Node-Group', class: 'nodeGroup' }, [
        G({
            class: 'node',
            style: 'user-select:none;cursor:pointer;'
        }, [
            Circle({
                cx: 142.805,
                cy: 291.236,
                r: 10,
                stroke: '#6bd46b',
                fill: '#80ff80',
                'stroke-width': 1
            }),
            G({
                role: 'nodeLabel',
                style: 'pointer-events: none;user-select:none;'
            }, [
                Rect({
                    x: 102.305,
                    y: 284.736,
                    rx: 4,
                    ry: 4,
                    style: 'fill:rgba(255,255,255,0.5);stroke:rgba(68,68,68,0.45);',
                    'stroke-width': 0.5,
                    width: 81,
                    height: 13
                }),
                Text({
                    x: 104.305,
                    y: 293.736,
                    'font-family': 'Helvetica',
                    'font-size': 10,
                    fill: '#444'
                }, [
                    'server\\sitemap.js'
                ])
            ])
        ])
    ])
]));
*/