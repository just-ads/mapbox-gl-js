import {warnOnce} from "./util";

type ResponseOptions = {
    status: number;
    statusText: string;
    headers: Record<string, string>;
}

type CacheData = {
    data: Blob;
    url: string;
    options: ResponseOptions;
}

let tileDB: Promise<IDBDatabase>;

function isNullBodyStatus(status: Response["status"]): boolean {
    if (status === 200 || status === 404) {
        return false;
    }

    return [101, 103, 204, 205, 304].includes(status);
}

function openDB() {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    if (tileDB) return;
    tileDB = new Promise((resolve, reject) => {
        const request = indexedDB.open("map-tiles", 1);
        request.onerror = (error) => {
            console.error('indexDB 初始化失败', error);
            reject(new Error('indexDB 初始化失败'));
        };
        request.onupgradeneeded = () => {
            const db = request.result;
            db.createObjectStore('tiles', {keyPath: 'url'});
        };
        request.onsuccess = () => {
            resolve(request.result);
        };
    });
}

function getObjectStore() {
    openDB();
    return tileDB.then(db => {
        return db.transaction('tiles', 'readwrite').objectStore('tiles');
    });
}

export function cachePutToDB(url: string, response: Response) {
    const options: ResponseOptions = {
        status: response.status,
        statusText: response.statusText,
        headers: {}
    };
    response.headers.forEach((v, k) => {
        if (k === 'max-age') return;
        options.headers[k] = v;
    });
    response
        .blob()
        .then(data => {
            return getObjectStore().then(store => {
                store.put({data: isNullBodyStatus(response.status) ? null : data, url, options});
            });
        })
        .catch(e => warnOnce(e.message));
}

export function cacheGetFromDB(id: string, callback: (error?: any, response?: Response | null, fresh?: boolean | null) => void) {
    let cancel = false;
    const timer = setTimeout(() => {
        cancel = true;
        callback(null);
    }, 2000);
    getObjectStore()
        .then(store => {
            clearTimeout(timer);
            if (cancel) return callback(null);
            const request = store.get(id) as IDBRequest<CacheData | null>;
            request.onerror = (error) => {
                console.error(error);
                callback(error);
            };
            request.onsuccess = () => {
                const cache = request.result;
                if (!cache) {
                    callback(null);
                } else {
                    // 构造 Response
                    const response = new Response(cache.data, cache.options);
                    callback(null, response, true);
                }
            };
        })
        .catch(err => {
            console.log(err);
        });
}

export function enforceDBCacheSizeLimit(limit: number) {
    getObjectStore()
        .then(store => {
            const request = store.count();
            request.onsuccess = () => {
                if (request.result < limit) return;
                removeTile(request.result - limit);
            };
        })
        .catch(e => warnOnce(e.message));
}

function removeTile(count: number) {
    getObjectStore()
        .then(store => {
            const request = store.openCursor();
            request.onsuccess = () => {
                const cursor = request.result;
                // cursor.source.get()
                // cursor.value.headers
                if (cursor && count-- > 0) {
                    if (cursor.value.headers.get('Persistence')) return;
                    cursor.delete();
                    cursor.continue();
                }
            };
        })
        .catch(e => warnOnce(e.message));
}

export function clearDB(callback?: (err?: Error | null) => void) {
    getObjectStore()
        .then(store => {
            store.clear();
            if (callback) callback();
        })
        .catch(e => warnOnce(e.message));
}

export function getCacheDB() {
    openDB();
    return tileDB.then(db => {
        return {
            db,
            getStore: (mode?: IDBTransactionMode, options?: IDBTransactionOptions) => db.transaction('tiles', mode, options).objectStore('tiles')
        };
    });
}
