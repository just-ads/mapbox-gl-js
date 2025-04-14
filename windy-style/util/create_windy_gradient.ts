import getGradientObj, {type GradientObj} from "./gradients.js";
import {createTexture} from "./util.js";
import {clamp, nextPowerOfTwo} from "../../src/util/util.js";

export type Gradient = {
    max: number,
    min: number,
    mul: number,
    add: number,
    wTransformR: number,
    texture: WebGLTexture
}

// const cache = {}
export default function createGradient(gl: WebGL2RenderingContext, gradientsObj: GradientObj, pType?: boolean, opaque?: boolean): Gradient {
    let steps = gradientsObj.steps;
    if (steps > 2048) {
        steps = 2048;
    }
    const width = nextPowerOfTwo(steps);
    const byteLen = width << 2;

    let tw = width;

    // ptype 模式时会跳过计算gradientArray，由ptype自己的obj计算
    const gradientInfo = createGradientArray(gradientsObj, pType, opaque);

    let {gradientArray, min, max} = gradientInfo;

    if (pType) {
        const pTypeGradObj = getGradientObj('ptype');
        const pTypeGradInfo = createGradientArray(pTypeGradObj, false, true);
        const maxIndex = (pTypeGradObj.steps - 1) << 2;
        const pw = nextPowerOfTwo(pTypeGradObj.steps);
        tw = pw;
        gradientArray = new Uint8Array(pw << 2);
        const s = Math.floor(pw / 11);
        for (let i = 0; i < 11; i++) {
            const index = clamp((i - pTypeGradInfo.min) / pTypeGradInfo.step << 2, 0, maxIndex);
            const c = pTypeGradInfo.gradientArray.slice(index, index + 4);
            const offset = i * 4 * s;
            for (let j = 0; j < s; j++) {
                gradientArray.set(c, offset + 4 * j);
            }
        }
    } else {
        if (gradientArray.byteLength < byteLen) {
            const newGradientArray = new Uint8Array(byteLen);
            newGradientArray.set(gradientArray);
            if (gradientArray.byteLength > 7) {
                const lastGradient = gradientArray.slice(-8, -4);
                for (let i = gradientArray.byteLength - 4; i < byteLen; i += 4) {
                    newGradientArray.set(lastGradient, i);
                }
            }
            gradientArray = newGradientArray;
        }
        if (gradientArray.byteLength > byteLen) {
            gradientArray = gradientArray.slice(0, byteLen);
        }
    }
    // console.log(gradientsObj.ident, gradientArray);

    const mul = steps / ((max - min) * width);
    const add = -mul * min;
    // const pars = [mul, add, 0, 0];
    return {
        texture: createTexture(gl, gradientArray, tw, 1),
        max,
        min,
        mul,
        add,
        wTransformR: gradientsObj.wTransformR
    };
}

function createGradientArray(gradientsObj: GradientObj, pType?: boolean, opaque: boolean = true) {
    const gradient = gradientsObj.gradient;
    const steps = gradientsObj.steps;
    const min = gradient[0][0];
    const max = gradient[gradient.length - 1][0];
    const step = (max - min) / steps;
    if (pType) {
        return {
            min,
            max,
            step,
        };
    }
    const scale = gradientsObj.scale || (gradientsObj.steps > 2048 ? gradientsObj.steps / 2048 : 1);
    let index = 2;
    let currentGrad = gradient[0];
    let nextGrad = gradient[1] || gradient[0];

    const gradientArray = new Uint8Array((steps + 1) << 2);
    for (let i = 0; i < steps; i++) {
        const t = min + step * i * scale;
        if (t > nextGrad[0] && index < gradient.length) {
            currentGrad = nextGrad;
            nextGrad = gradient[index++];
        }
        const colorScale = (t - currentGrad[0]) / (nextGrad[0] - currentGrad[0]);
        const rgba = getGradientColor(currentGrad[1], nextGrad[1], colorScale);
        // if (mix) {
        //     makePremultiplied(rgba);
        // }
        rgba[3] = opaque ? 255 : rgba[3];
        gradientArray.set(rgba.map(v => Math.round(v)), i * 4);
    }
    gradientArray.set([128, 128, 128, 255], steps * 4);
    return {
        min,
        max,
        step,
        gradientArray,
    };
}

function getGradientColor(startColor: number[], endColor: number[], scale: number) {
    const start = normalizedColor(startColor);
    const end = normalizedColor(endColor);
    const startYuva = rgba2yuva(start);
    const endYuva = rgba2yuva(end);
    const gYuva = gradYuva(startYuva, endYuva, scale, true);
    const rgba = yuva2rgba(gYuva);
    for (let i = 0; i < rgba.length; i++) {
        rgba[i] = Math.max(0, Math.min(256 * rgba[i], 255));
    }
    return rgba;
}

function normalizedColor(color: number[]): number[] {
    return color.map(c => c / 255);
}

function rgba2yuva(color: number[]) {
    const [r, g, b, a] = color;
    const o = 0.299 * r + 0.587 * g + 0.114 * b;
    return [o, 0.565 * (b - o), 0.713 * (r - o), a];
}

function lerpArray(start: number[], end: number[], scale: number) {
    const arr = [];
    for (let i = 0; i < start.length; i++) {
        arr.push(start[i] * (1 - scale) + end[i] * scale);
    }
    return arr;
}

function vec2size(g: number, b: number) {
    return Math.sqrt(g * g + b * b);
}

function gradYuva(start: number[], end: number[], scale: number, bool: boolean) {
    const arr = lerpArray(start, end, scale);
    if (bool) {
        const a = vec2size(start[1], start[2]);
        const o = vec2size(end[1], end[2]);
        if (a > 0.05 && o > 0.05) {
            const s = vec2size(arr[1], arr[2]);
            if (s > 0.01) {
                const l = (a * (1 - scale) + o * scale) / s;
                arr[1] *= l;
                arr[2] *= l;
            }
        }
    }
    return arr;
}

function yuva2rgba(color: number[]) {
    const [r, g, b, a] = color;
    return [
        r + 1.403 * b,
        r - 0.344 * g - 0.714 * b,
        r + 1.77 * g,
        a,
    ];
}
