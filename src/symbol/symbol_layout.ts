import Anchor from './anchor';
import {getAnchors, getCenterAnchor} from './get_anchors';
import clipLine from './clip_line';
import {shapeText, shapeIcon, WritingMode, fitIconToText} from './shaping';
import {getGlyphQuads, getIconQuads} from './quads';
import {warnOnce, degToRad, clamp} from '../util/util';
import {
    allowsVerticalWritingMode,
    allowsLetterSpacing
} from '../util/script_detection';
import findPoleOfInaccessibility from '../util/find_pole_of_inaccessibility';
import classifyRings from '../util/classify_rings';
import EXTENT from '../style-spec/data/extent';
import EvaluationParameters from '../style/evaluation_parameters';
import {getRasterizedIconSize, SIZE_PACK_FACTOR} from './symbol_size';
import ONE_EM from './one_em';
import Point from '@mapbox/point-geometry';
import murmur3 from 'murmurhash-js';

import type SymbolBucket from '../data/bucket/symbol_bucket';
import type {CanonicalTileID} from '../source/tile_id';
import type {Shaping, PositionedIcon, TextJustify} from './shaping';
import type {CollisionBoxArray} from '../data/array_types';
import type {SymbolFeature} from '../data/bucket/symbol_bucket';
import type {StyleImage} from '../style/style_image';
import type {StyleGlyph} from '../style/style_glyph';
import type SymbolStyleLayer from '../style/style_layer/symbol_style_layer';
import type {ImagePosition} from '../render/image_atlas';
import type {GlyphPositions} from '../render/glyph_atlas';
import type {PossiblyEvaluatedPropertyValue} from '../style/properties';
import type Projection from '../geo/projection/projection';
import type {vec3} from 'gl-matrix';

// The symbol layout process needs `text-size` evaluated at up to five different zoom levels, and
// `icon-size` at up to three:
//
//   1. `text-size` at the zoom level of the bucket. Used to calculate a per-feature size for source `text-size`
//       expressions, and to calculate the box dimensions for icon-text-fit.
//   2. `icon-size` at the zoom level of the bucket. Used to calculate a per-feature size for source `icon-size`
//       expressions.
//   3. `text-size` and `icon-size` at the zoom level of the bucket, plus one. Used to calculate collision boxes.
//   4. `text-size` at zoom level 18. Used for something line-symbol-placement-related.
//   5.  For composite `*-size` expressions: two zoom levels of curve stops that "cover" the zoom level of the
//       bucket. These go into a vertex buffer and are used by the shader to interpolate the size at render time.
//
// (1) and (2) are stored in `bucket.layers[0].layout`. The remainder are below.
//
type Sizes = {
    textScaleFactor: number
    iconScaleFactor: number
    textSizeScaleRange: [number, number]
    iconSizeScaleRange: [number, number]
    layoutTextSize: PossiblyEvaluatedPropertyValue<number> // (3);
    layoutIconSize: PossiblyEvaluatedPropertyValue<number> // (3);
    textMaxSize: PossiblyEvaluatedPropertyValue<number>    // (4);
    compositeTextSizes: [PossiblyEvaluatedPropertyValue<number>, PossiblyEvaluatedPropertyValue<number>] // (5);
    compositeIconSizes: [PossiblyEvaluatedPropertyValue<number>, PossiblyEvaluatedPropertyValue<number>] // (5);
};

type ImageTextAnchor = 'image-top' | 'image-bottom' | 'image-right' | 'image-left'
export type TextAnchor = 'center' | 'left' | 'right' | 'top' | 'bottom' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

// The radial offset is to the edge of the text box
// In the horizontal direction, the edge of the text box is where glyphs start
// But in the vertical direction, the glyphs appear to "start" at the baseline
// We don't actually load baseline data, but we assume an offset of ONE_EM - 17
// (see "yOffset" in shaping.js)
const baselineOffset = 7;
const INVALID_TEXT_OFFSET = Number.POSITIVE_INFINITY;
const sqrt2 = Math.sqrt(2);

export const SymbolBucketConstants = {
    // this constant is based on the size of StructArray indexes used in a symbol
    // bucket--namely, glyphOffsetArrayStart
    // eg the max valid UInt16 is 65,535
    // See https://github.com/mapbox/mapbox-gl-js/issues/2907 for motivation
    // lineStartIndex and textBoxStartIndex could potentially be concerns
    // but we expect there to be many fewer boxes/lines than glyphs
    MAX_GLYPHS: 65535
} as const;

export function evaluateVariableOffset(anchor: TextAnchor, [offsetX, offsetY]: [any, any]): [number, number] {
    let x = 0, y = 0;

    if (offsetY === INVALID_TEXT_OFFSET) { // radial offset
        if (offsetX < 0) offsetX = 0; // Ignore negative offset.
        // solve for r where r^2 + r^2 = offsetX^2
        const hypotenuse = offsetX / sqrt2;
        switch (anchor) {
        case 'top-right':
        case 'top-left':
            y = hypotenuse - baselineOffset;
            break;
        case 'bottom-right':
        case 'bottom-left':
            y = -hypotenuse + baselineOffset;
            break;
        case 'bottom':
            y = -offsetX + baselineOffset;
            break;
        case 'top':
            y = offsetX - baselineOffset;
            break;
        }

        switch (anchor) {
        case 'top-right':
        case 'bottom-right':
            x = -hypotenuse;
            break;
        case 'top-left':
        case 'bottom-left':
            x = hypotenuse;
            break;
        case 'left':
            x = offsetX;
            break;
        case 'right':
            x = -offsetX;
            break;
        }

    } else { // text offset
        // Use absolute offset values.
        offsetX = Math.abs(offsetX);
        offsetY = Math.abs(offsetY);

        switch (anchor) {
        case 'top-right':
        case 'top-left':
        case 'top':
            y = offsetY - baselineOffset;
            break;
        case 'bottom-right':
        case 'bottom-left':
        case 'bottom':
            y = -offsetY + baselineOffset;
            break;
        }

        switch (anchor) {
        case 'top-right':
        case 'bottom-right':
        case 'right':
            x = -offsetX;
            break;
        case 'top-left':
        case 'bottom-left':
        case 'left':
            x = offsetX;
            break;
        }
    }

    return [x, y];
}

