export const VERSION='1.0.0';
export const LIMITS={steps:80,bytes:6_000_000,image:500_000};
export const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const validID=s=>typeof s==='string'&&/^[a-zA-Z0-9_-]{1,64}$/.test(s);
export function inspect(g,{draft=false}={}){
 const errors=[];const fail=s=>errors.push(s);
 if(!g||g.schema!=='relay-guide/1')return {ok:false,errors:['This is not a Relay guide (relay-guide/1).']};
 if(!validID(g.id))fail('The guide needs a valid ID.');
 for(const [key,max,required] of [['title',120,true],['description',600,false]])if(typeof g[key]!=='string'||g[key].length>max||(required&&!draft&&!g[key].trim()))fail(`Guide ${key} must be ${required?'1–':'0–'}${max} characters.`);
 if(!Array.isArray(g.steps)||g.steps.length<1||g.steps.length>LIMITS.steps)return {ok:false,errors:[...errors,'Use between 1 and 80 steps.']};
 const ids=new Set();
 for(const [i,s] of Array.from(g.steps).entries()){
  const name=`Step ${i+1}`;
  if(!s||!validID(s.id)){fail(`${name} needs a valid ID.`);continue;}
  if(ids.has(s.id))fail(`${name} has a duplicate ID.`);ids.add(s.id);
  if(!['action','decision','end'].includes(s.type))fail(`${name} has an unknown type.`);
  for(const [key,max,required] of [['title',160,true],['body',3000,false],['alt',240,false]])if(typeof s[key]!=='string'||s[key].length>max||(required&&!draft&&!s[key].trim()))fail(`${name}: ${key} must be ${required?'1–':'0–'}${max} characters.`);
  if(typeof s.image!=='string'||s.image.length>LIMITS.image||(s.image&&!/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/.test(s.image)))fail(`${name}: use a PNG, JPEG, or WebP image under 500 KB.`);
  if(!draft&&s.image&&!s.alt?.trim())fail(`${name}: describe the image for someone who cannot see it.`);
  if(!Array.isArray(s.choices)){fail(`${name} needs a choices array.`);continue;}
  const count=s.choices.length;
  if((s.type==='action'&&count!==1)||(s.type==='decision'&&(count<2||count>4))||(s.type==='end'&&count!==0))fail(`${name}: an action needs one destination, a question needs 2–4, and an ending needs none.`);
  for(const c of Array.from(s.choices))if(!c||typeof c.label!=='string'||(!draft&&!c.label.trim())||c.label.length>100||(!validID(c.to)&&!(draft&&c.to==='')))fail(`${name}: give every choice a label and destination.`);
 }
 if(new TextEncoder().encode(JSON.stringify(g)).length>LIMITS.bytes)fail('Guide is too large. Keep text and photos below 6 MB.');
 if(errors.length)return {ok:false,errors};
 if(draft)return {ok:true,errors:[]};
 if(!ids.has(g.start))fail('Choose an existing first step.');
 for(const s of g.steps)for(const c of s.choices)if(!ids.has(c.to))fail(`“${s.title}” points to a missing step.`);
 if(errors.length)return {ok:false,errors};
 const map=new Map(g.steps.map(s=>[s.id,s])),seen=new Set(),active=new Set();let cycle=false;
 function walk(id){if(active.has(id)){cycle=true;return;}if(seen.has(id))return;seen.add(id);active.add(id);for(const c of map.get(id).choices)walk(c.to);active.delete(id);}
 walk(g.start);
 if(cycle)fail('A path loops back on itself. Give each path a clear ending.');
 for(const s of g.steps)if(!seen.has(s.id))fail(`“${s.title}” cannot be reached from the first step.`);
 return {ok:!errors.length,errors,steps:g.steps.length,endings:g.steps.filter(s=>s.type==='end').length};
}
export function cleanGuide(raw,options){
 const result=inspect(raw,options);if(!result.ok)throw Error(result.errors.join('\n'));
 return {schema:'relay-guide/1',id:raw.id,title:raw.title,description:raw.description,start:raw.start,steps:raw.steps.map(s=>({id:s.id,type:s.type,title:s.title,body:s.body,image:s.image,alt:s.alt,choices:s.choices.map(c=>({label:c.label,to:c.to}))}))};
}
export function parseGuide(text,options){if(typeof text!=='string'||new TextEncoder().encode(text).length>LIMITS.bytes)throw Error('Guide file is too large (6 MB maximum).');return cleanGuide(JSON.parse(text),options);}
export function createRun(raw){const guide=cleanGuide(raw);return {guide,path:[{id:guide.start,note:'',choice:null}],started_at:new Date().toISOString(),finished_at:null};}
export function advanceRun(run,index,note=''){
 const current=run.guide.steps.find(s=>s.id===run.path.at(-1).id);if(!Number.isInteger(index)||!current.choices[index])throw Error('Choose an available answer.');
 if(typeof note!=='string'||note.length>1000)throw Error('Keep notes under 1,000 characters.');
 const next=structuredClone(run);next.path.at(-1).note=note;next.path.at(-1).choice=index;next.path.push({id:current.choices[index].to,note:'',choice:null});next.finished_at=null;return next;
}
export function backRun(run){if(run.path.length===1)return structuredClone(run);const next=structuredClone(run);next.path.pop();next.path.at(-1).choice=null;next.finished_at=null;return next;}
export async function revision(guide){const bytes=new TextEncoder().encode(JSON.stringify(cleanGuide(guide)));return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(v=>v.toString(16).padStart(2,'0')).join('');}
export function receipt(run,hash){return {schema:'relay-receipt/1',guide_title:run.guide.title,guide_id:run.guide.id,revision_sha256:hash,started_at:run.started_at,finished_at:run.finished_at,path:run.path.map(p=>{const s=run.guide.steps.find(s=>s.id===p.id);return {step_id:p.id,title:s.title,answer:p.choice===null?null:s.choices[p.choice].label,note:p.note};}),scope:'Self-reported walkthrough. This records choices, not independently verified work.'};}
export function safeJSON(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
export function standaloneHTML(guide,hash,runtime,style){
 const clean=cleanGuide(guide);
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; base-uri 'none'; form-action 'none'"><title>${escapeHTML(clean.title)} · Relay</title><style>${style.replace(/<\/style/gi,'<\\/style')}</style></head><body class="offline"><header class="offline-head"><b>relay<span>↗</span></b><span>Offline guide · saved copy</span></header><main id="offline-player"></main><script>${runtime.replace(/<\/script/gi,'<\\/script')}\nmountPlayer(document.querySelector('#offline-player'),${safeJSON(clean)},${safeJSON(hash)});</script></body></html>`;
}
