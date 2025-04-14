import Tile from "../../src/source/tile";
import browser from "../../src/util/browser";

import type {TextureImage} from "../../src/render/texture";
import type Painter from "../../src/render/painter";

export class RasterWindyTile extends Tile {
    _headerPars?: number[];
    _cloud?: ImageData;

    override setTexture(img: TextureImage, painter: Painter) {
        super.setTexture(img, painter);
        // @ts-expect-error
        this.setTileColorRange(img, 257);
    }

    setTileColorRange(img: ImageBitmap | HTMLImageElement, size: number) {
        if (this._headerPars) return;
        const {data} = browser.getImageData(img);
        let pointer = 4 * size * 4 + 8;
        const rgbUit8Array = new Uint8Array(28);
        for (let i = 0; i < 28; i++) {
            const r = Math.round(data[pointer] / 64);
            const g = Math.round(data[pointer + 1] / 16);
            const b = Math.round(data[pointer + 2] / 64);
            rgbUit8Array[i] = (r << 6) + (g << 2) + b;
            pointer += 16;
        }
        const rgb32f = new Float32Array(rgbUit8Array.buffer);
        this._headerPars = [
            rgb32f[1] - rgb32f[0], rgb32f[0],
            rgb32f[3] - rgb32f[2], rgb32f[2],
            rgb32f[5] - rgb32f[4], rgb32f[4]
        ];
        this._cloud = new ImageData(data.slice(img.width * 8 * 4, Infinity), img.width, img.height - 8);
    }

    getTileColorMix(boolean: boolean = false, offset: number = 0): [number, number, number, number] {
        const p = this._headerPars;
        return boolean ? [p[4], p[5], 0, 0] : [p[0], p[1], p[2], p[3] + offset];
    }
}
