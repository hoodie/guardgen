import ts from 'typescript';
import { capitalize } from './utils';
import { visitNode } from './visit';

const propertyName = (node: ts.PropertySignature): string => {
    if (ts.isIdentifier(node.name)) {
        return node.name.escapedText as any;
    } else if (ts.isStringLiteral(node.name)) {
        return node.name.text;
    } else {
        return node.name as any;
    }
};

const propertyTypeChecks = (iface: ts.InterfaceDeclaration): string =>
    iface.members
        .filter(ts.isPropertySignature)
        .map(prop => visitNode(prop as any, propertyName(prop)))
        .map(({check}) => check)
        .join(' &&\n    ');

const propertyNames = (iface: ts.InterfaceDeclaration): string[] =>
    iface.members
        .filter(ts.isPropertySignature)
        .map(propertyName) as string[];

const interfaceGuard = (iface: ts.InterfaceDeclaration): string => {
    const name = iface.name.escapedText as string;
    const maybe = `maybe${capitalize(name)}`;

    const head = `export const is${name} = (${maybe}: ${name}): ${maybe} is ${name} =>`;

    const checks = propertyTypeChecks(iface);
    const properties = propertyNames(iface).join(', ');

    const destructuring = `const {${properties}} = ${maybe}`

    return `\n// generated typeguard for ${name}\n${head} {\n    ${destructuring};\n\n    return ${checks};\n}\n\n`;
}

const typeGuard = (node: ts.TypeAliasDeclaration) => {
    const name = capitalize(node.name.escapedText as string);
    const maybe = `maybe${name}`;

    const head = `const is${name} = (${maybe}: ${name}): ${maybe} is ${name} => `;
    const {check} = visitNode(node, maybe);

    return `${head}\n    ${check}`;
};


const generateGuard = (node: ts.Node): string => {
    if (ts.isInterfaceDeclaration(node)) {
        return interfaceGuard(node);
    } else if (ts.isTypeAliasDeclaration(node)) {
        return typeGuard(node);
    } else {
        return `// `;
    }
};

export function generateGuards(fakeFile: ts.SourceFile): string[] {
    const guards: string[] = [];
    ts.forEachChild(fakeFile, node => {
        const guard = generateGuard(node);
        guards.push(guard);
    });
    return guards;
}
