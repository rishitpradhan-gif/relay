#!/usr/bin/env node
import {readFile,writeFile} from 'node:fs/promises';import {fileURLToPath} from 'node:url';
import {parseGuide,inspect,revision,standaloneHTML} from './public/core.mjs';
const [command,input,output]=process.argv.slice(2);
try{
 if(!['check','export'].includes(command)||!input||(command==='export'&&!output))throw Error('Usage: node cli.mjs check guide.json\n       node cli.mjs export guide.json guide.html');
 const guide=parseGuide(await readFile(input,'utf8')),hash=await revision(guide);
 if(command==='check')console.log(JSON.stringify({...inspect(guide),revision_sha256:hash},null,2));
 else{const runtime=await readFile(fileURLToPath(new URL('./public/offline-runtime.txt',import.meta.url)),'utf8'),style=await readFile(fileURLToPath(new URL('./public/reader.css',import.meta.url)),'utf8');await writeFile(output,standaloneHTML(guide,hash,runtime,style),{flag:'wx'});console.log(`Wrote ${output} (${hash.slice(0,12)})`);}
}catch(error){console.error(error.message);process.exitCode=1;}
