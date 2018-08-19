export interface Foo {
    name: 'foo'; // single quotes
    value: string;
    amount?: number;
    more: object,
    muchMore: any,
}

export interface Bar {
    name: "bar"; // double quotes
    list: number[];
    maybesomething: 'something' | 'nothing';
}

export type Direction = 'up' | 'down';

export type FooOrBar = Foo | Bar

export interface Foobar {
    foo: Foo;
    bar: Bar;
    extras?: {[key: string]: string},
    names?: string[],
    direction: Direction,
    directions: Direction[],
    numbers?: (number)[],
    parts: PrivateInterface,
}

interface PrivateInterface {
    top: 'secret'
}


export class SoClassy {
    public foo?: Foo;
    constructor() {}
}