import { createReadStream, createWriteStream } from 'node:fs';
import { createServer } from 'node:http';
import { pipeline } from 'node:stream/promises';

const log = createWriteStream('./log.txt', { flags: 'a' });

createServer(async (req, res) => {
  const dados = createReadStream('./dados.json');
  log.write(`${req.method} ${req.socket.remoteAddress} \n`);
  await pipeline(dados, res);
})
  .listen(3000)
  .on('close', () => {
    log.end();
  });
