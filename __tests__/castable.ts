import { cast, element, Castable, toBool } from '../lib/castable';

class Product extends Castable {
  @cast name: string;
  @cast price: number;
  @cast tax: number;
  @cast(Date) date: Date;
  @cast onSale: boolean;
}

test('Convert a simple object', () => {
  const serverResponse = `{
    "name": "Milk",
    "price": "200",
    "tax": "10",
    "date": "2017-10-20T06:28:08Z",
    "onSale": "false"
  }`;
  const product = new Product(JSON.parse(serverResponse));
  const sum = product.price + product.tax;
  expect(sum).toBe(210);
  expect(product.date.getDate()).toBe(20);
  expect(product.onSale).toBe(false);
});

test('Convert a simple object with unknown field', () => {
  const serverResponse = `{
    "name": "Milk",
    "price": "200",
    "tax": "10",
    "date": "2017-10-20T06:28:08Z",
    "onSale": "false",
    "unknown": 10
  }`;
  const product = new Product(JSON.parse(serverResponse));
  const sum = product.price + product.tax;
  expect(sum).toBe(210);
  expect(product.date.getDate()).toBe(20);
  expect(product.onSale).toBe(false);
  expect((product as any).unknown).toBe(10);
});

test('Convert an object array', () => {
  const serverResponse = `[
    {
      "name": "Milk",
      "price": "200",
      "tax": "10",
      "date": "2017-10-20T06:28:08Z",
      "onSale": "true"
    },
    {
      "name": "Water",
      "price": "50",
      "tax": "5",
      "date": "2017-10-25T06:28:08Z",
      "onSale": "false"
    }
  ]`;
  const products = JSON.parse(serverResponse).map(x => new Product(x));
  expect(products[1].price + products[1].tax).toBe(55);
  expect(products[1].date.getDate()).toBe(25);
  expect(products[1].onSale).toBe(false);
});

test('Convert a nested object with array type', () => {
  class Product extends Castable {
    @cast name: string;
    @cast price: number;
    @cast tax: number;
    @cast(Date) date: Date;
  }

  class OrderList extends Castable {
    @cast
    @element(Product)
    orders: Product[];
    @cast(Date) dueDate: Date;
  }

  const serverResponse = `{
    "orders": [
      {"name": "Milk", "price": "200", "tax": "10", "date": "2017-10-20T06:28:08Z"},
      {"name": "Water", "price": "50", "tax": "5", "date": "2017-10-20T06:28:08Z"}
    ],
    "dueDate": "2017-10-25T06:28:08Z"
  }`;
  const orderList = new OrderList(JSON.parse(serverResponse));
  expect(orderList.dueDate.getDate()).toBe(25);
  expect(orderList.orders.length).toBe(2);
  expect(orderList.orders[0].price).toBe(200);
  expect(orderList.orders[1].date.getDate()).toBe(20);
});

test('Convert an object with enum', () => {
  enum Color {
    Blue,
    Red,
    Yellow
  }
  class C extends Castable {
    @cast name: string;
    @cast color: Color;
  }
  const serverResponse = `{
    "name": "abc", "color": 1
  }`;
  const converted = new C(JSON.parse(serverResponse));
  expect(converted.name).toBe('abc');
  expect(converted.color).toBe(Color.Red);
});

test('Convert an object with string enum', () => {
  enum Color {
    Blue = 'Blue',
    Red = 'Red',
    Yellow = 'Yellow'
  }
  class C extends Castable {
    @cast name: string;
    @cast color: Color;
  }
  const serverResponse = `{
    "name": "abc", "color": "Red"
  }`;
  const converted = new C(JSON.parse(serverResponse));
  expect(converted.name).toBe('abc');
  expect(converted.color).toBe(Color.Red);
});

test('Convert 2D array', () => {
  class C extends Castable {
    @cast
    @element(Array, String)
    arr: string[][];
  }
  const s = `{ "arr": [ ["a", "b"], ["c", "d"] ] }`;
  const c = new C(JSON.parse(s));
  expect(c.arr.length).toBe(2);
  expect(c.arr[0].length).toBe(2);
});

test('Convert 2D object array', () => {
  class Pair extends Castable {
    @cast name: string;
    @cast n: number;
  }
  class C extends Castable {
    @cast
    @element(Array, Pair)
    arr: Pair[][];
  }
  const s = `{
    "arr": [
      [ { "name": "abc", "n": "123" }, { "name": "def", "n": "999" } ],
      [ { "name": "abc2", "n": "200" }, { "name": "def2", "n": "300" } ]
    ]
  }`;
  const c = new C(JSON.parse(s));
  expect(c.arr.length).toBe(2);
  expect(c.arr[0].length).toBe(2);
  expect(typeof c.arr[0][0].name).toBe('string');
  expect(c.arr[0][0].name).toBe('abc');
  expect(typeof c.arr[0][0].n).toBe('number');
  expect(c.arr[0][0].n).toBe(123);
  expect(typeof c.arr[1][0].name).toBe('string');
  expect(c.arr[1][0].name).toBe('abc2');
  expect(typeof c.arr[1][0].n).toBe('number');
  expect(c.arr[1][0].n).toBe(200);
});

test('Convert expanded boolean values', () => {
  class C extends Castable {
    @cast y: boolean;
    @cast yes: boolean;
    @cast intPos: boolean;
    @cast intNeg: boolean;
    @cast t: boolean;
    @cast TRUE: boolean;
    @cast on: boolean;
    @cast n: boolean;
    @cast no: boolean;
    @cast off: boolean;
    @cast zero: boolean;
    @cast f: boolean;
    @cast s: boolean;
    @cast null: boolean;
  }
  const s = `{
    "y": "y", "yes": "yes", "t": "t", "intNeg": -1, "intPos": 1, "on": "on", "TRUE": "TRUE",
    "n": "n", "no": "no", "zero": 0, "f": "f", "s": "arbitrary string", "null": null, "off": "off"
  }`;
  const c = new C(JSON.parse(s));
  for (const key of ['y', 'yes', 't', 'intNeg', 'intPos', 'on', 'TRUE']) {
    expect(c[key]).toBe(true);
  }
  for (const key of ['n', 'no', 'zero', 'f', 'null', 'off', 's']) {
    expect(c[key]).toBe(false);
  }
});

test('should be able to use `toBool` directly', () => {
  for (const val of ['y', 'yes', 't', -1, 1]) {
    expect(toBool(val)).toBe(true);
  }
  for (const val of ['n', 'no', 0, 'f', null, void 0]) {
    expect(toBool(val)).toBe(false);
  }
});

test('should allow a property called `convert`', () => {
  class C extends Castable {
    @cast convert: string;
  }
  const s = '{"convert": "value"}';
  const c = new C(JSON.parse(s));
  expect(c.convert).toEqual('value');
});
