import type Control = require('./lib/utils/control');

export type KeyPath = (string | number)[];
export type ModelContext = Record<string, unknown>;
export type ModelFunction = (...args: never[]) => unknown;
export type ExportMapper = (
  options: unknown,
  instance: unknown,
  keyPath: KeyPath,
  copy: () => unknown
) => unknown;
export type SnapshotMapper = ExportMapper;

export interface Factory<T = unknown> {
  readonly opt?: unknown;
  createInstance(value?: unknown, keyPath?: KeyPath, control?: Control, parent?: object): T;
  toPropertyDescriptor(
    value: unknown, control: Control, keyPath: KeyPath, key: string | number, parent: object
  ): PropertyDescriptor;
  snapshot?(mapper: SnapshotMapper, instance: unknown, keyPath: KeyPath): unknown;
}

export interface GetterFactory<T, R> extends Factory<(this: T) => R> {
  readonly isGetter: true;
}

export interface ReferenceValue {
  ref?: object | null;
  keyPath?: KeyPath;
}

export interface RefFactory extends Factory<ReferenceValue> {
  readonly isReference: true;
}

export interface ControlOptions {
  isChangeAllowed?: boolean;
  rootPropertyName?: string;
  onMutatorCall?: Control['onMutatorCall'];
  [key: string]: unknown;
}

interface ModelLocation {
  readonly root?: object;
  readonly parent?: object;
  readonly keyPath: readonly (string | number)[];
}

export interface Managed extends ModelLocation {
  readonly control: Control;
  export(mapper?: ExportMapper): unknown;
  serialize(): string;
  /** @deprecated Use export() for a copy or serialize() for a full state round-trip. */
  snapshot(mapper?: SnapshotMapper): unknown;
}

export type FixedArray<T> = Omit<ReadonlyArray<T>, number> & { [index: number]: T };

type ModelInput<T> = T extends FixedArray<infer E> ? readonly ModelInput<E>[] :
  T extends ModelFunction ? T :
  T extends object ? { [K in keyof T as K extends keyof ModelLocation ? never : K]?: ModelInput<T[K]> } :
  T;

type HasHidden<T> = T extends '$hidden' ? true :
  T extends readonly (infer E)[] ? HasHidden<E> :
  T extends ModelFunction ? false :
  T extends object ? { [K in keyof T]-?: HasHidden<T[K]> }[keyof T] :
  false;
type Unprojected<T> = true extends HasHidden<T> ? never : T;

export interface ManagedClass<T extends object> extends Factory {
  deserialize(data: string, options?: Control | ControlOptions): T & Managed;
  createInstance(value?: null, options?: Control | ControlOptions): T & Managed;
  createInstance<const I extends ModelInput<T>>(value: I & Unprojected<I>, options?: Control | ControlOptions): T & Managed;
  createInstance(value: unknown, options?: KeyPath | Control | ControlOptions, control?: Control, parent?: object): unknown;
  new(value?: null, options?: Control | ControlOptions): T & Managed;
  new<const I extends ModelInput<T>>(value: I & Unprojected<I>, options?: Control | ControlOptions): T & Managed;
  new(value: unknown, options?: Control | ControlOptions): object;
}

export interface ModelClass<T extends object> extends ManagedClass<T> {
  readonly props: Record<string, Factory>;
}

export interface ArrayClass<T> extends Factory {
  deserialize(data: string, options?: Control | ControlOptions): FixedArray<T> & Managed;
  createInstance(value?: null, options?: Control | ControlOptions): FixedArray<T> & Managed;
  createInstance<const I extends readonly ModelInput<T>[]>(value: I & Unprojected<I>, options?: Control | ControlOptions): FixedArray<T> & Managed;
  createInstance(value: unknown, options?: KeyPath | Control | ControlOptions, control?: Control, parent?: object): unknown;
  new(value?: null, options?: Control | ControlOptions): FixedArray<T> & Managed;
  new<const I extends readonly ModelInput<T>[]>(value: I & Unprojected<I>, options?: Control | ControlOptions): FixedArray<T> & Managed;
  new(value: unknown): object;
}

export interface ObjectOptions<P extends Record<string, Factory> = Record<string, Factory>> {
  props: P;
  rootPropertyName?: string;
  [key: string]: unknown;
}

export interface ArrayOptions<F extends Factory = Factory> {
  elem: F;
  defaultLength: number;
  [key: string]: unknown;
}

export interface PrimitiveOptions<T> {
  initialValue?: T;
  [key: string]: unknown;
}

export interface MutatorOptions<F extends ModelFunction = ModelFunction, T = ModelContext> {
  fn: F;
  guard?: (this: T) => boolean;
  [key: string]: unknown;
}

export interface StateOptions {
  delegate: ModelClass<object>;
  when?: (this: ModelContext) => unknown;
  subState?: readonly StateOptions[];
}

export interface CompiledState extends StateOptions {
  readonly idx: number;
  readonly subState: readonly CompiledState[];
}

export type FactoryValue<F> = F extends GetterFactory<infer _T, infer R> ? R :
  F extends RefFactory ? object | null :
  F extends ManagedClass<infer T> ? T & ModelLocation :
  F extends ArrayClass<infer T> ? FixedArray<T> :
  F extends Factory<infer T> ? T : never;
export type ObjectValue<P> = { [K in keyof P]: FactoryValue<P[K]> };
type SugarFields<S> = SugarProperties<S extends { props: infer P } ? P : S>;
type SugarProperties<S> = {
  [K in keyof S as K extends `$${string}` ? never : K]: SugarValue<S[K]>
};
export type SugarValue<S> =
  S extends Factory ? FactoryValue<S> :
  S extends NumberConstructor | number ? number :
  S extends StringConstructor | string ? string :
  S extends BooleanConstructor | boolean ? boolean :
  S extends (...args: infer A) => infer R ? (...args: A) => R :
  S extends readonly (infer E)[] ? FixedArray<SugarValue<E>> :
  S extends object ? SugarFields<S> & ModelLocation :
  never;

export type SugarFactory<S> = S extends Factory ? S :
  S extends NumberConstructor | StringConstructor | BooleanConstructor | number | string | boolean
    ? Factory<SugarValue<S>> :
  S extends ModelFunction ? Factory<S> :
  S extends readonly (infer E)[] ? ArrayClass<SugarValue<E>> :
  ModelClass<SugarFields<S> & object>;

export function isRecord(value: unknown): value is ModelContext {
  return value !== null && typeof value === 'object';
}

export function isFactory(value: unknown): value is Factory {
  return value !== null && (typeof value === 'object' || typeof value === 'function') &&
    'createInstance' in value && typeof value.createInstance === 'function';
}

export function rootOf(parent: object | undefined, target: object, control: Control): object {
  if (parent == null) {
    return target;
  }
  const root = Object.prototype.hasOwnProperty.call(parent, control.rootPropertyName)
    ? Reflect.get(parent, control.rootPropertyName) as unknown : parent;
  if (!isRecord(root)) {
    throw new TypeError('expected root object');
  }
  return root;
}
