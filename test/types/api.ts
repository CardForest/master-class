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
const scores: readonly number[] = person.scores;
person.scores[0] = 2;
const label: string = person.label;
person.birthday(1);
Person.createInstance(person.snapshot());
const exported: unknown = person.export();
const restoredAge: number = Person.deserialize(person.serialize()).age;
void [exported, restoredAge];
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
// @ts-expect-error Managed arrays have fixed length.
person.scores.push(1);
// @ts-expect-error Only root models have export().
person.nested.export();
// @ts-expect-error Only root models have serialize().
person.scores.serialize();
const projection = Person.createInstance(person.snapshot(() => 'hidden'));
// @ts-expect-error Mapper output can replace whole fields or objects.
projection.scores;
const replaced = Person.createInstance({ nested: 'hidden' });
// @ts-expect-error This initializer does not guarantee a schema-shaped model.
replaced.nested.score;
const replacedViaConstructor = new Person({ nested: 'hidden' });
// @ts-expect-error The constructor also accepts projected data.
replacedViaConstructor.nested.score;
const omitted = new Person({ name: '$hidden' });
// @ts-expect-error The reserved omission marker does not produce a string property.
omitted.name;
const loadedScore: number = Person.createInstance({ nested: { score: 2 } }).nested.score;

const Explicit = M.Object({
  props: {
    n: M.Number(),
    s: M.String(),
    g: M.Getter(function (this: { n: number }) { return this.n + 1; }),
    a: M.Array({ elem: M.Boolean(), defaultLength: 2 }),
    child: M.Object({ props: { score: M.Number() } })
  }
});
const explicit = Explicit.createInstance();
const n: number = explicit.n;
const s: string = explicit.s;
const g: number = explicit.g;
const a: readonly boolean[] = explicit.a;
const childScore: number = explicit.child.score;
// @ts-expect-error Explicitly declared children also lack the root controller.
explicit.child.control;
const primitive: number = M(Number).createInstance();
const array: readonly number[] = M([Number]).createInstance();
const reused: typeof Explicit = M(Explicit);
const guarded = M.Mutator({
  fn(this: { n: number }, amount: number) { return this.n += amount; },
  guard(this: { n: number }) { return this.n < 10; }
});
const Guarded = M.Object({ props: { n: M.Number(), increment: guarded } });
const result: number = Guarded.createInstance().increment(1);

void [name, age, active, score, scores, label, n, s, g, a, childScore, primitive, array, reused, result, loadedScore];
