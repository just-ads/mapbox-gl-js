import {VectorTile} from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import {getArrayBuffer} from '../util/ajax';

import type {DedupedRequest} from './deduped_request';

import type {Callback} from '../types/callback';
import type {WorkerSourceVectorTileRequest} from './worker_source';

export type LoadVectorTileResult = {
    rawData: ArrayBuffer;
    vectorTile?: VectorTile;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expires?: any;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cacheControl?: any;
    resourceTiming?: Array<PerformanceResourceTiming>;
};

/**
 * @callback LoadVectorDataCallback
 * @param error
 * @param vectorTile
 * @private
 */
export type LoadVectorDataCallback = Callback<LoadVectorTileResult | null | undefined>;

export type AbortVectorData = () => void;
export type LoadVectorData = (params: WorkerSourceVectorTileRequest, callback: LoadVectorDataCallback) => AbortVectorData | undefined;

/**
 * @private
 */
export function loadVectorTile(
    params: WorkerSourceVectorTileRequest & {vtOptions: any},
    callback: LoadVectorDataCallback,
    skipParse?: boolean,
): () => void {
    const key = JSON.stringify(params.request);

    const makeRequest = (callback: LoadVectorDataCallback) => {
        const request = getArrayBuffer(params.request, (err?: Error | null, data?: ArrayBuffer | null, cacheControl?: string | null, expires?: string | null) => {
            if (err) {
                callback(err);
            } else if (data) {
                callback(null, {
                    // @ts-ignore
                    vectorTile: skipParse ? undefined : new VectorTile(new Protobuf(data), undefined, params.vtOptions),
                    rawData: data,
                    cacheControl,
                    expires
                });
            }
        });
        return () => {
            request.cancel();
            callback();
        };
    };

    if (params.data) {
        // if we already got the result earlier (on the main thread), return it directly
        (this.deduped as DedupedRequest).entries[key] = {result: [null, params.data]};
    }

    const callbackMetadata = {type: 'parseTile', isSymbolTile: params.isSymbolTile, zoom: params.tileZoom};
    return (this.deduped as DedupedRequest).request(key, callbackMetadata, makeRequest, callback);
}
