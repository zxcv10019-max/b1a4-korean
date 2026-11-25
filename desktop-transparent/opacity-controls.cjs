function createOpacityControls({win,initial=100,onChange=()=>{},save=()=>{}}){
  let percent=Number.isFinite(initial)&&initial>=10&&initial<=100?Math.round(initial):100;
  function setPercent(value,{persist=true}={}){
    if(!Number.isFinite(value)||value<10||value>100)throw Error('不透明度需介於10到100%');
    percent=Math.round(value);win.setOpacity(percent/100);onChange(percent);if(persist)save(percent);return percent;
  }
  return{current:()=>percent,setPercent};
}
module.exports={createOpacityControls};
