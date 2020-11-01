#!/usr/bin/env node
import program from 'commander';
import * as fs from 'fs';
import { importPath, outfilePath } from './file-utils';

import { generateFrom, Generated, logger, toggleLogger } from 'guardgen-lib';

const error = (message: string) => console.error(`ERROR: ${message}`);

const printGuards = (generated: Generated) => console.log(concatGuards(generated));

const concatGuards = ({ imports, guards }: Generated): string => [imports].concat(guards).join('\n');

const writeGuardsFile = (generated: Generated, path: string) =>
    fs.writeFileSync(path, concatGuards(generated), { encoding: 'utf8' });

program
    .version('0.1.0')
    .name('guardner')
    .command('generate [FILE]')
    .alias('gen')
    .description('generate guards from given ts file')
    .option('-w, --warners', 'embed code that produces warnings')
    .option('-d, --debug', 'print some internals for pros')
    .option('-g, --guardsfile', 'put a .guards.ts file next to your input')
    .option('-o, --outfile [FILE]', 'path to file to generate')
    .action((inputFile: string, { warners, outfile, debug }) => {
        toggleLogger(debug);
        logger.dir({ inputFile, warners, debug, outfile });
        const embedWarnings = !!warners;
        if (inputFile) {
            if (outfile) {
                const outputFile = outfilePath(inputFile, outfile);
                const importFrom = importPath(inputFile, outputFile);
                let generated = generateFrom(inputFile, {
                    importFrom,
                    embedWarnings,
                });
                writeGuardsFile(generated, outfile);
            } else {
                let generated = generateFrom(inputFile, { embedWarnings });
                if (!debug) printGuards(generated);
            }
        } else {
            error('please pass a typescript file to generate guards for');
        }
    });

if (!process.argv.slice(2).length) {
    program.outputHelp();
} else {
    program.parse(process.argv);
}
