/*jslint */
/*global define, FDG */
define(["util", "utils/stringify"], function (util) {
    "use strict";

    const makeSchema = () => {
        const bob = FDG.util.node.store().reduce((ret, x) => {
            const lbl = FDG.util.string.toLowerUnderscoreCase(x.label);
            ret[lbl] = ret[lbl] || {};
            const X = FDG.util.node.get(x.guid);
            // console.debug(lbl);
            const schema = Object.assign(
                (x.description ? eval(`(()=>(${util.nativeCleanse(x.description)}))()`) : {}),
                ret[lbl],
                {
                    id: String,
                    created_at: Date,
                    modified_at: Date,
                    identifier: String,
                    name: String,
                    description: String
                }
            );
            X.description(util.stringify(schema));
            Object.assign(ret[lbl], schema);
            FDG.util.connection.ofNode(X).forEach((c) => {
                const a = c.alphaNode;
                const b = c.betaNode;
                const is_a = a.guid() === x.guid;
                const oth = FDG.util.string.toLowerUnderscoreCase(is_a ? b.label() : a.label());
                const con_type = c.connectionType();
                switch (con_type) {
                case 'oneToMany':
                    if (is_a) {
                        ret[lbl][`${oth}`] = [];
                    } else {
                        ret[lbl][`${oth}`] = `ref`;
                    }
                    break;
                case 'manyToMany':
                    ret[lbl][`${oth}`] = [];
                    break;
                default:
                }
            });
            return ret;
        }, {});
        return bob;
    };

    const makePostgres = () => {
        const graph = {
            label: FDG.util.graph.setting('label'),
            nodes: FDG.util.node.store(),
            connections: FDG.util.connection.store(),
            index: {}
        };
        const SCHEMA = makeSchema();
        graph.nodes.forEach((n) => {
            graph.index[n.guid] = n;
        }, {});
        const lowerUnderscore = FDG.util.string.toLowerUnderscoreCase;
        const db_name = lowerUnderscore(graph.label);
        const db_user = db_name.slice(0, 8);
        const db_password = `This_is_the_temporary_password_for_${db_user}`;
        const schema = 'public';
        const shard = '001';
        const tables = new Set();
        const table_index = {};
        const sql = `
-- =============================================================================
-- DATABASE
-- =============================================================================

CREATE ROLE ${db_user} WITH LOGIN PASSWORD '${db_password}';

CREATE DATABASE ${db_name}
  WITH OWNER = ${db_user}
       ENCODING = 'UTF8'
       TABLESPACE = pg_default
       LC_COLLATE = 'en_US.UTF-8'
       LC_CTYPE = 'en_US.UTF-8'
       CONNECTION LIMIT = -1;

\\c ${db_name};

-- =============================================================================
-- SCHEMAS
-- =============================================================================

DROP SCHEMA IF EXISTS ${schema} CASCADE;
CREATE SCHEMA IF NOT EXISTS ${schema};
-- GRANT ALL ON SCHEMA ${schema} TO postgres;
GRANT ALL ON SCHEMA ${schema} TO ${db_user};
COMMENT ON SCHEMA ${schema}
  IS '${graph.label} ${schema} schema, shard ${shard}';

-- =============================================================================
-- ADDITIONAL DB ROLES
-- =============================================================================

-- CREATE ROLE ${db_user} WITH LOGIN PASSWORD '${db_password}';

-- =============================================================================
-- COMMON FUNCTIONS
-- =============================================================================

-- Designed for use with PostgreSQL 9.6 and PLV8 2.1.0
CREATE EXTENSION IF NOT EXISTS plv8;

ALTER DATABASE ${db_name} SET plv8.start_proc = 'plv8_init';

CREATE TABLE public."plv8_modules" (
  module text unique primary key,
  autoload bool default true,
  source text
);
ALTER TABLE public."plv8_modules" OWNER TO ${db_user};


CREATE OR REPLACE FUNCTION plv8_init() RETURNS void AS $$
  const moduleCache = {};
  const load = (key, source) => {
    const module = { exports: { } };
    eval(\`((module, exports) => {$\{source};})\`)(module, module.exports);
    moduleCache[key] = module.exports;
    return module.exports;
  };
  schema = {};
  require = (module) => {
    if (moduleCache[module]) { return moduleCache[module]; }
    const rows = plv8.execute(
      'SELECT source FROM public.plv8_modules WHERE module = $1',
      [module]
    );
    if (rows.length < 1) {
      plv8.elog(NOTICE, \`Could not load module $\{module}.\`);
      return null;
    }
    return load(module, rows[0].source);
  };
  getId = (x) => ((\`$\{x}\`).match(/[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}/) || [])[0];
  getTable = (x) => ((\`$\{x}\`).match(/^\\/(\\w+)\\//) || [])[1];
  saveManyToMany = (id, set, table, left, right) => {
      const add = set.map(getId);
      const remove = [];
      plv8.execute(
          \`SELECT $\{right} FROM public.$\{table} WHERE $\{left} = $1\`,
          [id]
      ).forEach((x) => {
          const i = add.indexOf(x[right]);
          if (i < 0) {
              remove.push(x[right]);
          } else {
              add.splice(i, 1);
          }
      });
      if (remove.length) {
          plv8.execute(
              \`DELETE FROM public.$\{table} WHERE $\{right} =ANY ($1)\`,
              [remove]
          );
      }
      if (add.length) {
          add.forEach((x) => {
              plv8.execute(
                  \`INSERT INTO public.$\{table} ($\{left}, $\{right}) VALUES ($1, $2)\`,
                  [id, x]
              );
          });
      }

  };
  loadConnection = (id, table, left, right, order_by) => {
      const t = right === 'id' ? table : right;
      const order_clause = order_by ? \` ORDER BY $\{order_by}\` : '';
      return plv8.execute(
          \`SELECT $\{right} FROM $\{table} WHERE $\{left} = $1$\{order_clause}\`,
          [id]
      ).map((x) => \`/$\{t}/$\{x[right]}\`);
  };
  plv8.execute(
    'SELECT module, source FROM plv8_modules WHERE autoload = true'
  ).forEach(({ module, source }) => load(module, source));
$$ LANGUAGE plv8;

CREATE OR REPLACE FUNCTION uuid_v6() RETURNS uuid AS
$$
    const R = Math.random;
    const D = () => (R()*16|0).toString(16);
    const B = () => (R()*16|0&0x3|0x8).toString(16);
    const t = ('000000000000'+new Date().getTime().toString(16)).slice(-12);
    return t.slice(0, 8)+
        '-'+t.slice(-4)+
        '-6${shard}'+
        '-'+B()+D()+D()+D()+
        '-'+D()+D()+D()+D()+D()+D()+D()+D()+D()+D()+D()+D();
$$
LANGUAGE plv8 VOLATILE;

-- A function for checking a set of columns for non-null values
CREATE OR REPLACE FUNCTION count_not_null_cols(variadic p_array anyarray) RETURNS BIGINT AS
$$
    SELECT count(x) FROM unnest($1) AS x
$$
LANGUAGE SQL IMMUTABLE;
-- Example usage to ensure one and only one of a set of columns are set
-- ALTER TABLE some_table
--   ADD chk_key_set CHECK(count_not_null_cols(col1, col2, col3) = 1);
-- Example usage to ensure one or more of a set of columns are set
-- ALTER TABLE some_table
--   ADD chk_key_set CHECK(count_not_null_cols(col1, col2, col3) > 0);

-- A function for checking a set of columns for TRUE values
CREATE OR REPLACE FUNCTION count_true_cols(variadic p_array anyarray) RETURNS BIGINT AS
$$
    SELECT count(x) FROM unnest($1) AS x WHERE x IS TRUE
$$
LANGUAGE SQL IMMUTABLE;


-- =============================================================================
-- SCHEMA MODULES
-- =============================================================================

INSERT INTO plv8_modules (module, autoload, source) VALUES
${graph.nodes.map((x) => {
    const table = lowerUnderscore(x.label);
    const save_props = ['name', 'description'];
    const fields = ['id', 'identifier', 'created_at', 'modified_at', 'name', 'description'];
    const connections = [];
    const parents = [];
    const many_to_many = graph.connections.map((c) => {
        if (c.alpha !== x.guid && c.beta !== x.guid) { return ''; }
        const other = c.alpha === x.guid
          ? lowerUnderscore(graph.index[c.beta].label)
          : lowerUnderscore(graph.index[c.alpha].label);
        if (
            c.beta === x.guid && c.connectionType.match(/^(one|zero)ToMany$/)
            ||
            c.alpha === x.guid && c.connectionType.match(/^manyTo(One|Zero)$/)
        ) {
            parents.push(other);
            fields.push(other);
            return;
        }
        if (
            c.beta === x.guid && c.connectionType.match(/^manyTo(One|Zero)$/)
            ||
            c.alpha === x.guid && c.connectionType.match(/^(one|zero)ToMany$/)
        ) {
            connections.push(
              `${other}: loadConnection(id, "${other}", "${table}", "id")`
            );
        }
        if (c.connectionType !== 'manyToMany') { return ''; }
        const many = c.alpha === x.guid ? `${table}_${other}` : `${other}_${table}`;
        connections.push(
          `${other}: loadConnection(id, "${many}", "${table}", "${other}")`
        );
        return `if(Array.isArray(doc.${other})) {
        saveManyToMany(id, doc.${other}, "${many}", "${table}", "${other}");
    }`;
    }).filter(Boolean).sort();
    Object.keys(SCHEMA[table]).forEach((k) => {
        if (fields.includes(k)) { return; }
        const v = SCHEMA[table][k];
        // if (Array.isArray(v) || typeof v === 'function') { return; }
        if (Array.isArray(v)) { return; }
        save_props.push(k);
    });
    parents.sort();
    save_props.sort();
    return `(
    '${table}',
    true,
    E'const saveOne = (doc) => {
    let id = getId(doc.identifier);
    const body = {};
    let qry = "";
    const vals = [body];
    const fields = ["body"];${parents.map((x) => `
    if (doc.${x}) {
        vals.push(getId(doc.${x}));
        fields.push("${x}");
    }`).join('')}
    if (id) {
        fields.push("modified_at");
        vals.push(new Date(), id);
        qry = \`UPDATE public.${table} SET \${fields.map((x, i) => \`\${x} = \\\\\$\${i + 1}\`).join(", ")} WHERE id = \\\\\$\${vals.length} RETURNING id\`;
        const current = plv8.execute("SELECT body FROM public.${table} WHERE id = $1", [id])[0];
        Object.assign(body, current.body);
    } else {
        qry = \`INSERT INTO public.${table} (\${fields.join(", ")}) VALUES (\${fields.map((x, i) => \`\\\\\$\${i + 1}\`).join(", ")}) RETURNING id\`;
    }
    const diff = [];
    ${JSON.stringify(save_props)}.forEach((k) => {
        if(doc[k] !== undefined && doc[k] !== body[k]) {
          diff.push([k, body[k], doc[k]]);
          body[k] = doc[k];
        }
    });
    const results = plv8.execute(qry, vals);
    id = results[0].id;
    ${many_to_many.join('\n    ')}
    const ref = \`/${table}/$\{results[0].id}\`;
    plv8.execute("INSERT INTO audit_log (body, ref) VALUES ($1, $2)", [
        {
            operation: id ? "update" : "insert",
            identifier: ref,
            diff
        },
        results[0].id
    ]);
    return loadOne(ref);
};

const save = (doc) => Array.isArray(doc) ? doc.map(saveOne): saveOne(doc);

const loadOne = (identifier) => {
    const { id, created_at, modified_at, body${
        parents.length
        ? ['', ...parents].join(', ')
        : ''
    } } = plv8.execute(
        "SELECT * FROM public.${table} WHERE id = $1",
        [getId(identifier)]
    )[0] || {};
    if (!id) {
        plv8.elog(WARNING, \`Cannot find $\{identifier}\`);
        return { error: \`Cannot find $\{identifier}\`};
    }
    return Object.assign(body || {}, {
        id,
        identifier: \`/${table}/$\{id}\`,${parents.map((x) => `
        ${x}: ${x} && \`/${x}/\${${x}}\`,`).join('')
        }
        created_at,
        modified_at${
          connections.length
          ? ['', ...connections].join(',\n        ')
          : ''
        }
    });
};

