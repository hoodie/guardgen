import { Console } from "console";

export const comment = (...x: any[]) => logger.log.apply(console, [`//`].concat(x) as any);

const utilLogger = new Console({ stdout: process.stderr, stderr: process.stderr });
const dumpLogger = {
    log(...args: any) { },
    info(...args: any) { },
    dir(...args: any) { },
    table(...args: any) { },
    debug(...args: any) { },
    trace(...args: any) { },
    warn(...args: any) { },
    error(...args: any) { },
};

const loggerSettings = { on: false }
export let logger = dumpLogger;
export const toggleLogger = (on: boolean) => {
    loggerSettings.on = on;
    logger = on ? utilLogger : dumpLogger;
}

export const dir = (x: any) => logger.dir(x, { colors: true, depth: 4 });

export const odir = (x: any) =>
    loggerSettings.on &&
    dir(
        JSON.parse(
            JSON.stringify(x, (k, v) => {
                if (k !== 'parent') {
                    return v;
                }
            })
        )
    );

export const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1);
