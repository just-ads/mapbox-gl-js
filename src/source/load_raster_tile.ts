import {getImage} from "../util/ajax";
import offscreenCanvasSupported from "../util/offscreen_canvas_supported";
import {asyncAll, isWorker} from "../util/util";

import type {Callback} from "../types/callback";
import type {Cancelable} from "../types/cancelable";
import type {RequestParameters} from "../util/ajax";
import type {WorkerSourceRasterTileRequest} from "./worker_source";

const supportImageBitmap = typeof createImageBitmap === 'function';

const transparentPngUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVQYV2NgAAIAAAUAAarVyFEAAAAASUVORK5CYII=';

function arrayBufferToImage(data: ArrayBuffer, callback: Callback<HTMLImageElement>) {
    const img: HTMLImageElement = new Image();
    img.onload = () => {
        callback(null, img);
        URL.revokeObjectURL(img.src);
        // prevent image dataURI memory leak in Safari;
        // but don't free the image immediately because it might be uploaded in the next frame
        // https://github.com/mapbox/mapbox-gl-js/issues/10226
        img.onload = null;
        requestAnimationFrame(() => {
            img.src = transparentPngUrl;
        });
    };
    img.onerror = () => callback(new Error('Could not load image. Please make sure to use a supported image type such as PNG or JPEG. Note that SVGs are not supported.'));
    const blob: Blob = new Blob([new Uint8Array(data)], {type: 'image/png'});
    img.src = data.byteLength ? URL.createObjectURL(blob) : transparentPngUrl;
}

function dataToTextureImage(data: ArrayBuffer | HTMLImageElement, cb: Callback<ImageBitmap | HTMLImageElement>) {
    if (data instanceof ArrayBuffer) {
        arrayBufferToImage(data, cb);
    } else {
        cb(null, data);
    }
}

function canvasToImage(canvas: HTMLCanvasElement | OffscreenCanvas, callback: Callback<ImageBitmap | HTMLCanvasElement>) {
    if (supportImageBitmap) {
        // console.log(canvas.toDataURL())
        createImageBitmap(canvas).then(imageBitmap => {
            callback(null, imageBitmap);
        }).catch(error => {
            callback(error);
        });
    } else {
        callback(null, canvas as HTMLCanvasElement);
    }
}

export type LoadRasterTile = (params: WorkerSourceRasterTileRequest, callback: Callback<ImageBitmap | HTMLCanvasElement>) => Cancelable;

/**
 * @private
 */
export function loadRasterTile(params: WorkerSourceRasterTileRequest, callback: Callback<ImageBitmap | HTMLCanvasElement>): Cancelable {
    const {requests, ltPixel, rbPixel} = params;

    const makeRequest = (requestParam: RequestParameters, cb: Callback<undefined>) => {
        // @ts-expect-error Property returnArraybuffer does not exist on type RequestParameters
        requestParam.returnArraybuffer = true;
        const request = getImage(requestParam, cb);
        return () => {
            request.cancel();
            cb();
        };
    };

    let canvas: OffscreenCanvas | HTMLCanvasElement,
        ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D,
        tileSize: number,
        dx: number,
        dy: number;

    const initConfig = (imageSize: number) => {
        if (!canvas) {
            canvas = offscreenCanvasSupported() ? new OffscreenCanvas(imageSize, imageSize) : (isWorker() ? null : document.createElement('canvas'));
            if (!canvas) return;
            // 计算都是基于256像素计算，所以使用的所有坐标要乘以 实际图片像素/256
            const scale = imageSize / 256;
            dx = -ltPixel.x * scale;
            dy = -ltPixel.y * scale;
            tileSize = imageSize;

            const size = Math.max(rbPixel.x - ltPixel.x, rbPixel.y - ltPixel.y) * scale;
            canvas.width = size;
            canvas.height = size;
            ctx = canvas.getContext('2d', {willReadFrequently: true});
        }
    };
    const draw = (data: ImageBitmap | HTMLImageElement, x: number, y: number) => {
        ctx.drawImage(data, x * tileSize + dx, y * tileSize + dy, data.width, data.height);
    };

    const cancels: (() => void)[] = [];
    // console.log(params);
    asyncAll(requests, (item, cb) => {
        const key = item.tile.key;
        if (this._subLoading[key]) {
            dataToTextureImage(this._subLoading[key], (_error, textureImage) => {
                if (textureImage) {
                    initConfig(textureImage.width);
                    draw(textureImage, item.x, item.y);
                }
                cb(null);
            });
        } else {
            const cancel = this.deduped.request(item.tile.key, null, makeRequest.bind(this, item.request), (error, data) => {
                if (error) {
                    delete this._subLoading[key];
                    return cb(null);
                }
                if (data) {
                    this._subLoading[key] = data;
                    dataToTextureImage(data, (_error, textureImage) => {
                        if (textureImage) {
                            initConfig(textureImage.width);
                            draw(textureImage, item.x, item.y);
                        }
                        cb(null);
                    });
                }
            });
            cancels.push(cancel);
        }
    }, () => {
        if (canvas) {
            // console.log(params.tileID, canvas.width, canvas.height, canvas.toDataURL());
            canvasToImage(canvas, callback);
        } else {
            callback(new Error('image failed to load'));
        }
    });
    return {
        cancel: () => {
            cancels.forEach(cancel => cancel());
        }
    };
}
