import * as fs from 'fs';
import ts from 'typescript';
import { generateGuards, generateImportLine, GeneratorConfig } from './guards';

const openFile = (path: string): string => fs.readFileSync(path, 'utf8');
const error = (message: string) => console.error(`ERROR: ${message}`);

export interface Generated {
    imports?: string;
    guards: string[];
}

export function generateFrom(sourceFilePath: string, config: GeneratorConfig): Generated {
    const sourceText = openFile(sourceFilePath);
    const sourceFile = ts.createSourceFile(
        'x.ts',
        sourceText,
        ts.ScriptTarget.Latest,
        true
    );

    const { importFrom } = config;
    const imports = importFrom && generateImportLine(sourceFile, importFrom);
    const guards = generateGuards(sourceFile, config);

    return { imports, guards };
}