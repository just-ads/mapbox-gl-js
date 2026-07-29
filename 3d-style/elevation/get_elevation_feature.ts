import {PROPERTY_ELEVATION_ID} from './elevation_constants';

import type {BucketFeature} from '../../src/data/bucket';
import type {ElevationFeature} from './elevation_feature';

/**
 * Kept in its own file so core-path callers (currently `model_bucket`) don't drag the
 * ~500-line `elevation_feature.ts` (plus `elevation_feature_parser.ts`) into the shared
 * bundle just to call this 6-line filter. HD extensions route through the same helper
 * for consistency.
 *
 * @private
 */
export function getElevationFeature(
    feature: BucketFeature,
    elevationFeatures?: ElevationFeature[],
): ElevationFeature | undefined {
    if (!elevationFeatures) return undefined;

    const value = +feature.properties[PROPERTY_ELEVATION_ID];
    if (Number.isNaN(value)) return undefined;

    return elevationFeatures.find(f => f.id === value);
}
