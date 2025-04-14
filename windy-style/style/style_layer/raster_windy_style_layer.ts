import StyleLayer from "../../../src/style/style_layer";
import {getLayoutProperties, getPaintProperties} from "./raster_windy_style_layer_properties";
import getGradientObj from "../../util/gradients";
import createGradient from "../../util/create_windy_gradient";
import {createTextureFromSource} from "../../util/util";

import type {Gradient} from "../../util/create_windy_gradient";
import type {LayerSpecification} from "../../../src/style-spec/types";
import type {LUT} from "../../../src/util/lut";
import type {ConfigOptions, PossiblyEvaluated} from "../../../src/style/properties";
import type {RasterWindyTile} from "../../source/raster_windy_tile";
import type {PaintProps} from './raster_windy_style_layer_properties';

const RENDER_DEFINES = {
    'wind': ['VSIZE'],
    'rain': ['RAIN', 'LOG', 'PATT', 'PATT2'],
    'rain_accu': ['VSIZE', 'LOG'],
    'snow': ['LOG'],
    'light_density': ['VSIZE', 'LOG'],
    'clouds': ['PNG', 'CLOUDS', 'PATT'],
    'cbase': ['PNG'],
    'cclAltitude': ['PNG'],
    'waves': ['PNG', 'BCH'],
    'currents': ['VSIZE'],
    'currentsTide': ['VSIZE'],
    'no2': ['VSIZE', 'PNG', 'LOG'],
    'pm2p5': ['VSIZE', 'PNG', 'LOG'],
    'aod550': ['VSIZE', 'PNG', 'LOG'],
    'gtco3': ['VSIZE', 'PNG'],
    'tcso2': ['VSIZE', 'PNG', 'LOG'],
    'go3': ['VSIZE', 'PNG', 'LOG'],
    'cosc': ['VSIZE', 'LOG'],
    'dust': ['VSIZE', 'LOG'],
    'pressure': ['HIGHP', 'VSIZE', 'PNG'],
    'drought': ['PNG'],
    'moistureAnom40': ['PNG'],
    'moistureAnom100': ['PNG'],
    'soilMoisture': ['PNG'],
    'fwi': ['PNG'],
    'dfm10h': ['PNG'],
    'radar': ['RADAR', 'NORMAL'],
    'satellite': ['NORMAL', 'SATELLITE'],
    'visibility': ['HIGHP']
};

