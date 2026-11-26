(async()=>{
const modal=document.createElement('section');modal.style.cssText='position:fixed;inset:0;background:#fff;z-index:20';modal.innerHTML='<header style="position:sticky;top:0;height:32px">閱讀標題</header><p>內容</p>';document.body.append(modal);
await new Promise(resolve=>setTimeout(resolve,50));
const bar=document.getElementById('bana-desktop-tools').getBoundingClientRect(),box=modal.getBoundingClientRect(),header=modal.querySelector('header').getBoundingClientRect();
if(box.top<40||box.top<bar.bottom||header.top<40||header.top>45||box.bottom>innerHeight+1)throw Error('Toolbar layout overlap: '+JSON.stringify({bar:bar.toJSON(),modal:box.toJSON(),header:header.toJSON()}));
modal.remove();return{toolbarBottom:bar.bottom,readerTop:box.top,headerTop:header.top,readerBottom:box.bottom};
})()
