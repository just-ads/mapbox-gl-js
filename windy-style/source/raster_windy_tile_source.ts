import RasterTileSource from '../../src/source/raster_tile_source';

import type {RasterSourceSpecification} from "../../src/style-spec/types";
import type Dispatcher from "../../src/util/dispatcher";
import type {Evented} from "../../src/util/evented";

class RasterWindyTileSource extends RasterTileSource<'raster-windy'> {
    constructor(id: string, options: RasterSourceSpecification, dispatcher: Dispatcher, eventedParent: Evented) {
        super(id, options, dispatcher, eventedParent);
        this.type = 'raster-windy';
    }

    override setTiles(tiles: Array<string>): this {
        this._options.tiles = tiles;
        this.tiles = this.map._requestManager.canonicalizeTileset(this._options as any, this._options.url);
        this.reload();
        return this;
    }

    override reload() {
        this.cancelTileJSONRequest();
        const sourceCache = this.map.style._sourceCaches[`other:${this.id}`];
        // @ts-expect-error
        sourceCache._reloading = true;

        sourceCache._preloadTiles(this.map.transform, (_error, result) => {
            const tiles = sourceCache._tiles;
            Object.keys(tiles).forEach(tileId => {
                sourceCache._removeTile(+tileId);
                delete tiles[tileId];
            });
            result.forEach(tile => {
                if (tile) tiles[tile.tileID.key] = tile;
            });
            // @ts-expect-error
            sourceCache._reloading = false;
            this.fire(new Event('idle'));
        });
    }

    _isSea() {
        return this._options && this._options.isSea;
    }

    _isPngTile() {
        return this.tiles[0].split('.').reverse()[0].toLowerCase().startsWith('png');
    }
}

export default RasterWindyTileSource;
