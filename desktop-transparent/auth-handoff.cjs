const http=require('http'),crypto=require('crypto');
function createHandoff({origin,timeoutMs=300000}){
  const state=crypto.randomBytes(32).toString('hex');let timer,settled=false,resolve,reject;
  const result=new Promise((yes,no)=>{resolve=yes;reject=no;});
  const server=http.createServer((req,res)=>{
    res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type','text/plain; charset=utf-8');res.setHeader('Content-Security-Policy',"default-src 'none'");
    if(req.method!=='POST'||req.url!=='/auth'||req.headers.origin!==origin){res.writeHead(403);res.end('Request rejected');return;}
    let body='',bytes=0;req.on('data',chunk=>{bytes+=chunk.length;if(bytes>16384){res.writeHead(413);res.end('Request too large');req.destroy();return;}body+=chunk.toString('utf8');});
    req.on('end',()=>{
      if(res.writableEnded)return;
      const fields=new URLSearchParams(body),provided=fields.get('state')||'';
      if(!/^[a-f0-9]{64}$/.test(provided)||!crypto.timingSafeEqual(Buffer.from(provided),Buffer.from(state))){res.writeHead(403);res.end('Invalid login session');return;}
      const idToken=fields.get('idToken')||'',accessToken=fields.get('accessToken')||'';
      if(!idToken&&!accessToken){res.writeHead(400);res.end('Missing Google credential');return;}
      res.end('Google 登入已交給 BANA Forest 電腦版，請回到電腦版確認同步狀態。此分頁可以關閉。');
      finish(null,{idToken,accessToken});
    });
    req.on('error',()=>{});
  });
  function finish(error,value){if(settled)return;settled=true;clearTimeout(timer);server.close();if(error)reject(error);else resolve(value);}
  const ready=new Promise((yes,no)=>{server.once('error',no);server.listen(0,'127.0.0.1',()=>{server.removeListener('error',no);timer=setTimeout(()=>finish(Error('Google 登入逾時，請重新按登入。')),timeoutMs);yes({port:server.address().port,state});});});
  return{ready,result,cancel:()=>finish(Error('Google 登入已取消。'))};
}
module.exports={createHandoff};
