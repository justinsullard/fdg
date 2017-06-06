const { UUID } = require('./uuid');

const CONNECTION_TYPES = ['reference', 'oneToOne', 'oneToMany', 'manyToMany', 'manyToOne'];
function Connection({
    uuid = UUID(),
    label = 'New Connection',
    description = '',
    type = CONNECTION_TYPES[0],
    length = 50,
    color = '#444444',
    color_highlight = '#aa4444',
    color_selected = '#aa4444',
    selected = false,
    highlighted = false,
    alpha = null,
    beta = null
}) {
    return {
        uuid,
        label,
        description,
        type: CONNECTION_TYPES.includes(type) ? type : CONNECTION_TYPES[0],
        length,
        color,
        color_highlight,
        color_selected,
        selected,
        highlighted,
        alpha,
        beta
    };
}

module.exports = {
    CONNECTION_TYPES,
    Connection
};
