import {warnOnce} from "./util";

import type {TileCacheProvider} from "./tile_cache_provider";

type ResponseOptions = {
    status: number;
    statusText: string;
    headers: [string, string][];
};

type CacheData = {
    url: string;
    data: Blob;
    options: ResponseOptions;
    timestamp: number;
};

export class IndexedDBCacheProvider implements TileCacheProvider {
    private static readonly DB_NAME = "tile-cache";
    private static readonly DB_VERSION = 1;

    private static tileDB: Promise<IDBDatabase> | undefined;

    /**
     * 检查当前环境是否支持 IndexedDB
     */
    static isAvailable(): boolean {
        return typeof indexedDB !== "undefined";
    }

    /**
     * 获取或重新建立数据库连接（连接失效时自动重连）
     */
    private static async ensureDB(): Promise<IDBDatabase> {
        if (IndexedDBCacheProvider.tileDB) {
            try {
                const db = await IndexedDBCacheProvider.tileDB;
                void db.objectStoreNames; // 检测连接是否有效
                return db;
            } catch {
                IndexedDBCacheProvider.tileDB = undefined;
            }
        }

        IndexedDBCacheProvider.tileDB = new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(
                IndexedDBCacheProvider.DB_NAME,
                IndexedDBCacheProvider.DB_VERSION
            );

            request.onupgradeneeded = () => {
                const db = request.result;

                // 直接创建全新的结构，不再处理旧版本
                if (!db.objectStoreNames.contains("tiles")) {
                    const store = db.createObjectStore("tiles", {keyPath: "url"});
                    store.createIndex("timestamp", "timestamp", {unique: false});
                }
            };

            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const db = request.result;
                // 监听关闭事件，及时清理引用
                db.onclose = () => {
                    IndexedDBCacheProvider.tileDB = undefined;
                };
                resolve(db);
            };
        });

        return IndexedDBCacheProvider.tileDB;
    }

    private async getStore(mode: IDBTransactionMode) {
        const db = await IndexedDBCacheProvider.ensureDB();
        return db.transaction("tiles", mode).objectStore("tiles");
    }

    private countStore(store: IDBObjectStore): Promise<number> {
        return new Promise((resolve, reject) => {
            const request = store.count();
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async get(key: string): Promise<Response | null> {
        try {
            const store = await this.getStore("readonly");

            return await new Promise((resolve, reject) => {
                const request = store.get(key) as IDBRequest<CacheData | undefined>;
                request.onerror = () => reject(request.error);
                request.onsuccess = () => {
                    const cache = request.result;
                    if (!cache) {
                        resolve(null);
                        return;
                    }
                    resolve(new Response(cache.data, {
                        status: cache.options.status,
                        statusText: cache.options.statusText,
                        headers: cache.options.headers,
                    }));
                };
            });
        } catch (e) {
            warnOnce((e as Error).message);
            return null;
        }
    }

    async put(key: string, response: Response): Promise<void> {
        try {
            const headers: [string, string][] = [];
            response.headers.forEach((value, name) => {
                headers.push([name, value]);
            });
            const data = await response.blob();
            const store = await this.getStore("readwrite");

            store.put({
                url: key,
                data,
                options: {
                    status: response.status,
                    statusText: response.statusText,
                    headers,
                },
                timestamp: Date.now(),
            } satisfies CacheData);
        } catch (e) {
            warnOnce((e as Error).message);
        }
    }

    async clear(): Promise<void> {
        try {
            const store = await this.getStore("readwrite");
            store.clear();
        } catch (e) {
            warnOnce((e as Error).message);
        }
    }

    async enforceLimit(limit: number): Promise<void> {
        const store = await this.getStore("readwrite");
        const count = await this.countStore(store);
        if (count <= limit) return;

        let remove = count - limit;

        // 通过时间戳索引按升序删除最旧的条目（保留 persistence=true 的瓦片）
        const index = store.index("timestamp");
        await new Promise<void>((resolve, reject) => {
            const request = index.openCursor();
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                const cursor = request.result;
                if (!cursor || remove <= 0) {
                    resolve();
                    return;
                }
                const entry = cursor.value as CacheData;
                if (entry.url.includes('persistence=true')) {
                    cursor.continue();
                    return;
                }
                const deleteReq = cursor.delete();
                deleteReq.onerror = (event) => {
                    event.preventDefault(); // 阻止事务中止
                    console.warn(`Failed to delete cache entry: ${entry.url}`);
                    cursor.continue();
                };
                deleteReq.onsuccess = () => {
                    remove--;
                    cursor.continue();
                };
            };
        });
    }
}
