import {getImage} from "../util/ajax";

import type {
    WorkerSource,
    WorkerSourceOptions,
    WorkerSourceRasterRequest,
    WorkerSourceRasterResult,
    WorkerSourceTileRequest
} from "./worker_source";
import type {TileProvider} from "mapbox-gl";
import type {Cancelable} from "../types/cancelable";

class RasterTileWorkerSource implements WorkerSource {
    tileProvider?: TileProvider<ArrayBuffer | ImageBitmap>;
    loading: Record<number, Cancelable>;

    constructor(options: WorkerSourceOptions) {
        this.tileProvider = options.tileProvider;
        this.loading = {};
    }

    async loadTile(params: WorkerSourceRasterRequest): Promise<WorkerSourceRasterResult | null> {
        const uid = params.uid;
        const controller = new AbortController();
        this.loading[uid] = {cancel: () => controller.abort()};

        if (this.tileProvider) {
            return this.loadTileWithProvider(this.tileProvider, uid, params, controller);
        }

        try {
            return await getImage(params.request, controller.signal);
        } catch (err) {
            if (controller.signal.aborted) return null;
            throw err;
        } finally {
            delete this.loading[uid];
        }
    }

    async loadTileWithProvider(provider: TileProvider<ArrayBuffer | ImageBitmap>, uid: number, params: WorkerSourceRasterRequest, controller: AbortController): Promise<WorkerSourceRasterResult | null> {
        const {z, x, y} = params.tileID.canonical;
        try {
            const response = await provider.loadTile({z, x, y}, {request: params.request, signal: controller.signal});

            if (controller.signal.aborted) return null;

            if (response == null) {
                const err: Error & { status?: number } = new Error('Tile not found');
                err.status = 404;
                throw err;
            }

            if (response.data == null) return null;

            const headers = new Headers();
            if (response.expires) headers.set('expires', response.expires);
            if (response.cacheControl) headers.set('cache-control', response.cacheControl);

            return {data: response.data, headers};
        } catch (err) {
            if (controller.signal.aborted) return null;
            throw err;
        } finally {
            delete this.loading[uid];
        }
    }

    async reloadTile(_params: WorkerSourceTileRequest) {
        // No-op: Raster tiles have no persistent worker-side state to reload
    }

    abortTile(params: WorkerSourceTileRequest) {
        const uid = params.uid;
        const tile = this.loading[uid];
        if (tile) {
            tile.cancel();
            delete this.loading[uid];
        }
    }

    removeTile(params: WorkerSourceTileRequest) {
        // No-op in the RasterTileWorkerSource class
    }
}

export default RasterTileWorkerSource;
