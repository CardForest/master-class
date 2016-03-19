# Strict Typing

We can generate classes that enforce run-time type checks and prevent object extensions.

```js
const myMClass = M({
  props: {
    num: M.Number(),
    str: M.String(),    
    arr: M.Array({
      defaultLength: 2
      elem: M.Number()
    })
    obj: M({
      props: {
        bool: M.Boolean()
      }
    })
  }
}
```