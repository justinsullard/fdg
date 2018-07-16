/* global define, FDG */
define([], function () {
    function getConnections(lbl) {
        return FDG.util.connection.ofNode(FDG.util.node.search(lbl)[0]).map(c => `${c.alphaNode.label()} -> ${c.betaNode.label()}`).sort();
    }
    function getParents(lbl) {
        const n = FDG.util.node.search(lbl)[0];
        return FDG.util.connection.ofNode(n).filter(c => c.betaNode === n).map(c => `${c.alphaNode.label()} -> ${c.betaNode.label()}`).sort();    
    }
    function getChildren(lbl) {
        const n = FDG.util.node.search(lbl)[0];
        return FDG.util.connection.ofNode(n).filter(c => c.alphaNode === n).map(c => `${c.alphaNode.label()} -> ${c.betaNode.label()}`).sort();    
    }
    function getBranchUp(lbl, pth = []) {
        const leaf = typeof lbl === 'string' ? FDG.util.node.search(lbl)[0] : lbl;
        let ret = [];
        pth.push(leaf);
        const branches = FDG.util.connection.ofNode(leaf).map(c => c.alphaNode).filter(n => pth.indexOf(n) === -1);
        if (branches.length) {
            branches.forEach(n => ret.push(...getBranchUp(n, pth.slice())));
        } else {
            ret = [pth];
        }
        return ret;
    }
    function getBranchDown(lbl, pth = []) {
        const leaf = typeof lbl === 'string' ? FDG.util.node.search(lbl)[0] : lbl;
        let ret = [];
        pth.push(leaf);
        const branches = FDG.util.connection.ofNode(leaf).map(c => c.betaNode).filter(n => pth.indexOf(n) === -1);
        if (branches.length) {
            branches.forEach(n => ret.push(...getBranchDown(n, pth.slice())));
        } else {
            ret = [pth];
        }
        return ret;
    }
    function getBranches(l) {
        let ret = getBranchUp(l);
        const nodes = new Set();
        ret.forEach(b => b.forEach(n => nodes.add(n.label())));
        ret = ret.map(b => b.map(n => n.label()).reverse().join(' -> '));
        return {
            paths: Array.from(new Set(ret)).sort(),
            nodes: Array.from(nodes).sort()
        };
    }
    function getBranchesDown(l) {
        let ret = getBranchDown(l);
        const nodes = new Set();
        ret.forEach(b => b.forEach(n => nodes.add(n.label())));
        ret = ret.map(b => b.map(n => n.label()).join(' -> '));
        return {
            paths: Array.from(new Set(ret)).sort(),
            nodes: Array.from(nodes).sort()
        };
    }
    function getLeafs() {
        return FDG.util.node.store().map(n => FDG.util.node.get(n.guid)).filter(n => {
            const cons = FDG.util.connection.ofNode(n);
            return cons.filter(c => c.betaNode === n).length === cons.length;
        });
    }
    function getRoots() {
        return FDG.util.node.store().map(n => FDG.util.node.get(n.guid)).filter(n => {
            const cons = FDG.util.connection.ofNode(n);
            return cons.filter(c => c.alphaNode === n).length === cons.length;
        });
    }
    function getOrphans() {
        return FDG.util.node.store().map(n => FDG.util.node.get(n.guid)).filter(n => {
            return FDG.util.connection.ofNode(n).length === 0;
        });
    }
    return {
        getConnections,
        getParents,
        getChildren,
        getBranches,
        getBranchesDown,
        getLeafs,
        getRoots,
        getOrphans
    };
});
