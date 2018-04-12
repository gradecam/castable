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
      const type = customType !== undefined ? customType : designType;
      this[propertyKey] = this.convert(source[propertyKey], propertyKey, type, 0);
    });
  }

  private convert(source: any, propertyKey: string, type: any, depth: number) {
    if (type === undefined) {
      return source;
    }
    switch (type.name) {
      case 'Number':
        return Number(source);
      case 'String':
        return String(source);
      case 'Boolean':
        return toBool(source);
      case 'Array':
        const elementType = Reflect.getMetadata('custom:element-type' + depth, this, propertyKey) as Function;
        const nextDepth = depth + 1;
        return (source as any[]).map(el => this.convert(el, propertyKey, elementType, nextDepth));
      default:
        return new type(source);
    }
  }
}

/**
 * Converts various values to a boolean.
 * @param val value to be converted
 */
export function toBool(val: any): boolean {
  return typeof val === 'number' ? val !== 0 : /^(t|true|y|yes)/.test(String(val))
}