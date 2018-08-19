# GuardGen

GuardGen generates typescript [type guard](https://www.typescriptlang.org/docs/handbook/advanced-types.html)s from interface definitions so you don't have to write them and the don't get outdated.

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

## Usage

### Cli

`> guardgen`

```
  Usage: guardgen [options] [command]

  Options:

    -V, --version                  output the version number
    -h, --help                     output usage information

  Commands:

    generate|gen [options] [FILE]  generate guards from given ts file
```

`> guardgen generate --help`

```
  Usage: generate|gen [options] [FILE]

  generate guards from given ts file

  Options:

    -w, --warners         embed code that produces warnings
    -g, --guardsfile      put a .guards.ts file next to your input
    -o, --outfile [FILE]  path to file to generate
    -h, --help            output usage information
```

### Output file

`guardgen some-types.ts`
prints to stdout.

`guardgen some-types.ts -o src/someguards.ts `
generates
`src/someguards.ts`.

`guardgen some-types.ts -o src/ `
generates
`src/some-types.guards.ts`.

## Contribution


### I found an issue
OMG, I'm so sorry - please don't be mad! Thanks for reporting it in a kind manner and perhaps even helping me fix it quickly.

### I want a feature X
1. Ya! That sounds like a cool idea, now I want that too. Oh you already started implementing it? Even better, let me have a look and perhaps we just merge it.
2. Hmm sounds like that is a different use case for a code generator - so let's not put it in guardgen and instead let's kick of an alternate generator for your special usecase. I can perhaps help you navigate Typescripts Compiler API or you just use guardgen as a template.