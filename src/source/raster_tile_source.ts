import {extend, pick} from '../util/util';
import {getImage, ResourceType} from '../util/ajax';
import {Event, ErrorEvent, Evented} from '../util/evented';
import loadTileJSON from './load_tilejson';
import {postTurnstileEvent} from '../util/mapbox';
import TileBounds from './tile_bounds';
import browser from '../util/browser';
import {cacheEntryPossiblyAdded} from '../util/tile_request_cache';
import {CanonicalTileID} from "./tile_id";
import offscreenCanvasSupported from "../util/offscreen_canvas_supported";
import {DedupedRequest} from "./deduped_request";
import {makeFQID} from "../util/fqid";
import {loadRasterTile} from "./load_raster_tile";
import Texture from '../render/texture';

import type {ISource, SourceEvents, SourceRasterLayer} from './source';
import type {OverscaledTileID} from './tile_id';
import type {Map} from '../ui/map';
import type Dispatcher from '../util/dispatcher';
import type Tile from './tile';
import type {Callback} from '../types/callback';
import type {Cancelable} from '../types/cancelable';
import type {
    RasterSourceSpecification,
    RasterDEMSourceSpecification,
    RasterArraySourceSpecification, RasterProjection, CustomTags
} from '../style-spec/types';
import type Actor from '../util/actor';
import type {WorkerCoverTilesResult} from "./worker_source";

/**
 * A source containing raster tiles.
 * See the [Style Specification](https://docs.mapbox.com/mapbox-gl-js/style-spec/sources/#raster) for detailed documentation of options.
 *
 * @example
 * map.addSource('some id', {
 *     type: 'raster',
 *     url: 'mapbox://mapbox.satellite',
 *     tileSize: 256
 * });
 *
 * @example
 * map.addSource('some id', {
 *     type: 'raster',
 *     tiles: ['https://img.nj.gov/imagerywms/Natural2015?bbox={bbox-epsg-3857}&format=image/png&service=WMS&version=1.1.1&request=GetMap&srs=EPSG:3857&transparent=true&width=256&height=256&layers=Natural2015'],
 *     tileSize: 256
 * });
 *
 * @see [Example: Add a raster tile source](https://docs.mapbox.com/mapbox-gl-js/example/map-tiles/)
 * @see [Example: Add a WMS source](https://docs.mapbox.com/mapbox-gl-js/example/wms/)
 */
class RasterTileSource<T extends 'raster' | 'raster-dem' | 'raster-array' | 'raster-windy' = 'raster'> extends Evented<SourceEvents> implements ISource {
    type: T;
    id: string;
    scope: string;
    minzoom: number;
    maxzoom: number;
    url: string;
    scheme: string;
    attribution: string | undefined;
    // eslint-disable-next-line camelcase
    mapbox_logo: boolean | undefined;
    tileSize: number;
    customTags?: CustomTags;
    projection?: RasterProjection;
    minTileCacheSize: number | null | undefined;
    maxTileCacheSize: number | null | undefined;
    vectorLayers?: never;
    vectorLayerIds?: never;
    rasterLayers?: Array<SourceRasterLayer>;
    rasterLayerIds?: Array<string>;

    bounds: [number, number, number, number] | null | undefined;
    tileBounds: TileBounds;
    roundZoom: boolean | undefined;
    reparseOverscaled: boolean | undefined;
    dispatcher: Dispatcher;
    map: Map;
    tiles: Array<string>;
    actor: Actor;

    _deduped: DedupedRequest;
    _subLoading: Record<string, any>;

    _loaded: boolean;
    _options: RasterSourceSpecification | RasterDEMSourceSpecification | RasterArraySourceSpecification;
    _tileJSONRequest: Cancelable | null | undefined;

    prepare: undefined;
    afterUpdate: undefined;
    _clear: undefined;

    constructor(id: string, options: RasterSourceSpecification | RasterDEMSourceSpecification | RasterArraySourceSpecification, dispatcher: Dispatcher, eventedParent: Evented) {
        super();
        this.id = id;
        this.dispatcher = dispatcher;
        this.setEventedParent(eventedParent);

        this.type = 'raster' as T;
        this.minzoom = 0;
        this.maxzoom = 22;
        this.roundZoom = true;
        this.scheme = 'xyz';
        this.tileSize = 512;
        this._loaded = false;

        this._deduped = new DedupedRequest();
        this._subLoading = {};

        this._options = extend({type: 'raster'}, options);
        extend(this, pick(options, ['url', 'scheme', 'tileSize', 'projection', 'customTags']));
    }

