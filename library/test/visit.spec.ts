import 'jest';
import ts from 'typescript';
import { emitGuard, publicStatements } from '../src/guards';

const buildGuardFromSource = (sourceText: string): string => {
    const source = ts.createSourceFile('x.ts', sourceText, ts.ScriptTarget.Latest, true);
    const { statements, names: exportedSymbols } = publicStatements(source);
    const node = statements[0];

    const guard = emitGuard(node, exportedSymbols, {});
    return guard;
};

describe('checks for aliases', () => {
    describe('primitive types', () => {
        ['number', 'string', 'object', 'any'].forEach((primitiveType) => {
            it(`alias of ${primitiveType}`, () => {
                const guard = buildGuardFromSource(`export type MyType = ${primitiveType};`);
                expect(guard).toMatchSnapshot();
            });

            xit(`array of ${primitiveType}`, () => {
                const source = `export type MyType = Array<${primitiveType}>;`;
                const guard = buildGuardFromSource(source);
                expect(guard).toMatchSnapshot();
            });
        });
    });
});

describe('checks for interface properies', () => {
    describe('properties with primitive types', () => {
        ['number', 'string', 'object', 'any'].forEach((primitiveType) => {
            it(`alias of ${primitiveType}`, () => {
                const source = `export interface MyType {
                    fieldA: ${primitiveType};
                    fieldB: ${primitiveType};
                };`;
                const guard = buildGuardFromSource(source);
                expect(guard).toMatchSnapshot();
            });
        });
    });
});
