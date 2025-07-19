export interface AuthEvent {
  type: 'logout' | 'login' | 'token_expired' | 'session_expired';
  data?: any;
}

class AuthEventEmitter {
  private static instance: AuthEventEmitter;
  private listeners: Map<string, ((event: AuthEvent) => void)[]> = new Map();

  private constructor() {}

  static getInstance(): AuthEventEmitter {
    if (!AuthEventEmitter.instance) {
      AuthEventEmitter.instance = new AuthEventEmitter();
    }
    return AuthEventEmitter.instance;
  }

  emitAuthEvent(event: AuthEvent): void {
    console.log('🔔 Auth Event Emitted:', event);
    const callbacks = this.listeners.get('auth_event') || [];
    callbacks.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Error in auth event callback:', error);
      }
    });
  }

  onAuthEvent(callback: (event: AuthEvent) => void): void {
    const eventName = 'auth_event';
    if (!this.listeners.has(eventName)) {
      this.listeners.set(eventName, []);
    }
    this.listeners.get(eventName)!.push(callback);
  }

  removeAuthListener(callback: (event: AuthEvent) => void): void {
    const eventName = 'auth_event';
    const callbacks = this.listeners.get(eventName) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }
}

export default AuthEventEmitter.getInstance();
