import ts, { TsConfigSourceFile } from 'typescript';
import { SyntaxKind } from 'typescript';

export interface NodeInfo {
    name: string,
    typeName: string,
    guardName?: string,
    check: string,
}

interface VisitContext {
    name: string,
    optional: boolean,
    defaultCheck: string
}

type HasType = {type: ts.TypeNode};

const hasType = (node: any): node is HasType =>
    node.type && ts.isTypeNode(node.type);

interface Visitor<T extends ts.Node> {
    (node: T): NodeInfo;
}

const typeCheck = (typ: ts.TypeNode): string => {
    const {check, typeName} = visitNode({type: typ} as any);
    return check ? `(x) => ${check}` : `/* unimplemented for ${typeName} */`;
};

// export const visitLiterExpression: Visitor<ts.LiteralTypeNode> = (node: ts.LiteralTypeNode) =>
//     ({
//         name,
//         typeName: `'${node.type.literal.text}'`,
//         check: `${optional}${name} === '${node.type.literal.text}'`
//     });

export function visitNode(node: ts.Node & HasType, name = 'x'): NodeInfo {
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
        const elementTypeName = visitNode({type: node.type.elementType} as any).typeName;
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
        const l = node.type.types.map(t => visitNode({type: t} as any, name));
        const check = l.map(t => t.check).join(' || ');
        return {
            name,
            typeName: l.map(t => t.typeName).join(' | '),
            check: `(${check})`
        };

    } else if(ts.isParenthesizedTypeNode(node.type)) {
        return visitNode({...node, type: node.type.type}, name)

    } else {
        return { name, typeName: `unhandled typeName(${SyntaxKind[node.type.kind]})`, check };
    }
};