    load(callback?: Callback<undefined>) {
        this._loaded = false;
        this.fire(new Event('dataloading', {dataType: 'source'}));
        this._tileJSONRequest = loadTileJSON(this._options, this.map._requestManager, null, null, (err, tileJSON) => {
            this._tileJSONRequest = null;
            this._loaded = true;
            if (err) {
                this.fire(new ErrorEvent(err));
            } else if (tileJSON) {
                extend(this, tileJSON);

                if (tileJSON.raster_layers) {
                    this.rasterLayers = tileJSON.raster_layers;
                    this.rasterLayerIds = this.rasterLayers.map(layer => layer.id);
                }

                if (tileJSON.bounds) this.tileBounds = new TileBounds(tileJSON.bounds, this.minzoom, this.maxzoom);

                postTurnstileEvent(tileJSON.tiles);

                // `content` is included here to prevent a race condition where `Style#updateSources` is called
                // before the TileJSON arrives. this makes sure the tiles needed are loaded once TileJSON arrives
                // ref: https://github.com/mapbox/mapbox-gl-js/pull/4347#discussion_r104418088
                this.fire(new Event('data', {dataType: 'source', sourceDataType: 'metadata'}));
                this.fire(new Event('data', {dataType: 'source', sourceDataType: 'content'}));
            }

            if (callback) callback(err);
        });
    }

    loaded(): boolean {
        return this._loaded;
    }

    onAdd(map: Map) {
        this.map = map;
        this.load();
    }

    /**
     * Reloads the source data and re-renders the map.
     *
     * @example
     * map.getSource('source-id').reload();
     */
    reload() {
        this.cancelTileJSONRequest();
        const fqid = makeFQID(this.id, this.scope);
        this.load(() => this.map.style.clearSource(fqid));
    }

    /**
     * Sets the source `tiles` property and re-renders the map.
     *
     * @param {string[]} tiles An array of one or more tile source URLs, as in the TileJSON spec.
     * @returns {RasterTileSource} Returns itself to allow for method chaining.
     * @example
     * map.addSource('source-id', {
     *     type: 'raster',
     *     tiles: ['https://some_end_point.net/{z}/{x}/{y}.png'],
     *     tileSize: 256
     * });
     *
     * // Set the endpoint associated with a raster tile source.
     * map.getSource('source-id').setTiles(['https://another_end_point.net/{z}/{x}/{y}.png']);
     */
    setTiles(tiles: Array<string>): this {
        this._options.tiles = tiles;
        this.reload();

        return this;
    }

    /**
     * Sets the source `url` property and re-renders the map.
     *
     * @param {string} url A URL to a TileJSON resource. Supported protocols are `http:`, `https:`, and `mapbox://<Tileset ID>`.
     * @returns {RasterTileSource} Returns itself to allow for method chaining.
     * @example
     * map.addSource('source-id', {
     *     type: 'raster',
     *     url: 'mapbox://mapbox.satellite'
     * });
     *
     * // Update raster tile source to a new URL endpoint
     * map.getSource('source-id').setUrl('mapbox://mapbox.satellite');
     */
    setUrl(url: string): this {
        this.url = url;
        this._options.url = url;
        this.reload();

        return this;
    }

    onRemove(_: Map) {
        this.cancelTileJSONRequest();
    }

    serialize(): RasterSourceSpecification | RasterDEMSourceSpecification {
        return extend({}, this._options);
    }

    hasTile(tileID: OverscaledTileID): boolean {
        return !this.tileBounds || this.tileBounds.contains(tileID.canonical);
    }

    needRevise() {
        return this.projection && this.projection !== 'MERCATOR';
    }

