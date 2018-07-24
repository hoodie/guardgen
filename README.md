# guard-gen

**WIP** generates typescript [type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html)s from interface definitions.

So far it can understand something like this:

```typescript
export interface Foo {
    name: 'foo';
    value: string;
    amount: number;
}

export interface Bar {
    name: 'bar';
    list?: number[];
}

export interface Foobar {
    foo: Foo;
    bar: Bar;
}
```

and produce something like this:

```typescript
import {Foo, Bar, Foobar} from './test/example-types'

// generated typeguard for Foo
export const isFoo = (maybeFoo: Foo): maybeFoo is Foo => {
    const {name, value, amount} = maybeFoo;

    return name === 'foo' /*name: 'foo'*/ &&
    typeof value === 'string' /*value: string*/ &&
    typeof amount === 'number' /*amount: number*/;
}



// generated typeguard for Bar
export const isBar = (maybeBar: Bar): maybeBar is Bar => {
    const {name, list} = maybeBar;

    return name === 'bar' /*name: 'bar'*/ &&
    !(list) || (Array.isArray(list) && list.every((x) => typeof x === 'number')) /*list: Array<number>?*/;
}



// generated typeguard for Foobar
export const isFoobar = (maybeFoobar: Foobar): maybeFoobar is Foobar => {
    const {foo, bar} = maybeFoobar;

    return isFoo(foo) /*foo: Foo*/ &&
    isBar(bar) /*bar: Bar*/;
}
```

## Why?

Type guards are required to move some of the guarantees of the typesystem from compiletime to runtime. Unfortunately generating runtime code is not part of typescripts philosophy.
However their compiler API makes it rather easy to generate them.
This is currently only a toy project, if you have more experience with TypeScripts Compiler API and great ambitions please pick it up :D