const {createHandoff}=require('./auth-handoff.cjs');
const assert=require('node:assert/strict');
(async()=>{
  const origin='https://zxcv10019-max.github.io',handoff=createHandoff({origin,timeoutMs:5000}),{port,state}=await handoff.ready;
  const post=(values,requestOrigin=origin)=>fetch('http://127.0.0.1:'+port+'/auth',{method:'POST',headers:{Origin:requestOrigin},body:new URLSearchParams(values)});
  assert.equal((await post({state,idToken:'test'},'https://wrong.example')).status,403);
  assert.equal((await post({state:'0'.repeat(64),idToken:'test'})).status,403);
  assert.equal((await post({state:'é'.repeat(64),idToken:'test'})).status,403);
  assert.equal((await post({state})).status,400);
  assert.equal((await post({state,idToken:'test-id',accessToken:'test-access'})).status,200);
  assert.deepEqual(await handoff.result,{idToken:'test-id',accessToken:'test-access'});
  const cancelled=createHandoff({origin});cancelled.result.catch(()=>{});await cancelled.ready;cancelled.cancel();await assert.rejects(cancelled.result,/取消/);
  console.log('PASS: localhost binding, origin and session validation, credential delivery, cancellation');
})().catch(error=>{console.error(error);process.exit(1)});
