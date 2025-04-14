import DepthMode from "../../src/gl/depth_mode";
import CullFaceMode from "../../src/gl/cull_face_mode";
import {rasterWindyUniformValues} from "./program/raster_windy_program";

import type Painter from "../../src/render/painter";
import type SourceCache from "../../src/source/source_cache";
import type RasterWindyStyleLayer from "../style/style_layer/raster_windy_style_layer";
import type {OverscaledTileID} from "../../src/source/tile_id";
import type {RasterWindyTile} from "../source/raster_windy_tile";

export default function drawRasterWindy(painter: Painter, sourceCache: SourceCache, layer: RasterWindyStyleLayer, tileIDs: Array<OverscaledTileID>, variableOffsets: any, isInitialLoad: boolean) {
    if (painter.renderPass !== 'translucent') return;
    if (layer.paint.get('raster-windy-opacity') === 0) return;
    if (!tileIDs.length) return;

    const context = painter.context;
    const gl = context.gl;
    const colorMode = painter.colorModeForDrapableLayerRenderPass();

    // When rendering to texture, coordinates are already sorted: primary by
    // proxy id and secondary sort is by Z.
    const renderingToTexture = painter.terrain && painter.terrain.renderingToTexture;

    const defines = layer.getDefines();
    const [gradient, gradient2] = layer.getGradients(gl);
    const [patt, patt2] = layer.buildExtraTexture(gl);
    const [stencilModes, coords] = renderingToTexture ? [{}, tileIDs] : painter.stencilConfigForOverlap(tileIDs);

    const minTileZ = coords[coords.length - 1].overscaledZ;
    const align = !painter.options.moving;

    if (gradient) {
        context.activeTexture.set(gl.TEXTURE2);
        gl.bindTexture(gl.TEXTURE_2D, gradient.texture);
    }

    if (gradient2) {
        context.activeTexture.set(gl.TEXTURE3);
        gl.bindTexture(gl.TEXTURE_2D, gradient2.texture);
    }

    if (patt) {
        context.activeTexture.set(gl.TEXTURE4);
        gl.bindTexture(gl.TEXTURE_2D, patt);
    }
    if (patt2) {
        context.activeTexture.set(gl.TEXTURE5);
        gl.bindTexture(gl.TEXTURE_2D, patt2);
    }

    for (const coord of coords) {
        const depthMode = renderingToTexture ? DepthMode.disabled : painter.depthModeForSublayer(coord.overscaledZ - minTileZ,
            layer.paint.get('raster-windy-opacity') === 1 ? DepthMode.ReadWrite : DepthMode.ReadOnly, gl.LESS);
        const unwrappedTileID = coord.toUnwrapped();

        const tile = sourceCache.getTile(coord);
        if (renderingToTexture && !(tile && tile.hasData())) continue;

        const projMatrix = (renderingToTexture) ? coord.projMatrix : painter.transform.calculateProjMatrix(unwrappedTileID, align);

        const stencilMode = painter.terrain && renderingToTexture ?
            painter.terrain.stencilModeForRTTOverlap(coord) :
            stencilModes[coord.overscaledZ];

        const textureFilter = layer.paint.get('raster-windy-resampling') === 'nearest' ? gl.NEAREST : gl.LINEAR;
        context.activeTexture.set(gl.TEXTURE0);
        tile.texture.bind(textureFilter, gl.CLAMP_TO_EDGE);

        // Enable trilinear filtering on tiles only beyond 20 degrees pitch,
        // to prevent it from compromising image crispness on flat or low tilted maps.
        // @ts-expect-error - TS2339 - Property 'useMipmap' does not exist on type 'Texture | UserManagedTexture'.
        if (tile.texture.useMipmap && context.extTextureFilterAnisotropic && painter.transform.pitch > 20) {
            gl.texParameterf(gl.TEXTURE_2D, context.extTextureFilterAnisotropic.TEXTURE_MAX_ANISOTROPY_EXT, context.extTextureFilterAnisotropicMax);
        }
        // console.log(coord.toString(), layer.getPars0(tile), layer.getPars1(), layer.getPars2())
        const uniformValues = rasterWindyUniformValues(
            <Float32Array<ArrayBufferLike>>projMatrix,
            layer,
            layer.getPars0(<RasterWindyTile>tile),
            layer.getPars1(),
            layer.getPars2()
        );
        const affectedByFog = painter.isTileAffectedByFog(coord);

        // @ts-expect-error
        const program = painter.getOrCreateProgram('rasterWindy', {defines, overrideFog: affectedByFog});

        painter.uploadCommonUniforms(context, program, unwrappedTileID);

        const {tileBoundsBuffer, tileBoundsIndexBuffer, tileBoundsSegments} = painter.getTileBoundsBuffers(tile);

        // @ts-expect-error - TS2554 - Expected 12-16 arguments, but got 11.
        program.draw(painter, gl.TRIANGLES, depthMode, stencilMode, colorMode, CullFaceMode.disabled,
            uniformValues, layer.id, tileBoundsBuffer,
            tileBoundsIndexBuffer, tileBoundsSegments);
    }
}