export function performSymbolLayout(bucket: SymbolBucket,
                             glyphMap: {
                                 [_: string]: {
                                     glyphs: {
                                         [_: number]: StyleGlyph | null | undefined;
                                     };
                                     ascender?: number;
                                     descender?: number;
                                 };
                             },
                             glyphPositions: GlyphPositions,
                             imageMap: {
                                 [_: string]: StyleImage;
                             },
                             imagePositions: {
                                 [_: string]: ImagePosition;
                             },
                             showCollisionBoxes: boolean,
                             availableImages: Array<string>,
                             canonical: CanonicalTileID,
                             tileZoom: number,
                             projection: Projection,
                             scaleFactor: number = 1,
                             pixelRatio: number,
                             brightness?: number | null) {
    bucket.createArrays();

    const tileSize = 512 * bucket.overscaling;
    bucket.tilePixelRatio = EXTENT / tileSize;
    bucket.compareText = {};
    bucket.iconsNeedLinear = false;

    const layout = bucket.layers[0].layout;
    const unevaluatedLayoutValues = bucket.layers[0]._unevaluatedLayout._values;

    const sizes: Record<string, any> = {};

    sizes.scaleFactor = scaleFactor;
    sizes.textSizeScaleRange = layout.get('text-size-scale-range');
    sizes.iconSizeScaleRange = layout.get('icon-size-scale-range');
    const [textSizeScaleRangeMin, textSizeScaleRangeMax] = sizes.textSizeScaleRange;
    const [iconSizeScaleRangeMin, iconSizeScaleRangeMax] = sizes.iconSizeScaleRange;
    sizes.textScaleFactor = clamp(sizes.scaleFactor, textSizeScaleRangeMin, textSizeScaleRangeMax);
    sizes.iconScaleFactor = clamp(sizes.scaleFactor, iconSizeScaleRangeMin, iconSizeScaleRangeMax);

    if (bucket.textSizeData.kind === 'composite') {
        const {minZoom, maxZoom} = bucket.textSizeData;
        sizes.compositeTextSizes = [
            unevaluatedLayoutValues['text-size'].possiblyEvaluate(new EvaluationParameters(minZoom), canonical),
            unevaluatedLayoutValues['text-size'].possiblyEvaluate(new EvaluationParameters(maxZoom), canonical)
        ];
    }

    if (bucket.iconSizeData.kind === 'composite') {
        const {minZoom, maxZoom} = bucket.iconSizeData;
        sizes.compositeIconSizes = [
            unevaluatedLayoutValues['icon-size'].possiblyEvaluate(new EvaluationParameters(minZoom), canonical),
            unevaluatedLayoutValues['icon-size'].possiblyEvaluate(new EvaluationParameters(maxZoom), canonical)
        ];
    }

    sizes.layoutTextSize = unevaluatedLayoutValues['text-size'].possiblyEvaluate(new EvaluationParameters(tileZoom + 1), canonical);
    sizes.layoutIconSize = unevaluatedLayoutValues['icon-size'].possiblyEvaluate(new EvaluationParameters(tileZoom + 1), canonical);
    sizes.textMaxSize = unevaluatedLayoutValues['text-size'].possiblyEvaluate(new EvaluationParameters(18), canonical);

    const textAlongLine = layout.get('text-rotation-alignment') === 'map' && layout.get('symbol-placement').includes('line');  //!== 'point';
    const textSize = layout.get('text-size');

    let hasAnySecondaryIcon = false;
    for (const feature of bucket.features) {
        if (feature.icon && feature.icon.nameSecondary) {
            hasAnySecondaryIcon = true;
            break;
        }
    }

    for (const feature of bucket.features) {

        const fontstack = layout.get('text-font').evaluate(feature, {}, canonical).join(',');

        const layoutTextSizeThisZoom = textSize.evaluate(feature, {}, canonical) * sizes.textScaleFactor;
        const layoutTextSize = sizes.layoutTextSize.evaluate(feature, {}, canonical) * sizes.textScaleFactor;
        const layoutIconSize = sizes.layoutIconSize.evaluate(feature, {}, canonical) * sizes.iconScaleFactor;

        const shapedTextOrientations = {
            horizontal: {},
            vertical: undefined
        };
        const text = feature.text;
        let textOffset: [number, number] = [0, 0];
        let imageTextAnchor;
        if (text) {
            const unformattedText = text.toString();

            const spacing = layout.get('text-letter-spacing').evaluate(feature, {}, canonical) * ONE_EM;

            const lineHeight = layout.get('text-line-height').evaluate(feature, {}, canonical) * ONE_EM;
            const spacingIfAllowed = allowsLetterSpacing(unformattedText) ? spacing : 0;

            let textAnchor = layout.get('text-anchor').evaluate(feature, {}, canonical);
            imageTextAnchor = textAnchor.startsWith('image') ? textAnchor : false;
            textAnchor = textAnchor.replace('image-', '') as TextAnchor;
            const variableTextAnchor = layout.get('text-variable-anchor');

            if (!variableTextAnchor) {

                const radialOffset = layout.get('text-radial-offset').evaluate(feature, {}, canonical);
                // Layers with variable anchors use the `text-radial-offset` property and the [x, y] offset vector
                // is calculated at placement time instead of layout time
                if (radialOffset) {
                    // The style spec says don't use `text-offset` and `text-radial-offset` together
                    // but doesn't actually specify what happens if you use both. We go with the radial offset.
                    textOffset = evaluateVariableOffset(textAnchor, [radialOffset * ONE_EM, INVALID_TEXT_OFFSET]);
                } else {

                    textOffset = (layout.get('text-offset').evaluate(feature, {}, canonical).map(t => t * ONE_EM) as any);
                }
            }

            let textJustify = textAlongLine ?
                "center" :

                layout.get('text-justify').evaluate(feature, {}, canonical);

            const isPointPlacement = layout.get('symbol-placement') === 'point';
            const maxWidth = isPointPlacement ?

                layout.get('text-max-width').evaluate(feature, {}, canonical) * ONE_EM :
                Infinity;

            const addVerticalShapingIfNeeded = (textJustify: TextJustify) => {
                if (bucket.allowVerticalPlacement && allowsVerticalWritingMode(unformattedText)) {
                    // Vertical POI label placement is meant to be used for scripts that support vertical
                    // writing mode, thus, default left justification is used. If Latin
                    // scripts would need to be supported, this should take into account other justifications.
                    shapedTextOrientations.vertical = shapeText(text, glyphMap, glyphPositions, imagePositions, fontstack, maxWidth, lineHeight, textAnchor,
                        // @ts-expect-error - TS2345 - Argument of type 'number' is not assignable to parameter of type '2 | 1'.
                                                                textJustify, spacingIfAllowed, textOffset, WritingMode.vertical, true, layoutTextSize, layoutTextSizeThisZoom);
                }
            };

            // If this layer uses text-variable-anchor, generate shapings for all justification possibilities.
            if (!textAlongLine && variableTextAnchor) {
                const justifications = textJustify === "auto" ?

                    variableTextAnchor.map(a => getAnchorJustification(a)) :
                    [textJustify];

                let singleLine = false;
                for (let i = 0; i < justifications.length; i++) {
                    const justification: TextJustify = justifications[i];
                    if (shapedTextOrientations.horizontal[justification]) continue;
                    if (singleLine) {
                        // If the shaping for the first justification was only a single line, we
                        // can re-use it for the other justifications
                        shapedTextOrientations.horizontal[justification] = shapedTextOrientations.horizontal[0];
                    } else {
                        // If using text-variable-anchor for the layer, we use a center anchor for all shapings and apply
                        // the offsets for the anchor in the placement step.
                        const shaping = shapeText(text, glyphMap, glyphPositions, imagePositions, fontstack, maxWidth, lineHeight, 'center',
                            // @ts-expect-error - TS2345 - Argument of type 'number' is not assignable to parameter of type '2 | 1'.
                                                  justification, spacingIfAllowed, textOffset, WritingMode.horizontal, false, layoutTextSize, layoutTextSizeThisZoom);
                        if (shaping) {
                            shapedTextOrientations.horizontal[justification] = shaping;
                            singleLine = shaping.positionedLines.length === 1;
                        }
                    }
                }

                addVerticalShapingIfNeeded('left');
            } else {
                if (textJustify === "auto") {
                    textJustify = getAnchorJustification(textAnchor);
                }
                // Add horizontal shaping for all point labels and line labels that need horizontal writing mode.

                if (isPointPlacement || ((layout.get("text-writing-mode").indexOf('horizontal') >= 0) || !allowsVerticalWritingMode(unformattedText))) {
                    const shaping = shapeText(text, glyphMap, glyphPositions, imagePositions, fontstack, maxWidth, lineHeight, textAnchor, textJustify, spacingIfAllowed,
                        // @ts-expect-error - TS2345 - Argument of type 'number' is not assignable to parameter of type '2 | 1'.
                                            textOffset, WritingMode.horizontal, false, layoutTextSize, layoutTextSizeThisZoom);
                    if (shaping) shapedTextOrientations.horizontal[textJustify] = shaping;
                }

                // Vertical point label (if allowVerticalPlacement is enabled).
                addVerticalShapingIfNeeded(isPointPlacement ? 'left' : textJustify);
            }
        }

        let shapedIcon;
        let isSDFIcon = false;
        let isUSVGIcon = false;
        if (feature.icon && feature.icon.namePrimary) {
            const iconSizeFactor = getRasterizedIconSize(bucket.iconSizeData, unevaluatedLayoutValues['icon-size'], canonical, bucket.zoom, feature);
            const scaleFactor = iconSizeFactor  * sizes.iconScaleFactor * pixelRatio;
            const primaryImageSerialized = feature.icon.getPrimary().scaleSelf(scaleFactor).serialize();
            const image = imageMap[primaryImageSerialized];
            if (image) {
                shapedIcon = shapeIcon(
                    imagePositions[primaryImageSerialized],
                    feature.icon.nameSecondary ? imagePositions[feature.icon.getSecondary().scaleSelf(scaleFactor).serialize()] : undefined,

                    layout.get('icon-offset').evaluate(feature, {}, canonical),

                    layout.get('icon-anchor').evaluate(feature, {}, canonical)
                );
                isSDFIcon = image.sdf;
                isUSVGIcon = image.usvg;
                if (bucket.sdfIcons === undefined) {
                    bucket.sdfIcons = image.sdf;
                } else if (bucket.sdfIcons !== image.sdf) {
                    warnOnce('Style sheet warning: Cannot mix SDF and non-SDF icons in one buffer');
                }
                if (image.pixelRatio !== bucket.pixelRatio) {
                    bucket.iconsNeedLinear = true;

                } else if (layout.get('icon-rotate').constantOr(1) !== 0) {
                    bucket.iconsNeedLinear = true;
                }
            }
        }

        const shapedText = getDefaultHorizontalShaping(shapedTextOrientations.horizontal) || shapedTextOrientations.vertical;
        if (!bucket.iconsInText) {
            bucket.iconsInText = shapedText ? shapedText.iconsInText : false;
        }
        if (imageTextAnchor && shapedText) {
            shapedIconText(shapedText, shapedIcon, imageTextAnchor, layoutTextSize, layoutIconSize);
        }
        if (shapedText || shapedIcon) {
            // @ts-expect-error - TS2345 - Argument of type 'Record<string, any>' is not assignable to parameter of type 'Sizes'.
            addFeature(bucket, feature, shapedTextOrientations, shapedIcon, imageMap, sizes, layoutTextSize, layoutIconSize, textOffset, isSDFIcon, isUSVGIcon, availableImages, canonical, projection, brightness, hasAnySecondaryIcon);
        }
    }

    if (showCollisionBoxes) {
        bucket.generateCollisionDebugBuffers(tileZoom, bucket.collisionBoxArray, sizes.textScaleFactor);
    }
}

