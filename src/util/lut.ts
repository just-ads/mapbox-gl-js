import {DataConstantProperty, Properties, PossiblyEvaluated, Transitionable} from '../style/properties';
import {extend} from './util';
import type {RGBAImage} from "./image";
import {Texture3D} from '../../src/render/texture';
import type {ColorThemeSpecification} from "../style-spec/types";
import styleSpec from '../style-spec/reference/latest';
import EvaluationParameters from '../../src/style/evaluation_parameters';
import type {ConfigOptions} from '../../src/style/properties';

export type LUT = {
    image: RGBAImage;
    texture?: Texture3D;
};

type Props = {
    ["data"]: DataConstantProperty<string>;
};

const colorizationProperties: Properties<Props> = new Properties({
    "data": new DataConstantProperty(styleSpec.colorTheme.data)
});

export function evaluateColorThemeProperties(
    scope: string,
    values?: ColorThemeSpecification,
    configOptions?: ConfigOptions | null,
): PossiblyEvaluated<Props> {
    const properties = extend({}, values);
    for (const name of Object.keys(styleSpec.colorTheme)) {
        // Fallback to use default style specification when the properties wasn't set
        if (properties[name] === undefined) {
            properties[name] = styleSpec.colorTheme[name].default;
        }
    }

    const transitionable = new Transitionable(colorizationProperties, scope, new Map(configOptions));
    // @ts-expect-error - TS2344 - Type 'ColorThemeSpecification' does not satisfy the constraint 'PropertyValueSpecifications<Props>'.
    transitionable.setTransitionOrValue<ColorThemeSpecification>(properties, configOptions);
    const transitioning = transitionable.untransitioned();
    return transitioning.possiblyEvaluate(new EvaluationParameters(0.0));
}