const EXTRA_RESOURCE = {
    rain1: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAC/klEQVRYw8WWMWsdRxDHfxPieG14pAgBfQAX0wkHAsLV9qlduslnyGc40h+uwxUpXLp1NRBIeXYpjIqUItWFgCAO1j/F7Z1X7+neOysSGhgWVqs3v5vdmfkD2HUuySTZ0t8XPAEdoOJd2Vv8HwPM3Tk6OuL8/JzT01MAJAFgZgBcd2bLHgK/A0+39t8Cz4B/WDDLOZskG4bB3H0nA+5uwzCYJMs5L31N/eXb3u3JwtUAEWHuPgO4u0XEDuA1LqAHGqAnI/IViGWACSIikqQuIlSsK3sz2J4fUgm+AU4QPfoMACC5e18Fn6yPiHQguAFtAYDMBtGgOQvLVzClWlKnZeuqc0vVkci0JXAzZ2BcE/kwgCT1kpqybtshACOTEG0JLESHSAhbBKjv0N2biNhIOqkhIkIrrqAGMVQ8Hzw/P8I2IhpJFIhmCl4eo30WxATACoBShklSGxGNu8/XUB5mWlGGu1nIKwGqRpTcvR0b4fj4SnWsaUQ38ttsxTe22xxGlX9r8GzdFdyN/2zwp8HD+wB4avCXgQye3wfAqzR1VvhN8NU+XfD/A7pjOY8rHCf4d25iIMGPcqfPmTSeuWWAnDEJG4YvzP11N1bx5Qzg/k5jFdPlvBZgfSMxd2wYMOkHi5Dc1UuXjaTe/VIRHyV9r2FAazOQyiBZre3csYhfbWzfaiRtJJ1EXPbj3hu5f6k1byCR51Faq5p+P8Q35v63Ragtc4QC0YxZ+Sh40u0HGKdYV41TbYF0uw1r8udT80rSDFGP9l76KU3n9wFMIqIWFXUmFgB+qfXCBFELmiS9MenBHoBJ22UaxAZxQqbfUrjXpP+xwR/mLou4KlxGPSlzV2lOXx98A6O2G8Ntis47IK8fmfvZHLyGqPfc3xs8WvEIoSXTkIvEPvAIxzJ8eeVrP8n6TxDD8NLWl+GYiVVlODaiYxuGDyXVtXYcIYbhg0nHtr4R3agVvzC42AGAC3N/UbXrOx1G3xm0Jp2ZdGbQlr09iog7scdlvVilhu7N/gMqKhn+GXrQ3AAAAABJRU5ErkJggg==',
    rain2: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAADy0lEQVRYw7WXX0iddRjHP895z9TZdOKfNE/oCtwyhpsISWCoCFs3k0W0yNhSKDQoY+A2hK12sYth0oUQwXYTiQ5rTSi6mBEh1P6AkIV5IZJhCG4qdmzq8Xg83y7O0Z2j2zwHz3ng4X2flxe+3+f35/v9/QwwouIp2NNC1VspHGaVxTXIdoyxvWl8/+WfMHuDRIdFZ5ulnpEtS6aIbJqSkfmebf1/x7nx8j4wCeOTb49pUtKRdfBeydjfkwzwKAKXoVpUS4OSJDVIsgXJMi7+Z5CZdALtcE0HerUexyXZOxMyaEoWeCSB3LPkrKjDt0Hg2C3JqLuTTPBIAh/Vu1ul6TC6V6rI6ZoxyEgqAffDzdD8z2vNkB+uvvOyGuwd5GDJc5D6NADpgJPu4raTD7cHgHuJ2oaVRqXKftkYffl9S/LI6zMFN21HyWj6y+CZRI2C23B+tfJb8kjyhwk8kJSlTVpwSTIuzRsUJHIKCsGTwuz03cW662uBRWkXuMYf+JeXXnU8dJ44AC7oBs53A+dfAaYTKYRuw40BKcAIIKAfcPcfumkKyoYkY0gGbyZjEQYgAEAQWAizGjlMaeD4J0dszuDofeDox0BfDA3taSHjg/aMk2mcxA9rvItjP2Zl7ebq1T+Ymfn6iV7QDswD9d8UfGGSrEIyyvvi6KrtMmektocLukGSTU3JMh/tJVGFA6Tlkeao4187LRmnhg1ccRAYb2dMGlO0ou5/vJds/djlbrSvJOPKnEFeHODVRrXOVisqjl18spdEFUXPQ9Wn50aLbEghfYhrUV0zelXfG4E+MaEKaIzJjIoBX252jfZ2yofnw+L4wHOMnBXL8ancF0Ggru5OWaxuWAMmcgdEbo9CdTwEWo1WWatUtg7+edeMHzI8MXoBE+BaYbYjFX5aCdXxRAs0QzPMAateL7v6egf9JSX7FlNT8ze2W2G6i9+cfO5HeIltmobq8DOO7iuNSlltSLKzJC1pSVr1+oYVVEqknA9LVhDtJTtVs5CXcEv2bQgkRdJIeBb6JbnXwRck82zyEvfOpfxZ8KTA9F06rwf4TAQDuBaC/mUWnMKR/hMvBEpdWBB4uRumHuElOx8B95bv7cD8i4du1q+F7fyNx3tJUk46DpSm/XxDjiS7cE9GzoXYlTAR6Ql7yQ/be0kyCOwu6unwVs1LRe5Tv2/nJQknUFzsbvSNSjp4Zc4HecWxKmGisub0uVG9PiTBS7EoaoIJZNcWe0JeIsC3najZ1tvxDg/YuQPATBGzDfuAv0P3zbhuxztJx6DWIhrbNv8HK0gxMglo6/cAAAAASUVORK5CYII=',
    clouds: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAADJJREFUOE9jbGhoaHB0dHTYv3//AXJoRktLS6vjx48fI5dmHHXBsdEwOD4aBscHQxgAAEci+Di5oB9xAAAAAElFTkSuQmCC'
};

class RasterWindyStyleLayer extends StyleLayer {
    gradient: Gradient;
    gradient2: Gradient;
    extraTextures: { [_: string]: WebGLTexture };
    override paint: PossiblyEvaluated<PaintProps>;

    constructor(layer: LayerSpecification, scope: string, lut: LUT | null, options?: ConfigOptions | null) {
        const properties = {
            layout: getLayoutProperties(),
            paint: getPaintProperties()
        };
        super(layer, properties, scope, lut, options);
        this.extraTextures = {};
    }

    override getProgramIds(): Array<string> {
        return ['raster-windy'];
    }

    override isDraped() {
        return true;
    }