function shapedIconText(shapedText: Shaping, shapedIcon: Shaping, imageTextAnchor: ImageTextAnchor, layoutTextSize: number, layoutIconSize: number) {
    if (!shapedIcon) {
        return shapedText;
    }
    const scale = layoutTextSize / ONE_EM;
    const textWidth = shapedText.right - shapedText.left;
    const textHeight = shapedText.bottom - shapedText.top;

    const imagePadding = 2;

    const iconTop = (shapedIcon.top - imagePadding) * layoutIconSize / scale;
    const iconBottom = (shapedIcon.bottom + imagePadding) * layoutIconSize / scale;
    const iconLeft = (shapedIcon.left - imagePadding) * layoutIconSize / scale;
    const iconRight = (shapedIcon.right + imagePadding) * layoutIconSize / scale;

    const iconHeight = iconBottom - iconTop;

    const oldTop = shapedText.top;
    const oldLeft = shapedText.left;

    switch (imageTextAnchor) {
    case 'image-top':
        shapedText.bottom = iconTop;
        shapedText.top = shapedText.bottom - textHeight;
        break;
    case 'image-bottom':
        shapedText.top = iconBottom;
        shapedText.bottom = shapedText.top + textHeight;
        break;
    case 'image-left':
        shapedText.bottom = iconBottom - iconHeight / 2 + textHeight / 2;
        shapedText.top = shapedText.bottom - textHeight;
        shapedText.right = iconLeft;
        shapedText.left = shapedText.right - textWidth;
        break;
    case 'image-right':
        shapedText.bottom = iconBottom - iconHeight / 2 + textHeight / 2;
        shapedText.top = shapedText.bottom - textHeight;
        shapedText.left = iconRight;
        shapedText.right = shapedText.left + textWidth;
        break;
    }

    const dx = oldLeft - shapedText.left;
    const dy = oldTop - shapedText.top;

    for (const positionedLine of shapedText.positionedLines) {
        for (const positionedGlyph of positionedLine.positionedGlyphs) {
            positionedGlyph.x -= dx;
            positionedGlyph.y -= dy;
        }
    }
    // console.log(shapedText, shapedIcon);
    return shapedText;
}

