import { isRecord } from '../../types';

type Kind = 'object' | 'array' | 'state';
type Primitive = string | boolean | number | null;
type Node = Primitive | { number: string } | { schema: true } | { ref: number } |
  { kind: Kind; id: number; fields: Record<string, Node>; length: number | undefined; seed?: unknown };
type Write = (value: unknown, reference?: boolean) => Node;
type Fields = (write: Write) => Record<string, Node>;
const layouts = new WeakMap<object, { kind: Kind; fields: Fields; length?: number | undefined; seed?: unknown }>();

export function trackModel(target: object, kind: Kind, fields: Fields, length?: number, seed?: unknown): void {
  layouts.set(target, { kind, fields, length, seed });
}

function numberNode(value: number): number | { number: string } {
  return Number.isFinite(value) && !Object.is(value, -0)
    ? value : { number: Object.is(value, -0) ? '-0' : String(value) };
}

function readNumber(value: unknown): number {
  switch (value) {
    case '-0': return -0;
    case 'NaN': return NaN;
    case 'Infinity': return Infinity;
    case '-Infinity': return -Infinity;
    default: return invalidData();
  }
}

// Initializers are data, not live models: keep their keys separate from wire tags.
function writeSeed(value: unknown, ancestors = new Set<object>()): unknown {
  if (value === undefined) return { absent: true };
  if (typeof value === 'number') return numberNode(value);
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
  if (!isRecord(value) || ancestors.has(value) || (!Array.isArray(value) &&
      Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null)) {
    throw new TypeError('state initializer must be acyclic plain data');
  }
  ancestors.add(value);
  const fields = Object.fromEntries(Reflect.ownKeys(value).flatMap((key): [string, unknown][] => {
    if (Array.isArray(value) && key === 'length') return [];
    const desc = Object.getOwnPropertyDescriptor(value, key)!;
    if (typeof key !== 'string' || !Object.hasOwn(desc, 'value')) throw new TypeError('expected plain state initializer');
    return [[key, writeSeed(desc.value, ancestors)]];
  }));
  ancestors.delete(value);
  return { fields, length: Array.isArray(value) ? value.length : undefined,
    nullPrototype: Object.getPrototypeOf(value) === null || undefined };
}

function readSeed(value: unknown): unknown {
  if (value === null || typeof value === 'string' || typeof value === 'boolean' || typeof value === 'number') return value;
  if (!isRecord(value)) return invalidData();
  if (value.absent === true) return undefined;
  if (Object.hasOwn(value, 'number')) return readNumber(value.number);
  if (!isRecord(value.fields) || Array.isArray(value.fields)) return invalidData();
  const entries = Object.entries(value.fields).map(([key, field]) => [key, readSeed(field)] as const);
  if (!Object.hasOwn(value, 'length')) {
    const object = Object.fromEntries(entries);
    if (value.nullPrototype === true) Object.setPrototypeOf(object, null);
    return object;
  }
  const size = value.length;
  if (typeof size !== 'number' || !Number.isInteger(size) || size < 0 || size > 0xffffffff) return invalidData();
  const array = new Array<unknown>(size);
  for (const [key, field] of entries) {
    if (key === 'length') return invalidData();
    Object.defineProperty(array, key, { value: field, enumerable: true, writable: true, configurable: true });
  }
  if (array.length !== size) return invalidData();
  return array;
}

export function writeProperty(write: Write, target: object, key: string | number, factory: object): Node {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (!descriptor) throw new TypeError('cannot save a projected model with missing fields');
  if (!descriptor.enumerable) return { schema: true };
  const value: unknown = Reflect.get(target, key);
  if ('modelKind' in factory && (!isRecord(value) || layouts.get(value)?.kind !== factory.modelKind)) {
    throw new TypeError('cannot save a projected model with replaced fields');
  }
  return write(value, 'isReference' in factory && factory.isReference === true);
}

