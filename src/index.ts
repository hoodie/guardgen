import * as fs from 'fs';
import ts from 'typescript';
import { generateGuards } from './guards';
import { dir } from './utils';

const openFile = (path: string): string => fs.readFileSync(path, 'utf8');

const sourceFilePath = './test/example-types.ts';
// const sourceFilePath = process.argv[2];
const sourceText = openFile(sourceFilePath);
const sourceFile = ts.createSourceFile('x.ts', sourceText, ts.ScriptTarget.Latest, true);

const guards = generateGuards(sourceFile);

console.log('// ---------------- Result ----------------');
console.log(`import {Foo, Bar, Foobar, Direction} from './test/example-types';`);

console.log('// ----------- Interface Guards -----------');
console.log(`import * from '${sourceFilePath.slice(0, -3)}';`);

guards.forEach(code => console.log(code));