// Choose the justification that matches the direction of the TextAnchor
export function getAnchorJustification(anchor: TextAnchor): TextJustify {
    switch (anchor) {
    case 'right':
    case 'top-right':
    case 'bottom-right':
        return 'right';
    case 'left':
    case 'top-left':
    case 'bottom-left':
        return 'left';
    }
    return 'center';
}

/**
 * for "very" overscaled tiles (overscaleFactor > 2) on high zoom levels (z > 18)
 * we use the tile pixel ratio from the previous zoom level and clamp it to 1
 * in order to thin out labels density and save memory and CPU .
 * @private
 */
function tilePixelRatioForSymbolSpacing(overscaleFactor: number, overscaledZ: number) {
    if (overscaledZ > 18 && overscaleFactor > 2) {
        overscaleFactor >>= 1;
    }
    const tilePixelRatio = EXTENT / (512 * overscaleFactor);
    return Math.max(tilePixelRatio, 1);
}

/**
 * Given a feature and its shaped text and icon data, add a 'symbol
 * instance' for each _possible_ placement of the symbol feature.
 * (At render time Placement.updateBucketOpacities() selects which of these
 * instances to show or hide based on collisions with symbols in other layers.)
 * @private
 */
function addFeature(bucket: SymbolBucket,
                    feature: SymbolFeature,
                    shapedTextOrientations: any,
                    shapedIcon: PositionedIcon | undefined,
                    imageMap: {
                        [_: string]: StyleImage;
                    },
                    sizes: Sizes,
                    layoutTextSize: number,
                    layoutIconSize: number,
                    textOffset: [number, number],
                    isSDFIcon: boolean,
                    isUSVGIcon: boolean,
                    availableImages: Array<string>,
                    canonical: CanonicalTileID,
                    projection: Projection,
                    brightness: number | null | undefined,
                    hasAnySecondaryIcon: boolean) {
    // To reduce the number of labels that jump around when zooming we need
    // to use a text-size value that is the same for all zoom levels.
    // bucket calculates text-size at a high zoom level so that all tiles can
    // use the same value when calculating anchor positions.
    let textMaxSize = sizes.textMaxSize.evaluate(feature, {}, canonical);
    if (textMaxSize === undefined) {
        textMaxSize = layoutTextSize * sizes.textScaleFactor;
    } else {
        textMaxSize *= sizes.textScaleFactor;
    }
    const layout = bucket.layers[0].layout;

    const iconOffset = layout.get('icon-offset').evaluate(feature, {}, canonical);
    const defaultShaping = getDefaultHorizontalShaping(shapedTextOrientations.horizontal) || shapedTextOrientations.vertical;
    const isGlobe = projection.name === 'globe';

    const glyphSize = ONE_EM,
        fontScale = layoutTextSize * sizes.textScaleFactor / glyphSize,
        textMaxBoxScale = bucket.tilePixelRatio * textMaxSize / glyphSize,
        iconBoxScale = bucket.tilePixelRatio * layoutIconSize,

        symbolMinDistance = tilePixelRatioForSymbolSpacing(bucket.overscaling, bucket.zoom) * layout.get('symbol-spacing'),

        textPadding = layout.get('text-padding') * bucket.tilePixelRatio,

        iconPadding = layout.get('icon-padding') * bucket.tilePixelRatio,

        textMaxAngle = degToRad(layout.get('text-max-angle')),
        textAlongLine = layout.get('text-rotation-alignment') === 'map' && layout.get('symbol-placement').includes('line'),
        iconAlongLine = layout.get('icon-rotation-alignment') === 'map' && layout.get('symbol-placement').includes('line'),
        symbolPlacement = layout.get('symbol-placement'),
        textRepeatDistance = symbolMinDistance / 2;

    const iconTextFit = layout.get('icon-text-fit').evaluate(feature, {}, canonical);

    const iconTextFitPadding = layout.get('icon-text-fit-padding').evaluate(feature, {}, canonical);
    const hasIconTextFit = iconTextFit !== 'none';
    if (bucket.hasAnyIconTextFit === false && hasIconTextFit) {
        bucket.hasAnyIconTextFit = true;
    }
    let verticallyShapedIcon;

    // Adjust shaped icon size when icon-text-fit is used.
    if (shapedIcon && hasIconTextFit) {
        if (bucket.allowVerticalPlacement && shapedTextOrientations.vertical) {
            verticallyShapedIcon = fitIconToText(shapedIcon, shapedTextOrientations.vertical, iconTextFit,
                iconTextFitPadding, iconOffset, fontScale);
        }
        if (defaultShaping) {
            shapedIcon = fitIconToText(shapedIcon, defaultShaping, iconTextFit,
                                       iconTextFitPadding, iconOffset, fontScale);
        }
    }

    const addSymbolAtAnchor = (line: Array<Point>, anchor: Anchor, canonicalId: CanonicalTileID) => {
        if (anchor.x < 0 || anchor.x >= EXTENT || anchor.y < 0 || anchor.y >= EXTENT) {
            // Symbol layers are drawn across tile boundaries, We filter out symbols
            // outside our tile boundaries (which may be included in vector tile buffers)
            // to prevent double-drawing symbols.
            return;
        }

        let globe: {
            anchor: Anchor;
            up: vec3;
        } | null | undefined = null;
        if (isGlobe) {
            const {x, y, z} = projection.projectTilePoint(anchor.x, anchor.y, canonicalId);
            globe = {
                anchor: new Anchor(x, y, z, 0, undefined),
                up: projection.upVector(canonicalId, anchor.x, anchor.y)
            };
        }

        addSymbol(bucket, anchor, globe, line, shapedTextOrientations, shapedIcon, imageMap, verticallyShapedIcon, bucket.layers[0],
            bucket.collisionBoxArray, feature.index, feature.sourceLayerIndex,
            bucket.index, textPadding, textAlongLine, textOffset,
            iconBoxScale, iconPadding, iconAlongLine, iconOffset,
            feature, sizes, isSDFIcon, isUSVGIcon, availableImages, canonical, brightness, hasAnySecondaryIcon);
    };

    const addSymbolAtAnchorFromLine = (line: Point[]) => {
        const l = line.length;
        if (symbolPlacement === 'vertex') {
            for (let i = 0; i < l; i++) {
                addSymbolAtAnchor(line, new Anchor(line[i].x, line[i].y, 0, 0, undefined), canonical);
            }
        } else if (symbolPlacement === 'first-vertex') {
            addSymbolAtAnchor(line, new Anchor(line[0].x, line[0].y, 0, 0, undefined), canonical);
        } else if (symbolPlacement === 'last-vertex' && l > 1) {
            addSymbolAtAnchor(line, new Anchor(line[l - 1].x, line[l - 1].y, 0, 0, undefined), canonical);
        } else if (symbolPlacement === 'first-last-vertex') {
            addSymbolAtAnchor(line, new Anchor(line[0].x, line[0].y, 0, 0, undefined), canonical);
            // eslint-disable-next-line no-unused-expressions
            l > 1 && addSymbolAtAnchor(line, new Anchor(line[l - 1].x, line[l - 1].y, 0, 0, undefined), canonical);
        } else if (symbolPlacement === 'except-first-vertex' && l > 1) {
            for (let i = 1; i < l; i++) {
                addSymbolAtAnchor(line, new Anchor(line[i].x, line[i].y, 0, 0, undefined), canonical);
            }
        } else if (symbolPlacement === 'except-last-vertex' && l > 1) {
            for (let i = 0; i < l - 1; i++) {
                addSymbolAtAnchor(line, new Anchor(line[i].x, line[i].y, 0, 0, undefined), canonical);
            }
        } else if (symbolPlacement === 'middle-vertex' && l > 2) {
            for (let i = 1; i < l - 1; i++) {
                addSymbolAtAnchor(line, new Anchor(line[i].x, line[i].y, 0, 0, undefined), canonical);
            }
        } else {
            addSymbolAtAnchor(line, new Anchor(line[0].x, line[0].y, 0, 0, undefined), canonical);
        }
    };

    if (symbolPlacement === 'line') {
        for (const line of clipLine(feature.geometry, 0, 0, EXTENT, EXTENT)) {
            const anchors = getAnchors(
                line,
                symbolMinDistance,
                textMaxAngle,
                shapedTextOrientations.vertical || defaultShaping,
                shapedIcon,
                glyphSize,
                textMaxBoxScale,
                bucket.overscaling,
                EXTENT
            );
            for (const anchor of anchors) {
                const shapedText = defaultShaping;
                if (!shapedText || !anchorIsTooClose(bucket, shapedText.text, textRepeatDistance, anchor)) {
                    addSymbolAtAnchor(line, anchor, canonical);
                }
            }
        }
    } else if (symbolPlacement === 'line-center') {
        // No clipping, multiple lines per feature are allowed
        // "lines" with only one point are ignored as in clipLines
        for (const line of feature.geometry) {
            if (line.length > 1) {
                const anchor = getCenterAnchor(
                    line,
                    textMaxAngle,
                    shapedTextOrientations.vertical || defaultShaping,
                    shapedIcon,
                    glyphSize,
                    textMaxBoxScale);
                if (anchor) {
                    addSymbolAtAnchor(line, anchor, canonical);
                }
            }
        }
    } else if (feature.type === 'Polygon') {
        for (const polygon of classifyRings(feature.geometry, 0)) {
            // 16 here represents 2 pixels
            if (symbolPlacement === 'point') {
                const poi = findPoleOfInaccessibility(polygon, 16);
                addSymbolAtAnchor(polygon[0], new Anchor(poi.x, poi.y, 0, 0, undefined), canonical);
            } else {
                addSymbolAtAnchorFromLine(polygon[0]);
            }
        }
    } else if (feature.type === 'LineString') {
        // https://github.com/mapbox/mapbox-gl-js/issues/3808
        for (const line of feature.geometry) {
            addSymbolAtAnchorFromLine(line);
        }
    } else if (feature.type === 'Point') {
        for (const points of feature.geometry) {
            for (const point of points) {
                addSymbolAtAnchor([point], new Anchor(point.x, point.y, 0, 0, undefined), canonical);
            }
        }
    }
}

