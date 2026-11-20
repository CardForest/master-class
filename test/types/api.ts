import M = require('../../src');

const Person = M({
  name: String,
  age: 0,
  active: Boolean,
  nested: { score: Number },
  scores: [Number],
  get label(): string {
    return this.name;
  },
  birthday(years: number) {
    this.age += years;
  }
});

const person = new Person({ name: 'Ada' });
const name: string = person.name;
const age: number = person.age;
const active: boolean = person.active;
const score: number = person.nested.score;
const scores: number[] = person.scores;
const label: string = person.label;
person.birthday(1);
Person.createInstance(person.snapshot());
Person.createInstance(null, { isChangeAllowed: false });
person.control.isChangeAllowed = false;

// @ts-expect-error Primitive properties retain their runtime types.
person.age = 'wrong';
// @ts-expect-error Undeclared fields are not part of the generated model.
person.missing = true;
// @ts-expect-error Mutator argument types are preserved.
person.birthday('wrong');
// @ts-expect-error Primitive initial values must match their factory.
M.Number({ initialValue: 'wrong' });

const Explicit = M.Object({
  props: {
    n: M.Number(),
    s: M.String(),
    g: M.Getter(function (this: { n: number }) { return this.n + 1; }),
    a: M.Array({ elem: M.Boolean(), defaultLength: 2 })
  }
});
const explicit = Explicit.createInstance();
const n: number = explicit.n;
const s: string = explicit.s;
const g: number = explicit.g;
const a: boolean[] = explicit.a;
const primitive: number = M(Number).createInstance();
const array: number[] = M([Number]).createInstance();
const reused: typeof Explicit = M(Explicit);
const guarded = M.Mutator({
  fn(this: { n: number }, amount: number) { return this.n += amount; },
  guard(this: { n: number }) { return this.n < 10; }
});
const Guarded = M.Object({ props: { n: M.Number(), increment: guarded } });
const result: number = Guarded.createInstance().increment(1);

void [name, age, active, score, scores, label, n, s, g, a, primitive, array, reused, result];
