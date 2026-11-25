const assert=require('node:assert/strict'),{createOpacityControls}=require('./opacity-controls.cjs');
let native=1,saved;const controller=createOpacityControls({win:{setOpacity:value=>native=value},save:value=>saved=value});
assert.equal(controller.current(),100);controller.setPercent(30);assert.equal(native,.3);assert.equal(saved,30);controller.setPercent(100);assert.equal(native,1);
for(const invalid of [NaN,0,101,'30',undefined])assert.throws(()=>controller.setPercent(invalid));
const remembered=createOpacityControls({win:{setOpacity(){}},initial:70});assert.equal(remembered.current(),70);
console.log('PASS: default 100%, whole-window opacity, restore, valid bounds, remembered percentage');
