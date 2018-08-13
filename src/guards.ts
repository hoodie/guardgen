import ts, { SyntaxKind, Statement } from 'typescript';
import { capitalize, odir, dir, comment } from './utils';
import { visitNode, NodeInfo, isExported } from './visit';

export interface GeneratorConfig {
    embedWarnings: boolean;
}

// determine the name of an interface property
const propertyName = (node: ts.PropertySignature): string => {
    if (ts.isIdentifier(node.name)) {
        return node.name.escapedText as any;
    } else if (ts.isStringLiteral(node.name)) {
        return node.name.text;
    } else {
        return node.name as any;
    }
};

// list the names of interface properties
const propertyNames = (iface: ts.InterfaceDeclaration): string[] =>
    iface.members
        .filter(ts.isPropertySignature)
        .map(propertyName) as string[];


// generate an individual interface property check
const propertyCheck = ({embedWarnings}: GeneratorConfig) => {
    if (embedWarnings) {
        return propertyCheckWithWarning
    } else {
        return silentPropertyCheck
    }
}

const silentPropertyCheck = ({ name, isOptional, valueCheck, typeName }: NodeInfo) =>
    `${ isOptional ? `!(${name}) || ` : '' }${valueCheck} /*${name}: ${typeName}${ isOptional ? `?` : '' }*/` ;


const propertyCheckWithWarning = ({ name, isOptional, valueCheck, typeName }: NodeInfo) => {
    const pc = silentPropertyCheck({name, isOptional, valueCheck, typeName})
    return `((${name}) => {
        const ${name}ChecksOut = ${pc};
        if(!${name}ChecksOut) {console.warn("${name} is not a propper ${typeName}")}
        return ${name}ChecksOut;
    })(${name})\n`
};

// generate all checks for individual interface properties
const propertyChecks = (iface: ts.InterfaceDeclaration, exportedSymbols: string[], config: GeneratorConfig): string =>
    iface.members
        .filter(ts.isPropertySignature)
        .map(prop => visitNode({node: prop as any, name: propertyName(prop), exportedSymbols }))
        .map(propertyCheck(config))
        .join(' &&\n        ');

const interfaceGuard = (iface: ts.InterfaceDeclaration, exportedSymbols: string[], config: GeneratorConfig): string => {
    const name = iface.name.escapedText as string;
    const maybe = `maybe${capitalize(name)}`;

    const head = `export const is${name} = (${maybe}: ${name}): ${maybe} is ${name} =>`;

    const checks = propertyChecks(iface, exportedSymbols, config);
    const properties = propertyNames(iface).join(', ');

    const destructuring = `const {${properties}} = ${maybe}`

    return `\n// generated typeguard for ${name}\n${head} {\n    ${destructuring};\n\n    return ${checks};\n}\n\n`;
}

const publicStatements = (sourceFile: ts.SourceFile): { statements: Statement[], names: string[] } => {
    const names: string[] = [];
    const statements: Statement[] = [];

    sourceFile.statements.filter(isExported).forEach(statement => {
        if (ts.isInterfaceDeclaration(statement) || ts.isTypeAliasDeclaration(statement)) {
            statements.push(statement)
            names.push(statement.name.escapedText as string);
        }
    });

    return {statements, names}
}

const typeGuard = (node: ts.TypeAliasDeclaration) => {
    const name = capitalize(node.name.escapedText as string);
    const maybe = `maybe${name}`;

    const head = `const is${name} = (${maybe}: ${name}): ${maybe} is ${name} =>`;
    const {valueCheck} = visitNode({node, name: maybe});

    return `\n// generated typeguard for ${name}\n${head}\n    ${valueCheck}`;
};

const generateGuard = (node: ts.Node, exportedSymbols: string[], config: GeneratorConfig): string => {
    if (ts.isInterfaceDeclaration(node)) {
        return interfaceGuard(node, exportedSymbols, config);
    } else if (ts.isTypeAliasDeclaration(node)) {
        return typeGuard(node);
    } else {
        return `// `;
    }
};

export function generateImportLine(sourceFile: ts.SourceFile, path: string): string {
    const { names } = publicStatements(sourceFile);
    return `import {${names.join(', ')}} from '${path.slice(0, -3)}'`;
}

export function generateGuards(sourceFile: ts.SourceFile, config: GeneratorConfig): string[] {
    const guards: string[] = [];
    const { statements, names: exportedSymbols } = publicStatements(sourceFile);
    statements.forEach(node => {
        const guard = generateGuard(node, exportedSymbols, config);
        guards.push(guard);
    });
    return guards;
}
