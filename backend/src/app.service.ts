import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'PropFlow API',
      version: 'v1',
      status: 'ok',
      docs: '/docs',
      health: '/api/v1/health',
    };
  }
}
