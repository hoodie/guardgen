import ts, { TsConfigSourceFile, LiteralExpression, TypeFlags, TypeReferenceNode } from 'typescript';
import { SyntaxKind } from 'typescript';
import { odir, comment, dir } from './utils';

export interface NodeInfo  {
    name: string,
    valueCheck: string,
    typeName: string,
    isOptional: boolean
}

interface Context<T extends ts.Node> extends NodeInfo {
    node: T
    exportedSymbols: string[]
}

type VisitorContext = Context<ts.Node & HasType>;

export const isExported = (node: ts.Statement) =>
    node.modifiers && node.modifiers.some(
        ({ kind }) => kind === SyntaxKind.ExportKeyword
    );


type HasType = {type: ts.TypeNode};

const hasType = (node: any): node is HasType =>
    node.type && ts.isTypeNode(node.type);

interface Visitor {
    (ctx: VisitorContext): NodeInfo;
}

const typeCheck = (typ: ts.TypeNode): string => {
    const {valueCheck, typeName} = visitNode({node: {type: typ} as any});
    return valueCheck ? `(x) => ${valueCheck}` : `/* unimplemented for ${typeName} */`;
};

const kindName = (kind: SyntaxKind) => SyntaxKind[kind];
const flagName = (flag: TypeFlags) => TypeFlags[flag];

// string, number, object
const toNodeInfo: Visitor = ({name, typeName, valueCheck, isOptional}: VisitorContext): NodeInfo =>
    ({ name, typeName, valueCheck, isOptional });

// string, number, object
const visitPrimitive: Visitor = ({name, typeName, isOptional}: VisitorContext): NodeInfo =>
    ({ name, typeName, valueCheck: `typeof ${name} === '${typeName}'`, isOptional });

// rootVisitor
export function visitNode({ node, name, exportedSymbols }: Partial<VisitorContext>): NodeInfo {
    if (!hasType(node)) throw new Error("only TypeNodes allowed");

    const baseContext = {
        name: name || 'x',
        node,
        valueCheck: `true /* unimplemented for ${SyntaxKind[node.type.kind]} "${name}" */`,
        isOptional: !!((node as any).questionToken),
        exportedSymbols: exportedSymbols || []
    }

    if (node.type.kind === SyntaxKind.NumberKeyword) {
        // odir({baseContext})
        return visitPrimitive({ ...baseContext, typeName: 'number' })

    } else if (node.type.kind === SyntaxKind.StringKeyword) {
        return visitPrimitive({ ...baseContext, typeName: 'string' })

    } else if (node.type.kind === SyntaxKind.ObjectKeyword) {
        return visitPrimitive({ ...baseContext, typeName: "object" });

    } else if (node.type.kind === SyntaxKind.AnyKeyword) {
        return toNodeInfo({ ...baseContext, typeName: 'any', valueCheck: `true` });

    } else if (ts.isLiteralTypeNode(node.type) && ts.isLiteralExpression(node.type.literal)) {
        return toNodeInfo({
          ...baseContext,
          typeName: `'${node.type.literal.text}'`,
          valueCheck: `${name} === '${ node.type.literal.text }'`,
        });

    } else if (ts.isArrayTypeNode(node.type)) {
        const elementTypeName = visitNode({node: {type: node.type.elementType} as any}).typeName;
        const elementCheck = typeCheck(node.type.elementType);

        return toNodeInfo({
            ...baseContext,
            typeName: `Array<${elementTypeName}>`,
            valueCheck: `(Array.isArray(${name}) && ${name}.every(${elementCheck}))`,
        });

    } else if (ts.isTypeReferenceNode(node.type) && ts.isIdentifier(node.type.typeName)) {
        const typeName = node.type.typeName.escapedText as string;
        const exported = exportedSymbols && exportedSymbols.includes(typeName)
        const valueCheck = exported ? `is${typeName}(${name})` : `true /* skipping private ${name}: ${typeName}*/`;

        return toNodeInfo({
            ...baseContext,
            typeName,
            valueCheck
        });

    } else if (ts.isUnionTypeNode(node.type)) {
        const l = node.type.types.map(t =>
          visitNode({ ...baseContext, node: { type: t } as any })
        );
        const check = l.map(t => t.valueCheck).join(' || ');
        return toNodeInfo({
            ...baseContext,
            typeName: l.map(t => t.typeName).join(' | '),
            valueCheck: `(${check})`,
        });

    } else if(ts.isParenthesizedTypeNode(node.type)) {
        const newNode = { ...node, type: node.type.type };
        return visitNode({...baseContext, node: newNode})

    } else {
        return toNodeInfo({
            ...baseContext,
            typeName: `unhandled typeName(${SyntaxKind[node.type.kind]})`,
            valueCheck: baseContext.valueCheck,
        });
    }
};