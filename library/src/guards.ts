/* eslint-disable @typescript-eslint/no-use-before-define */
import ts from 'typescript';
import { isExported, tryName } from './visit';
import { logger } from './utils';

import { emitInterfaceGuard, emitTypeGuard } from "./guardEmitters";

export const emitGuard = (node: ts.Node, exportedSymbols: string[], config: EmitterConfig): string => {
    logger.debug(`\nemitGuard" ${tryName(node)}"`);

    if (ts.isInterfaceDeclaration(node)) {
        return emitInterfaceGuard(node, exportedSymbols, config);

    } else if (ts.isTypeAliasDeclaration(node)) {
        return emitTypeGuard(node, exportedSymbols);

    } else {
        return `// `;
    }
};

export const publicStatements = (sourceFile: ts.SourceFile): { statements: ts.Statement[]; names: string[] } => {
    const names: string[] = [];
    const statements: ts.Statement[] = [];

    sourceFile.statements.filter(isExported).forEach((statement) => {
        if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
            statements.push(statement);
            names.push(statement.name.escapedText as string);
        }
    });

    return { statements, names };
};

// public

export interface EmitterConfig {
    // path to import types from
    importFrom?: string;

    // generate warning code for every single property
    embedWarnings?: boolean;
}

export function emitImportLine(sourceFile: ts.SourceFile, importFrom: string): string {
    logger.debug('emitImportLine', { importFrom });
    const { names } = publicStatements(sourceFile);
    return `import {${names.sort().join(', ')}} from '${importFrom}';`;
}

export function emitGuardsForSourceFile(sourceFile: ts.SourceFile, config: EmitterConfig): string[] {
    logger.debug('emitGuards', { config });
    const guards: string[] = [];
    const { statements, names: exportedSymbols } = publicStatements(sourceFile);
    statements.forEach((node) => {
        const guard = emitGuard(node, exportedSymbols, config);
        guards.push(guard);
    });
    return guards;
}
