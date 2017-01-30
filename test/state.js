const assert = require('assert');

const {RootState, State, SubStatesContainer} = require('../lib/state');
// const Resurrect = require('resurrect-js');
const {Serializer, Deserializer} = require('../lib/serialization');

describe('state', () => {
    describe('RootState serialization', () => {
      let serializer;
      let deserializer;

      beforeEach(() => {
        serializer = new Serializer();
        deserializer = new Deserializer({classes: {RootState, State, SubStatesContainer}});
      });

      it('xx', () => {

        const source = new RootState();
        source.x = 2;
        source.$subStates.d = new State();
        source.$subStates.d.a = 4;
        const target = deserializer.deserialize(serializer.serialize(source));

        assert.deepEqual(target, source);
      });
    });

    describe('RootState', () => {
        it('can be inherited', () => {
            class C extends RootState {}
            const c = new C();

            assert(c instanceof RootState);
        });

        it('subclass instance\'s properties act normally normally', () => {
            class C extends RootState {
                constructor() {
                    super();

                    Object.assign(this, {a: 'a', b: 2});
                }

                getA() {
                    return this.a;
                }

                get b() {
                    return this._b;
                }

                set b(_b) {
                    this._b = _b + 1;
                }
            }

            const c = new C();
            c.c = 'c';

            assert.equal(c.a, 'a');
            assert.equal(c.getA(), 'a');
            assert.equal(c.b, 3);
            assert.equal(c.c, 'c');

            assert(c.hasOwnProperty('c'));
        });

        it('root\'s subStates override in assignment order', () => {

            class C extends RootState {
                constructor() {
                    super();

                    this.i = 1;
                }
            }

            const c = new C();

            const child1 = new State();
            child1.i = 3;
            child1.x = 'x';
            const child2 = new State();
            child2.i = 2;

            Object.assign(c.$subStates, {child1, child2});

            assert.equal(c.i, 2);
            assert(c.hasOwnProperty('x'));
            delete c.$subStates.child2;
            assert.equal(c.i, 3);
            delete c.$subStates.child1;
            assert(!c.hasOwnProperty('x'));
            assert.equal(c.i, 1);
            assert(c.hasOwnProperty('i'));
        });

        it('root\'s state properties are being set only if they have a property defined or no parent has that property',
            () => {

                class C extends RootState {
                    constructor() {
                        super();
                        this.a = 'a';
                    }
                }

                const c = new C();
                const child1 = new State();
                c.$subStates.child1 = child1;

                child1.i = 2;

                // the property is defined
                c.i = 3;
                assert(child1.hasOwnProperty('i'));
                assert.equal(c.i, 3);
                assert(child1.i, 3);

                // it's not set on child when the property is in the tree
                c.a = 'b';
                assert(!child1.hasOwnProperty('a'));
                assert(c.hasOwnProperty('a'));
                assert.equal(c.a, 'b');

                // it's set on child when the property is not in the tree
                c.x = 'x';
                assert(child1.hasOwnProperty('x'));
                assert.equal(c.x, 'x');
                assert.equal(child1.x, 'x');
            });

        it('a root\'s child methods are called with root\'s this', () => {

            class C extends RootState {
                constructor() {
                    super();
                }
            }

            const c = new C();
            const child1 = new (class extends State {
                constructor() {
                    super();

                    this.m1 = function () {
                        assert.equal(this, c);
                    };
                }

                m2() {
                    assert.equal(this, c);
                }

                get m3() {
                    assert.equal(this, c);
                }

                // jshint ignore:start
                set m4(unused) {
                    assert.equal(this, c);
                }

                // jshint ignore:end
            })();
            c.$subStates.child1 = child1;

            c.m1();
            c.m2();
            c.m3; // jshint ignore:line
            c.m4 = null;
        });

        it('delete operator deletes a property in the first state with the property', () => {
            class C extends RootState {
                constructor() {
                    super();
                    this.i = 1;
                }
            }

            const c = new C();
            const child1 = new State();
            c.$subStates.child1 = child1;

            child1.i = 2;

            delete c.i;

            assert(child1.i === undefined);
            assert.equal(c.i, 1);
        });

        it('hasOwnProperty and has checks detects child properties', () => {
            class C extends RootState {
                constructor() {
                    super();
                    this.a = 1;
                }

                t1() {
                }
            }

            const c = new C();
            const child1 = new (class extends State {
                t2() {

                }
            })();
            c.$subStates.child1 = child1;
            child1.b = 2;

            assert(c.hasOwnProperty('a'));
            assert(c.hasOwnProperty('b'));

            assert('a' in c);
            assert('b' in c);
            assert('t1' in c);
            assert('t2' in c);
        });

        it('can iterate on all properties including subStates', () => {
            class C extends RootState {
                constructor() {
                    super();
                    this.a = 1;
                }

                test() {
                }
            }

            const c = new C();
            const child1 = new State();
            c.$subStates.child1 = child1;
            child1.b = 2;
            child1[Symbol.for('b')] = 2;
            Reflect.defineProperty(child1, 'c', {value: 2, configurable: true});

            assert.deepEqual(Reflect.ownKeys(c), ['$subStates', '$$raw', 'a', 'b', 'c', Symbol.for('b')]);
            assert.deepEqual(Object.keys(c), ['$subStates', 'a', 'b']);
            assert.deepEqual(Object.getOwnPropertyNames(c), ['$subStates', '$$raw', 'a', 'b', 'c']);
            assert.deepEqual(Object.getOwnPropertySymbols(c), [Symbol.for('b')]);
        });

        it('deep equals plain objects', () => {
            class C extends RootState {
                constructor() {
                    super();
                    this.a = 1;
                }

                test() {
                }
            }

            const c = new C();
            const child1 = c.$subStates.child1 = new State();
            child1.b = 2;
            child1[Symbol.for('b')] = 2;
            Reflect.defineProperty(child1, 'c', {value: 2, configurable: true});

            assert.deepEqual(c, {
              a: 1, b: 2, [Symbol.for('b')]: 2,
              $subStates: { // TODO possibly avoid showing $subStates
                child1: {
                  $subStates: {},
                  b: 2
                }
              }
            });
        });
    });
});