const MAX_GLYPH_ICON_SIZE = 255;
const MAX_PACKED_SIZE = MAX_GLYPH_ICON_SIZE * SIZE_PACK_FACTOR;
export {MAX_PACKED_SIZE};

function addTextVertices(bucket: SymbolBucket,
                         globe: {
                             anchor: Anchor;
                             up: vec3;
                         } | null | undefined,
                         tileAnchor: Anchor,
                         shapedText: Shaping,
                         imageMap: {
                             [_: string]: StyleImage;
                         },
                         layer: SymbolStyleLayer,
                         textAlongLine: boolean,
                         feature: SymbolFeature,
                         textOffset: [number, number],
                         lineArray: {
                             lineStartIndex: number;
                             lineLength: number;
                         },
                         writingMode: number,
                         placementTypes: Array<'vertical' | 'center' | 'left' | 'right'>,
                         placedTextSymbolIndices: {
                             [_: string]: number;
                         },
                         placedIconIndex: number,
                         sizes: Sizes,
                         availableImages: Array<string>,
                         canonical: CanonicalTileID,
                         brightness?: number | null) {
    const glyphQuads = getGlyphQuads(tileAnchor, shapedText, textOffset,
                            layer, textAlongLine, feature, imageMap, bucket.allowVerticalPlacement);

    const sizeData = bucket.textSizeData;
    let textSizeData = null;

    if (sizeData.kind === 'source') {
        textSizeData = [
            SIZE_PACK_FACTOR * layer.layout.get('text-size').evaluate(feature, {}, canonical) * sizes.textScaleFactor
        ];
        if (textSizeData[0] > MAX_PACKED_SIZE) {
            warnOnce(`${bucket.layerIds[0]}: Value for "text-size" is >= ${MAX_GLYPH_ICON_SIZE}. Reduce your "text-size".`);
        }
    } else if (sizeData.kind === 'composite') {
        textSizeData = [
            SIZE_PACK_FACTOR * sizes.compositeTextSizes[0].evaluate(feature, {}, canonical) * sizes.textScaleFactor,
            SIZE_PACK_FACTOR * sizes.compositeTextSizes[1].evaluate(feature, {}, canonical) * sizes.textScaleFactor
        ];
        if (textSizeData[0] > MAX_PACKED_SIZE || textSizeData[1] > MAX_PACKED_SIZE) {
            warnOnce(`${bucket.layerIds[0]}: Value for "text-size" is >= ${MAX_GLYPH_ICON_SIZE}. Reduce your "text-size".`);
        }
    }

    bucket.addSymbols(
        bucket.text,
        glyphQuads,
        textSizeData,
        textOffset,
        textAlongLine,
        feature,
        writingMode,
        globe,
        tileAnchor,
        lineArray.lineStartIndex,
        lineArray.lineLength,
        placedIconIndex,
        availableImages,
        canonical,
        brightness,
        false);

    // The placedSymbolArray is used at render time in drawTileSymbols
    // These indices allow access to the array at collision detection time
    for (const placementType of placementTypes) {
        placedTextSymbolIndices[placementType] = bucket.text.placedSymbolArray.length - 1;
    }

    return glyphQuads.length * 4;
}

