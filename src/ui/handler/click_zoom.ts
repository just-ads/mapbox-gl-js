import type Point from '@mapbox/point-geometry';
import type {Map} from '../map';
import type {Handler, HandlerResult} from '../handler';

export default class ClickZoomHandler implements Handler {
    _enabled: boolean;
    _active: boolean;

    constructor() {
        this.reset();
    }

    reset() {
        this._active = false;
    }

    blur() {
        this.reset();
    }

    dblclick(e: MouseEvent, point: Point): HandlerResult {
        e.preventDefault();
        return {
            cameraAnimation: (map: Map) => {
                map.easeTo({
                    duration: 300,
                    zoom: map.getZoom() + (e.shiftKey ? -1 : 1),
                    around: map.unproject(point)
                }, {originalEvent: e});
            }
        };
    }

    enable() {
        this._enabled = true;
    }

    disable() {
        this._enabled = false;
        this.reset();
    }

    isEnabled(): boolean {
        return this._enabled;
    }

    isActive(): boolean {
        return this._active;
    }
}
