import transformLngLat from "../geo/projection/coordinates_transform";
import {lngLatToTileFromZ} from "../geo/projection/tile_transform";
import {getTileSystem, lngLatToPixel} from "../geo/projection/tile_projection";
import {DedupedRequest} from "./deduped_request";
import {loadRasterTile} from "./load_raster_tile";
import {Evented} from "../util/evented";

import type {TileState} from "./tile";
import type {Callback} from "../types/callback";
import type {RequestParameters} from "../util/ajax";
import type {
    TileParameters,
    WorkerCoverTilesResult,
    WorkerSource
} from "./worker_source";
import type {Cancelable} from "../types/cancelable";
import type {LoadRasterTile} from "./load_raster_tile";
import type {CanonicalTileID} from "./tile_id";
import type {RasterProjection} from "../style-spec/types";

type Request = {
    request: RequestParameters,
    tile: CanonicalTileID,
    x: number,
    y: number
}

type WorkerTileParameters = {
    tileID: CanonicalTileID,
    requests: Request[],
    offset: number[],
    extent: number[],
}

type LoadingTile = {
    status: TileState,
    subTiles?: number[],
    request?: Cancelable
}

export default class RasterTileWorkerSource extends Evented implements WorkerSource {
    availableImages: Array<string>;
    _loading: { [_: number]: LoadingTile };
    _subLoading: { [_: number]: ImageBitmap };
    deduped: DedupedRequest;
    loadRasterTile: LoadRasterTile;

    constructor() {
        super();
        this._loading = {};
        this._subLoading = {};
        this.deduped = new DedupedRequest();
        this.loadRasterTile = loadRasterTile.bind(this);
    }

    getCoverTiles(params: {
        projection: RasterProjection,
        tile: CanonicalTileID,
        zoom: number
    }, callback: Callback<WorkerCoverTilesResult>) {
        return callback(null, this.reprojectedTile(params));
    }

    reprojectedTile(params: {
        projection: RasterProjection,
        tile: CanonicalTileID,
        zoom: number
    }): WorkerCoverTilesResult {
        const {tile, projection, zoom} = params;

        const actualZ = zoom || tile.z;
        const worldSize = 1 << actualZ;

        const {direction, fullExtent, transformExtent} = getTileSystem(projection);

        const bound = tile.toLngLatBounds();

        if (fullExtent) {
            if (!fullExtent.contains(bound.getNorthWest()) && !fullExtent.contains(bound.getSouthEast())) {
                return null;
            }
        }

        if (transformExtent) {
            if (!transformExtent.contains(bound.getNorthWest()) && !transformExtent.contains(bound.getSouthEast())) {
                return {
                    coverTiles: [{x: tile.x, y: tile.y, z: tile.z, dx: 0, dy: 0}],
                    ltPixel: {x: 0, y: 0},
                    rbPixel: {x: 256, y: 256}
                };
            }
        }
        const coverTiles = [];

        // 转换成对应投影的坐标
        // 左上
        const northWest = transformLngLat(bound.getNorthWest(), 'WGS84', projection);
        // 右下
        const southEast = transformLngLat(bound.getSouthEast(), 'WGS84', projection);

        const northwestTile = lngLatToTileFromZ(northWest, actualZ, projection);
        const southeastTile = lngLatToTileFromZ(southEast, actualZ, projection);

        const xMin = direction.x > 0 ? northwestTile.x : southeastTile.x;
        const xMax = direction.x > 0 ? southeastTile.x : northwestTile.x;
        const yMin = direction.y > 0 ? northwestTile.y : southeastTile.y;
        const yMax = direction.y > 0 ? southeastTile.y : northwestTile.y;

        const yRange = yMax - yMin;
        let xRange = xMax - xMin;
        // 穿过子午线
        if (xMin > xMax) {
            xRange = worldSize - xMin;
            xRange += xMax;
        }
        for (let x = 0; x < xRange + 1; x++) {
            for (let y = 0; y < yRange + 1; y++) {
                const tileX = (xMin + x) % worldSize, tileY = yMin + y;
                const dx = x * direction.x + (direction.x < 0 ? xRange : 0);
                const dy = y * direction.y + (direction.y < 0 ? yRange : 0);
                coverTiles.push({x: tileX, y: tileY, z: actualZ, dx, dy});
            }
        }

        // 左上角像素坐标
        const ltPixel = lngLatToPixel(northWest, actualZ, projection);
        // 右下角像素坐标
        const rbPoint = lngLatToPixel(southEast, actualZ, projection);

        const rbPixel = {x: rbPoint.x + 256 * xRange, y: rbPoint.y + 256 * yRange};

        return {
            coverTiles,
            ltPixel,
            rbPixel
        };
    }

    // @ts-ignore
    loadTile(params: WorkerTileParameters & WorkerCoverTilesResult, callback) {
        const key = params.tileID.key;
        const loading = this._loading[key] = this._loading[key] || {status: 'loading'};
        loading.request = this.loadRasterTile(params, (error, result) => {
            delete this._loading[key];
            if (loading.status === 'unloaded') return callback(null);
            callback(error, result);
        });
        this.limitedStorage();
    }

    limitedStorage() {
        const subLoading = Object.keys(this._subLoading);
        if (subLoading.length > 300) {
            // 删除复用率较低的
            for (let i = 0; i < subLoading.length - 80; i++) {
                delete this._subLoading[subLoading[i]];
            }
        }
    }

    abortTile(params: TileParameters & { tileID: CanonicalTileID }) {
        const {tileID} = params;
        const loading = this._loading[tileID.key];
        if (loading && loading.request) {
            loading.request.cancel();
            delete this._loading[tileID.key];
        }
    }

    removeTile(params: TileParameters & { tileID: CanonicalTileID }) {
        this.abortTile(params);
    }

}
