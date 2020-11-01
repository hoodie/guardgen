import ts, { SyntaxKind } from 'typescript';
import { logger, odir } from './utils';

export interface NodeInfo {
    name: string;
    valueCheck: string;
    typeName: string;
    typeArguments?: ts.NodeArray<ts.TypeNode>;
    isOptional: boolean;
}

interface Context<T extends ts.Node> extends NodeInfo {
    node: T;
    exportedSymbols: string[];
}

type VisitorContext = Context<ts.Node & HasType>;

export const isExported = (node: ts.Statement) => node.modifiers?.some(({ kind }) => kind === SyntaxKind.ExportKeyword);

interface HasType {
    type: ts.TypeNode;
}

const hasType = (node: any): node is HasType => node.type && ts.isTypeNode(node.type);

type Visitor = (ctx: VisitorContext) => NodeInfo;

const typeCheck = (typ: ts.TypeNode): string => {
    const { valueCheck, typeName } = visitNode({ node: { type: typ } as any });
    return valueCheck ? `(x) => ${valueCheck}` : `/* unimplemented for ${typeName} */`;
};

export const tryName = (node: ts.Node & any) => node.name.escapedText || node.name;

const debugNode = (node: ts.Node & HasType) => {
    const info = {
        type: ts.SyntaxKind[node.type.kind],
        name: tryName(node),
        kind: ts.SyntaxKind[node.kind],
    };
    logger.log(`🔑 ${info.kind} '${info.name}' = ${info.type}`);
    // odir(node)
};

// string, number, object
const toNodeInfo: Visitor = ({ name, typeName, typeArguments, valueCheck, isOptional }: VisitorContext): NodeInfo => ({
    name,
    typeName,
    typeArguments,
    valueCheck,
    isOptional,
});

// string, number, object
const visitPrimitive: Visitor = ({ name, typeName, typeArguments, isOptional }: VisitorContext): NodeInfo => ({
    name,
    // name: (logger.debug('    visitPrimitive', typeName), name),
    typeName,
    typeArguments,
    valueCheck: `typeof ${name} === '${typeName}'`,
    isOptional,
});

// rootVisitor
export function visitNode({ node, name, exportedSymbols }: Partial<VisitorContext>): NodeInfo {
    logger.debug('  visitNode');
    if (!hasType(node)) {
        throw new Error('only TypeNodes allowed');
    }

    const ctx = {
        name: name || 'x',
        node,
        typeArguments: ((node as any) as ts.NodeWithTypeArguments).typeArguments,
        valueCheck: `true /* unimplemented for ${SyntaxKind[node.type.kind]} "${name}" */`,
        isOptional: !!(node as any).questionToken,
        exportedSymbols: exportedSymbols || [],
    };

    debugNode(node);

    if (node.type.kind === SyntaxKind.NumberKeyword) {
        return visitPrimitive({ ...ctx, typeName: 'number' });
    } else if (node.type.kind === SyntaxKind.StringKeyword) {
        return visitPrimitive({ ...ctx, typeName: 'string' });
    } else if (node.type.kind === SyntaxKind.ObjectKeyword) {
        return visitPrimitive({ ...ctx, typeName: 'object' });
    } else if (node.type.kind === SyntaxKind.AnyKeyword) {
        return toNodeInfo({ ...ctx, typeName: 'any', valueCheck: `true` });
    } else if (ts.isLiteralTypeNode(node.type) && ts.isLiteralExpression(node.type.literal)) {
        return toNodeInfo({
            ...ctx,
            typeName: `'${node.type.literal.text}'`,
            valueCheck: `${name} === '${node.type.literal.text}'`,
        });
    } else if (ts.isArrayTypeNode(node.type)) {
        const elementTypeName = visitNode({
            node: { type: node.type.elementType } as any,
        }).typeName;
        const elementCheck = typeCheck(node.type.elementType);

        return toNodeInfo({
            ...ctx,
            typeName: `Array<${elementTypeName}>`,
            valueCheck: `(Array.isArray(${name}) && ${name}.every(${elementCheck}))`,
        });
    } else if (ts.isMappedTypeNode(node.type)) {
        logger.debug('🤯');
        odir(node);
        throw new Error('unhandled case: typereference without identifier');
    } else if (ts.isTypeReferenceNode(node.type)) {
        if (ts.isIdentifier(node.type.typeName)) {
            const typeName = node.type.typeName.escapedText as string;
            const exported = exportedSymbols?.includes(typeName);
            const preCheck = ctx.isOptional ? `${name} && ` : ''; // because a || doesn't cut it
            const valueCheck = exported ? `${preCheck}is${typeName}(${name})` : `true /* ${name}: ${typeName}*/`;

            logger.debug('🤔', {
                isExpressionWithTypeArguments: ts.isExpressionWithTypeArguments(node),
                info: toNodeInfo({
                    ...ctx,
                    typeName,
                    typeArguments: node.type.typeArguments,
                    valueCheck,
                }),
            });
            odir(node);
            return toNodeInfo({
                ...ctx,
                typeName,
                typeArguments: node.type.typeArguments,
                valueCheck,
            });
        } else {
            throw new Error('unhandled case: typereference without identifier');
        }
    } else if (ts.isUnionTypeNode(node.type)) {
        const l = node.type.types.map((t) => visitNode({ ...ctx, node: { type: t } as any }));
        const check = l.map((t) => t.valueCheck).join(' || ');
        return toNodeInfo({
            ...ctx,
            typeName: l.map((t) => t.typeName).join(' | '),
            valueCheck: `(${check})`,
        });
    } else if (ts.isParenthesizedTypeNode(node.type)) {
        const newNode = { ...node, type: node.type.type };
        return visitNode({ ...ctx, node: newNode });
    } else if (ts.isPropertySignature(node) && ts.isFunctionTypeNode(node.type) && ts.isIdentifier(node.name)) {
        const { valueCheck } = visitPrimitive({ ...ctx, typeName: 'function' });
        return toNodeInfo({
            ...ctx,
            typeName: `unhandled typeName(${SyntaxKind[node.type.kind]})`,
            valueCheck: `${valueCheck} && (name.length >= ${node.type.parameters.length})`,
        });
    } else {
        return toNodeInfo({
            ...ctx,
            typeName: `unhandled typeName(${SyntaxKind[node.type.kind]})`,
            valueCheck: ctx.valueCheck,
        });
    }
}