    getGradients(gl: WebGL2RenderingContext): Gradient[] {
        if (!this.gradient) {
            const gradientType = this.getPaintProperty('raster-windy-gradient') as string;
            const randerMode = this.getPaintProperty('raster-windy-render-mode');
            this.gradient = createGradient(gl, getGradientObj(gradientType), randerMode === 'ptype', false);
            if (gradientType === 'clouds') {
                this.gradient2 = createGradient(gl, getGradientObj('rainClouds'), false, false);
            }
        }
        return [this.gradient, this.gradient2];
    }

    getPars0(tile: RasterWindyTile): [number, number, number, number] {
        const gradientType = this.getPaintProperty('raster-windy-gradient') as string;
        // if (gradientType === 'satellite') return [0, 0, 0, 0];
        const isBoolean = ['waves', 'wwaves', 'swell1', 'swell2', 'swell3'].includes(gradientType);
        const offset = ['rain', 'ptype', 'ccl'].includes(gradientType) ? .5 : 0;
        return tile.getTileColorMix(isBoolean, offset);
    }

    getPars1(): [number, number, number, number] {
        // const gradientType = this.getPaintProperty('windy-gradient');
        // if (gradientType === 'satellite') return [0, 0, 0, 0];
        const pars1 = [0, 0, 0, 0];
        if (this.gradient) {
            pars1[0] = this.gradient.mul;
            pars1[1] = this.gradient.add;
        }
        if (this.gradient2) {
            pars1[2] = this.gradient2.mul;
            pars1[3] = this.gradient2.add;
        }
        return pars1 as [number, number, number, number];
    }

    getPars2(): [number, number, number, number] {
        const gradientType = this.getPaintProperty('raster-windy-gradient');
        // if (gradientType === 'satellite') return [0, 0, 0, 0];
        const pars2 = [-.001, 0, 128 / 255, 0];
        if (gradientType === 'cloudtop') {
            pars2[2] = 111 / 255;
        }
        if (this.gradient.wTransformR > 0) {
            pars2[0] = this.gradient.wTransformR;
        }
        return pars2 as [number, number, number, number];
    }

    // isLayerDraped() {
    //     return true;
    // }

    getDefines(): string[] {
        const gradientType = this.getPaintProperty('raster-windy-gradient') as string;
        const randerMode = this.getPaintProperty('raster-windy-render-mode') as string;

        const defines = RENDER_DEFINES[gradientType] ? RENDER_DEFINES[gradientType].slice(0, Infinity) : [];
        if (randerMode === 'ptype') {
            defines.push('PTYPE');
        }
        return defines;
    }

    buildExtraTexture(gl: WebGLRenderingContext): WebGLTexture[] {
        const gradientType = this.getPaintProperty('raster-windy-gradient');
        const name = gradientType === 'rain' ? ['rain1', 'rain2'] :
            gradientType === 'clouds' ? ['clouds'] : [];

        return name.map(id => {
            let texture = this.extraTextures[id];
            if (texture) return texture;
            texture = this.extraTextures[id] = gl.createTexture();
            // eslint-disable-next-line no-undef
            const img = new window.Image();
            img.src = EXTRA_RESOURCE[id];
            img.onload = () => {
                createTextureFromSource(gl, img, texture);
                // console.log(createImageFromTexture(gl, texture, 16, 16));
            };
            return texture;
        });
        /*if (gradientType === 'rain') {
            return ['rain1', 'rain2'].map(id => {
                let texture = this.extraTextures[id];
                if (texture) return texture;
                texture = this.extraTextures[id] = gl.createTexture();
                // eslint-disable-next-line no-undef
                const img = new window.Image();
                img.src = EXTRA_RESOURCE[id];
                img.onload = () => {
                    createTextureFromSource(gl, img, texture);
                };
                return texture;
            });
        } else if (gradientType === 'clouds') {
            let texture = this.extraTextures['clouds'];
            if (!texture) {
                const data = new Uint8Array(1024);
                const color = [128, 192, 58, 0];
                let index = 0;
                for (let i = 0; i < 16; i++) {
                    for (let j = 0; j < 16; j++) {
                        for (let k = 0; k < 4; k++) {
                            data[index++] = color[(1 & j) + ((1 & i) << 1)];
                        }
                    }
                }
                texture = this.extraTextures['clouds'] = createTexture(gl, data, 16, 16, gl.NEAREST, gl.NEAREST, gl.REPEAT);
                console.log(createImageFromTexture(gl, texture, 16, 16));
            }
            return [texture];
        }*/
        // return [];
    }

}

export default RasterWindyStyleLayer;