function getDefaultHorizontalShaping(horizontalShaping: Partial<Record<TextJustify, Shaping>>): Shaping | null {
    // We don't care which shaping we get because this is used for collision purposes
    // and all the justifications have the same collision box
    for (const justification in horizontalShaping) {
        return horizontalShaping[justification];
    }
    return null;
}

export function evaluateBoxCollisionFeature(
    collisionBoxArray: CollisionBoxArray,
    projectedAnchor: Anchor,
    tileAnchor: Anchor,
    featureIndex: number,
    sourceLayerIndex: number,
    bucketIndex: number,
    shaped: any,
    padding: number,
    rotate: number,
    textOffset?: [number, number] | null,
    iconScaledSize: number = 1
): number {
    let y1 = shaped.top / iconScaledSize;
    let y2 = shaped.bottom / iconScaledSize;
    let x1 = shaped.left / iconScaledSize;
    let x2 = shaped.right / iconScaledSize;

    const collisionPadding = shaped.collisionPadding;
    if (collisionPadding) {
        x1 -= collisionPadding[0];
        y1 -= collisionPadding[1];
        x2 += collisionPadding[2];
        y2 += collisionPadding[3];
    }

    if (rotate) {
        // Account for *-rotate in point collision boxes
        // See https://github.com/mapbox/mapbox-gl-js/issues/6075
        // Doesn't account for icon-text-fit

        const tl = new Point(x1, y1);
        const tr = new Point(x2, y1);
        const bl = new Point(x1, y2);
        const br = new Point(x2, y2);

        const rotateRadians = degToRad(rotate);
        let rotateCenter = new Point(0, 0);

        if (textOffset) {
            rotateCenter = new Point(textOffset[0], textOffset[1]);
        }

        tl._rotateAround(rotateRadians, rotateCenter);
        tr._rotateAround(rotateRadians, rotateCenter);
        bl._rotateAround(rotateRadians, rotateCenter);
        br._rotateAround(rotateRadians, rotateCenter);

        // Collision features require an "on-axis" geometry,
        // so take the envelope of the rotated geometry
        // (may be quite large for wide labels rotated 45 degrees)
        x1 = Math.min(tl.x, tr.x, bl.x, br.x);
        x2 = Math.max(tl.x, tr.x, bl.x, br.x);
        y1 = Math.min(tl.y, tr.y, bl.y, br.y);
        y2 = Math.max(tl.y, tr.y, bl.y, br.y);
    }

    collisionBoxArray.emplaceBack(projectedAnchor.x, projectedAnchor.y, projectedAnchor.z, tileAnchor.x, tileAnchor.y, x1, y1, x2, y2, padding, featureIndex, sourceLayerIndex, bucketIndex);

    return collisionBoxArray.length - 1;
}

export function evaluateCircleCollisionFeature(shaped: any): number | null {
    if (shaped.collisionPadding) {
        // Compute height of the shape in glyph metrics and apply padding.
        // Note that the pixel based 'text-padding' is applied at runtime
        shaped.top -= shaped.collisionPadding[1];
        shaped.bottom += shaped.collisionPadding[3];
    }

    // Set minimum box height to avoid very many small labels
    const height = shaped.bottom - shaped.top;
    return height > 0 ? Math.max(10, height) : null;
}

/**
 * Add a single label & icon placement.
 *
 * @private
 */
