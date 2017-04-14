import UUID from './uuid';
import {
    vector,
    vrand
} from './vector';

export const NODE_TYPES = ['model', 'view', 'controller', 'lookup', 'module', 'config', 'group'];
export function Node({
    guid = UUID(),
    label = 'New Node',
    description = '',
    nodeType = 'model',
    point = vrand(),
    radius = 10,
    color = '#cccccc',
    colorAnchored = '#aaaaaa',
    colorHighlight = '#aaaaff',
    colorSelected = '#f5f5f5',
    selected = false,
    highlighted = false,
    forces = vector(),
    velocity = vector(),
    group = null
}) {
    return {
        guid,
        label,
        description,
        nodeType: NODE_TYPES.indexOf(nodeType) ? nodeType : NODE_TYPES[0],
        point,
        radius,
        color,
        colorAnchored,
        colorHighlight,
        colorSelected,
        selected,
        highlighted,
        forces,
        velocity,
        group
    };
}
