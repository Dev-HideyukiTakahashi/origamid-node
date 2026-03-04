import { createReadStream, createWriteStream } from 'node:fs';
import { Transform } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createGzip } from 'node:zlib';

const transform = new Transform({
  transform(chunk: Buffer, _enc, next) {
    const data = JSON.parse(chunk.toString());
    const filter = data.filter((item: any) => item.vitalicio === 'true');
    this.push(JSON.stringify(filter));
    next();
  },
});

const read = createReadStream('./dados.json');
const write = createWriteStream('./dados-vitalicio.json');
await pipeline(read, transform, write);

// createGzip();
// await pipeline(read, createGzip(), write);
