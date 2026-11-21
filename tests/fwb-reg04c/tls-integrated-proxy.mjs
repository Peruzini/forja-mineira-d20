import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';
const tls={key:fs.readFileSync(process.env.FWB_LAB_TLS_KEY),
  cert:fs.readFileSync(process.env.FWB_LAB_TLS_CERT)};
https.createServer(tls,(request,response)=>{
  const host=request.headers.host?.split(':')[0];
  if(host!=='auth-lab.example.org'&&host!=='wp-lab.example.org'){
    response.writeHead(421);response.end();return;
  }
  const keycloak=host==='auth-lab.example.org';
  const upstream=http.request({hostname:'127.0.0.1',port:keycloak?8080:8888,
    path:request.url,method:request.method,timeout:15000,
    headers:{...request.headers,host:keycloak?'auth-lab.example.org':'localhost:8888',
      'x-forwarded-proto':'https','x-forwarded-host':host,'x-forwarded-port':'443'}
  },r=>{response.writeHead(r.statusCode,r.headers);r.pipe(response)});
  upstream.on('error',()=>{if(!response.headersSent)response.writeHead(502);response.end()});
  request.pipe(upstream);
}).listen(443,'127.0.0.1',()=>console.log('REG04C_EPHEMERAL_INTEGRATED_TLS_READY'));
