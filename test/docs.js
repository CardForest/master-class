'use strict';

var assert = require('assert');
var M = require('..');

// TODO automate this at som point
describe('doc fragments', function () {
  it('strict-typing', function () {
    const MyClass = M({
      str: String,
      arr: [Number],
      obj: {
        bool: Boolean
      }
    });

    const myInstance = new MyClass();

    assert.deepEqual(myInstance, {
      str: '',
      arr: [0],
      obj: {
        bool: false
      }
    });

    assert.throws(function () {
      myInstance.obj.bool = 'will throw';
    });

    assert.throws(function () {
      myInstance.newProperty = 'will throw';
    });

  });

  it('change-control', function () {
    const MyClass = M({
      n: Number
    });
    let myInstance = new MyClass();

    myInstance.n = 3;
    assert.equal(myInstance.n, 3);

    myInstance.control.isChangeAllowed = false;

    assert.throws(function () {
      myInstance.n = 4;
    });
    assert.equal(myInstance.n, 3);

    M({
      n: Number,
      get g() {
        // if we would try and assign `this.n = 4`
        // it would throw a run-time exception
        return this.n + 1;
      }
    }).createInstance().g; // jshint ignore:line

    myInstance.control.on('change',
      function (changeType, changePayload, opt) { // jshint ignore:line
        // triggered on any direct or nested changes
      }
    );

    myInstance = M({
      n: Number,
      m1(x) {
        this.n += x;
      }
    }).createInstance();

    myInstance.control.onMutatorCall =
      function (keyPath, args, mutator) {
        // apply the original methd (add args[0] to this.n)
        mutator.apply(this, args);
        // add another 4 - just because we can
        return this.n += 4;
      };

    myInstance.m1(3);
    assert.equal(myInstance.n, 7);

    myInstance = M({
      n: 5,
      m: M.Mutator({
        guard: function () {
          return this.n < 10;
        },
        fn: function (x) {
          this.n += x;
        }
      })
    }).createInstance();

    myInstance.m(6);
    assert.equal(myInstance.n, 11);

    assert.throws(function () {
      myInstance.m(1);
    });
    assert.equal(myInstance.n, 11);
  });

  it('serialization', function () {
    const MyClass = M({
      n: 3,
      s: 'test',
      b: true
    });
    let myInstance = new MyClass();

    assert.deepEqual(
      myInstance,
      {n: 3, s: 'test', b: true}
    );

    assert.deepEqual(
      new MyClass({n: 4, s: 'test2', b: false}),
      {n: 4, s: 'test2', b: false}
    );

    assert.deepEqual(
      MyClass.createInstance(myInstance.snapshot()),
      myInstance
    );

    assert.deepEqual(
      myInstance.snapshot(
        function (opt, instance, keyPath, snapshotFn) {
          if (keyPath[0] === 'n') {
            return 5;
          } else {
            return snapshotFn();
          }
        }
      ),
      {n: 5, s: 'test', b: true}
    );

    myInstance = M({
      r: M.Ref(),
      o: {
        n: Number
      }
    }).createInstance();
    myInstance.r = myInstance.o;

    const myInstanceCopy = new MyClass(myInstance.snapshot());

    assert.strictEqual(myInstanceCopy.r, myInstanceCopy.o);
  });

  it('state-pattern', function () {
    let MyClass = M({
      state: M.State([
        {
          delegate: M({n: 3}), // (1) first object type
          subState: [{
            delegate: M({m: 5}) // (1.1) first object type child
          }]
        },
        {
          delegate: M({s: String}) // (2) second object type
        }
      ])
    });
    let myInstance = new MyClass();
    assert.deepEqual(myInstance.state, {n: 3, m: 5, s: ''});

    MyClass = M({
      flag1: true,
      state: M.State([
        {
          when() {return this.flag2;},
          delegate: M({n: 3}), // (1) first object type
          subState: [{
            when() {return this.root.flag1;},
            delegate: M({m: 5}) // (1.1) first object type child
          }]
        },
        {
          delegate: M({ // (2) second object type
            flag2: Boolean,
            s: String
          })
        }
      ])
    });
    myInstance = new MyClass();
    assert.deepEqual(myInstance.state, {flag2: false, s: ''});

    myInstance.state.flag2 = true;
    assert.deepEqual(
      myInstance.state,
      {flag2: true, s: '', n: 3, m: 5}
    );
  });
});
