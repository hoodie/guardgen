#!/bin/env node
import * as fs from 'fs';
import ts from 'typescript';
import { generateGuards, generateImportLine } from './guards';

const openFile = (path: string): string => fs.readFileSync(path, 'utf8');

// const sourceFilePath = './test/example-types.ts';
const sourceFilePath = process.argv[2];
const sourceText = openFile(sourceFilePath);
const sourceFile = ts.createSourceFile(
  "x.ts",
  sourceText,
  ts.ScriptTarget.Latest,
  true
);

const imports = generateImportLine(sourceFile, sourceFilePath);
const guards = generateGuards(sourceFile);

console.log(imports);

console.log(guards.join('\n'));