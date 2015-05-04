'use strict';

var assert = require('assert');
var M = require('../..');

describe('getter', function () {
  it('can access it\'s owner object', function () {
    var o = M.Object({
      props: {
        n: M.Number(),
        g: M.Getter(function() {
          return this.n + 1;
        })
      }
    }).createInstance();

    assert.strictEqual(o.g, 1);
  });


  it('can access other getters in it\'s owner object', function () {
    var o = M.Object({
      props: {
        n: M.Number(),
        g1: M.Getter(function() {
          return this.n + 1;
        }),
        g2: M.Getter(function() {
          return this.g1 + 1;
        })
      }
    }).createInstance();

    assert.strictEqual(o.g2, 2);
  });


  it('works in inner objects', function () {
    var o = M.Object({
      props: {
        o: M.Object({
          props: {
            n: M.Number(),
            g: M.Getter(function() {
              return this.n + 1;
            })
          }
        })
      }
    }).createInstance();

    assert.strictEqual(o.o.g, 1);
  });

  it('disallows change of owner', function () {
    var o = M.Object({
      props: {
        n: M.Number(),
        g: M.Getter(function() {
          return this.n++;
        })
      }
    }).createInstance();

    assert.throws(function() {o.g;}); // jshint ignore:line
  });

  it('disallows overriding', function () {
    var o = M.Object({
      props: {
        n: M.Number(),
        g: M.Getter(function() {
          return this.n;
        })
      }
    }).createInstance();

    assert.throws(function() {o.g = function () {return 3;};});
  });

  it('can access keyPath attribute', function () {
    var o = M.Object({
      props: {
        arr: M.Array({
          defaultLength: 4,
          elem: M.Object({
            props: {
              idx: M.Getter(function() {
                return this.keyPath[1];
              })
            }
          })
        })
      }
    }).createInstance();

    assert.strictEqual(o.arr[2].idx, 2);
  });
});
