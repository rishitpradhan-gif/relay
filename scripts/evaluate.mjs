import assert from 'node:assert/strict';import {writeFile,readFile} from 'node:fs/promises';import {createHash} from 'node:crypto';
import {inspect,createRun,advanceRun,parseGuide,revision} from '../public/core.mjs';
let state=271828;const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
let totalSteps=0,totalRoutes=0;const records=[];
for(let seed=0;seed<100;seed++){
 const n=6+Math.floor(random()*75),steps=[];
 for(let i=0;i<n;i++){const isEnd=i===n-1,decision=!isEnd&&i<n-2&&random()<.6;const choices=isEnd?[]:[{label:'Continue',to:`s${i+1}`}];if(decision)choices.push({label:'Alternate',to:`s${i+2+Math.floor(random()*(n-i-2))}`});steps.push({id:`s${i}`,type:isEnd?'end':decision?'decision':'action',title:`Step ${i}`,body:'Generated test fixture.',image:'',alt:'',choices});}
 const guide={schema:'relay-guide/1',id:`case-${seed}`,title:'Generated route',description:'Synthetic structural test, not usability evidence.',start:'s0',steps};assert.equal(inspect(guide).ok,true);assert.deepEqual(parseGuide(JSON.stringify(guide)),guide);assert.equal(await revision(parseGuide(JSON.stringify(guide))),await revision(guide));
 let transitions=0;
 for(let trial=0;trial<10;trial++){let run=createRun(guide),oracle='s0',count=0;while(steps[Number(oracle.slice(1))].type!=='end'){const source=steps[Number(oracle.slice(1))],choice=Math.floor(random()*source.choices.length);oracle=source.choices[choice].to;run=advanceRun(run,choice);assert.equal(run.path.at(-1).id,oracle);assert.ok(++count<n);transitions++;}assert.equal(oracle,`s${n-1}`);assert.equal(new Set(run.path.map(p=>p.id)).size,run.path.length);totalRoutes++;}
 const loop=structuredClone(guide);loop.steps[n-1].type='action';loop.steps[n-1].choices=[{label:'Loop',to:'s0'}];assert.equal(inspect(loop).ok,false);
 const broken=structuredClone(guide);broken.steps[0].choices[0].to='missing';assert.equal(inspect(broken).ok,false);
 totalSteps+=transitions;records.push({case:seed,nodes:n,completed_routes:10,transitions,cycle_rejected:true,missing_destination_rejected:true});
}
const source_hashes={};for(const path of ['public/core.mjs','scripts/evaluate.mjs'])source_hashes[path]=createHash('sha256').update(await readFile(path)).digest('hex');
const report={schema:'relay-structural-evaluation/1',seed:271828,generator:'LCG 1664525/1013904223 unsigned 32-bit',graphs:100,completed_routes:totalRoutes,transitions:totalSteps,mutated_invalid_graphs_rejected:200,source_hashes,records,scope:'Deterministic generated graph tests. Covers topology and replay invariants, not real-world instruction accuracy, usability, clinical use, or security certification.'};await writeFile('docs/evaluation.json',JSON.stringify(report,null,2)+'\n');console.log(`${totalRoutes} routes; ${totalSteps} transitions; 200 invalid graphs rejected.`);
