import * as fs from 'fs';
import ts from 'typescript';
import { emitGuards, emitImportLine, EmitterConfig } from './guards';
import { logger } from './utils';

export { logger, toggleLogger } from './utils';

const openFile = (path: string): string => fs.readFileSync(path, 'utf8');

export interface Generated {
    imports?: string;
    guards: string[];
}

export function generateFrom(sourceFilePath: string, config: EmitterConfig): Generated {
    logger.debug('generateFrom', { sourceFilePath, config });
    const sourceText = openFile(sourceFilePath);
    const sourceFile = ts.createSourceFile('x.ts', sourceText, ts.ScriptTarget.Latest, true);

    const { importFrom } = config;
    const imports = importFrom && emitImportLine(sourceFile, importFrom);
    const guards = emitGuards(sourceFile, config);

    return { imports, guards };
}