function addSymbol(bucket: SymbolBucket,
                   anchor: Anchor,
                   globe: {
                       anchor: Anchor;
                       up: vec3;
                   } | null | undefined,
                   line: Array<Point>,
                   shapedTextOrientations: any,
                   shapedIcon: PositionedIcon | undefined,
                   imageMap: {
                       [_: string]: StyleImage;
                   },
                   verticallyShapedIcon: PositionedIcon | undefined,
                   layer: SymbolStyleLayer,
                   collisionBoxArray: CollisionBoxArray,
                   featureIndex: number,
                   sourceLayerIndex: number,
                   bucketIndex: number,
                   textPadding: number,
                   textAlongLine: boolean,
                   textOffset: [number, number],
                   iconBoxScale: number,
                   iconPadding: number,
                   iconAlongLine: boolean,
                   iconOffset: [number, number],
                   feature: SymbolFeature,
                   sizes: Sizes,
                   isSDFIcon: boolean,
                   isUSVGIcon: boolean,
                   availableImages: Array<string>,
                   canonical: CanonicalTileID,
                   brightness: number | null | undefined,
                   hasAnySecondaryIcon: boolean) {
    const lineArray = bucket.addToLineVertexArray(anchor, line);
    let textBoxIndex, iconBoxIndex, verticalTextBoxIndex, verticalIconBoxIndex;
    let textCircle, verticalTextCircle, verticalIconCircle;

    let numIconVertices = 0;
    let numVerticalIconVertices = 0;
    let numHorizontalGlyphVertices = 0;
    let numVerticalGlyphVertices = 0;
    let placedIconSymbolIndex = -1;
    let verticalPlacedIconSymbolIndex = -1;
    const placedTextSymbolIndices: Record<string, any> = {};
    let key = murmur3('');
    const collisionFeatureAnchor: Anchor = globe ? globe.anchor : anchor;

    const hasIconTextFit = layer.layout.get('icon-text-fit').evaluate(feature, {}, canonical) !== 'none';

    let textOffset0 = 0;
    let textOffset1 = 0;
    if (layer._unevaluatedLayout.getValue('text-radial-offset') === undefined) {

        [textOffset0, textOffset1] = (layer.layout.get('text-offset').evaluate(feature, {}, canonical).map(t => t * ONE_EM) as any);
    } else {

        textOffset0 = layer.layout.get('text-radial-offset').evaluate(feature, {}, canonical) * ONE_EM;
        textOffset1 = INVALID_TEXT_OFFSET;
    }

    if (bucket.allowVerticalPlacement && shapedTextOrientations.vertical) {
        const verticalShaping = shapedTextOrientations.vertical;
        if (textAlongLine) {
            verticalTextCircle = evaluateCircleCollisionFeature(verticalShaping);
            if (verticallyShapedIcon) {
                verticalIconCircle = evaluateCircleCollisionFeature(verticallyShapedIcon);
            }
        } else {
            const textRotation = layer.layout.get('text-rotate').evaluate(feature, {}, canonical);
            const verticalTextRotation = textRotation + 90.0;
            verticalTextBoxIndex = evaluateBoxCollisionFeature(collisionBoxArray, collisionFeatureAnchor, anchor, featureIndex, sourceLayerIndex, bucketIndex, verticalShaping, textPadding, verticalTextRotation, textOffset);
            if (verticallyShapedIcon) {
                verticalIconBoxIndex = evaluateBoxCollisionFeature(collisionBoxArray, collisionFeatureAnchor, anchor, featureIndex, sourceLayerIndex, bucketIndex, verticallyShapedIcon, iconPadding, verticalTextRotation);
            }
        }
    }

    // Place icon first, so text can have a reference to its index in the placed symbol array.
    // Text symbols can lazily shift at render-time because of variable anchor placement.
    // If the style specifies an `icon-text-fit` then the icon would have to shift along with it.
    // For more info check `updateVariableAnchors` in `draw_symbol.js` .

    if (shapedIcon) {
        const sizeData = bucket.iconSizeData;
        const unevaluatedLayoutValues = bucket.layers[0]._unevaluatedLayout._values;
        const rasterizedIconScaleFactor = isUSVGIcon ? getRasterizedIconSize(bucket.iconSizeData, unevaluatedLayoutValues['icon-size'], canonical, bucket.zoom, feature) : 1;
        const iconRotate = layer.layout.get('icon-rotate').evaluate(feature, {}, canonical);
        const iconQuads = getIconQuads(shapedIcon, iconRotate, isSDFIcon, hasIconTextFit, isUSVGIcon ? 1 / rasterizedIconScaleFactor : sizes.iconScaleFactor);
        const verticalIconQuads = verticallyShapedIcon ? getIconQuads(verticallyShapedIcon, iconRotate, isSDFIcon, hasIconTextFit, sizes.iconScaleFactor) : undefined;
        iconBoxIndex = evaluateBoxCollisionFeature(collisionBoxArray, collisionFeatureAnchor, anchor, featureIndex, sourceLayerIndex, bucketIndex, shapedIcon, iconPadding, iconRotate, null, isUSVGIcon ? sizes.iconScaleFactor * rasterizedIconScaleFactor : 1);
        numIconVertices = iconQuads.length * 4;

        let iconSizeData = null;

        if (sizeData.kind === 'source') {
            iconSizeData = [
                SIZE_PACK_FACTOR * layer.layout.get('icon-size').evaluate(feature, {}, canonical) * sizes.iconScaleFactor
            ];
            if (iconSizeData[0] > MAX_PACKED_SIZE) {
                warnOnce(`${bucket.layerIds[0]}: Value for "icon-size" is >= ${MAX_GLYPH_ICON_SIZE}. Reduce your "icon-size".`);
            }
        } else if (sizeData.kind === 'composite') {
            iconSizeData = [
                SIZE_PACK_FACTOR * sizes.compositeIconSizes[0].evaluate(feature, {}, canonical) * sizes.iconScaleFactor,
                SIZE_PACK_FACTOR * sizes.compositeIconSizes[1].evaluate(feature, {}, canonical) * sizes.iconScaleFactor
            ];
            if (iconSizeData[0] > MAX_PACKED_SIZE || iconSizeData[1] > MAX_PACKED_SIZE) {
                warnOnce(`${bucket.layerIds[0]}: Value for "icon-size" is >= ${MAX_GLYPH_ICON_SIZE}. Reduce your "icon-size".`);
            }
        }

        bucket.addSymbols(
            bucket.icon,
            iconQuads,
            iconSizeData,
            iconOffset,
            iconAlongLine,
            feature,
            false,
            globe,
            anchor,
            lineArray.lineStartIndex,
            lineArray.lineLength,
            // The icon itself does not have an associated symbol since the text isnt placed yet
            -1,
            availableImages,
            canonical,
            brightness,
            hasAnySecondaryIcon);

        placedIconSymbolIndex = bucket.icon.placedSymbolArray.length - 1;

        if (verticalIconQuads) {
            numVerticalIconVertices = verticalIconQuads.length * 4;

            bucket.addSymbols(
                bucket.icon,
                verticalIconQuads,
                iconSizeData,
                iconOffset,
                iconAlongLine,
                feature,
                WritingMode.vertical,
                globe,
                anchor,
                lineArray.lineStartIndex,
                lineArray.lineLength,
                // The icon itself does not have an associated symbol since the text isnt placed yet
                -1,
                availableImages,
                canonical,
                brightness,
                hasAnySecondaryIcon);

            verticalPlacedIconSymbolIndex = bucket.icon.placedSymbolArray.length - 1;
        }
    }

    for (const justification in shapedTextOrientations.horizontal) {
        const shaping = shapedTextOrientations.horizontal[justification];

        if (!textBoxIndex) {
            key = murmur3(shaping.text);
            // As a collision approximation, we can use either the vertical or any of the horizontal versions of the feature
            // We're counting on all versions having similar dimensions
            if (textAlongLine) {
                textCircle = evaluateCircleCollisionFeature(shaping);
            } else {

                const textRotate = layer.layout.get('text-rotate').evaluate(feature, {}, canonical);
                textBoxIndex = evaluateBoxCollisionFeature(collisionBoxArray, collisionFeatureAnchor, anchor, featureIndex, sourceLayerIndex, bucketIndex, shaping, textPadding, textRotate, textOffset);
            }
        }

        const singleLine = shaping.positionedLines.length === 1;
        numHorizontalGlyphVertices += addTextVertices(
            bucket, globe, anchor, shaping, imageMap, layer, textAlongLine, feature, textOffset, lineArray,
            shapedTextOrientations.vertical ? WritingMode.horizontal : WritingMode.horizontalOnly,
            singleLine ? (Object.keys(shapedTextOrientations.horizontal) as any) : [justification],
            placedTextSymbolIndices, placedIconSymbolIndex, sizes, availableImages, canonical, brightness);

        if (singleLine) {
            break;
        }
    }

    if (shapedTextOrientations.vertical) {
        numVerticalGlyphVertices += addTextVertices(
            bucket, globe, anchor, shapedTextOrientations.vertical, imageMap, layer, textAlongLine, feature,
            textOffset, lineArray, WritingMode.vertical, ['vertical'], placedTextSymbolIndices,
            verticalPlacedIconSymbolIndex, sizes, availableImages, canonical, brightness);
    }

    // Check if runtime collision circles should be used for any of the collision features.
    // It is enough to choose the tallest feature shape as circles are always placed on a line.
    // All measurements are in glyph metrics and later converted into pixels using proper font size "layoutTextSize"
    let collisionCircleDiameter = -1;

    const getCollisionCircleHeight = (diameter: number | null | undefined, prevHeight: number): number => {
        return diameter ? Math.max(diameter, prevHeight) : prevHeight;
    };

    collisionCircleDiameter = getCollisionCircleHeight(textCircle, collisionCircleDiameter);
    collisionCircleDiameter = getCollisionCircleHeight(verticalTextCircle, collisionCircleDiameter);
    collisionCircleDiameter = getCollisionCircleHeight(verticalIconCircle, collisionCircleDiameter);
    const useRuntimeCollisionCircles = (collisionCircleDiameter > -1) ? 1 : 0;

    if (bucket.glyphOffsetArray.length >= SymbolBucketConstants.MAX_GLYPHS) warnOnce(
        "Too many glyphs being rendered in a tile. See https://github.com/mapbox/mapbox-gl-js/issues/2907"
    );

    if (feature.sortKey !== undefined) {
        bucket.addToSortKeyRanges(bucket.symbolInstances.length, feature.sortKey);
    }

    const projectedAnchor = collisionFeatureAnchor;

    bucket.symbolInstances.emplaceBack(
        anchor.x,
        anchor.y,
        projectedAnchor.x,
        projectedAnchor.y,
        projectedAnchor.z,
        placedTextSymbolIndices.right >= 0 ? placedTextSymbolIndices.right : -1,
        placedTextSymbolIndices.center >= 0 ? placedTextSymbolIndices.center : -1,
        placedTextSymbolIndices.left >= 0 ? placedTextSymbolIndices.left : -1,
        placedTextSymbolIndices.vertical  >= 0 ? placedTextSymbolIndices.vertical : -1,
        placedIconSymbolIndex,
        verticalPlacedIconSymbolIndex,
        key,
        textBoxIndex !== undefined ? textBoxIndex : bucket.collisionBoxArray.length,
        textBoxIndex !== undefined ? textBoxIndex + 1 : bucket.collisionBoxArray.length,
        verticalTextBoxIndex !== undefined ? verticalTextBoxIndex : bucket.collisionBoxArray.length,
        verticalTextBoxIndex !== undefined ? verticalTextBoxIndex + 1 : bucket.collisionBoxArray.length,
        iconBoxIndex !== undefined ? iconBoxIndex : bucket.collisionBoxArray.length,
        iconBoxIndex !== undefined ? iconBoxIndex + 1 : bucket.collisionBoxArray.length,
        verticalIconBoxIndex ? verticalIconBoxIndex : bucket.collisionBoxArray.length,
        verticalIconBoxIndex ? verticalIconBoxIndex + 1 : bucket.collisionBoxArray.length,
        featureIndex,
        numHorizontalGlyphVertices,
        numVerticalGlyphVertices,
        numIconVertices,
        numVerticalIconVertices,
        useRuntimeCollisionCircles,
        0,
        textOffset0,
        textOffset1,
        collisionCircleDiameter,
        0,
        hasIconTextFit ? 1 : 0,
    );
}

function anchorIsTooClose(bucket: any, text: string, repeatDistance: number, anchor: Point) {
    const compareText = bucket.compareText;
    if (!(text in compareText)) {
        compareText[text] = [];
    } else {
        const otherAnchors = compareText[text];
        for (let k = otherAnchors.length - 1; k >= 0; k--) {
            if (anchor.dist(otherAnchors[k]) < repeatDistance) {
                // If it's within repeatDistance of one anchor, stop looking
                return true;
            }
        }
    }
    // If anchor is not within repeatDistance of any other anchor, add to array
    compareText[text].push(anchor);
    return false;
}
