#!/bin/env node
import * as fs from 'fs';
import programm from 'commander';
import ts from 'typescript';
import { generateGuards, generateImportLine, GeneratorConfig } from './guards';

const openFile = (path: string): string => fs.readFileSync(path, 'utf8');
const error = (message: string) => console.error(`ERROR: ${message}`)

export interface Generated {
    imports: string;
    guards: string[];
}

function generateFrom(sourceFilePath: string, { embedWarnings }: GeneratorConfig): Generated {
    const sourceText = openFile(sourceFilePath);
    const sourceFile = ts.createSourceFile(
      "x.ts",
      sourceText,
      ts.ScriptTarget.Latest,
      true
    );

    const imports = generateImportLine(sourceFile, sourceFilePath);
    const guards = generateGuards(sourceFile, { embedWarnings });

    return {imports, guards}
}

function printGuards({imports, guards}: Generated) {
  console.log(imports)
  guards.forEach(guard => console.log(guard))
}

programm
    .version("0.1.0")
    .name('guardner')
    .command('generate [FILE]')
    .alias('gen')
    .description('generate guards from given ts file')
    .option('-w, --warners', 'embed code that produces warnings')
    .action((file, {warners}) => {
        const embedWarnings = !!warners;
        if (!!file) {
          const generated = generateFrom(file, {embedWarnings})
          printGuards(generated);
        } else {
          error("please pass a typescript file to generate guards for");
        }
    })


if (!process.argv.slice(2).length) {
    programm.outputHelp();

} else {
    programm.parse(process.argv);

}