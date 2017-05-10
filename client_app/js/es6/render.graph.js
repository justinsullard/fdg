const { El, } = require('./vdom.js');
const { renderNode } = require("./render.node.js");

const renderConnection = ({uuid}) => El('g', { uuid, class: 'fdg-svg-connection' });

const renderGraph = (graph) => {
    const {
        uuid,
        data: {
            width,
            height
        },
        visible
    } = graph;
    // console.debug(graph);
    const connections = Array.from(visible).filter(c => c.type === 'connection');
    const nodes = Array.from(visible).filter(c => c.type !== 'connection');

    // const connections = visible.filter(c => !c.data);
    // const nodes = visible.filter(c => c.data);
    const dom = El(
        'svg',
        {
            class: 'fdg-svg',
            uuid: uuid,
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
