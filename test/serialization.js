const assert = require('assert');
const sinon = require('sinon');

const {Serializer, Deserializer} = require('../lib/serialization');
const skeleton = require('../lib/skeleton');

describe('serialization', () => {
  let serializer;

  beforeEach(() => {
    serializer = new Serializer();
  });

  [skeleton, function noOp(_) {return _;}].forEach((sourceMapper) => {
    describe(`serialization after ${sourceMapper.name}`, () => {
      describe('regular deserializer', () => {
        let deserializer;

        beforeEach(() => {
          deserializer = new Deserializer();
        });

        it('is deep equal', () => {
          const source = sourceMapper({p: 1, o: {arr: [{p: 1}]}});
          const target = deserializer.deserialize(serializer.serialize(source));

          assert.deepEqual(target, source);
        });

        it('preserves references', () => {
          const o = {};
          const target = deserializer.deserialize(serializer.serialize(sourceMapper({o1: o, o2: o})));

          assert.strictEqual(target.o1, target.o2);
        });

        it('preserves reference loop', () => {
          const source = sourceMapper({});
          source.loop = source;
          const target = deserializer.deserialize(serializer.serialize(source));

          assert.strictEqual(target.loop, target);
        });

        it('respects inner clone method', () => {
          const target = deserializer.deserialize(serializer.serialize(sourceMapper({
            o: {
              clone() {
                return {n: 3};
              }
            }
          })));

          assert.deepEqual(target.o.n, 3);
        });

        it('removes a property when it\'s value clone method returns undefined', () => {
          const target = deserializer.deserialize(serializer.serialize(sourceMapper({
            o: {
              clone() {
              }
            }
          })));

          assert(!target.hasOwnProperty('o'));
        });

        it('inner clone method receives serialize\'s second parameter', () => {
          const clone = sinon.spy();

          deserializer.deserialize(serializer.serialize(sourceMapper({
            o: {clone}
          }), 1));

          assert(clone.calledOnce);
          assert(clone.calledWithExactly(1));
        });
      });

      it('deserializer with extra classes', () => {
        class C1 {
        }
        class C2 {
        }
        const source = new C1();
        source.c2 = new C2();

        const deserializerWithClasses = new Deserializer({classes: {C1, C2}});

        const target = deserializerWithClasses.deserialize(serializer.serialize(sourceMapper(source)));


        assert.strictEqual(Reflect.getPrototypeOf(target), C1.prototype);
        assert.strictEqual(Reflect.getPrototypeOf(target.c2), C2.prototype);
      });
    });
  });
});
