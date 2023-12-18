// @flow

import {test} from '../../util/test.js';
import {register, serialize, deserialize} from '../../../src/util/web_worker_transfer.js';

import type {Serialized} from '../../../src/util/web_worker_transfer.js';

test('round trip', (t) => {
    class Foo {
        n: number;
        buffer: ArrayBuffer;
        _cached: ?number;

        constructor(n: number) {
            this.n = n;
            this.buffer = new ArrayBuffer(100);
            this.squared();
        }

        squared(): number {
            if (this._cached) {
                return this._cached;
            }
            this._cached = this.n * this.n;
            return this._cached;
        }
    }

    register(Foo, 'Foo', {omit: ['_cached']});

    const foo = new Foo(10);
    const transferables = new Set();
    const deserialized = deserialize(serialize(foo, transferables));
    t.assert(deserialized instanceof Foo);
    const bar: Foo = (deserialized: any);

    t.assert(foo !== bar);
    t.assert(bar.constructor === Foo);
    t.assert(bar.n === 10);
    t.assert(bar.buffer === foo.buffer);
    t.assert(transferables.has(foo.buffer));
    t.assert(bar._cached === undefined);
    t.assert(bar.squared() === 100);
    t.end();
});

test('duplicate buffers', (t) => {
    const foo = new ArrayBuffer(1);
    const transferables = new Set();
    const deserialized = deserialize(serialize([foo, foo], transferables));
    t.deepEqual(deserialized, [foo, foo]);
    t.assert(transferables.size === 1);
    t.end();
});

test('custom serialization', (t) => {
    class Bar {
        id: string;
        _deserialized: boolean;
        constructor(id: string) {
            this.id = id;
            this._deserialized = false;
        }

        static serialize(b: Bar): Serialized {
            return {foo: `custom serialization,${b.id}`};
        }

        static deserialize(input: Serialized): Bar {
            const b = new Bar((input: any).foo.split(',')[1]);
            b._deserialized = true;
            return b;
        }
    }

    register(Bar, 'Bar');

    const bar = new Bar('a');
    t.assert(!bar._deserialized);

    const deserialized = deserialize(serialize(bar));
    t.assert(deserialized instanceof Bar);
    const bar2: Bar = (deserialized: any);
    t.equal(bar2.id, bar.id);
    t.assert(bar2._deserialized);
    t.end();
});

