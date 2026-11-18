import { NotFoundException, StreamableFile } from '@nestjs/common';
import { NextFunction, Response } from 'express';
import { access, constants } from 'node:fs/promises';
import { basename, extname } from 'node:path';
import { promisify } from 'node:util';
import { CacheControl } from 'src/enum.js';
import { LoggingRepository } from 'src/repositories/logging.repository.js';
import { ImmichReadStream } from 'src/repositories/storage.repository.js';
import { onRouteError } from 'src/utils/logger.js';

export function getFileNameWithoutExtension(path: string): string {
  return basename(path, getFilenameExtension(path));
}

export function getFilenameExtension(path: string) {
  const extension = extname(path);
  if (!extension && path.startsWith('.') && !path.includes('.', 1)) {
    return path;
  }
  return extension;
}

export function getLivePhotoMotionFilename(stillName: string, motionName: string) {
  return getFileNameWithoutExtension(stillName) + getFilenameExtension(motionName);
}

/**
 * iOS Safari only honors the plain `filename` parameter, and it types a download from that
 * extension. `filename*` is included for clients that support RFC 5987.
 */
export function contentDisposition(disposition: 'inline' | 'attachment', fileName: string): string {
  const asciiName = asciiFilename(fileName);
  return `${disposition}; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}

const asciiFilename = (fileName: string): string => {
  const cleaned = fileName.replaceAll(/[\r\n"\\]/g, '_');
  const isAscii = [...cleaned].every((char) => {
    const code = char.codePointAt(0) ?? 0;
    return code >= 0x20 && code <= 0x7e;
  });
  if (isAscii) {
    return cleaned;
  }

  const extension = getFilenameExtension(cleaned);
  const asciiExtension = [...extension].every((char) => (char.codePointAt(0) ?? 0) < 0x80) ? extension : '';
  return `download${asciiExtension}`;
};

export class ImmichFileResponse {
  public readonly path!: string;
  public readonly contentType!: string;
  public readonly cacheControl!: CacheControl;
  public readonly fileName?: string;
  /** Set on an explicit download. Viewing responses stay inline so an <img> can render them. */
  public readonly disposition?: 'inline' | 'attachment';

  constructor(response: ImmichFileResponse) {
    Object.assign(this, response);
  }
}
type SendFile = Parameters<Response['sendFile']>;
type SendFileOptions = SendFile[1];

const cacheControlHeaders: Record<CacheControl, string | null> = {
  [CacheControl.PrivateWithCache]:
    'private, max-age=86400, no-transform, stale-while-revalidate=2592000, stale-if-error=2592000',
  [CacheControl.PrivateWithoutCache]: 'private, no-cache, no-transform',
  [CacheControl.None]: null, // falsy value to prevent adding Cache-Control header
};

export const sendFile = async (
  res: Response,
  next: NextFunction,
  handler: () => Promise<ImmichFileResponse> | ImmichFileResponse,
  logger: LoggingRepository,
): Promise<void> => {
  // promisified version of 'res.sendFile' for cleaner async handling
  const _sendFile = (path: string, options: SendFileOptions) =>
    promisify<string, SendFileOptions>(res.sendFile).bind(res)(path, options);

  try {
    const file = await handler();

    await access(file.path, constants.R_OK);

    const cacheControlHeader = cacheControlHeaders[file.cacheControl];
    if (cacheControlHeader) {
      // set the header to Cache-Control
      res.header('Cache-Control', cacheControlHeader);
    }

    res.header('Content-Type', file.contentType);
    if (file.fileName) {
      res.header('Content-Disposition', contentDisposition(file.disposition ?? 'inline', file.fileName));
    }
    if (file.disposition === 'attachment' && file.contentType === 'application/octet-stream') {
      res.header('X-Content-Type-Options', 'nosniff');
    }

    return await _sendFile(file.path, { dotfiles: 'allow' });
  } catch (error: Error | any) {
    const { canWrite } = onRouteError(undefined, res, error, logger);
    if (canWrite) {
      next(new NotFoundException());
    }
  }
};

export const asStreamableFile = ({ stream, type, disposition, length }: ImmichReadStream) => {
  return new StreamableFile(stream, { type, disposition, length });
};
