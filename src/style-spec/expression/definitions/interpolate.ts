import UnitBezier from '@mapbox/unitbezier';
import * as interpolate from '../../util/interpolate';
import {toString, NumberType, ColorType, ValueType} from '../types';
import {findStopLessThanOrEqualTo} from '../stops';
import {hcl, lab} from '../../util/color_spaces';
import Literal from './literal';
import RuntimeError from '../runtime_error';

import type Color from '../../util/color';
import type {Stops} from '../stops';
import type {Expression, SerializedExpression} from '../expression';
import type ParsingContext from '../parsing_context';
import type EvaluationContext from '../evaluation_context';
import type {Type} from '../types';

export type InterpolationType = {
    name: 'linear';
} | {
    name: 'exponential';
    base: number;
} | {
    name: 'cubic-bezier';
    controlPoints: [number, number, number, number];
};

class Interpolate implements Expression {
    type: Type;

    operator: 'interpolate' | 'interpolate-hcl' | 'interpolate-lab';
    interpolation: InterpolationType;
    input: Expression;
    dynamicStops: Expression | null;
    labels: Array<number>;
    outputs: Array<Expression>;

    constructor(type: Type, operator: 'interpolate' | 'interpolate-hcl' | 'interpolate-lab', interpolation: InterpolationType, input: Expression, dynamicStops: Expression | null, stops: Stops) {
        this.type = type;
        this.operator = operator;
        this.interpolation = interpolation;
        this.input = input;
        this.dynamicStops = dynamicStops;

        this.labels = [];
        this.outputs = [];
        for (const [label, expression] of stops) {
            this.labels.push(label);
            this.outputs.push(expression);
        }
    }

    static interpolationFactor(
        interpolation: InterpolationType,
        input: number,
        lower: number,
        upper: number,
    ): number {
        let t = 0;
        if (interpolation.name === 'exponential') {
            t = exponentialInterpolation(input, interpolation.base, lower, upper);
        } else if (interpolation.name === 'linear') {
            t = exponentialInterpolation(input, 1, lower, upper);
        } else if (interpolation.name === 'cubic-bezier') {
            const c = interpolation.controlPoints;
            const ub = new UnitBezier(c[0], c[1], c[2], c[3]);
            t = ub.solve(exponentialInterpolation(input, 1, lower, upper));
        }
        return t;
    }

    static parse(args: ReadonlyArray<unknown>, context: ParsingContext): Interpolate | null | undefined {
        let [operator, interpolation, input, ...rest] = args;

        if (!Array.isArray(interpolation) || interpolation.length === 0) {
            // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
            return context.error(`Expected an interpolation type expression.`, 1);
        }

        if (interpolation[0] === 'linear') {
            interpolation = {name: 'linear'};
        } else if (interpolation[0] === 'exponential') {
            const base = interpolation[1];
            if (typeof base !== 'number')
            // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
                return context.error(`Exponential interpolation requires a numeric base.`, 1, 1);
            interpolation = {
                name: 'exponential',
                base
            };
        } else if (interpolation[0] === 'cubic-bezier') {
            const controlPoints = interpolation.slice(1);
            if (
                controlPoints.length !== 4 ||
                controlPoints.some(t => typeof t !== 'number' || t < 0 || t > 1)
            ) {
                // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
                return context.error('Cubic bezier interpolation requires four numeric arguments with values between 0 and 1.', 1);
            }

            interpolation = {
                name: 'cubic-bezier',
                controlPoints: (controlPoints as any)
            };
        } else {
            // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
            return context.error(`Unknown interpolation type ${String(interpolation[0])}`, 1, 0);
        }

        if (args.length - 1 < 3) {
            // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
            return context.error(`Expected at least 3 arguments, but found only ${args.length - 1}.`);
        }

        if (args.length - 1 > 3 && (args.length - 1) % 2 !== 0) {
            // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
            return context.error(`Expected an even number of arguments.`);
        }

        input = context.parse(input, 2, NumberType);
        if (!input) return null;

        const stops: Stops = [];

        let outputType: Type = (null as any);
        if (operator === 'interpolate-hcl' || operator === 'interpolate-lab') {
            outputType = ColorType;
        } else if (context.expectedType && context.expectedType.kind !== 'value') {
            outputType = context.expectedType;
        }

        // Exactly 3 arguments means that the steps are created by an expression
        if (args.length - 1 === 3) {
            const dynamicStops = context.parse(rest[0], 3, ValueType);
            if (!dynamicStops) return null;

            // @ts-expect-error - TS2345 - Argument of type 'unknown' is not assignable to parameter of type 'InterpolationType'.
            return new Interpolate(outputType, (operator as any), interpolation, input, dynamicStops, stops);
        }

        for (let i = 0; i < rest.length; i += 2) {
            const label = rest[i];
            const value = rest[i + 1];

            const labelKey = i + 3;
            const valueKey = i + 4;

            if (typeof label !== 'number') {
                // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
                return context.error('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.', labelKey);
            }

            if (stops.length && stops[stops.length - 1][0] >= label) {
                // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
                return context.error('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.', labelKey);
            }

            const parsed = context.parse(value, valueKey, outputType);
            if (!parsed) return null;
            outputType = outputType || parsed.type;
            stops.push([label, parsed]);
        }

        if (outputType.kind !== 'number' &&
            outputType.kind !== 'color' &&
            !(
                outputType.kind === 'array' &&
                outputType.itemType.kind === 'number' &&
                typeof outputType.N === 'number'
            )
        ) {
            // @ts-expect-error - TS2322 - Type 'void' is not assignable to type 'Interpolate'.
            return context.error(`Type ${toString(outputType)} is not interpolatable.`);
        }

        // @ts-expect-error - TS2345 - Argument of type 'unknown' is not assignable to parameter of type 'InterpolationType'.
        return new Interpolate(outputType, (operator as any), interpolation, input, null, stops);
    }

