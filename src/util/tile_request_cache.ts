import {BrowserCacheProvider,} from './tile_cache_storage';
import {IndexedDBCacheProvider} from './tile_db_storage';
import {warnOnce, parseCacheControl} from './util';
import {stripQueryParameters, setQueryParameters} from './url';

import type Dispatcher from './dispatcher';
import type {TileCacheProvider} from './tile_cache_provider';

let cacheLimit = 10000; // 1000MB / (100KB/tile) ~= 10000 tiles
let cacheCheckThreshold = 1000;

// 默认时间 100年
const EXPIRED_TIME = Date.now() + 1000 * 60 * 60 * 24 * 365 * 100;
const MIN_TIME_UNTIL_EXPIRY = 1000 * 60 * 7; // 7 minutes. Skip caching tiles with a short enough max age.

// So that caching functions correctly, these params are persisted
// on URLs with query params otherwise stripped.
const PERSISTENT_PARAMS = ['language', 'worldview', 'jobid'];

export type ResponseOptions = {
    status: number;
    statusText: string;
    headers: Headers;
};

/**
 * Cache provider is selected here.
 *
 * tile_request_cache does not care how the provider stores data.
 */
let cacheProvider: TileCacheProvider | undefined;

function getCacheProvider(): TileCacheProvider {
    if (cacheProvider) {
        return cacheProvider;
    }
    if (BrowserCacheProvider.isAvailable()) {
        cacheProvider = new BrowserCacheProvider();
    } else if (IndexedDBCacheProvider.isAvailable()) {
        cacheProvider = new IndexedDBCacheProvider();
    }
    return cacheProvider;
}

export function setCacheProvider(provider: TileCacheProvider): void {
    cacheProvider = provider;
}

// https://fetch.spec.whatwg.org/#null-body-status
function isNullBodyStatus(status: Response["status"]): boolean {
    if (status === 200 || status === 404) {
        return false;
    }

    return [101, 103, 204, 205, 304].includes(status);
}

export async function cachePut(
    request: Request,
    response: Response,
    requestTime: number,
    cacheUrl?: string,
    persistence?: boolean
): Promise<void> {

    const url = cacheUrl || request.url;

    const cacheControl = parseCacheControl(response.headers.get('cache-control') || '');

    // Do not cache no-store responses.
    if (cacheControl['no-store']) {
        return;
    }

    const options: ResponseOptions = {
        status: response.status,
        statusText: response.statusText,
        headers: new Headers(response.headers)
    };

    if (cacheControl['max-age']) {
        options.headers.set('Expires', new Date(requestTime + cacheControl['max-age'] * 1000).toUTCString());
    }

    const expires = options.headers.get('expires') || EXPIRED_TIME;

    if (!expires) {
        return;
    }

    const timeUntilExpiry = new Date(expires).getTime() - requestTime;

    if (timeUntilExpiry < MIN_TIME_UNTIL_EXPIRY) {
        return;
    }

    let strippedURL = stripQueryParameters(url, {persistentParams: PERSISTENT_PARAMS});

    // Handle partial responses by keeping the range header in the query string
    if (response.status === 206) {
        const range = request.headers.get('Range');
        if (!range) return;

        options.status = 200;
        strippedURL = setQueryParameters(strippedURL, {range});
    }

    const cacheKey = persistence ? setQueryParameters(strippedURL, {persistence: 'true'}) : strippedURL;

    const clonedResponse = new Response(isNullBodyStatus(response.status) ? null : response.body, options);

    try {
        await getCacheProvider().put(cacheKey, clonedResponse);
    } catch (e) {
        warnOnce((e as Error).message);
    }
}

export async function cacheGet(
    request: Request,
    cacheUrl?: string,
    persistence?: boolean,
    secondUrl?: string,
): Promise<{ response: Response; fresh: boolean } | null> {

    const url = cacheUrl || request.url;

    const getCache = async (lookupUrl: string): Promise<{ response: Response; fresh: boolean } | null> => {

        let strippedURL = stripQueryParameters(lookupUrl, {persistentParams: PERSISTENT_PARAMS});

        const range = request.headers.get('Range');

        if (range) {
            strippedURL = setQueryParameters(strippedURL, {range});
        }

        const cacheKey = persistence ? setQueryParameters(strippedURL, {persistence: 'true'}) : strippedURL;

        let response: Response | null;

        try {
            response = await getCacheProvider().get(cacheKey);
        } catch (e) {
            warnOnce((e as Error).message);
            return null;
        }

        if (!response) {
            return null;
        }

        const fresh = isFresh(response);

        if (fresh) {
            try {
                await getCacheProvider().put(cacheKey, response.clone());
            } catch (e) {
                warnOnce((e as Error).message);
            }
        }

        return {response, fresh};
    };

    if (secondUrl) {
        const secondResult = await getCache(secondUrl);
        if (secondResult) {
            return secondResult;
        }
    }
    return getCache(url);
}

function isFresh(response: Response): boolean {
    if (!response) {
        return false;
    }
    const expires = new Date(response.headers.get('expires') || EXPIRED_TIME);
    const cacheControl = parseCacheControl(response.headers.get('cache-control') || '');
    return (Number(expires) > Date.now() && !cacheControl['no-cache']);
}

// `Infinity` triggers a cache check after the first tile is loaded
// so that a check is run at least once on each page load.
let globalEntryCounter = Infinity;

// The cache check gets run on a worker. The reason for this is that
// profiling sometimes shows this as taking up significant time on the
// thread it gets called from. And sometimes it doesn't. It *may* be
// fine to run this on the main thread but out of caution this is being
// dispatched on a worker. This can be investigated further in the future.
export function cacheEntryPossiblyAdded(dispatcher: Dispatcher) {
    globalEntryCounter++;
    if (globalEntryCounter > cacheCheckThreshold) {
        dispatcher.getActor().notify('enforceCacheSizeLimit', cacheLimit);
        globalEntryCounter = 0;
    }
}

// runs on worker, see above comment
export async function enforceCacheSizeLimit(limit: number): Promise<void> {
    try {
        await getCacheProvider().enforceLimit(limit);
    } catch (e) {
        warnOnce((e as Error).message);
    }
}

export async function clearTileCache(): Promise<void> {
    try {
        await getCacheProvider().clear();
    } catch (e) {
        warnOnce((e as Error).message);
    }
}

export function setCacheLimits(limit: number, checkThreshold: number): void {
    cacheLimit = limit;
    cacheCheckThreshold = checkThreshold;
}
