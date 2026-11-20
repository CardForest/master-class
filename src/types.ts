import type Control = require('./lib/utils/control');

export type KeyPath = (string | number)[];
export type ModelContext = Record<string, unknown>;
export type ModelFunction = (...args: never[]) => unknown;
export type SnapshotMapper = (
  options: unknown,
  instance: unknown,
  keyPath: KeyPath,
  snapshot: () => unknown
) => unknown;

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

export interface Managed {
  readonly control: Control;
  readonly root: object;
  readonly parent?: object;
  readonly keyPath: KeyPath;
  snapshot(mapper?: SnapshotMapper): unknown;
}

export interface ModelClass<T extends object> extends Factory<T & Managed> {
  readonly props: Record<string, Factory>;
  createInstance(
    value?: unknown, options?: KeyPath | Control | ControlOptions, control?: Control, parent?: object
  ): T & Managed;
  new(value?: unknown, options?: KeyPath | Control | ControlOptions, control?: Control, parent?: object): T & Managed;
}

export interface ArrayClass<T> extends Factory<T[]> {
  new(value?: unknown, keyPath?: KeyPath, control?: Control, parent?: object): T[];
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
  delegate: ModelClass<object> & { readonly props: Record<string, Factory> };
  when?: (this: ModelContext) => unknown;
  subState?: StateOptions[];
  idx?: number;
}

export type FactoryValue<F> = F extends GetterFactory<infer _T, infer R> ? R :
  F extends RefFactory ? object | null :
  F extends Factory<infer T> ? T : never;
export type ObjectValue<P> = { [K in keyof P]: FactoryValue<P[K]> };
export type SugarValue<S> =
  S extends Factory ? FactoryValue<S> :
  S extends NumberConstructor | number ? number :
  S extends StringConstructor | string ? string :
  S extends BooleanConstructor | boolean ? boolean :
  S extends (...args: infer A) => infer R ? (...args: A) => R :
  S extends readonly (infer E)[] ? SugarValue<E>[] :
  S extends { props: infer P } ? SugarValue<P> :
  S extends object ? { [K in keyof S as K extends `$${string}` ? never : K]: SugarValue<S[K]> } :
  never;

export type SugarFactory<S> = S extends Factory ? S :
  S extends NumberConstructor | StringConstructor | BooleanConstructor | number | string | boolean
    ? Factory<SugarValue<S>> :
  S extends ModelFunction ? Factory<S> :
  S extends readonly (infer E)[] ? ArrayClass<SugarValue<E>> :
  ModelClass<SugarValue<S> & object>;

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
