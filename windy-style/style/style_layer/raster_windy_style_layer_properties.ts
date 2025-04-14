// This file is generated. Edit build/generate-style-code.ts, then run `npm run codegen`.
/* eslint-disable */

import styleSpec from '../../../src/style-spec/reference/latest';

import {
    Properties,
    DataConstantProperty
} from '../../../src/style/properties';

export type LayoutProps = {
    "visibility": DataConstantProperty<"visible" | "none">;
};
let layout: Properties<LayoutProps>;
export const getLayoutProperties = (): Properties<LayoutProps> => layout || (layout = new Properties({
    "visibility": new DataConstantProperty(styleSpec["layout_raster-windy"]["visibility"]),
}));

export type PaintProps = {
    "raster-windy-gradient": DataConstantProperty<string>;
    "raster-windy-render-mode": DataConstantProperty<string>;
    "raster-windy-opacity": DataConstantProperty<number>;
    "raster-windy-hue-rotate": DataConstantProperty<number>;
    "raster-windy-brightness-min": DataConstantProperty<number>;
    "raster-windy-brightness-max": DataConstantProperty<number>;
    "raster-windy-saturation": DataConstantProperty<number>;
    "raster-windy-contrast": DataConstantProperty<number>;
    "raster-windy-resampling": DataConstantProperty<"linear" | "nearest">;
};

let paint: Properties<PaintProps>;
export const getPaintProperties = (): Properties<PaintProps> => paint || (paint = new Properties({
    "raster-windy-gradient": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-gradient"]),
    "raster-windy-render-mode": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-render-mode"]),
    "raster-windy-opacity": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-opacity"]),
    "raster-windy-hue-rotate": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-hue-rotate"]),
    "raster-windy-brightness-min": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-brightness-min"]),
    "raster-windy-brightness-max": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-brightness-max"]),
    "raster-windy-saturation": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-saturation"]),
    "raster-windy-contrast": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-contrast"]),
    "raster-windy-resampling": new DataConstantProperty(styleSpec["paint_raster-windy"]["raster-windy-resampling"]),
}));
