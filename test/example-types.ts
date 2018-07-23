export interface Foo {
    name: 'foo';
    value: string;
    amount: number;
}

export interface Bar {
    name: 'bar';
    list?: number[];
    maybesomething?: 'something' | 'nothing';
}

export type Direction = 'up' | 'down';

export interface Foobar {
    foo: Foo;
    bar: Bar;
    extras?: {[key: string]: string},
    names?: string[],
    direction: Direction,
    directions: Direction[],
    numbers?: (number)[],
}