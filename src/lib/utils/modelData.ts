import { isRecord } from '../../types';

type Kind = 'object' | 'array' | 'state';
type Primitive = string | boolean | number | null;
type Node = Primitive | { number: string } | { schema: true } | { ref: number } |
  { kind: Kind; id: number; fields: Record<string, Node>; length: number | undefined };
type Write = (value: unknown, reference?: boolean) => Node;
type Fields = (write: Write) => Record<string, Node>;
const layouts = new WeakMap<object, { kind: Kind; fields: Fields; length: number | undefined }>();

export function trackModel(target: object, kind: Kind, fields: Fields, length?: number): void {
  layouts.set(target, { kind, fields, length });
}

export function writeProperty(write: Write, target: object, key: string | number, factory: object): Node {
  const descriptor = Object.getOwnPropertyDescriptor(target, key);
  if (!descriptor?.enumerable) return { schema: true };
  return write(Reflect.get(target, key), 'isReference' in factory && factory.isReference === true);
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
    if (value === null || typeof value === 'string' || typeof value === 'boolean') return value;
    if (typeof value === 'number') {
      return Number.isFinite(value) && !Object.is(value, -0)
        ? value : { number: Object.is(value, -0) ? '-0' : String(value) };
    }
    if (!isRecord(value)) throw new TypeError('unsupported model value');
    const layout = layouts.get(value);
    if (!layout || written.has(value)) throw new TypeError('expected an owned model value');
    written.add(value);
    return { kind: layout.kind, id: idOf(value), fields: layout.fields(write), length: layout.length };
  };
  const rootData = write(root);
  if (written.size !== ids.size) throw new TypeError('cannot serialize a reference outside the current model');
  return JSON.stringify({ version: 1, root: rootData });
}

export class RestoredReference {
  constructor(readonly target: () => object) {}
}

export class RestoredModel {
  constructor(
    readonly kind: Kind, readonly fields: Record<string, unknown>, readonly length: number | undefined,
    readonly register: (target: object, validate?: () => void) => void
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
  if (!isRecord(envelope) || envelope.version !== 1) return invalidData();
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
      switch (value.number) {
        case '-0': return -0;
        case 'NaN': return NaN;
        case 'Infinity': return Infinity;
        case '-Infinity': return -Infinity;
        default: return invalidData();
      }
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
      });
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
