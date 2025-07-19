import { config as API_CONFIG } from './config';

export interface NetworkTestResult {
  success: boolean;
  message: string;
  details?: any;
}

export class NetworkTester {
  private baseURL: string;

  constructor() {
    this.baseURL = API_CONFIG.apiUrl;
  }

  async testConnection(): Promise<NetworkTestResult> {
    try {
      console.log('🔍 Testing network connection to:', this.baseURL);

      const response = await fetch(
        `${this.baseURL.replace('/api', '')}/health`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          message: '✅ Network connection successful',
          details: {
            status: response.status,
            url: this.baseURL,
            serverResponse: data,
          },
        };
      } else {
        return {
          success: false,
          message: `❌ Server responded with status: ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: this.baseURL,
          },
        };
      }
    } catch (error) {
      console.error('Network test failed:', error);
      return {
        success: false,
        message: `❌ Network connection failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: this.baseURL,
          type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  async testLoginEndpoint(): Promise<NetworkTestResult> {
    try {
      console.log('🔍 Testing login endpoint...');

      const response = await fetch(`${this.baseURL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          password: 'testpassword',
        }),
      });

      // We expect a 400 or 404 for invalid credentials, but the endpoint should be reachable
      if (response.status === 400 || response.status === 404) {
        return {
          success: true,
          message:
            '✅ Login endpoint is reachable (expected error for invalid credentials)',
          details: {
            status: response.status,
            url: `${this.baseURL}/auth/login`,
          },
        };
      } else if (response.ok) {
        return {
          success: true,
          message: '✅ Login endpoint is working',
          details: {
            status: response.status,
            url: `${this.baseURL}/auth/login`,
          },
        };
      } else {
        return {
          success: false,
          message: `❌ Login endpoint returned unexpected status: ${response.status}`,
          details: {
            status: response.status,
            statusText: response.statusText,
            url: `${this.baseURL}/auth/login`,
          },
        };
      }
    } catch (error) {
      console.error('Login endpoint test failed:', error);
      return {
        success: false,
        message: `❌ Login endpoint test failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
        details: {
          error: error instanceof Error ? error.message : 'Unknown error',
          url: `${this.baseURL}/auth/login`,
          type: error instanceof Error ? error.constructor.name : 'Unknown',
        },
      };
    }
  }

  async runFullTest(): Promise<{
    connection: NetworkTestResult;
    login: NetworkTestResult;
    summary: string;
  }> {
    console.log('🚀 Starting comprehensive network test...');

    const connectionTest = await this.testConnection();
    const loginTest = await this.testLoginEndpoint();

    const allTestsPassed = connectionTest.success && loginTest.success;
    const summary = allTestsPassed
      ? '✅ All network tests passed! The app should be able to connect to the backend.'
      : '❌ Some network tests failed. Check the details below.';

    return {
      connection: connectionTest,
      login: loginTest,
      summary,
    };
  }
}

// Export singleton instance
export const networkTester = new NetworkTester();
