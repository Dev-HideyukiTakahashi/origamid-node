import { Api } from '../../core/utils/abstract.ts';
import { createReadStream, createWriteStream } from 'node:fs';
import { pipeline } from 'node:stream/promises';
import { validate } from '../../core/utils/validate.ts';
import path from 'node:path';
import { checkEtag, LimitBytes, mimeType } from './utils.ts';
import { rename, rm, stat } from 'node:fs/promises';
import { RouteError } from '../../core/utils/route-error.ts';
import { randomUUID } from 'node:crypto';
import { AuthMiddleware } from '../auth/middleware/auth.ts';
import { FILES_PATH } from '../../env.ts';

const MAX_BYTES = 150 * 1024 * 1024; // 150 MB

export class FilesApi extends Api {
  auth = new AuthMiddleware(this.core);

  handlers = {
    publicFile: async (req, res) => {
      const name = validate.file(req.params.name);
      const filePath = path.join(FILES_PATH, 'public', name);
      const ext = path.extname(name);
      let st;

      try {
        st = await stat(filePath);
      } catch (error) {
        throw new RouteError(404, 'arquivo não encontrado');
      }

      const etag = `W/${st.size.toString(16)}-${Math.floor(st.mtimeMs).toString(16)}`;

      res.setHeader('ETag', etag);
      res.setHeader('Content-Length', st.size);
      res.setHeader('Last-Modified', st.mtime.toUTCString());
      res.setHeader('Content-Type', mimeType[ext] || 'application/octet-stream');
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');

      if (checkEtag(req.headers['if-none-match'], etag)) {
        res.status(304);
        res.end();
        return;
      }

      res.status(200);
      const file = createReadStream(filePath);
      await pipeline(file, res);
    },

    uploadFile: async (req, res) => {
      if (req.headers['content-type'] !== 'application/octet-stream') {
        throw new RouteError(415, 'use octet-stream');
      }

      const contentLength = Number(req.headers['content-length']);
      if (!Number.isInteger(contentLength)) {
        throw new RouteError(400, 'contentLength error');
      }

      if (contentLength > MAX_BYTES) {
        throw new RouteError(413, 'corpo grande');
      }

      const name = validate.file(req.headers['x-filename']);
      const visibility =
        validate.optional.string(req.headers['x-visibility']) === 'public' ? 'public' : 'private';
      const now = Date.now();
      const ext = path.extname(name);
      const finalName = `${name.replace(ext, '')}-${now}${ext}`;
      const tempPath = path.join(FILES_PATH, visibility, `${randomUUID()}.temp`);
      const writePath = path.join(FILES_PATH, visibility, finalName);
      const writeStream = createWriteStream(tempPath, { flags: 'wx' });

      try {
        await pipeline(req, LimitBytes(MAX_BYTES), writeStream);
        await rename(tempPath, writePath);
        res.status(201).json({ path: writePath, name: finalName });
      } catch (error) {
        if (error instanceof RouteError) {
          throw new RouteError(error.status, error.message);
        } else {
          throw new RouteError(500, 'erro');
        }
      } finally {
        await rm(tempPath, { force: true }).catch(() => {});
      }
    },

    privateFile: async (req, res) => {
      const name = validate.file(req.params.name);
      res.setHeader('X-Accel-Redirect', name);
      res.status(200).end();
    },
  } satisfies Api['handlers'];

  routes(): void {
    this.router.get('/files/public/:name', this.handlers.publicFile);
    this.router.get('/files/private/:name', this.handlers.privateFile, [this.auth.guard('user')]);
    this.router.post('/files/upload', this.handlers.uploadFile);
  }
}
