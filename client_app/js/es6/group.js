const { Node } = require('./node.js');

// A group is basically a node with children and props
function Group(node = {}) {
    const {
        children = [],
        collapsed = false
    } = node;
    const group = Node(node);
    group.children = children;
    group.collapsed = collapsed;
    group.type = 'group';
    return group;
}

module.exports = {
    Group
};
