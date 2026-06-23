import https from 'https';
import { knowledgeStore } from '../core/AgentKnowledge';
import { evolutionTracker } from '../core/AgentEvolution';

interface PCloudResponse {
  result: number;
  error?: string;
  metadata?: {
    fileid: number;
    path: string;
    name: string;
    size: number;
  };
  auth?: string;
  fileids?: number[];
  hosts?: string[];
  path?: string;
}

export class PCloudStorage {
  private authToken: string | null = null;
  private apiHost: string = 'eapi.pcloud.com';
  private basePath: string = '/VonWobeser/agents';

  async authenticate(): Promise<boolean> {
    const username = process.env.PCLOUD_USERNAME;
    const password = process.env.PCLOUD_PASSWORD;

    if (!username || !password) {
      console.error('[PCloud] Missing credentials');
      return false;
    }

    try {
      const response = await this.apiCall('userinfo', {
        getauth: '1',
        logout: '1',
        username,
        password,
      });

      if (response.result === 0 && response.auth) {
        this.authToken = response.auth;
        console.log('[PCloud] Authenticated successfully');
        return true;
      } else {
        console.error('[PCloud] Authentication failed:', response.error);
        return false;
      }
    } catch (error) {
      console.error('[PCloud] Authentication error:', error);
      return false;
    }
  }

  private async apiCall(method: string, params: Record<string, string>): Promise<PCloudResponse> {
    return new Promise((resolve, reject) => {
      const queryParams = new URLSearchParams(params);
      if (this.authToken && !params.auth) {
        queryParams.set('auth', this.authToken);
      }

      const path = `/${method}?${queryParams.toString()}`;

      const options = {
        hostname: this.apiHost,
        port: 443,
        path,
        method: 'GET',
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(new Error(`Invalid JSON response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.end();
    });
  }

  private async uploadFile(path: string, content: string): Promise<boolean> {
    if (!this.authToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return false;
    }

    return new Promise((resolve, reject) => {
      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substr(2);
      const fileName = path.split('/').pop() || 'data.json';
      
      const bodyParts = [
        `--${boundary}`,
        `Content-Disposition: form-data; name="file"; filename="${fileName}"`,
        'Content-Type: application/json',
        '',
        content,
        `--${boundary}--`,
        '',
      ];
      const body = bodyParts.join('\r\n');

      const folderPath = this.basePath + '/' + path.split('/').slice(0, -1).join('/');
      
      const options = {
        hostname: this.apiHost,
        port: 443,
        path: `/uploadfile?auth=${this.authToken}&path=${encodeURIComponent(folderPath)}&filename=${encodeURIComponent(fileName)}&nopartial=1`,
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (response.result === 0) {
              console.log(`[PCloud] Uploaded: ${path}`);
              resolve(true);
            } else {
              console.error(`[PCloud] Upload failed: ${response.error}`);
              resolve(false);
            }
          } catch (e) {
            reject(new Error(`Invalid response: ${data}`));
          }
        });
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private async downloadFile(path: string): Promise<string | null> {
    if (!this.authToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return null;
    }

    try {
      const fullPath = this.basePath + '/' + path;
      const statResponse = await this.apiCall('stat', { path: fullPath });
      
      if (statResponse.result !== 0) {
        console.log(`[PCloud] File not found: ${path}`);
        return null;
      }

      const linkResponse = await this.apiCall('getfilelink', { path: fullPath });
      
      if (linkResponse.result !== 0 || !linkResponse.hosts || !linkResponse.path) {
        console.error(`[PCloud] Failed to get file link: ${(linkResponse as any).error}`);
        return null;
      }

      return new Promise((resolve, reject) => {
        const host = (linkResponse as any).hosts[0];
        const filePath = (linkResponse as any).path;

        https.get(`https://${host}${filePath}`, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => resolve(data));
        }).on('error', reject);
      });
    } catch (error) {
      console.error(`[PCloud] Download error:`, error);
      return null;
    }
  }

  async ensureFolder(path: string): Promise<boolean> {
    if (!this.authToken) {
      const authenticated = await this.authenticate();
      if (!authenticated) return false;
    }

    try {
      const fullPath = this.basePath + (path ? '/' + path : '');
      const response = await this.apiCall('createfolderifnotexists', { path: fullPath });
      return response.result === 0 || response.result === 2004;
    } catch (error) {
      console.error(`[PCloud] Create folder error:`, error);
      return false;
    }
  }

  async saveKnowledge(): Promise<boolean> {
    await this.ensureFolder('knowledge');
    // toJSON() es async (lee de la BD) → sin await, JSON.stringify serializa la
    // Promise como '{}' y el backup sube vacío.
    const data = JSON.stringify(await knowledgeStore.toJSON(), null, 2);
    return this.uploadFile('knowledge/knowledge.json', data);
  }

  async loadKnowledge(): Promise<boolean> {
    const data = await this.downloadFile('knowledge/knowledge.json');
    if (!data) return false;

    try {
      const parsed = JSON.parse(data);
      knowledgeStore.fromJSON(parsed);
      console.log('[PCloud] Knowledge loaded successfully');
      return true;
    } catch (error) {
      console.error('[PCloud] Failed to parse knowledge:', error);
      return false;
    }
  }

  async saveEvolution(): Promise<boolean> {
    await this.ensureFolder('evolution');
    // toJSON() es async (lee de la BD) → sin await sube '{}' vacío.
    const data = JSON.stringify(await evolutionTracker.toJSON(), null, 2);
    return this.uploadFile('evolution/evolution.json', data);
  }

  async loadEvolution(): Promise<boolean> {
    const data = await this.downloadFile('evolution/evolution.json');
    if (!data) return false;

    try {
      const parsed = JSON.parse(data);
      evolutionTracker.fromJSON(parsed);
      console.log('[PCloud] Evolution data loaded successfully');
      return true;
    } catch (error) {
      console.error('[PCloud] Failed to parse evolution data:', error);
      return false;
    }
  }

  async syncAll(): Promise<{ knowledge: boolean; evolution: boolean }> {
    console.log('[PCloud] Starting sync...');
    
    await this.ensureFolder('');
    
    const knowledge = await this.saveKnowledge();
    const evolution = await this.saveEvolution();

    console.log(`[PCloud] Sync complete - Knowledge: ${knowledge}, Evolution: ${evolution}`);
    
    return { knowledge, evolution };
  }

  async loadAll(): Promise<{ knowledge: boolean; evolution: boolean }> {
    console.log('[PCloud] Loading from cloud...');
    
    const knowledge = await this.loadKnowledge();
    const evolution = await this.loadEvolution();

    console.log(`[PCloud] Load complete - Knowledge: ${knowledge}, Evolution: ${evolution}`);
    
    return { knowledge, evolution };
  }

  async testConnection(): Promise<boolean> {
    return this.authenticate();
  }
}

export const pcloudStorage = new PCloudStorage();
