const UUID = require('./uuid');

function Graph({
    guid = UUID(),
    label = `New Graph ${new Date().toISOString()}`,
    notes = '',
    width = 1600,
    height = 1600,
    orbit = 60,
    radius = 10,
    speed = 0.5,
    damping = 0.5,
    running = true,
    spreading = 500,
    spring = 1,
    nodes = [],
    groups = [],
    connections = []
}) {
    return {
        guid,
        label,
        notes,
        width,
        height,
        orbit,
        radius,
        speed,
        damping,
        running,
        spreading,
        spring,
        nodes,
        groups,
        connections
    };
}

module.exports = {
    Graph
};
