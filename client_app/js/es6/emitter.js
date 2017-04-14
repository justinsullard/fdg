const handlers = {};
function store(ev) {
    if (!handlers[ev]) { handlers[ev] = new Set(); }
    return handlers[ev];
}
export default {
    on(ev, cb) { store(ev).add(cb); },
    once(ev, cb) {
        const f = (...args) => {
            store(ev).delete(f);
            cb(...args);
        };
        store(ev).add(f);
    },
    off(ev, cb) { store(ev).delete(cb); },
    emit(ev, ...args) { store(ev).forEach(f => f(...args)); },
    count(ev) { return store(ev).size; }
};
