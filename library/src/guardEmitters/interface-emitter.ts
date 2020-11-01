import ts from 'typescript';

import { EmitterConfig } from '../guards';
import { capitalize, logger } from '../utils';
import { NodeInfo, visitNode } from '../visit';

// determine the name of an interface property
const propertyName = (node: ts.PropertySignature): string => {
    if (ts.isIdentifier(node.name)) {
        return node.name.escapedText as string;
    } else if (ts.isStringLiteral(node.name)) {
        return node.name.text;
    } else {
        return node.name as any;
    }
};

// list the names of interface properties
const propertyNames = (iface: ts.InterfaceDeclaration): string[] =>
    iface.members.filter(ts.isPropertySignature).map(propertyName) as string[];

// generate an individual interface property check
const propertyCheck = ({ embedWarnings }: EmitterConfig) => {
    if (embedWarnings) {
        return propertyCheckWithWarning;
    } else {
        return silentPropertyCheck;
    }
};

const propertyDescription = ({ name, isOptional, typeName }: NodeInfo) =>
    `${name}: ${typeName}${isOptional ? `?` : ''}`;

const silentPropertyCheck = (node: NodeInfo) =>
    // `${node.isOptional ? `!(${node.name}) || ` : '' }${node.valueCheck}`;
    `${node.isOptional ? `!(${node.name}) || ` : ''}${node.valueCheck} /* ${propertyDescription(node)}*/`;

const propertyCheckWithWarning = ({ name, isOptional, valueCheck, typeName }: NodeInfo) => {
    const pc = silentPropertyCheck({ name, isOptional, valueCheck, typeName });
    return `((${name}) => {
        const ${name}ChecksOut = ${pc};
        if(!${name}ChecksOut) {console.warn("${name} is not a propper ${typeName}")}
        return ${name}ChecksOut;
        })(${name})`;
};

// generate all checks for individual interface properties
const propertyChecks = (iface: ts.InterfaceDeclaration, exportedSymbols: string[], config: EmitterConfig): string =>
    iface.members
        .filter(ts.isPropertySignature)
        .map((prop) =>
            visitNode({
                node: prop as any,
                name: propertyName(prop),
                exportedSymbols,
            })
        )
        .map(propertyCheck(config))
        .join(' &&\n        ');

export const emitInterfaceGuard = (
    iface: ts.InterfaceDeclaration,
    exportedSymbols: string[],
    config: EmitterConfig
): string => {
    const name = iface.name.escapedText as string;
    logger.log('emitInterfaceGuard', name);
    const maybe = `maybe${capitalize(name)}`;

    const head = `export const is${name} = (${maybe}: any): ${maybe} is ${name} =>`;

    const checks = propertyChecks(iface, exportedSymbols, config);
    const properties = propertyNames(iface).join(', ');

    const destructuring = `const {${properties}} = ${maybe}`;

    return `\n// generated typeguard for ${name}\n${head} {\n    ${destructuring};\n\n    return (\n        ${checks};\n    )\n};\n\n`;
};