    loadTile(tile: Tile, callback: Callback<undefined>) {
        const use2x = browser.devicePixelRatio >= 2;
        const imageLoaded = (error, data, cacheControl, expires) => {
            delete tile.request;

            if (tile.aborted) {
                tile.state = 'unloaded';
                return callback(null);
            }

            if (error) {
                tile.state = 'errored';
                return callback(error);
            }

            if (!data) return callback(null);

            if (this.map._refreshExpiredTiles) tile.setExpiryData({cacheControl, expires});
            tile.setTexture(data, this.map.painter);
            tile.state = 'loaded';

            cacheEntryPossiblyAdded(this.dispatcher);
            callback(null);
        };

        if (this.needRevise()) {
            this.loadOtherProjectionTile(tile, imageLoaded);
        } else {
            const url = this.map._requestManager.normalizeTileURL(tile.tileID.canonical.url(this.tiles, this.scheme), use2x, this.tileSize);
            // @ts-ignore
            const request = this.map._requestManager.transformRequest(url, ResourceType.Tile, this.customTags, tile.tileID.canonical);
            // @ts-ignore
            tile._url = request.url;
            tile.request = getImage(request, imageLoaded);
        }
    }

    loadOtherProjectionTile(tile: Tile, callback: (error, data?, cacheControl?, expires?) => (void)) {
        const use2x = browser.devicePixelRatio >= 2;
        if (!tile.actor) {
            tile.actor = this.dispatcher.getActor();
        }
        // 计算覆盖的瓦片
        tile.actor.send(`${this.type}.getCoverTiles`, {
            tile: tile.tileID.canonical,
            projection: this.projection,
            source: this.id,
            type: this.type,
            scope: this.scope
        }, (err, data: WorkerCoverTilesResult) => {
            if (tile.state === 'unloaded') return callback(null);
            if (!data) return callback(err);
            const coverTiles = data.coverTiles;
            const requests = coverTiles.map(item => {
                const ti = new CanonicalTileID(item.z, item.x, item.y);
                const url = this.map._requestManager.normalizeTileURL(ti.url(this.tiles, this.scheme), use2x, this.tileSize);
                return {
                    // @ts-ignore
                    request: this.map._requestManager.transformRequest(url, ResourceType.Tile, this.customTags, ti),
                    tile: ti,
                    x: item.dx,
                    y: item.dy
                };
            });
            const params = {
                requests,
                ltPixel: data.ltPixel,
                rbPixel: data.rbPixel,
                tileID: tile.tileID.canonical,
                source: this.id,
                type: this.type,
                scope: this.scope
            };

            if (offscreenCanvasSupported()) {
                tile.actor.send('loadTile', params, callback);
            } else {
                tile.request = loadRasterTile.call(this, params, callback);
                this.limitedStorage();
            }
        });
    }

    limitedStorage() {
        const subLoading = Object.keys(this._subLoading);
        if (subLoading.length > 300) {
            // 中间的复用率较低
            for (let i = 0; i < subLoading.length - 80; i++) {
                delete this._subLoading[subLoading[i]];
            }
        }
    }

    abortTile(tile: Tile, callback?: Callback<undefined>) {
        tile.aborted = true;
        tile.state = 'unloaded';
        if (tile.request) {
            tile.request.cancel();
            delete tile.request;
        }
        if (tile.actor && this.type === 'raster') {
            tile.actor.send('abortTile', {
                uid: tile.uid,
                tileID: tile.tileID.canonical,
                type: this.type,
                source: this.id,
                scope: this.scope
            });
        }
        if (callback) callback();
    }

    unloadTile(tile: Tile, callback?: Callback<undefined>) {
        tile.aborted = true;
        tile.state = 'unloaded';
        // Cache the tile texture to avoid re-allocating Textures if they'll just be reloaded
        if (tile.texture && tile.texture instanceof Texture) {
            // Clean everything else up owned by the tile, but preserve the texture.
            // Destroy first to prevent racing with the texture cache being popped.
            tile.destroy(true);

            // Save the texture to the cache
            if (tile.texture && tile.texture instanceof Texture) {
                this.map.painter.saveTileTexture(tile.texture);
            }
        } else {
            tile.destroy();
        }
        if (tile.actor && this.type === 'raster') {
            tile.actor.send('removeTile', {
                uid: tile.uid,
                tileID: tile.tileID.canonical,
                type: this.type,
                source: this.id,
                scope: this.scope
            });
        }
        if (callback) callback();
    }

    hasTransition(): boolean {
        return false;
    }

    cancelTileJSONRequest() {
        if (!this._tileJSONRequest) return;
        this._tileJSONRequest.cancel();
        this._tileJSONRequest = null;
    }
}

export default RasterTileSource;
