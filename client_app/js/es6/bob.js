const {
    Vector,
    VZero,
    VRand,
    VAdd,
    VSub,
    VMul,
    VDiv,
    VMag,
    VNorm
} = require('./vector');
const { Tree } = require('./tree.js');
console.time('bob');
var bob = Tree({
    "label": "Graph 2017_04_26T04_08_56_831Z",
    "guid": "55530c3f-9546-4226-b42a-212a9e204abb",
    "notes": "",
    "width": 1600,
    "height": 1600,
    "orbit": 60,
    "radius": 10,
    "speed": 0.5,
    "damping": 0.5,
    "running": true,
    "spreading": 500,
    "spring": 1,
    "nodes": [{
        "guid": "cfd0b2e0-c5bc-46d6-88df-d53bcc171c37",
        "label": "New Node 0",
        "description": "",
        "type": "model",
        "radius": 10,
        "color": "#cccccc",
        "color_highlight": "#aaaaff",
        "color_selected": "#f5f5f5",
        "color_anchored": "#aaaaaa",
        "anchored": false,
        "selected": false,
        "highlighted": false,
        "forces": { "x": 0, "y": 0 },
        "velocity": { "x": -0.0002973897, "y": 0.0004205111 },
        "point": { "x": 589.9528988182, "y": 213.5382425509 },
        "properties": []
    }, {
        "guid": "a3590036-7ad0-483c-bd36-d8cdf4f8fab7",
        "label": "New Node 1",
        "description": "",
        "type": "model",
        "radius": 10,
        "color": "#cccccc",
        "color_highlight": "#aaaaff",
        "color_selected": "#f5f5f5",
        "color_anchored": "#aaaaaa",
        "anchored": false,
        "selected": false,
        "highlighted": false,
        "forces": { "x": 0, "y": 0 },
        "velocity": { "x": -0.000211415, "y": 0.0003046365 },
        "point": { "x": 665.5928953788, "y": 255.8284534852 },
        "properties": []
    }, {
        "guid": "f67e5737-ccd8-42ae-af7e-60d81d95c92c",
        "label": "New Node 2",
        "description": "",
        "type": "model",
        "radius": 10,
        "color": "#cccccc",
        "color_highlight": "#aaaaff",
        "color_selected": "#f5f5f5",
        "color_anchored": "#aaaaaa",
        "anchored": false,
        "selected": false,
        "highlighted": false,
        "forces": { "x": 0, "y": 0 },
        "velocity": { "x": -0.0001678009, "y": 0.0003915199 },
        "point": { "x": 584.380714518, "y": 300.2654304698 },
        "properties": []
    }, {
        "guid": "ff65307e-ee9f-4cf7-97db-59aa08e25e01",
        "label": "New Node 3",
        "description": "",
        "type": "model",
        "radius": 10,
        "color": "#cccccc",
        "color_highlight": "#aaaaff",
        "color_selected": "#f5f5f5",
        "color_anchored": "#aaaaaa",
        "anchored": false,
        "selected": false,
        "highlighted": false,
        "forces": { "x": 0, "y": 0 },
        "velocity": { "x": 0.00036639, "y": -0.0003467327 },
        "point": { "x": 734.1817612972, "y": 313.5192970596 },
        "properties": []
    }, {
        "guid": "e4a00d98-0da4-45dd-b588-37bf7f1b2193",
        "label": "New Node 4",
        "description": "",
        "type": "model",
        "radius": 10,
        "color": "#cccccc",
        "color_highlight": "#aaaaff",
        "color_selected": "#f5f5f5",
        "color_anchored": "#aaaaaa",
        "anchored": false,
        "selected": false,
        "highlighted": false,
        "forces": { "x": 0, "y": 0 },
        "velocity": { "x": 0.0008964682, "y": -0.0002966669 },
        "point": { "x": 727.7274603417, "y": 397.6535438118 },
        "properties": []
    }, {
        "guid": "337891dc-a39f-4bf3-b458-510b8fe17fce",
        "label": "New Node 5",
        "description": "",
        "type": "model",
        "radius": 10,
        "color": "#cccccc",
        "color_highlight": "#aaaaff",
        "color_selected": "#f5f5f5",
        "color_anchored": "#aaaaaa",
        "anchored": false,
        "selected": false,
        "highlighted": false,
        "forces": { "x": 0, "y": 0 },
        "velocity": { "x": 0.0002834835, "y": 0.0002941753 },
        "point": { "x": 590.5028813454, "y": 390.3183155235 },
        "properties": []
    }, {
        "guid": "9bd9c43b-d64a-4b33-b6d8-61396a6adfbb",
        "label": "New Node 6",
        "description": "",
        "type": "model",
        "radius": 10,
        "color": "#cccccc",
        "color_highlight": "#aaaaff",
        "color_selected": "#f5f5f5",
        "color_anchored": "#aaaaaa",
        "anchored": false,
        "selected": false,
        "highlighted": false,
        "forces": { "x": 0, "y": 0 },
        "velocity": { "x": 0.0008032558, "y": -0.0003389588 },
        "point": { "x": 656.1824624622, "y": 452.6532085966 },
        "properties": []
    }, {
        "guid": "a9a4578c-164e-4986-9e1d-8ea6b3baad48",
        "label": "New Node 7",
        "description": "",
        "type": "model",
        "radius": 10,
        "color": "#cccccc",
        "color_highlight": "#aaaaff",
        "color_selected": "#f5f5f5",
        "color_anchored": "#aaaaaa",
        "anchored": false,
        "selected": false,
        "highlighted": false,
        "forces": { "x": 0, "y": 0 },
        "velocity": { "x": -0.0016729917, "y": -0.0004284845 },
        "point": { "x": 654.1067777718, "y": 536.417160712 },
        "properties": []
    }],
    "connections": [{
        "guid": "3a875872-6112-4ef6-9306-f1f0d030869a",
        "length": 85,
        "alpha": "cfd0b2e0-c5bc-46d6-88df-d53bcc171c37",
        "beta": "a3590036-7ad0-483c-bd36-d8cdf4f8fab7",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }, {
        "guid": "f51fd0b2-9921-499b-95c7-3ee60d98ad6f",
        "length": 85,
        "alpha": "cfd0b2e0-c5bc-46d6-88df-d53bcc171c37",
        "beta": "f67e5737-ccd8-42ae-af7e-60d81d95c92c",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }, {
        "guid": "04b66d45-1e70-463a-a271-3b69f3d33aac",
        "length": 90,
        "alpha": "f67e5737-ccd8-42ae-af7e-60d81d95c92c",
        "beta": "a3590036-7ad0-483c-bd36-d8cdf4f8fab7",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }, {
        "guid": "9b5a9f89-3422-4135-9014-91041d072711",
        "length": 85,
        "alpha": "ff65307e-ee9f-4cf7-97db-59aa08e25e01",
        "beta": "a3590036-7ad0-483c-bd36-d8cdf4f8fab7",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }, {
        "guid": "2bfb3512-1a31-4059-a8e2-d1a7030bf126",
        "length": 80,
        "alpha": "e4a00d98-0da4-45dd-b588-37bf7f1b2193",
        "beta": "ff65307e-ee9f-4cf7-97db-59aa08e25e01",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }, {
        "guid": "8145b2ce-ca21-44e8-a44e-9e394a59d71c",
        "length": 85,
        "alpha": "f67e5737-ccd8-42ae-af7e-60d81d95c92c",
        "beta": "337891dc-a39f-4bf3-b458-510b8fe17fce",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }, {
        "guid": "fffb2ea5-3ddc-4194-90fb-314de0f58875",
        "length": 85,
        "alpha": "9bd9c43b-d64a-4b33-b6d8-61396a6adfbb",
        "beta": "337891dc-a39f-4bf3-b458-510b8fe17fce",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }, {
        "guid": "eb92c61d-9d12-46bf-b931-39b61072fd2d",
        "length": 80,
        "alpha": "a9a4578c-164e-4986-9e1d-8ea6b3baad48",
        "beta": "9bd9c43b-d64a-4b33-b6d8-61396a6adfbb",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }, {
        "guid": "bad728a8-dbc4-44f3-9437-b493e00565db",
        "length": 85,
        "alpha": "e4a00d98-0da4-45dd-b588-37bf7f1b2193",
        "beta": "9bd9c43b-d64a-4b33-b6d8-61396a6adfbb",
        "description": "",
        "type": "reference",
        "multiTypes": []
    }]
});
var sam = {
    "guid": "015bc75c-575a-4553-b7e2-bbf3989747a8",
    "label": "Group 0",
    "description": "",
    "type": "group",
    "radius": 20,
    "color": "#cccccc",
    "color_highlight": "#aaaaff",
    "color_selected": "#f5f5f5",
    "color_anchored": "#aaaaaa",
    "anchored": false,
    "selected": false,
    "highlighted": false,
    "forces": Vector(),
    "velocity": Vector(),
    "point": Vector(),
    "children": [
        "cfd0b2e0-c5bc-46d6-88df-d53bcc171c37",
        "a3590036-7ad0-483c-bd36-d8cdf4f8fab7",
        "f67e5737-ccd8-42ae-af7e-60d81d95c92c"
    ],
    "collapsed": true
    // "collapsed": false
};
sam.point = VDiv(sam.children.map(g => bob.index.get(g).data.point).reduce((v, p) => VAdd(v, p), Vector()), 3);
sam.velocity = VDiv(sam.children.map(g => bob.index.get(g).data.velocity).reduce((v, p) => VAdd(v, p), Vector()), 3);
bob.addGroup(sam);
console.timeEnd('bob');
console.log(Array.from(bob.visible).map(o => o.data ? o.data.label : `${o.v_alpha.data.label} -> ${o.v_beta.data.label}`));

module.exports = bob;
