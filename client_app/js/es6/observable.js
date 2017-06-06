const values = new WeakMap();
const listeners = new WeakMap();

class Observable {
    constructor(value) {
        listeners.set(this, new Set());
        this.next(value);
    }
    get value() { return values.get(this); }
    next(value) {
        values.set(this, value);
        listeners.get(this).forEach((listener) => { try { listener(value); } catch (ignore) { } });
    }
    subscribe(listener) {
        if (typeof listener !== 'function') { throw new Error('listener must be a function'); }
        listeners.get(this).add(listener);
        return () => listeners.get(this).delete(listener);
    }
    map(transform) {
        if (typeof transform !== 'function') { throw new Error('transform must be a function'); }
        const observable = new Observable(this.value);
        this.subscribe((value) => observable.next(transform(value)));
        return observable;
    }
    filter(callback) {
        if (typeof callback !== 'function') { throw new Error('callback must be a function'); }
        const observable = new Observable(this.value);
        this.subscribe((value) => callback(value) && observable.next(value));
        return observable;
    }
    merge(...others) {
        if (others.length < 1 || others.some((o) => !(o instanceof Observable))) {
            throw new Error('1 or more Observables must be provided');
        }
        const observable = new Observable();
        this.subscribe(observable.next);
        others.forEach((o) => o.subscribe(observable.next));
        return observable;
    }
    static merge(...others) {
        if (others.length < 2 || others.some((o) => !(o instanceof Observable))) {
            throw new Error('2 or more Observables must be provided');
        }
        const observable = new Observable(this.value);
        others.forEach((o) => o.subscribe(observable.next));
        return observable;
    }
    take(n) {
        if (parseInt(n) !== n || n < 1) { throw new Error('must take at least 1'); }
        let x = n;
        const observable = new Observable(this.value);
        const subscription = observable.subscribe((value) => {
            observable.next(value);
            if (--x) { return; }
            subscription();
        })
        return observable;
    }
    skip(n) {
        if (parseInt(n) !== n || n < 0) { throw new Error('must skip a positive integer'); }
        let x = n;
        const observable = new Observable(this.value);
        observable.subscribe((value) => {
            if (--x) { return; }
            observable.next(value);
        })
        return observable;
    }
    until(other) {
        if (!(other instanceof Observable)) { throw new Error('other must be an Observable'); }
        const observable = new Observable();
        const subscription = this.subscribe(observable.next);
        const remover = other.subscribe(() => subscription() || remover());
        return observable;
    }
    since(other) {
        if (!(other instanceof Observable)) { throw new Error('other must be an Observable'); }
        const observable = new Observable();
        const adder = other.subscribe(() => {
            this.subscribe(observable.next);
            adder()
        });
        return observable;
    }
    debounce(ms) {
        if (parseInt(ms) !== ms || ms <= 0) { throw new Error('ms must be >= 0'); }
        const observable = new Observable(this.value);
        let timeout;
        this.subscribe(() => {
            clearTimeout(timeout);
            timeout = setTimeout(() => observable.next(this.value), ms);
        });
        return observable;
    }
}

module.exports = { Observable };
