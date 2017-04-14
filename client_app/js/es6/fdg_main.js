import emitter from './emitter';
import {
    Svg,
    G,
    Circle,
    Rect,
    Text,
    Path
} from './svg';
import FDG from './fdg_es6';

console.log(
    !!emitter,
    !!Svg,
    !!G,
    !!Circle,
    !!Rect,
    !!Text,
    !!Path,
    !!FDG
);

/*

compile: npm run rollup fdg_main.js --format iife --output fdg_bundle.js

 */
