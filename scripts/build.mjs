import {readFile,writeFile} from 'node:fs/promises';
const core=(await readFile('public/core.mjs','utf8')).replace(/^export /gm,'');
const player=(await readFile('public/player.mjs','utf8')).replace(/^import .*?;\n/,'').replace(/^export /gm,'');
await writeFile('public/offline-runtime.txt',core+'\n'+player);
console.log('Built self-contained offline runtime.');
