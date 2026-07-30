import {warnOnce} from './util';
import type {TileCacheProvider} from './tile_cache_provider';

export class BrowserCacheProvider implements TileCacheProvider {

    private static readonly CACHE_NAME = 'map-tiles';

    /**
     * 全局共享 Cache 对象。
     * Safari 下频繁 caches.open / keys 会导致内存问题，所以保持单例。
     */
    private static sharedCache: Promise<Cache> | undefined;

    /**
     * 检查当前环境是否支持 Cache Storage API
     */
    static isAvailable(): boolean {
        return typeof caches !== 'undefined';
    }

    /**
     * 安全获取 CacheStorage 对象
     */
    private static getCacheStorage(): CacheStorage | undefined {
        try {
            return caches;
        } catch {
            // iframe sandbox 等环境可能无法访问 caches
            return undefined;
        }
    }

    /**
     * 确保共享 Cache 实例可用
     */
    private static ensureCache(): Promise<Cache> | null {
        const storage = BrowserCacheProvider.getCacheStorage();
        if (!storage) {
            return null;
        }
        if (!BrowserCacheProvider.sharedCache) {
            BrowserCacheProvider.sharedCache = storage.open(BrowserCacheProvider.CACHE_NAME);
        }
        return BrowserCacheProvider.sharedCache;
    }

    /**
     * 重置共享缓存引用（用于清除后重建）
     */
    private static resetCache() {
        BrowserCacheProvider.sharedCache = undefined;
    }

    async get(key: string): Promise<Response | null> {
        const cachePromise = BrowserCacheProvider.ensureCache();
        if (!cachePromise) {
            return null;
        }
        try {
            const cache = await cachePromise;
            const response = await cache.match(key);
            return response || null;
        } catch (e) {
            warnOnce((e as Error).message);
            return null;
        }
    }

    async put(key: string, response: Response): Promise<void> {
        const cachePromise = BrowserCacheProvider.ensureCache();
        if (!cachePromise) {
            return;
        }
        try {
            const cache = await cachePromise;
            await cache.put(key, response);
        } catch (e) {
            warnOnce((e as Error).message);
        }
    }

    async clear(): Promise<void> {
        const storage = BrowserCacheProvider.getCacheStorage();
        if (!storage) {
            return;
        }
        try {
            await storage.delete(BrowserCacheProvider.CACHE_NAME);
            BrowserCacheProvider.resetCache();
        } catch (e) {
            warnOnce((e as Error).message);
        }
    }

    async enforceLimit(limit: number): Promise<void> {
        const cachePromise = BrowserCacheProvider.ensureCache();
        if (!cachePromise) {
            return;
        }
        try {
            const cache = await cachePromise;
            const keys = await cache.keys();
            const removeCount = keys.length - limit;
            if (removeCount <= 0) {
                return;
            }
            let removed = 0;

            // 注意：Cache API 没有内建时间索引，这里按 keys 的自然顺序删除（通常为插入顺序）
            for (const request of keys) {
                if (request.url.includes('persistence=true')) {
                    continue;
                }
                await cache.delete(request);
                removed++;
                if (removed >= removeCount) {
                    break;
                }
            }
        } catch (e) {
            warnOnce((e as Error).message);
        }
    }
}
