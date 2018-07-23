import * as fs from 'fs';
import * as ts from 'typescript';
import {SyntaxKind} from 'typescript';

const dir = x => console.dir(x, { colors: true, depth: 4 });
const odir = x => dir(JSON.parse(JSON.stringify(x, (k, v) => { if (k !== 'parent') { return v } })));

const propertyName = (node: ts.PropertySignature): string => {
    if (ts.isIdentifier(node.name)) {
        return node.name.escapedText as any;
    } else if (ts.isStringLiteral(node.name)) {
        return node.name.text;
    } else {
        return node.name as any;
    }
};

const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1);

const ifaceName = (iface: ts.Node): string => {
    if (ts.isInterfaceDeclaration(iface)) {
        return iface.name.escapedText as string;
    }
    throw new Error('not an interfaceDeclaration');
}

interface TypeLogic {
    name: string,
    typeName: string,
    guardName?: string,
    check: string,
}

type HasType = {type: ts.TypeNode};
const hasType = (node: any): node is HasType =>
    node.type && ts.isTypeNode(node.type);

const typeLogic = (node: ts.Node & HasType, name = 'x'): TypeLogic => {
    if (!hasType(node)) throw new Error("only TypeNodes allowed");

    const check = `true /* unimplemented for ${SyntaxKind[node.type.kind]}*/`;
    const optional = (node as any).questionToken ? `!(${name}) || ` : "";

    if (node.type.kind === SyntaxKind.NumberKeyword) {
        return { name, typeName: "number", check: `${optional}typeof ${name} === 'number'` };

    } else if (node.type.kind === SyntaxKind.StringKeyword) {
        return { name, typeName: "string", check: `${optional}typeof ${name} === 'string'` };

    } else if (node.type.kind === SyntaxKind.ObjectKeyword) {
        return { name, typeName: "object", check: `${optional}typeof ${name} === 'object'` };

    } else if (ts.isLiteralTypeNode(node.type) && ts.isLiteralExpression(node.type.literal)) {
        return { name, typeName: `'${node.type.literal.text}'`, check: `${optional}${name} === '${node.type.literal.text}'` };

    } else if (ts.isArrayTypeNode(node.type)) {
        const elementTypeName = typeLogic({type: node.type.elementType} as any).typeName;
        const elementCheck = typeCheck(node.type.elementType);

        return {
            name, typeName: `Array<${elementTypeName}>`,
            check: `${optional}(Array.isArray(${name}) && ${name}.every(${elementCheck}))`
        };

    } else if (ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName)) {
        const typeName = node.type.typeName.escapedText as string;
        return {
            name,
            typeName,
            check: `${optional}is${typeName}(${name})`
        };

    } else if (ts.isUnionTypeNode(node.type)) {
        const l = node.type.types.map(t => typeLogic({type: t} as any, name));
        const check = l.map(t => t.check).join(' || ');
        return {
            name,
            typeName: l.map(t => t.typeName).join(' | '),
            check: `(${check})`
        };

    } else if(ts.isParenthesizedTypeNode(node.type)) {
        return typeLogic({...node, type: node.type.type}, name)

    } else {
        return { name, typeName: `unhandled typeName(${SyntaxKind[node.type.kind]})`, check };
    }
};

const typeName = (typ: ts.TypeNode): string =>
    typeLogic({type: typ} as any).typeName;

const typeCheck = (typ: ts.TypeNode): string => {
    const {check, typeName} = typeLogic({type: typ} as any);
    return check ? `(x) => ${check}` : `/* unimplemented for ${typeName} */`;
};

const propertyTypeChecks = (iface: ts.InterfaceDeclaration): string =>
    iface.members
        .filter(ts.isPropertySignature)
        .map(prop => typeLogic(prop as any, propertyName(prop)))
        .map(({check}) => check)
        .join(' &&\n    ');

const propertyNames = (iface: ts.InterfaceDeclaration): string[] =>
    iface.members
        .filter(ts.isPropertySignature)
        .map(propertyName) as string[];


/** Main Visitor */
const typeGuard = (typ: ts.Node): string | undefined => {
    if (ts.isInterfaceDeclaration(typ)) {
        return interfaceGuard(typ);
    } else if (ts.isTypeAliasDeclaration(typ)) {
        const name = capitalize(typ.name.escapedText as string);
        const maybe = `maybe${name}`;

        const head = `const is${name} = (${maybe}: ${name}): ${maybe} is ${name} => `;
        const {check} = typeLogic(typ, maybe);

        return `${head}\n    ${check}`;
    } else {
        return `// `;
    }
}

const interfaceGuard = (iface: ts.InterfaceDeclaration): string => {
    const name = ifaceName(iface);
    const maybe = `maybe${capitalize(name)}`;

    const head = `export const is${name} = (${maybe}: ${name}): ${maybe} is ${name} =>`;

    const checks = propertyTypeChecks(iface);
    const properties = propertyNames(iface).join(', ');

    const destructuring = `const {${properties}} = ${maybe}`

    return `\n// generated typeguard for ${name}\n${head} {\n    ${destructuring};\n\n    return ${checks};\n}\n\n`;
};

const guards: string[] = [];

const openFile = (path: string): string => fs.readFileSync(path, 'utf8');

const source = openFile('./test/example-types.ts');
const fakeFile = ts.createSourceFile('x.ts', source, ts.ScriptTarget.Latest, true);

ts.forEachChild(fakeFile, node => {
    if (ts.isInterfaceDeclaration(node) || ts.isTypeAliasDeclaration(node)) {
        guards.push(typeGuard(node));
    }
});

console.log('// ---------------- Result ----------------');
console.log(`import {Foo, Bar, Foobar, Direction} from './test/example-types';`);

console.log('// ----------- Interface Guards -----------');
guards.forEach(code => console.log(code));