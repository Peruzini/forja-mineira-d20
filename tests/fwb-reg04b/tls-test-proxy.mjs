// Disposable GitHub Actions HTTPS test proxy. This is NOT a production gateway.
// Bind only in isolated CI and terminate with the workflow; do not deploy.
import https from 'node:https';
import http from 'node:http';
import fs from 'node:fs';

const options={key:fs.readFileSync(process.env.FWB_LAB_TLS_KEY),
  cert:fs.readFileSync(process.env.FWB_LAB_TLS_CERT)};
https.createServer(options,(request,response)=>{
  const upstream=http.request({
    hostname:'127.0.0.1',port:8080,path:request.url,method:request.method,
    headers:{...request.headers,host:'auth-lab.example.org',
      'x-forwarded-proto':'https','x-forwarded-host':'auth-lab.example.org','x-forwarded-port':'443'},
    timeout:20000
  },serverResponse=>{
    response.writeHead(serverResponse.statusCode,serverResponse.headers);
    serverResponse.pipe(response);
  });
  upstream.on('error',()=>{if(!response.headersSent)response.writeHead(502);response.end();});
  request.pipe(upstream);
}).listen(443,'127.0.0.1',()=>console.log('REG04B_EPHEMERAL_TLS_PROXY_READY'));
