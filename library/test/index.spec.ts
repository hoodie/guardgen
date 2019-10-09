import "jest"
import { generateFrom } from "../src";

describe('generator', () => {
    it('generates the same code as yesterday without warnings', () => {
        const generated = generateFrom('./test/fixtures/example-types.ts', {embedWarnings: false});
        expect(JSON.stringify(generated)).toMatchSnapshot()

    })
    it('generates the same code as yesterday with warnings', () => {
        const generated = generateFrom('./test/fixtures/example-types.ts', {embedWarnings: true});
        expect(JSON.stringify(generated)).toMatchSnapshot()

    })
});