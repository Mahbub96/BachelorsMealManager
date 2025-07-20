interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt?: number;
}

class CacheManager {
  private cache = new Map<string, CacheItem<any>>();

  // Set cache item
  set<T>(key: string, item: CacheItem<T>): void {
    this.cache.set(key, item);
  }

  // Get cache item
  get<T>(key: string): CacheItem<T> | null {
    const item = this.cache.get(key);

    if (!item) {
      return null;
    }

    // Check if expired
    if (item.expiresAt && Date.now() > item.expiresAt) {
      this.remove(key);
      return null;
    }

    return item;
  }

  // Remove cache item
  remove(key: string): void {
    this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Get cache size
  size(): number {
    return this.cache.size;
  }

  // Check if key exists
  has(key: string): boolean {
    return this.cache.has(key);
  }

  // Get all keys
  keys(): string[] {
    return Array.from(this.cache.keys());
  }
}

export const cacheManager = new CacheManager();
export default cacheManager;
