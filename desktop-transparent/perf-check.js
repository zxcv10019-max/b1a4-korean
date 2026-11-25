(async()=>{
const check=(v,m)=>{if(!v)throw Error(m)},wait=()=>new Promise(r=>setTimeout(r,200));
const api=window.banaDesktopSkin;api.setMode(true);
const many=document.createElement('section');many.innerHTML=Array.from({length:1500},(_,i)=>'<span>word '+i+'</span>').join('');document.body.append(many);await wait();
const before=api.getStats(),text=document.getElementById('text');
for(let i=0;i<200;i++){text.style.marginLeft=(i%3)+'px';text.className='test-'+i;text.firstChild.data='new '+i;}
await wait();const after=api.getStats();check(after.flushes===before.flushes,'Layout, class and text changes must not scan the page');
api.setMode(true);check(api.getStats().flushes===after.flushes,'Unchanged mode must not scan');
const added=document.createElement('span');added.textContent='one added';many.append(added);await wait();const final=api.getStats();
check(final.nodesRead-after.nodesRead===1,'Only newly added node should be read');check(getComputedStyle(added).color.endsWith('0.25)'),'Added text opacity');
text.style.color='rgb(100,20,10)';await wait();check(getComputedStyle(text).color==='rgba(100, 20, 10, 0.25)','Preserve text color editing');
text.style.removeProperty('color');text.style.removeProperty('margin-left');text.className='';text.textContent='韓文文字 25%';many.remove();await wait();
return{existingNodes:1500,styleChanges:200,unnecessaryScans:after.flushes-before.flushes,incrementalNodesRead:final.nodesRead-after.nodesRead,lastBatchMs:final.lastDurationMs};
})()
