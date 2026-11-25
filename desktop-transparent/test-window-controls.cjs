const assert=require('node:assert/strict'),{createWindowControls}=require('./window-controls.cjs');
const wait=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
let bounds={x:100,y:80,width:560,height:800},minimum=[400,400],resizable=true,pinned=false;
const win={getBounds:()=>({...bounds}),setBounds:v=>bounds={...v},getMinimumSize:()=>[...minimum],setMinimumSize:(...v)=>minimum=v,isResizable:()=>resizable,setResizable:v=>resizable=v,isAlwaysOnTop:()=>pinned,setAlwaysOnTop:v=>pinned=v,isMaximized:()=>false};
const controls=createWindowControls({win,screen:{getDisplayMatching:()=>({workArea:{x:0,y:0,width:1920,height:1080}})},hideDelay:10});
controls.leave();await wait(25);assert.equal(controls.state().collapsed,false);
controls.toggleCollapse();assert.deepEqual(bounds,{x:260,y:80,width:400,height:40});controls.togglePin();assert.equal(pinned,true);
bounds.x=500;bounds.y=140;controls.expand();assert.deepEqual(bounds,{x:340,y:140,width:560,height:800});assert.deepEqual(minimum,[400,400]);assert.equal(resizable,true);assert.equal(pinned,true);
controls.toggleAutoHide();controls.leave();controls.enter();await wait(25);assert.equal(controls.state().collapsed,false);
controls.leave();await wait(25);assert.equal(controls.state().collapsed,true);assert.equal(pinned,true);
controls.enter();assert.equal(controls.state().collapsed,false);controls.leave();controls.toggleAutoHide();await wait(25);assert.equal(controls.state().collapsed,false);
controls.togglePin();assert.equal(pinned,false);controls.dispose();console.log('PASS: collapse/restore, pin, optional mouse-leave hide, hover restore, cancelled hide');
})().catch(error=>{console.error(error);process.exit(1)});
