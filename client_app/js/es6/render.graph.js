const { El, } = require('./vdom.js');
const { renderNode } = require("./render.node.js");

const renderConnection = ({guid}) => El('g', { guid, class: 'fdg-svg-connection' });

const renderGraph = (graph) => {
    const {
        guid,
        data: {
            width,
            height
        },
        visible
    } = graph;
    // console.debug(graph);
    const connections = Array.from(visible).filter(c => !c.data);
    const nodes = Array.from(visible).filter(c => c.data);

    // const connections = visible.filter(c => !c.data);
    // const nodes = visible.filter(c => c.data);
    const dom = El(
        'svg',
        {
            class: 'fdg-svg',
            guid: guid,
            height,
            width,
            viewbox: `0 0 ${width} ${height}`
        },
        El(
            'g',
            {
                class: 'fdg-svg-connections'
            },
            ...connections.map(renderConnection)
        ),
        El(
            'g',
            {
                class: 'fdg-svg-nodes'
            },
            ...nodes.map(renderNode)
        )
    );
    // console.debug('renderGraph', dom);
    return dom;
};

module.exports = { renderGraph };
