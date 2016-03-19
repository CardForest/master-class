# The State Pattern

Firstly, if you are not familiar with this pattern I can recommend this [excellent article](http://gameprogrammingpatterns.com/state.html).

Our Master-Class types include an `M.State` type. That type helps us turns objects into concurrent, hierarchical state machines.

The `M.State` type basically merges object types together

```js
const MyClass = M({
  props: {
    state: M.State([
      {
        delegate: M({ // (1) first object type
          props: {
            n: M.Number({initialValue: 3})
          }
        }),
        subState: [{
          delegate: M({ // (1.1) first object type child
            props: {
              m: M.Number({initialValue: 5})
            }
          })
        }]
      },
      {
        delegate: M({ // (2) second object type
          props: {
            s: M.String()
          }
        })
      }
    ])
  }
});
const myInstance = new MyClass();
assert.deepEqual(myInstance.state, {n: 3, m: 5, s: ''})
```

*but* every merge can be conditional using the `when` option

```js
const MyClass = M({
  props: {
    flag1: M.Boolean(),
    state: M.State([
      {
        delegate: M({ // (1) first object type
          props: {
            n: M.Number({initialValue: 3})
          }
        }),
        subState: [{
          when() {return this.flag2;}
          delegate: M({ // (1.1) first object type child
            props: {
              m: M.Number({initialValue: 5})
            }
          })
        }]
      },
      {
        when() {return this.root.flag1;}
        delegate: M({ // (2) second object type
          props: {
            s: M.String()
          }
        })
      }
    ])
  }
});
const myInstance = new MyClass();
assert.deepEqual(myInstance.state, {n: 3, m: 5, s: ''})
```

