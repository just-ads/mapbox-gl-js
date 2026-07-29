import {VectorTile} from '@mapbox/vector-tile';
import {PbfReader} from 'pbf';
import {getArrayBuffer, isHttpNotFound} from '../util/ajax';

import type {DedupedRequest} from './deduped_request';
import type {Callback} from '../types/callback';
import type {Cancelable} from '../types/cancelable';
import type {WorkerSourceVectorTileRequest} from './worker_source';
import type {TaskMetadata} from '../util/scheduler';

export type LoadVectorTileResult = {
    rawData: ArrayBuffer;
    vectorTile?: VectorTile;
    headers?: Headers;
};

/**
 * Callback for vector tile data loading with a three-state contract:
 * - `(null, data)` — tile has data, render normally
 * - `(null, null)` — tile intentionally empty, render as empty (e.g. HTTP 404 on a sparse tileset)
 * - `(err)` — real error, propagate further (e.g. network error, invalid tile data)
 *
 * @private
 */
export type LoadVectorDataCallback = Callback<LoadVectorTileResult | null>;

export type LoadVectorData = (params: WorkerSourceVectorTileRequest, callback: LoadVectorDataCallback) => Cancelable['cancel'];

type VectorDataRequest = (callback: LoadVectorDataCallback) => Cancelable['cancel'];

/**
 * @private
 */
export function loadVectorTile(
    this: {deduped: DedupedRequest},
    params: WorkerSourceVectorTileRequest,
    callback: LoadVectorDataCallback,
    skipParse?: boolean,
): Cancelable['cancel'] {
    const key = JSON.stringify(params.request);

    const makeRequest: VectorDataRequest = (callback: LoadVectorDataCallback) => {
        const controller = new AbortController();
        getArrayBuffer(params.request, controller.signal)
            .then(({data, headers}) => {
                callback(null, {
                    rawData: data,
                    // vectorTile: skipParse ? undefined : new VectorTile(new Protobuf(data), undefined, params.vtOptions),
                    headers
                });
            })
            .catch((err: Error) => {
                if (err.name === 'AbortError') return;
                // HTTP 404 on a sparse tileset: the tile intentionally doesn't exist.
                // Convert to empty result — no parent fallback for HTTP sources.
                if (isHttpNotFound(err)) {
                    callback(null, null);
                } else {
                    callback(err);
                }
            });
        return () => {
            controller.abort();
            callback(null, null);
        };
    };

    if (params.data) {
        // if we already got the result earlier (on the main thread), return it directly
        this.deduped.entries[key] = {result: [null, params.data]};
    }

    const metadata: TaskMetadata = {type: 'parseTile', renderSourceType: params.renderSourceType, zoom: params.tileZoom};
    return this.deduped.request(key, metadata, makeRequest, callback);
}
