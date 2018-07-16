/*global FDG */
// Sort nodes into lone, root, branch, leaf
var tbl_summary = FDG.util.node.store().map(
    (x) => FDG.util.node.get(x.guid)
).reduce(
    (r, x) => {
        const X = x.serialize().label;
        const conn = FDG.util.connection.ofNode(x).filter(
            (c) => (
                c.alphaNode.nodeType() !== 'lookup'
                && c.betaNode.nodeType() !== 'lookup'
            )
        );
        if (!conn.length && x.nodeType() !== 'lookup') {
            r.lone.push(X);
            return r;
        }
        const kids = conn.filter(
            (c) => {
                if (!c.connectionType().includes('To')) { return false; }
                const [at, bt] = c.connectionType().split('To').map(y => y.toLowerCase());
                if (`${at}${bt}` === 'manymany') { return true; }
                if (c.alphaNode === x) { return at === 'one' || at === 'zero'; }
                return bt === 'one' || bt === 'zero';
            }
        ).length;
        const parents = conn.length - kids;
        if (parents && kids) {
            r.branch.push(X);
        } else if (parents) {
            r.leaf.push(X);
        } else if (x.nodeType() === 'lookup') {
            r.lookup.push(X);
        } else {
            r.root.push(X);
        }
        return r;
    },
    {
        lookup: [],
        lone: [],
        root: [],
        branch: [],
        leaf: [],
    }
);

// Get the possible candidates for manyToMany relationships currently represented as nodes
// FDG.util.node.store().map(
//     (x) => FDG.util.node.get(x.guid)
// ).filter(
//     (x) => (
//         x.nodeType() !== 'lookup'
//         && FDG.util.connection.ofNode(x).filter(
//             (c) => c.alphaNode === x && c.connectionType().includes('one') || c.betaNode === x && c.connectionType().includes('ToMany')
//         ).length === 2
//     )
// ).map(
//     (x) => `${x.label()} : ${x.description()}`
// );

// Another possible way, just identify those that have only 2 fields
FDG.util.node.store().map(
    (x) => FDG.util.node.get(x.guid)
).filter(
    (x) => {
        if (tbl_summary.lone.includes(x.label())) { return false; }
        if (x.nodeType() == 'lookup') { return false; }
        if (x.label().match(/assoc/i)) { return true; }
        let bob = {};
        eval(`bob = ${x.description()};`);
        const b = Object.keys(bob).filter(k => k !== 'BusinessUnit').length;
        return (
            b === 2
            || (
                !tbl_summary.root.includes(x)
                && b < 5
                && x.nodeType() !== 'lookup'
                && FDG.util.connection.ofNode(x).filter(
                    (c) => c.alphaNode === x && c.connectionType().includes('one') || c.betaNode === x && c.connectionType().includes('ToMany')
                ).length === 2
            )
        );
    }
).map(
    (x) => `${x.label()} : ${x.description()}`
);