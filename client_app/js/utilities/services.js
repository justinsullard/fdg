/*jslint */
/*global define */
define(["util", "utils/stringify"], function (util) {
    "use strict";

    const makeSearchServices = () => {
        const graph = {
            label: FDG.util.graph.setting('label'),
            nodes: FDG.util.node.store(),
            connections: FDG.util.connection.store(),
            index: {}
        };
        const services = `
let db = null;
process.on('db', (x) => { db = x; });

const search = (socket, table, term) => {
    if (!db) {
        socket.emit('oops', \`Unable to search for a $\{table} at the moment.\`);
        return;
    }
    const iterm = \`%$\{term}%\`;
    db[table].findDoc({
        or: [
            {'name ilike': iterm},
            {'email ilike': iterm},
            {'description ilike': iterm}
        ]
    }).then(
        (docs) => docs.map(({
            id,
            identifier,
            name,
            email
        }) => ({ id, identifier, name, email }))
    ).then((docs) => {
        socket.emit(\`$\{table}.search.results\`, docs);
    }).catch((e) => {
        console.error(e);
        socket.emit('oops', \`Massive errors are happening with $\{table} search.\`);
    });
};

process.on('connection', (socket) => {
    socket.on('search', ({
        id = UUID()
        table,
        term
    }) => search(socket, table, term));
${
    graph.nodes.map((x) => {
        const lbl = FDG.util.string.toLowerUnderscoreCase(x.label);
        return `    socket.on('${lbl}.search', (term) => search(socket, '${lbl}', term));`;
    }).join('\n')
}
\});
`;
        return services;
    };

    const makeGetServices = () => {
        const graph = {
            label: FDG.util.graph.setting('label'),
            nodes: FDG.util.node.store(),
            connections: FDG.util.connection.store(),
            index: {}
        };
        const services = `
let db = null;
process.on('db', (x) => { db = x; });

const mapper = {${
    graph.nodes.map((x) => {
        const lbl = FDG.util.string.toLowerUnderscoreCase(x.label);
        const X = FDG.util.node.get(x.guid);
        return `
    ${lbl}: (docs) => Promise.all([${
    FDG.util.connection.ofNode(X).map((c) => {
        const a = c.alphaNode;
        const b = c.betaNode;
        const is_a = a.guid() === x.guid;
        const oth = FDG.util.string.toLowerUnderscoreCase(is_a ? b.label() : a.label());
        const c_type = c.connectionType();
        if ((c_type === 'oneToMany' || c_type === 'zeroToMany') && c.alphaNode === X) {
            return `
        ...docs.map((${lbl}) => {
            return db.${oth}.find({ ${lbl}: ${lbl}.id }, { fields: ['id']}).then((list) => {
                ${lbl}.${oth} = list.map(({ id }) => \`/${oth}/$\{id}\`);
            });
        })`;
        } else if (c_type === 'manyToMany') {
            return `
        ...docs.map((${lbl}) => {
            return db.${is_a ? `${lbl}_${oth}` : `${oth}_${lbl}`}.find({ ${lbl}: ${lbl}.id }, { fields: ['${oth}']}).then((list) => {
                ${lbl}.${oth} = list.map(({ ${oth} }) => \`/${oth}/$\{${oth}}\`);
            });
        })`;
        }
        return null;
    }).filter(Boolean).join(',\n')
    }
    ]).then(() => docs)`;
    }).join(',\n')
}};

process.on('connection', (socket) => {
    socket.on('get', (identifier) => {
        const [table, id] = identifier.split('/').slice(1);
        if (!mapper[table]) {
            socket.emit('oops', \`We do not serve $\{table}\`);
            return;
        }
        db[table].findDoc({ id }).then(mapper[table]).then((docs) => {
            socket.emit('get.results', docs);
        }).catch((e) => {
            console.error(e);
            socket.emit('oops', \`Massive errors are happening with $\{table} get.\`);
        });
    });
});`;
        return services;
    };

    util.extend({
        "dest": util,
        "source": {
            "service": {
                "search": makeSearchServices,
                "get": makeGetServices
            }
        }
    });
    return util;
});
