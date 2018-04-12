import 'reflect-metadata';

export function cast(...args: any[]): any {
  if (args[0] instanceof Function) {
    return (target: any, propKey: string) => {
      Reflect.defineMetadata('custom:type', args[0], target, propKey);
    };
  }
}

export function element(...types: Function[]) {
  return (target: any, propertyKey: string) => {
    let metadataKey = 'custom:element-type0';
    for (const type of types) {
      Reflect.defineMetadata(metadataKey, type, target, propertyKey);
      metadataKey = metadataKey.replace(/(\d+)$/, (_, p1) => `${Number(p1) + 1}`);
    }
  };
}

export class Castable {
  constructor(source: any) {
    Object.getOwnPropertyNames(source).forEach(propertyKey => {
      const designType = Reflect.getMetadata('design:type', this, propertyKey);
      const customType = Reflect.getMetadata('custom:type', this, propertyKey);
      const type = customType !== void 0 ? customType : designType;
      this[propertyKey] = convert(source[propertyKey], type, propertyKey, 0, this);
    });
  }
}

/**
 * Convert a value into a specific type.
 * @param value
 * @param type
 * @param propertyKey
 * @param depth
 * @param obj
 */
function convert(value: any, type: any, propertyKey: string, depth: number, obj?: any) {
  if (type === void 0) {
    return value;
  }
  switch (type.name) {
    case 'Number':
      return Number(value);
    case 'String':
      return String(value);
    case 'Boolean':
      return toBool(value);
    case 'Array':
      const elementType = Reflect.getMetadata('custom:element-type' + depth, obj, propertyKey) as Function;
      const nextDepth = depth + 1;
      return (value as any[]).map(el => convert(el, elementType, propertyKey, nextDepth, obj));
    default:
      return new type(value);
  }
}

/**
 * Converts various values to a boolean.
 * @param val value to be converted
 */
export function toBool(val: any): boolean {
  return typeof val === 'number' ? val !== 0 : /^(t|true|y|yes|on)/.test(String(val).trim().toLowerCase());
}
