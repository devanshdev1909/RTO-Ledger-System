const https = require('https');
const querystring = require('querystring');
const postData = querystring.stringify({ email: 'admin@rto.com', password: 'admin@12345' });
const options = {
  hostname: 'rto-ledger-system.onrender.com',
  port: 443,
  path: '/login',
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded',
    'Content-Length': Buffer.byteLength(postData)
  }
};
const req = https.request(options, (res) => {
  const cookie = res.headers['set-cookie'];
  console.log('Login Status:', res.statusCode);
  if (!cookie) return console.log('No cookie received!');
  const sessionCookie = cookie[0].split(';')[0];
  console.log('Session Cookie:', sessionCookie);
  
  const patchData = JSON.stringify({ status: 'Completed' });
  const patchOptions = {
    hostname: 'rto-ledger-system.onrender.com',
    port: 443,
    path: '/services/requests/66/status',
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(patchData),
      'Cookie': sessionCookie
    }
  };
  const req2 = https.request(patchOptions, (res2) => {
    console.log('Patch Status:', res2.statusCode);
    let body = '';
    res2.on('data', d => body += d);
    res2.on('end', () => console.log('Patch Body:', body));
  });
  req2.write(patchData);
  req2.end();
});
req.write(postData);
req.end();
