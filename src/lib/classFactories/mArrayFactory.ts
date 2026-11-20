import MArray = require('../classes/mArray');
import type { ArrayClass, ArrayOptions, Factory, FactoryValue } from '../../types';

function mArrayFactory<F extends Factory>(
  opt: ArrayOptions<F>
): ArrayClass<FactoryValue<F>> & { readonly opt: ArrayOptions<F> } {
  return class extends MArray {
    static get opt() { return opt; }
  } as ArrayClass<FactoryValue<F>> & { readonly opt: ArrayOptions<F> };
}

export = mArrayFactory;
