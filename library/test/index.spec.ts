import "jest"
import { generateFrom } from "../src";
import path from 'path';
import ts, { isAssertionExpression } from "typescript";
import { generateGuards } from "../src/guards";

const fixture1 = 'example-types.ts';
const fixturePath = (s: string) => path.join(path.join(path.normalize(__dirname), 'fixtures', s));

describe("generator", () => {
    it("generates the same code as yesterday without warnings", () => {
        const generated = generateFrom(fixturePath(fixture1), {
            embedWarnings: false
        });
        expect(JSON.stringify(generated)).toMatchSnapshot();
    });

    it("generates the same code as yesterday with warnings", () => {
        const generated = generateFrom(fixturePath(fixture1), {
            embedWarnings: true
        });
        expect(JSON.stringify(generated)).toMatchSnapshot();
    });

    it("generated code with warnings compiles", () => {
        const generated = generateFrom(fixturePath(fixture1), { embedWarnings: true });
        const sourceFile = ts.createSourceFile(
            "module.ts",
            generated.guards.join('\n'),
            ts.ScriptTarget.ES2019,
            false,
        );
        expect((sourceFile as any).parseDiagnostics).toHaveLength(0)
    });
});