export function serializeModel(root: object): string {
  const ids = new Map<object, number>();
  const written = new Set<object>();
  const idOf = (value: object) => {
    if (!ids.has(value)) ids.set(value, ids.size);
    return ids.get(value)!;
  };
  const write: Write = (value, reference) => {
    if (reference && isRecord(value)) return { ref: idOf(value) };
    if (reference && value !== null) throw new TypeError('reference must point to a model or be null');
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      return numberNode(value);
    }
    if (!isRecord(value)) throw new TypeError('unsupported model value');
    const layout = layouts.get(value);
    if (!layout || written.has(value)) throw new TypeError('expected an owned model value');
    written.add(value);
    return { kind: layout.kind, id: idOf(value), fields: layout.fields(write), length: layout.length,
      seed: layout.seed === undefined ? undefined : writeSeed(layout.seed) };
  };
  const rootData = write(root);
  if (written.size !== ids.size) throw new TypeError('cannot serialize a reference outside the current model');
  return JSON.stringify({ version: 2, root: rootData });
}

export class RestoredReference {
  constructor(readonly target: () => object) {}
}

export class RestoredModel {
  constructor(
    readonly kind: Kind, readonly fields: Record<string, unknown>, readonly length: number | undefined,
    readonly register: (target: object, validate?: () => void) => void, readonly seed?: unknown
  ) {}

  static forKind(value: unknown, kind: Kind): RestoredModel | undefined {
    if (!(value instanceof RestoredModel)) return undefined;
    if (value.kind !== kind) throw new TypeError('serialized data does not match the model schema');
    return value;
  }
}

function invalidData(): never {
  throw new TypeError('invalid or unsupported serialized model data');
}

export function deserializeModel<T extends object>(data: string, construct: (root: RestoredModel) => T): T {
  if (typeof data !== 'string') return invalidData();
  const envelope: unknown = JSON.parse(data);
  if (!isRecord(envelope) || (envelope.version !== 1 && envelope.version !== 2)) return invalidData();
  const ids = new Set<number>();
  const targets = new Map<number, object>();
  const references: (() => object)[] = [];
  const validations: (() => void)[] = [];
  const readId = (value: unknown): number => {
    if (typeof value !== 'number' || !Number.isSafeInteger(value) || value < 0) return invalidData();
    return value;
  };
  const read = (value: unknown): unknown => {
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (!isRecord(value) || Array.isArray(value)) return invalidData();
    if (value.schema === true) return undefined;
    if (Object.hasOwn(value, 'number')) {
      return readNumber(value.number);
    }
    if (Object.hasOwn(value, 'ref')) {
      const id = readId(value.ref);
      let target: object | undefined;
      const resolve = () => {
        target ??= targets.get(id);
        if (!target) throw new TypeError('serialized reference has no target in the model');
        return target;
      };
      references.push(resolve);
      return new RestoredReference(resolve);
    }
    const { kind, fields, length } = value;
    if (kind !== 'object' && kind !== 'array' && kind !== 'state') return invalidData();
    if (!isRecord(fields) || Array.isArray(fields)) return invalidData();
    const id = readId(value.id);
    if (ids.has(id)) return invalidData();
    ids.add(id);
    const size = kind === 'array' ? readId(length) : undefined;
    if (size !== undefined && (size > 0xffffffff || Object.keys(fields).some(
      (key) => String(Number(key)) !== key || !Number.isInteger(Number(key)) || Number(key) < 0 || Number(key) >= size
    ))) return invalidData();
    return new RestoredModel(kind, Object.fromEntries(Object.entries(fields).map(([key, field]) => [key, read(field)])),
      size, (target, validate) => {
        targets.set(id, target);
        if (validate) validations.push(validate);
      }, envelope.version === 2 && kind === 'state' && Object.hasOwn(value, 'seed') ? readSeed(value.seed) : undefined);
  };
  const root = read(envelope.root);
  if (!(root instanceof RestoredModel)) return invalidData();
  try {
    const instance = construct(root);
    validations.forEach((validate) => validate());
    references.forEach((resolve) => resolve());
    return instance;
  } finally {
    targets.clear();
  }
}
