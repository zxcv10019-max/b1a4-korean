function createWindowControls({win,screen,onChange=()=>{}}){
  let collapsed=false,expanded;
  const state=()=>({collapsed,pinned:win.isAlwaysOnTop()});
  const publish=()=>{const value=state();onChange(value);return value;};
  function expand(){
    if(!collapsed)return state();
    const bar=win.getBounds(),area=screen.getDisplayMatching(bar).workArea;
    const width=Math.min(expanded.bounds.width,area.width),height=Math.min(expanded.bounds.height,area.height);
    win.setResizable(expanded.resizable);win.setMinimumSize(...expanded.minimum);
    win.setBounds({x:Math.max(area.x,Math.min(bar.x+bar.width-width,area.x+area.width-width)),y:Math.max(area.y,Math.min(bar.y,area.y+area.height-height)),width,height});
    collapsed=false;return publish();
  }
  function toggleCollapse(){
    if(collapsed)return expand();
    if(win.isMaximized())win.unmaximize();
    const bounds=win.getBounds();expanded={bounds,minimum:win.getMinimumSize(),resizable:win.isResizable()};
    win.setMinimumSize(300,40);win.setResizable(false);
    win.setBounds({x:bounds.x+bounds.width-300,y:bounds.y,width:300,height:40});
    collapsed=true;return publish();
  }
  function togglePin(){win.setAlwaysOnTop(!win.isAlwaysOnTop());return publish();}
  return{state,publish,expand,toggleCollapse,togglePin};
}
module.exports={createWindowControls};
