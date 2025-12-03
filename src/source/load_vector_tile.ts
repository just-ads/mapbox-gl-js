import {VectorTile} from '@mapbox/vector-tile';
import Protobuf from 'pbf';
import {getArrayBuffer} from '../util/ajax';

import type {DedupedRequest} from './deduped_request';
import type {Callback} from '../types/callback';
import type {WorkerSourceVectorTileRequest} from './worker_source';
import type {TaskMetadata} from '../util/scheduler';

export type LoadVectorTileResult = {
    rawData: ArrayBuffer;
    vectorTile?: VectorTile;
    responseHeaders?: Map<string, string>;
};

/**
 * @callback LoadVectorDataCallback
 * @param error
 * @param vectorTile
 * @private
 */
export type LoadVectorDataCallback = Callback<LoadVectorTileResult | null | undefined>;

export type LoadVectorData = (params: WorkerSourceVectorTileRequest, callback: LoadVectorDataCallback) => AbortVectorDataRequest | undefined;

type VectorDataRequest = (callback: LoadVectorDataCallback) => AbortVectorDataRequest;
type AbortVectorDataRequest = () => void;

/**
 * @private
 */
export function loadVectorTile(
    this: {deduped: DedupedRequest},
    params: WorkerSourceVectorTileRequest,
    callback: LoadVectorDataCallback,
    skipParse?: boolean,
): AbortVectorDataRequest {
    const key = JSON.stringify(params.request);

    const makeRequest: VectorDataRequest = (callback: LoadVectorDataCallback) => {
        const request = getArrayBuffer(params.request, (err?: Error | null, data?: ArrayBuffer | null, responseHeaders?: Headers) => {
            if (err) {
                callback(err);
            } else if (data) {
                callback(null, {
                    // @ts-expect-error TS2554: Expected 1 arguments, but got 3
                    vectorTile: skipParse ? undefined : new VectorTile(new Protobuf(data), undefined, params.vtOptions),
                    rawData: data,
                    responseHeaders: new Map(responseHeaders.entries())
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
        this.deduped.entries[key] = {result: [null, params.data]};
    }

    const callbackMetadata: TaskMetadata = {type: 'parseTile', isSymbolTile: params.isSymbolTile, zoom: params.tileZoom};
    return this.deduped.request(key, callbackMetadata, makeRequest, callback);
}
