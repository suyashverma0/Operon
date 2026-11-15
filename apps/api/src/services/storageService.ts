import { logger } from '../utils/logger';

export class StorageService {
  static async uploadFile(fileName: string, buffer: Buffer): Promise<string> {
    logger.info(`Uploading file ${fileName} (${buffer.length} bytes)`);
    return `https://storage.openron.local/${fileName}`;
  }
}
