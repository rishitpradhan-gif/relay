import {inspect,cleanGuide,parseGuide,revision,standaloneHTML,escapeHTML,LIMITS} from './core.mjs';
import {examples,blankGuide} from './examples.mjs';
import {mountPlayer,downloadFile} from './player.mjs';
const $=s=>document.querySelector(s),e=escapeHTML;
let guides=[],activeId='',stepId='',db=null,pending=0,saveSequence=0,saveFailed=false,playerGuide=null,playerHash='',toastTimer;
function toast(text){$('#toast').textContent=text;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,6000);}
function current(){return guides.find(g=>g.id===activeId);}
function selected(){return current()?.steps.find(s=>s.id===stepId);}
async function openDB(){return new Promise((resolve,reject)=>{const q=indexedDB.open('relay-guides',1);q.onupgradeneeded=()=>q.result.createObjectStore('library');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);q.onblocked=()=>reject(Error('Close another Relay tab to finish opening local storage.'));});}
async function loadLibrary(){return new Promise((resolve,reject)=>{const q=db.transaction('library').objectStore('library').get('guides');q.onsuccess=()=>resolve(q.result);q.onerror=()=>reject(q.error);});}
async function save(){
 const seq=++saveSequence;pending++;$('#save-state').textContent='Saving on this device…';
 try{if(!db)throw Error('Storage unavailable');const snapshot=structuredClone(guides);await new Promise((resolve,reject)=>{const tx=db.transaction('library','readwrite');tx.objectStore('library').put(snapshot,'guides');tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Save interrupted'));});if(seq===saveSequence){saveFailed=false;$('#save-state').textContent='Saved on this device';}}
 catch{saveFailed=true;$('#save-state').textContent='Not saved — download a backup';toast('Local saving is unavailable. Download a JSON backup before leaving.');}finally{pending--;}
}
window.addEventListener('beforeunload',event=>{if(pending||saveFailed){event.preventDefault();event.returnValue='';}});
function library(){
 $('#library').innerHTML=guides.length?guides.map(g=>`<button data-guide="${e(g.id)}" aria-pressed="${g.id===activeId}"><strong>${e(g.title||'Untitled guide')}</strong><small>${g.steps.length} STEPS · ${inspect(g).ok?'READY TO TRY':'DRAFT'}</small></button>`).join(''):'<p class="empty-library">Your workbench is empty. Start a guide or import a backup.</p>';
 $('#library').querySelectorAll('[data-guide]').forEach(b=>b.onclick=()=>{activeId=b.dataset.guide;stepId=current().start;renderEditor();});
}
function options(chosen){return current().steps.map((s,i)=>`<option value="${e(s.id)}" ${s.id===chosen?'selected':''}>${i+1}. ${e(s.title||'Untitled')}</option>`).join('');}
function updateCheck(){
 const g=current();if(!g)return;const check=inspect(g);$('#check-title').textContent=check.ok?'All paths lead somewhere.':'A few things to connect.';
 $('#check-results').innerHTML=check.ok?`<p>${check.steps} steps. ${check.endings} ending${check.endings===1?'':'s'}. No broken links or loops.</p><p>Try the guide yourself, then ask someone new to follow it.</p>`:`<ul>${check.errors.map(x=>`<li>${e(x)}</li>`).join('')}</ul>`;
 $('#preview').disabled=!check.ok;$('#offline').disabled=!check.ok;
 $('#route-map').innerHTML=g.steps.map((s,i)=>`<div class="route-entry"><strong>${String(i+1).padStart(2,'0')} ${e(s.title||'Untitled')}</strong>${s.choices.length?s.choices.map(c=>`<span>${e(c.label||'Unnamed answer')} → ${e(g.steps.find(n=>n.id===c.to)?.title||'Missing step')}</span>`).join(''):'<span>■ End of this route</span>'}</div>`).join('');
 $('#editing-title').textContent=g.title||'Untitled guide';library();
}
function outline(){const g=current();$('#step-list').innerHTML=g.steps.map((s,i)=>`<button data-step="${e(s.id)}" ${s.id===stepId?'aria-current="step"':''}><span>${String(i+1).padStart(2,'0')}</span>${e(s.title||'Untitled step')}</button>`).join('');$('#step-list').querySelectorAll('button').forEach(b=>b.onclick=()=>{stepId=b.dataset.step;renderStep();outline();});$('#guide-start').innerHTML=options(g.start);}
function changed(){updateCheck();outline();void save();}
function renderEditor(){library();$('#editor').hidden=!current();if(!current())return;const g=current();if(!selected())stepId=g.steps[0].id;$('#guide-title').value=g.title;$('#guide-description').value=g.description;outline();renderStep();updateCheck();}
function renderStep(){const s=selected(),g=current();if(!s)return;$('#edit-number').textContent=`STEP ${String(g.steps.indexOf(s)+1).padStart(2,'0')}`;$('#step-type').value=s.type;$('#step-title').value=s.title;$('#step-body').value=s.body;$('#step-alt').value=s.alt;$('#photo-preview').innerHTML=s.image?`<img src="${e(s.image)}" alt="${e(s.alt||'Attached photo')}">`:'';$('#alt-label').hidden=!s.image;$('#remove-photo').hidden=!s.image;$('#photo-file').value='';$('#delete-step').disabled=g.steps.length===1;$('#move-up').disabled=g.steps.indexOf(s)===0;$('#move-down').disabled=g.steps.indexOf(s)===g.steps.length-1;renderChoices();}
function renderChoices(){const s=selected();$('#choices-label').textContent=s.type==='end'?'This route ends here.':s.type==='decision'?'Answers & destinations':'Where next?';$('#add-choice').hidden=s.type!=='decision'||s.choices.length>=4;$('#choices-editor').innerHTML=s.choices.map((c,i)=>`<div class="choice-edit"><label>${s.type==='decision'?'Answer':'Button label'}<input maxlength="100" data-label="${i}" value="${e(c.label)}"></label><label>Go to<select data-destination="${i}"><option value="" ${!current().steps.some(n=>n.id===c.to)?'selected':''}>Choose a step</option>${options(c.to)}</select></label><button data-remove-choice="${i}" aria-label="Remove answer ${i+1}" ${s.type!=='decision'||s.choices.length<=2?'disabled':''}>×</button></div>`).join('');
 $('#choices-editor').querySelectorAll('[data-label]').forEach(input=>input.oninput=()=>{selected().choices[Number(input.dataset.label)].label=input.value;changed();});
 $('#choices-editor').querySelectorAll('[data-destination]').forEach(input=>input.onchange=()=>{selected().choices[Number(input.dataset.destination)].to=input.value;changed();});
 $('#choices-editor').querySelectorAll('[data-remove-choice]').forEach(b=>b.onclick=()=>{selected().choices.splice(Number(b.dataset.removeChoice),1);renderChoices();changed();});
}
$('#guide-title').oninput=event=>{current().title=event.target.value;changed();};$('#guide-description').oninput=event=>{current().description=event.target.value;changed();};$('#guide-start').onchange=event=>{current().start=event.target.value;changed();};
for(const field of ['title','body','alt'])$(`#step-${field}`).oninput=event=>{selected()[field]=event.target.value;changed();};
$('#step-type').onchange=event=>{const s=selected();s.type=event.target.value;const next=current().steps[current().steps.indexOf(s)+1]?.id||'';if(s.type==='end')s.choices=[];else if(s.type==='action')s.choices=[s.choices[0]||{label:'Done',to:next}];else s.choices=[s.choices[0]||{label:'Yes',to:next},s.choices[1]||{label:'No',to:''}];renderChoices();changed();};
$('#add-choice').onclick=()=>{if(selected().choices.length<4){selected().choices.push({label:'Another answer',to:''});renderChoices();changed();}};
$('#add-step').onclick=()=>{
 const g=current(),s=selected();if(g.steps.length>=80)return toast('A guide can contain up to 80 steps.');
 const id=crypto.randomUUID(),at=g.steps.indexOf(s),target=s.type==='end'?s.id:s.choices[0]?.to||'';
 const added={id,type:'action',title:'New step',body:'',image:'',alt:'',choices:[{label:'Done',to:target}]};
 if(s.type==='end'){for(const node of g.steps)for(const choice of node.choices)if(choice.to===s.id)choice.to=id;if(g.start===s.id)g.start=id;g.steps.splice(at,0,added);}else{if(s.choices[0])s.choices[0].to=id;g.steps.splice(at+1,0,added);}
 stepId=id;renderEditor();changed();$('#step-title').focus();$('#step-title').select();
};
$('#delete-step').onclick=()=>{const g=current(),s=selected();if(g.steps.length===1||!confirm(`Delete “${s.title}”? Any links to this step will need a new destination.`))return;g.steps=g.steps.filter(n=>n.id!==s.id);if(g.start===s.id)g.start=g.steps[0].id;stepId=g.steps[0].id;renderEditor();changed();};
for(const [id,delta] of [['move-up',-1],['move-down',1]])$(`#${id}`).onclick=()=>{const g=current(),i=g.steps.findIndex(s=>s.id===stepId),j=i+delta;if(j<0||j>=g.steps.length)return;[g.steps[i],g.steps[j]]=[g.steps[j],g.steps[i]];renderEditor();changed();};
async function addGuide(g){if(guides.length>=30)return toast('This workbench holds 30 guides. Back up and delete one to make room.');guides.push(g);activeId=g.id;stepId=g.start;renderEditor();await save();location.hash='desk';}
$('#new-guide').onclick=()=>void addGuide(blankGuide());
$('#delete-guide').onclick=()=>{if(!confirm(`Delete “${current().title}” from this browser? Download a backup first if you want to keep it.`))return;guides=guides.filter(g=>g.id!==activeId);activeId=guides[0]?.id||'';stepId=current()?.start||'';renderEditor();void save();};
function filename(g,ext){return (g.title.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,60)||'relay-guide')+ext;}
$('#backup').onclick=()=>{downloadFile(filename(current(),'.json'),JSON.stringify(current(),null,2));toast('Backup downloaded. You can import this backup later, including unfinished drafts.');};
$('#import-btn').onclick=()=>$('#import-file').click();
$('#import-file').onchange=async event=>{const file=event.target.files[0];if(!file)return;try{if(file.size>LIMITS.bytes)throw Error('Guide file is too large (6 MB maximum).');const g=parseGuide(await file.text(),{draft:true});g.id=crypto.randomUUID();await addGuide(g);toast('Imported as a new guide. Existing guides were kept.');}catch(error){toast(error.message);}finally{event.target.value='';}};
$('#photo-file').onchange=async event=>{
 const file=event.target.files[0];if(!file)return;const gid=activeId,sid=stepId;
 try{if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>8_000_000)throw Error('Choose a PNG, JPEG, or WebP photo under 8 MB.');const bitmap=await createImageBitmap(file);if(bitmap.width*bitmap.height>50_000_000){bitmap.close();throw Error('This image is too large. Resize it below 50 megapixels.');}const scale=Math.min(1,1280/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));const ctx=canvas.getContext('2d');ctx.fillStyle='#fff';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);bitmap.close();let image=canvas.toDataURL('image/jpeg',.82);if(image.length>LIMITS.image)image=canvas.toDataURL('image/jpeg',.5);if(image.length>LIMITS.image)throw Error('This photo is still too detailed. Try a smaller image.');const target=guides.find(g=>g.id===gid)?.steps.find(s=>s.id===sid);if(!target)return;target.image=image;await save();if(gid===activeId&&sid===stepId){renderStep();changed();$('#step-alt').focus();}toast('Photo added. Describe what the reader should notice.');}catch(error){toast(error.message);}finally{event.target.value='';}
};
$('#remove-photo').onclick=()=>{selected().image='';selected().alt='';renderStep();changed();};
$('#offline').onclick=async()=>{const b=$('#offline');b.disabled=true;try{const g=cleanGuide(current()),hash=await revision(g);const responses=await Promise.all([fetch('offline-runtime.txt'),fetch('reader.css')]);if(responses.some(r=>!r.ok))throw Error('Could not load the offline player. Try again while online.');const [runtime,style]=await Promise.all(responses.map(r=>r.text()));downloadFile(filename(g,'.html'),standaloneHTML(g,hash,runtime,style),'text/html');toast('Offline guide downloaded. Open the HTML file in a browser to try it.');}catch(error){toast(error.message);}finally{updateCheck();}};
async function startPlayer(g){try{playerGuide=cleanGuide(g);playerHash=await revision(playerGuide);mountPlayer($('#player'),playerGuide,playerHash);location.hash='follow';}catch(error){toast(error.message);}}
$('#preview').onclick=()=>void startPlayer(current());$('#restart-player').onclick=()=>{if(confirm('Start over? Notes in this walkthrough will be cleared.'))mountPlayer($('#player'),playerGuide,playerHash);};$('#exit-player').onclick=()=>location.hash='desk';
function route(){const hash=location.hash.slice(1),desk=hash==='desk',follow=hash==='follow'&&!!playerGuide;$('#cover').hidden=desk||follow;$('#desk').hidden=!desk;$('#walkthrough').hidden=!follow;if(desk||follow||hash==='home')window.scrollTo(0,0);else if(hash&&document.getElementById(hash))document.getElementById(hash).scrollIntoView();}
window.addEventListener('hashchange',route);
document.querySelectorAll('[data-template]').forEach(b=>b.onclick=()=>{const g=structuredClone(examples.find(g=>g.id===b.dataset.template));g.id=crypto.randomUUID();void addGuide(g);});
document.querySelectorAll('[data-demo]').forEach(b=>b.onclick=()=>void startPlayer(examples[0]));
$('#demo-choices').querySelectorAll('button').forEach(b=>b.onclick=()=>{const yes=b.dataset.answer==='yes';$('#demo-title').textContent=yes?'You’re ready to present.':'Match the input.';$('#demo-body').textContent=yes?'Open your slides and check the view from the back of the room. That’s your route finished.':'On the remote, select Input or Source. Match it to the socket your cable is plugged into.';$('#demo-count').textContent='03 / 03';$('#demo-choices').hidden=true;$('#demo-reset').hidden=false;});
$('#demo-reset').onclick=()=>{$('#demo-title').innerHTML='Can you see<br>your laptop screen?';$('#demo-body').textContent='Choose an answer. The instructions change with it.';$('#demo-count').textContent='02 / 03';$('#demo-choices').hidden=false;$('#demo-reset').hidden=true;};
try{db=await openDB();const saved=await loadLibrary();if(saved!==undefined){if(!Array.isArray(saved)||saved.some(g=>!g||!Array.isArray(g.steps)||!g.steps.length||g.steps.some(s=>!s||!Array.isArray(s.choices))))throw Error('Stored guides could not be read.');guides=saved.map(g=>cleanGuide(g,{draft:true}));}else{guides=structuredClone(examples);await save();}$('#save-state').textContent='Saved on this device';}catch{db=null;guides=structuredClone(examples);saveFailed=true;$('#save-state').textContent='Temporary session — export to keep';toast('Browser storage is unavailable. Export your guides before leaving.');}
activeId=guides[0]?.id||'';stepId=current()?.start||'';renderEditor();route();