const load = (identifier) => Array.isArray(identifier) ? identifier.map(loadOne) : loadOne(identifier);

schema.${table} = { save, load };

module.exports = schema.${table};
')`;
}).join(',\n')};


CREATE OR REPLACE FUNCTION save(req json) RETURNS json AS
$$
    const { doc } = req;
    if (Array.isArray(doc)) {
        return doc.map((d) => {
            const table = getTable(d.identifier);
            if (!schema[table]) { return { error: \`Unable to save $\{d}\` }; }
            return schema[table].save(d);
        });
    } else {
        const table = getTable(doc.identifier);
        if (!schema[table]) { return { error: \`Unable to load $\{doc}\` }; }
        return schema[table].save(doc);
    }
$$
LANGUAGE plv8 VOLATILE;

CREATE OR REPLACE FUNCTION load(req json) RETURNS json AS
$$
    const { identifier } = req;
    if (Array.isArray(identifier)) {
        identifier.map((i) => {
            const table = getTable(i);
            if (!schema[table]) { return { error: \`Unable to load $\{i}\` }; }
            return schema[table].load(i);
        })
    } else {
        const table = getTable(identifier);
        if (!schema[table]) { return { error: \`Unable to load $\{identifier} as $\{table}\` }; }
        return schema[table].load(identifier);
    }
$$
LANGUAGE plv8 VOLATILE;

CREATE OR REPLACE FUNCTION list(req json) RETURNS json AS
$$
    list = (identifier) => {
        const table = getTable(identifier);
        if (!schema[table]) { return { error: \`Cannot find $\{identifier}\` }; }
        const { id, body: { name, description } } = plv8.execute(
            \`SELECT id, body FROM public.$\{table} WHERE id = $1\`,
            [getId(identifier)]
        )[0] || {};
        if (!id) {
            plv8.elog(WARNING, \`Cannot find $\{identifier}\`);
            return { error: \`Cannot find $\{identifier}\`};
        }
        return {
            id,
            identifier,
            name,
            description
        };
    };
    const { identifier } = req;
    if (Array.isArray(identifier)) {
        return identifier.map(list);
    }
    if (!identifier) { return { error: 'No identifier was passed to load.' }; }
    if (identifier.split('/').pop() === '*') {
        const table = getTable(identifier);
        if (!schema[table]) { return { error: \`Cannot find $\{identifier}\` }; }
        return plv8.execute(\`SELECT id, body FROM public.$\{table}\`).map(({
            id,
            body: { name, description }
        }) => ({
            id,
            identifier: \`/$\{table}/$\{id}\`,
            name,
            description
        }));
    }
    return list(identifier);
$$
LANGUAGE plv8 VOLATILE;

-- =============================================================================
-- TABLES
-- =============================================================================

CREATE TABLE public."audit_log" (
  id uuid NOT NULL DEFAULT uuid_v6(),
  ref uuid NOT NULL,
  body jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),  
  CONSTRAINT audit_log_pk PRIMARY KEY (id)
) WITH (OIDS=FALSE);
ALTER TABLE public."audit_log" OWNER TO ${db_user};
CREATE INDEX idx_audit_log ON public."audit_log" USING GIN(body jsonb_path_ops);

${(
graph.nodes.map((x) => {
    const table_name = lowerUnderscore(x.label);
    tables.add(table_name);
    table_index[table_name] = x;
    const foreign_key_fields = graph.connections.map((c) => (
        c.beta !== x.guid || !c.connectionType.match(/^(one|zero)To(Many|One)/)
        ? null
        : (
            c.connectionType.indexOf('one') === 0
            ? `${lowerUnderscore(graph.index[c.alpha].label)} uuid NOT NULL,`
            : `${lowerUnderscore(graph.index[c.alpha].label)} uuid,`

        )
    )).filter(Boolean).join('\n  ');
    return `
CREATE TABLE ${schema}."${table_name}" (
  id uuid NOT NULL DEFAULT uuid_v6(),
  body jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  ${foreign_key_fields}
  search tsvector,
  CONSTRAINT ${table_name}_pk PRIMARY KEY (id)
) WITH (OIDS=FALSE);
ALTER TABLE ${schema}."${table_name}" OWNER TO ${db_user};
CREATE INDEX idx_${table_name} ON ${schema}."${table_name}" USING GIN(body jsonb_path_ops);
CREATE INDEX idx_search_${table_name} ON ${schema}."${table_name}" USING GIN(search);
`;
}).join('')
)}

-- =============================================================================
-- MANY TO MANY TABLES
-- =============================================================================
${(
graph.connections.filter(({connectionType}) => connectionType === 'manyToMany').map((c) => {
    const table_a_name = lowerUnderscore(graph.index[c.alpha].label);
    const table_b_name = lowerUnderscore(graph.index[c.beta].label);
    return `
CREATE TABLE ${schema}."${table_a_name}_${table_b_name}" (
    id uuid NOT NULL DEFAULT uuid_v6(),
    body jsonb,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    modified_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    ${table_a_name} uuid NOT NULL,
    ${table_b_name} uuid NOT NULL,
    search tsvector,
    CONSTRAINT ${table_a_name}_${table_b_name}_pk PRIMARY KEY(id),
    CONSTRAINT ${table_a_name}_${table_b_name}_uniq UNIQUE(${table_a_name}, ${table_b_name})
) WITH(OIDS = FALSE);
ALTER TABLE ${schema}."${table_a_name}_${table_b_name}" OWNER to ${db_user};
CREATE INDEX idx_${table_a_name}_${table_b_name} ON ${schema}."${table_a_name}_${table_b_name}" USING GIN(body jsonb_path_ops);
CREATE INDEX idx_search_${table_a_name}_${table_b_name} ON ${schema}."${table_a_name}_${table_b_name}" USING GIN(search);
  `;
}).join('')
)}
-- =============================================================================
-- UPDATE TRIGGERS
-- =============================================================================

-- CREATE OR REPLACE FUNCTION date_update() RETURNS trigger AS
-- $$
--     if (TG_OP == "UPDATE") { NEW.modified_at = Date.now(); }
--     return NEW;
-- $$
-- LANGUAGE "plv8";

${(
[...tables].map((table_name) => `
-- CREATE OR REPLACE FUNCTION ${schema}_${table_name}_schema() RETURNS trigger AS
-- $$
-- plv8.elog(NOTICE, '${schema}_${table_name}_schema()');
-- const schema = ${util.stringify(SCHEMA[table_name]).replace(/\n/g, '\n-- ')};
-- if (TG_OP == "UPDATE") { NEW.modified_at = new Date(); }
-- const body = Object.assign(NEW.body || {}, {
--     id: NEW.id,
--     identifier: \`/${table_name}/$\{NEW.id}\`,
--     created_at: new Date(NEW.created_at).toISOString(),
--     modified_at: new Date(NEW.modified_at).toISOString()
-- });
-- const parse = (obj, data) => {
--     const ret = {};
--     Object.keys(obj).forEach((k) => {
--         const v = obj[k];
--         if (v === "ref") {
--             const V = data[k] ? data[k].split('/').pop() : NEW[k] || null;
--             NEW[k] = V;
--             ret[k] = \`/$\{k}/$\{V}\`
--             return;
--         }
--         if (typeof v === 'function') {
--             ret[k] = data[k] ? v(data[k]) : null;
--             return;
--         }
--         if (Array.isArray(v)) {
--             // skip as this is ToMany relationship
--             ret[k] = [];
--             return;
--         }
--         if (typeof v === 'object') {
--             ret[k] = parse(v, data[k] || {});
--         }
--         if (typeof v === 'string') {
--             ret[k] = String(data[k] || "");
--             return;
--         }
--     });
--     return ret;
-- };
-- NEW.body = parse(schema, body);
-- return NEW;
-- $$
-- LANGUAGE "plv8";
-- CREATE TRIGGER ${schema}_${table_name}_insert BEFORE INSERT ON ${schema}."${table_name}" FOR EACH ROW EXECUTE PROCEDURE ${schema}_${table_name}_schema();
-- CREATE TRIGGER ${schema}_${table_name}_update BEFORE UPDATE ON ${schema}."${table_name}" FOR EACH ROW EXECUTE PROCEDURE ${schema}_${table_name}_schema();`).join('\n')
)}


-- =============================================================================
-- FOREIGN KEYS
-- =============================================================================

${(
graph.connections.map((c) => {
    const table_a_name = lowerUnderscore(graph.index[c.alpha].label);
    const table_b_name = lowerUnderscore(graph.index[c.beta].label);
    if (c.connectionType === 'oneToMany' || c.connectionType === 'zeroToMany' || c.connectionType === 'zeroToOne'|| c.connectionType === 'oneToOne') {
        return `
ALTER TABLE ${schema}."${table_b_name}" ADD CONSTRAINT ${table_b_name}_${table_a_name}_fk FOREIGN KEY (${table_a_name})
    REFERENCES ${schema}.${table_a_name} (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT;
`;
    }
    if (c.connectionType === 'manyToMany') {
        return `
ALTER TABLE ${schema}."${table_a_name}_${table_b_name}" ADD CONSTRAINT ${table_a_name}_${table_b_name}_${table_a_name}_fk FOREIGN KEY (${table_a_name})
    REFERENCES ${schema}.${table_a_name} (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT;
ALTER TABLE ${schema}."${table_a_name}_${table_b_name}" ADD CONSTRAINT ${table_a_name}_${table_b_name}_${table_b_name}_fk FOREIGN KEY (${table_b_name})
    REFERENCES ${schema}.${table_b_name} (id) MATCH SIMPLE ON UPDATE CASCADE ON DELETE RESTRICT;
`;
    }
    return `--${table_a_name} to ${table_b_name} not covered `;
}).join('\n')
)}

-- =============================================================================
-- VIEWS
-- =============================================================================

-- =============================================================================
-- INITIAL DATA INSERTS
-- =============================================================================

`;
        return sql;
    };

    util.extend({
        "dest": util,
        "source": {
            "postgres": {
                "make": makePostgres
            },
            "schema": {
                "make": makeSchema
            }
        }
    });
    return util;
});
