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
        store(ev).forEach(f => f(...args));
        return emitter;
    },
    count(ev) {
        return store(ev).size;
    },
    test() {
        console.log('define ev handlers');
        const bob = (msg) => console.log(`bob ${msg}`);
        const sam = (msg) => console.log(`sam ${msg}`);
        const mary = (msg) => console.log(`mary ${msg}`);
        console.log('add event handlers');
        emitter.on('bob', bob);
        emitter.on('sam', sam);
        emitter.once('mary', mary);
        console.log('emit events');
        emitter.emit('bob', 'Bob');
        emitter.emit('sam', 'Sam');
        emitter.emit('mary', 'Mary');
        console.log('remove event handlers');
        emitter.off('sam', sam);
        console.log('emit events');
        emitter.emit('bob', 'Bob');
        emitter.emit('sam', 'Sam');
        emitter.emit('mary', 'Mary');
        console.log('cleanup');
        emitter.off('bob', bob);
    }
};

module.exports = emitter;
