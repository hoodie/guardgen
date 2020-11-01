import ts from 'typescript';

import { capitalize, logger } from '../utils';
import { visitNode } from '../visit';

export const emitTypeGuard = (node: ts.TypeAliasDeclaration, exportedSymbols: string[]) => {
    const name = capitalize(node.name.escapedText as string);
    logger.log('emitTypeGuard', name);
    const maybe = `maybe${name}`;

    const head = `export const is${name} = (${maybe}: any): ${maybe} is ${name} =>`;
    const { valueCheck } = visitNode({ node, name: maybe, exportedSymbols });

    return `\n// generated typeguard for ${name}\n${head}\n    ${valueCheck};`;
};
