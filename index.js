import { createServer } from 'node:http';

createServer((req, res) => {
  const session = true;
  if (session) {
    res.statusCode = 200;
    res.setHeader('X-Accel-Redirect', req.url);
    res.end('autorizado');
  } else {
    res.statusCode = 401;
    res.end('não autorizado');
  }
}).listen(3000);
