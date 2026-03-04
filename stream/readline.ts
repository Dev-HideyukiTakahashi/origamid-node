import { createReadStream, createWriteStream } from 'node:fs';
import { createInterface } from 'node:readline/promises';

const read = createReadStream('./dados.ndjson');
const write = createWriteStream('./dados-vitalicio.ndjson');
const lines = createInterface({ input: read, crlfDelay: Infinity });

for await (const line of lines) {
  const obj = JSON.parse(line);
  if (obj.vitalicio === 'true') {
    write.write(line + '\n');
  }
}

write.end();
