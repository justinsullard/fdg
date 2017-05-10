const { UUID } = require('./uuid');
const {
    Vector,
    VRand
} = require('./vector');

const NODE_TYPES = ['model', 'view', 'controller', 'lookup', 'module', 'config'];
function Node({
    uuid = UUID(),
    label = 'New Node',
    description = '',
    type = 'model',
    point = VRand(),
    radius = 10,
    color = '#cccccc',
    color_anchored = '#aaaaaa',
    color_highlight = '#aaaaff',
    color_selected = '#f5f5f5',
    anchored = false,
    selected = false,
    highlighted = false,
    forces = Vector(),
    velocity = Vector(),
    group = null
}) {
    return {
        uuid,
        label,
        description,
        type: NODE_TYPES.indexOf(type) ? type : NODE_TYPES[0],
        point,
        radius,
        color,
        color_anchored,
        color_highlight,
        color_selected,
        anchored,
        selected,
        highlighted,
        forces,
        velocity,
        group
    };
}

module.exports = {
    NODE_TYPES,
    Node
};