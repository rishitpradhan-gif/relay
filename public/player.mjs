import {createRun,advanceRun,backRun,receipt,escapeHTML} from './core.mjs';
export function downloadFile(name,content,type='application/json'){
 const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);
}
export function mountPlayer(root,guide,hash){
 let run=createRun(guide);const e=escapeHTML;
 function render(focus=false){
  const s=run.guide.steps.find(s=>s.id===run.path.at(-1).id),terminal=s.type==='end';
  root.innerHTML=`<div class="player-shell"><aside class="journey"><span class="eyebrow">YOUR ROUTE</span><h2>${e(guide.title)}</h2><p>${e(guide.description)}</p><ol>${run.path.map((p,i)=>`<li ${i===run.path.length-1?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${e(guide.steps.find(s=>s.id===p.id).title)}</li>`).join('')}</ol><small>Only the route you choose is shown.<br>Notes stay in this tab until exported.</small></aside><article class="reader"><div class="reader-top"><span class="eyebrow">${terminal?'END OF THIS ROUTE':s.type==='decision'?'CHOOSE WHAT YOU SEE':'ONE THING AT A TIME'}</span><span class="step-number">${String(run.path.length).padStart(2,'0')}</span></div><h2 tabindex="-1">${e(s.title)}</h2>${s.image?`<img class="step-photo" src="${e(s.image)}" alt="${e(s.alt)}">`:''}<p class="instruction">${e(s.body).replace(/\n/g,'<br>')}</p><label class="run-note">Leave a note <span>optional · included in your record</span><textarea maxlength="1000" rows="2" placeholder="What should the next person know?">${e(run.path.at(-1).note)}</textarea></label><div class="reader-choices">${s.choices.map((c,i)=>`<button class="choice" data-choice="${i}">${e(c.label)} <span aria-hidden="true">↗</span></button>`).join('')}${terminal?`<button class="choice lime" data-finish>${run.finished_at?'Download record again':'Finish & download record'} <span aria-hidden="true">↓</span></button><p class="micro">A record of your answers, not proof that the work was performed.</p>`:''}</div><div class="reader-bottom"><button class="text-button" data-back ${run.path.length===1?'disabled':''}>← Previous step</button><span>Revision ${hash.slice(0,8)}</span></div><p class="reader-status" role="status"></p></article></div>`;
  const note=()=>root.querySelector('textarea').value;
  root.querySelectorAll('[data-choice]').forEach(b=>b.onclick=()=>{run=advanceRun(run,Number(b.dataset.choice),note());render(true);});
  root.querySelector('[data-back]').onclick=()=>{run=backRun(run);render(true);};
  root.querySelector('[data-finish]')?.addEventListener('click',()=>{run.path.at(-1).note=note();run.finished_at=new Date().toISOString();downloadFile('relay-walkthrough.json',JSON.stringify(receipt(run,hash),null,2));root.querySelector('.reader-status').textContent='Record downloaded. Keep it somewhere you trust.';});
  if(focus)root.querySelector('.reader h2').focus({preventScroll:true});
 }
 render();return {getRun:()=>structuredClone(run)};
}
