export const comment = (...x: any[]) => console.log.apply(console, [`//`].concat(x));
export const dir = (x : any) => console.dir(x, { colors: true, depth: 4 });
export const odir = (x : any) => dir(JSON.parse(JSON.stringify(x, (k, v) => { if (k !== 'parent') { return v } })));
export const capitalize = (s: string): string => s[0].toUpperCase() + s.slice(1);