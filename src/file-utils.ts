import { existsSync, statSync } from 'fs';
import { basename, dirname, join, relative } from 'path';
import { comment } from './utils';

const dtsBasename = (inputFile: string): string =>
    basename(basename(inputFile, '.d.ts'), '.ts');

const makePathImportable = (tsPath: string): string => {
    const importFilePath = join(dirname(tsPath), dtsBasename(tsPath));
    if (importFilePath.startsWith('../')) {
        return importFilePath;
    } else {
        return `./${importFilePath}`;
    }
};

const guardFileName = (inputFile: string): string =>
    dtsBasename(inputFile) + '.guards.ts';



// where does the outfile find the inputFile
export const importPath = (inputFile: string, outfile: string): string =>
    makePathImportable(relative(dirname(outfile), inputFile));

// if no outfile path is given
export const derivedOutfilePath = (inputFile: string): string =>
    join(dirname(inputFile), guardFileName(inputFile));

// if outfile path is either a dir or a file
export const outfilePath = (inputFile: string, targetPath: string): string => {
    if (existsSync(targetPath) && statSync(targetPath).isDirectory()) {
        return join(targetPath, guardFileName(inputFile));
    } else {
        return targetPath;
    }
};
