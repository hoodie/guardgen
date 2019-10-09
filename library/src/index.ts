import * as fs from 'fs';
import ts from 'typescript';
import { generateGuards, generateImportLine, GeneratorConfig } from './guards';

const openFile = (path: string): string => fs.readFileSync(path, 'utf8');
const error = (message: string) => console.error(`ERROR: ${message}`);

export interface Generated {
    imports?: string;
    guards: string[];
}

export function generateFrom(sourceFilePath: string, config: GeneratorConfig): Generated {
    const sourceText = openFile(sourceFilePath);
    const sourceFile = ts.createSourceFile(
        'x.ts',
        sourceText,
        ts.ScriptTarget.Latest,
        true
    );

    const { importFrom } = config;
    const imports = importFrom && generateImportLine(sourceFile, importFrom);
    const guards = generateGuards(sourceFile, config);

    return { imports, guards };
}

const printGuards = (generated: Generated) =>
    console.log(concatGuards(generated));

const concatGuards = ({ imports, guards }: Generated): string =>
    [imports].concat(guards).join('\n');

const writeGuardsFile = (generated: Generated, path: string) =>
    fs.writeFileSync(path, concatGuards(generated), { encoding: 'utf8' });

    /*
programm
    .version('0.1.0')
    .name('guardner')
    .command('generate [FILE]')
    .alias('gen')
    .description('generate guards from given ts file')
    .option('-w, --warners', 'embed code that produces warnings')
    .option('-g, --guardsfile', 'put a .guards.ts file next to your input')
    .option('-o, --outfile [FILE]', 'path to file to generate')
    .action((inputFile, { warners, outfile }) => {
        const embedWarnings = !!warners;
        if (!!inputFile) {
            const outputFile = outfilePath(inputFile, outfile);

            let generated: Generated;

            if (outfile) {
                const importFrom = importPath(inputFile, outputFile);
                generated = generateFrom(inputFile, {
                  importFrom,
                  embedWarnings
                });
                writeGuardsFile(generated, outfile);
            } else {
                generated = generateFrom(inputFile, { embedWarnings });
                printGuards(generated);
            }

        } else {
            error('please pass a typescript file to generate guards for');
        }
    });


if (!process.argv.slice(2).length) {
    programm.outputHelp();

} else {
    programm.parse(process.argv);

}

*/