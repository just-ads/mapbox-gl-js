import {Uniform1f, Uniform1i, Uniform3f, Uniform4f, UniformMatrix4f} from "../../../src/render/uniform_binding";

import type Context from "../../../src/gl/context";
import type {UniformValues} from "../../../src/render/uniform_binding";
import type RasterWindyStyleLayer from "../../style/style_layer/raster_windy_style_layer";

export type RasterWindyUniformsType = {
    'u_matrix': UniformMatrix4f,
    'u_opacity': Uniform1f,
    'u_image': Uniform1i,
    'u_brightness_low': Uniform1f,
    'u_brightness_high': Uniform1f,
    'u_saturation_factor': Uniform1f,
    'u_contrast_factor': Uniform1f,
    'u_spin_weights': Uniform3f,

    'u_gradient': Uniform1i,
    'u_gradient1': Uniform1i,
    'u_pars0': Uniform4f,
    'u_pars1': Uniform4f,
    'u_pars2': Uniform4f,

    'u_patt0': Uniform1i,
    'u_patt1': Uniform1i
}

const rasterWindyUniforms = (context: Context): RasterWindyUniformsType => ({
    'u_matrix': new UniformMatrix4f(context),
    'u_opacity': new Uniform1f(context),
    'u_image': new Uniform1i(context),
    'u_brightness_low': new Uniform1f(context),
    'u_brightness_high': new Uniform1f(context),
    'u_saturation_factor': new Uniform1f(context),
    'u_contrast_factor': new Uniform1f(context),
    'u_spin_weights': new Uniform3f(context),

    'u_gradient': new Uniform1i(context),
    'u_gradient1': new Uniform1i(context),
    'u_pars0': new Uniform4f(context),
    'u_pars1': new Uniform4f(context),
    'u_pars2': new Uniform4f(context),

    'u_patt0': new Uniform1i(context),
    'u_patt1': new Uniform1i(context)
});

const rasterWindyUniformValues = (
    matrix: Float32Array,
    layer: RasterWindyStyleLayer,
    pars0: [number, number, number, number],
    pars1: [number, number, number, number],
    pars2: [number, number, number, number]
): UniformValues<RasterWindyUniformsType> => ({
    'u_matrix': matrix,
    'u_opacity': layer.paint.get('raster-windy-opacity'),
    'u_image': 0,
    'u_brightness_low': layer.paint.get('raster-windy-brightness-min'),
    'u_brightness_high': layer.paint.get('raster-windy-brightness-max'),
    'u_saturation_factor': saturationFactor(layer.paint.get('raster-windy-saturation')),
    'u_contrast_factor': contrastFactor(layer.paint.get('raster-windy-contrast')),
    'u_spin_weights': spinWeights(layer.paint.get('raster-windy-hue-rotate')),
    'u_gradient': 2,
    'u_gradient1': 3,
    'u_pars0': pars0,
    'u_pars1': pars1,
    'u_pars2': pars2,

    'u_patt0': 4,
    'u_patt1': 5
});

function spinWeights(angle: number): [number, number, number] {
    angle *= Math.PI / 180;
    const s = Math.sin(angle);
    const c = Math.cos(angle);
    return [
        (2 * c + 1) / 3,
        (-Math.sqrt(3) * s - c + 1) / 3,
        (Math.sqrt(3) * s - c + 1) / 3
    ];
}

function contrastFactor(contrast: number) {
    return contrast > 0 ?
        1 / (1 - contrast) :
        1 + contrast;
}

function saturationFactor(saturation: number) {
    return saturation > 0 ?
        1 - 1 / (1.001 - saturation) :
        -saturation;
}

export {rasterWindyUniforms, rasterWindyUniformValues};