    evaluate(ctx: EvaluationContext): Color {
        let labels = this.labels;
        let outputs = this.outputs;

        if (this.dynamicStops) {
            const dynamicStopsValue = (this.dynamicStops.evaluate(ctx) as [number]);
            if (dynamicStopsValue.length % 2 !== 0) {
                throw new RuntimeError('Expected an even number of arguments.');
            }
            labels = [];
            outputs = [];
            for (let i = 0; i < dynamicStopsValue.length; i += 2) {
                const label = dynamicStopsValue[i];
                const output = new Literal(NumberType, dynamicStopsValue[i + 1]);
                if (typeof label !== 'number') {
                    throw new RuntimeError('Input/output pairs for "interpolate" expressions must be defined using literal numeric values (not computed expressions) for the input values.');
                }
                if (labels.length && labels[labels.length - 1] >= label) {
                    throw new RuntimeError('Input/output pairs for "interpolate" expressions must be arranged with input values in strictly ascending order.');
                }
                labels.push(label);
                outputs.push(output);
            }
            if (labels.length === 0) {
                throw new RuntimeError('Expected at least one input/output pair.');
            }
        }

        if (labels.length === 1) {
            return outputs[0].evaluate(ctx);
        }

        const value = (this.input.evaluate(ctx) as number);
        if (value <= labels[0]) {
            return outputs[0].evaluate(ctx);
        }

        const stopCount = labels.length;
        if (value >= labels[stopCount - 1]) {
            return outputs[stopCount - 1].evaluate(ctx);
        }

        const index = findStopLessThanOrEqualTo(labels, value);
        const lower = labels[index];
        const upper = labels[index + 1];
        const t = Interpolate.interpolationFactor(this.interpolation, value, lower, upper);

        const outputLower = outputs[index].evaluate(ctx);
        const outputUpper = outputs[index + 1].evaluate(ctx);

        if (this.operator === 'interpolate') {
            return (interpolate[this.type.kind.toLowerCase()] as any)(outputLower, outputUpper, t); // eslint-disable-line import/namespace
        } else if (this.operator === 'interpolate-hcl') {
            return hcl.reverse(hcl.interpolate(hcl.forward(outputLower), hcl.forward(outputUpper), t));
        } else {
            return lab.reverse(lab.interpolate(lab.forward(outputLower), lab.forward(outputUpper), t));
        }
    }

    eachChild(fn: (_: Expression) => void) {
        fn(this.input);
        for (const expression of this.outputs) {
            fn(expression);
        }
    }

    outputDefined(): boolean {
        return this.outputs.every(out => out.outputDefined());
    }

    serialize(): SerializedExpression {
        let interpolation;
        if (this.interpolation.name === 'linear') {
            interpolation = ["linear"];
        } else if (this.interpolation.name === 'exponential') {
            if  (this.interpolation.base === 1) {
                interpolation = ["linear"];
            } else {
                interpolation = ["exponential", this.interpolation.base];
            }
        } else {
            // @ts-expect-error - TS2769 - No overload matches this call.
            interpolation = ["cubic-bezier" ].concat(this.interpolation.controlPoints);
        }

        const serialized = [this.operator, interpolation, this.input.serialize()];

        if (this.dynamicStops) {
            serialized.push(this.dynamicStops.serialize());
        } else {
            for (let i = 0; i < this.labels.length; i++) {
                serialized.push(
                    this.labels[i],
                    this.outputs[i].serialize()
                );
            }
        }
        return serialized;
    }
}

/**
 * Returns a ratio that can be used to interpolate between exponential function
 * stops.
 * How it works: Two consecutive stop values define a (scaled and shifted) exponential function `f(x) = a * base^x + b`, where `base` is the user-specified base,
 * and `a` and `b` are constants affording sufficient degrees of freedom to fit
 * the function to the given stops.
 *
 * Here's a bit of algebra that lets us compute `f(x)` directly from the stop
 * values without explicitly solving for `a` and `b`:
 *
 * First stop value: `f(x0) = y0 = a * base^x0 + b`
 * Second stop value: `f(x1) = y1 = a * base^x1 + b`
 * => `y1 - y0 = a(base^x1 - base^x0)`
 * => `a = (y1 - y0)/(base^x1 - base^x0)`
 *
 * Desired value: `f(x) = y = a * base^x + b`
 * => `f(x) = y0 + a * (base^x - base^x0)`
 *
 * From the above, we can replace the `a` in `a * (base^x - base^x0)` and do a
 * little algebra:
 * ```
 * a * (base^x - base^x0) = (y1 - y0)/(base^x1 - base^x0) * (base^x - base^x0)
 *                     = (y1 - y0) * (base^x - base^x0) / (base^x1 - base^x0)
 * ```
 *
 * If we let `(base^x - base^x0) / (base^x1 base^x0)`, then we have
 * `f(x) = y0 + (y1 - y0) * ratio`.  In other words, `ratio` may be treated as
 * an interpolation factor between the two stops' output values.
 *
 * (Note: a slightly different form for `ratio`,
 * `(base^(x-x0) - 1) / (base^(x1-x0) - 1) `, is equivalent, but requires fewer
 * expensive `Math.pow()` operations.)
 *
 * @private
*/
function exponentialInterpolation(input: number, base: number, lowerValue: number, upperValue: number) {
    const difference = upperValue - lowerValue;
    const progress = input - lowerValue;

    if (difference === 0) {
        return 0;
    } else if (base === 1) {
        return progress / difference;
    } else {
        return (Math.pow(base, progress) - 1) / (Math.pow(base, difference) - 1);
    }
}

export default Interpolate;
