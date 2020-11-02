// export interface Foo {
//     name: 'foo';
//     value: string;
//     amount?: number;
//     more: object,
//     muchMore: any,
// }

// export type MyString = string;
// export type MyString2 = 'string';

export type Partial<T> = {
    [P in keyof T]?: T[P];
};

// export type PFoo = Partial<Foo>;

// export interface Bar {
//     name: 'bar';
//     list: number[];
//     maybesomething: 'something' | 'nothing';
// }
// 
// export type Direction = 'up' | 'down';
// 
// export type FooOrBar = Foo | Bar;
// 
// export interface Foobar {
//     foo: Foo;
//     bar: Bar;
//     extras?: {[key: string]: string},
//     names?: string[],
//     direction: Direction,
//     directions: Direction[],
//     numbers?: number[],
//     parts: PrivateInterface,
// }
// 
// interface PrivateInterface {
//     top: 'secret'
// }
// 