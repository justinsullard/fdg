const handlers = new Map();
function store(ev) {
    if (!handlers.has(ev)) { handlers.set(ev, new Set()); }
    return handlers.get(ev);
}
const emitter = {
    on(ev, cb) {
        store(ev).add(cb);
        return emitter;
    },
    once(ev, cb) {
        const f = (...args) => {
            store(ev).delete(f);
            cb(...args);
        };
        store(ev).add(f);
        return emitter;
    },
    off(ev, cb) {
        store(ev).delete(cb);
        return emitter;
    },
    emit(ev, ...args) {
        store(ev).forEach((f) => f(...args));
        return emitter;
    },
    count(ev) {
        return store(ev).size;
    }
};

module.exports = { emitter };
