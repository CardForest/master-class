import MObject = require('../classes/mObject');
import type { Factory, ModelClass, ObjectOptions, ObjectValue } from '../../types';

function mObjectFactory<P extends Record<string, Factory>>(
  opt: ObjectOptions<P>
): ModelClass<ObjectValue<P>> & { readonly opt: ObjectOptions<P> } {
  if (!Object.hasOwn(opt, 'props')) {
    throw new Error("object options must include 'props'");
  }
  // The schema's fields are installed by MObject using property descriptors.
  return class extends MObject {
    static get opt() { return opt; }
  } as ModelClass<ObjectValue<P>> & { readonly opt: ObjectOptions<P> };
}

export = mObjectFactory;
