import { dot, fromTo, toUnitVector, rotateNeg90Degrees } from 'flo-vector2d';
import { memoize } from 'flo-memoize';
import { curvature, evalDeCasteljau, tangent }   from 'flo-bezier3';
import { Curve, getCornerAtEnd } from './curve.js';
import { Circle } from './circle.js';
import { Corner } from './mat/corner.js';
// import { evalDeCasteljau$ } from './memoized/eval-de-casteljau.js';


interface PointOnShape {
    /** The [[ICurve]] on the shape boundary this points belong to. */
    curve: Curve;
    /** The bezier parameter value on the curve identifying the point coordinates. */
    t: number;
    p: number[];
}


function createPos(
        curve: Curve,
        t: number): PointOnShape {

    return {
        curve, t, p: evalDeCasteljau(curve.ps, t)
    }
}


/**
 * @hidden
 */
function isPosCorner(pos: PointOnShape) {
    return (pos.t === 0 || pos.t === 1);
}


/**
 * @hidden
 */
function getPosCorner(pos: PointOnShape): Corner {
    return getCornerAtEnd(
        pos.t === 1 ? pos.curve : pos.curve.prev
    );
}


/**
 * @hidden
 */
const isPosSharpCorner = memoize((pos: PointOnShape) => {
    if (!isPosCorner(pos)) { return false; }

    return getPosCorner(pos).isSharp;
});


/**
 * @hidden
 */
const isPosDullCorner = memoize((pos: PointOnShape) => {
    if (!isPosCorner(pos)) { return false; }

    return getPosCorner(pos).isDull;
});


/**
 * @hidden
 */
const isPosQuiteSharpCorner = memoize((pos: PointOnShape) => {
    if (!isPosCorner(pos)) { return false; }

    return getPosCorner(pos).isQuiteSharp;
});


/**
 * @hidden
 */
const isPosQuiteDullCorner = memoize((pos: PointOnShape) => {
    if (!isPosCorner(pos)) { return false; }

    return getPosCorner(pos).isQuiteDull;
});


/**
 * Returns a human-readable string of the given [[PointOnShape]]. 
 * For debugging only.
 * @hidden
 */
function posToHumanString(pos: PointOnShape) {
    return '' + pos.p[0] + ', ' + pos.p[1] + 
        ' | bz: '   + pos.curve.idx + 
        ' | t: '    + pos.t 
}


/**
 * @hidden
 * Calculates the order (to distinguish between points lying on top of each 
 * other) of the contact point if it is a dull corner.
 * @param pos
 */
function calcPosOrder(
        circle: Circle, 
        pos: PointOnShape): number {

    if (!isPosCorner(pos)) { return 0; }
    if (!isPosDullCorner(pos)) { return 0; }

    const corner = getPosCorner(pos);

    const n = rotateNeg90Degrees(corner.tangents[0]);
    const v = toUnitVector( fromTo(pos.p, circle.center) );

    return -dot(n, v);
}


/**
 * Compares two [[PointOnShape]]s according to their cyclic ordering imposed
 * by their relative positions on the shape boundary. 
 * @param a The first [[PointOnShape]].
 * @param b The second [[PointOnShape]].
 * @hidden
 */
function comparePoss(
        a: PointOnShape,
        b: PointOnShape) {

    if (a === undefined || b === undefined) {
        return undefined;
    }
    
    let res;
    
    res = a.curve.idx - b.curve.idx;
    if (res !== 0) { return res; }

    res = a.t - b.t;

    return res;
}


/**
 * Calculates and returns the osculating circle radius of the bezier at a 
 * specific t. If it is found to have negative or nearly zero radius
 * it is clipped to have positive radius so it can point into the shape.
 * @param ps
 * @param t
 * @hidden
 */
const calcOsculatingCircleRadius = memoize((pos: PointOnShape) => {
    const ps = pos.curve.ps;
    const t  = pos.t;

    const c = -curvature(ps, t); 

    // c > 0 => bending inwards

    return 1/c;
});


/**
 * Returns the osculating circle at this point of the curve.
 * @param maxOsculatingCircleRadius If not Number.POSITIVE_INFINITY then the
 * circle radius will be limited to this value.
 * @param pos The [[PointOnShape]] identifying the point.
 */
function getOsculatingCircle(
        maxOsculatingCircleRadius: number, 
        pos: PointOnShape): Circle {

    if (isPosSharpCorner(pos)) {
        return { center: pos.p, radius: 0 };
    }

    let radius = calcOsculatingCircleRadius(pos); 

    if (radius < 0) { radius = Number.POSITIVE_INFINITY; }
    radius = Math.min(
        radius, 
        maxOsculatingCircleRadius
    );

    const ps = pos.curve.ps;
    const t  = pos.t;
    
    const tangent_ = tangent(ps,t);
    const normal_ = toUnitVector([-tangent_[1],tangent_[0]]);
    const p = evalDeCasteljau(ps,t);
    const circleCenter = [
        p[0] - normal_[0]*radius,
        p[1] - normal_[1]*radius
    ];

    return { center: circleCenter, radius };
}


export { 
    PointOnShape,
    // PointOnShape, 
    getOsculatingCircle,
    comparePoss, 
    calcPosOrder,
    posToHumanString,
    isPosSharpCorner,
    isPosDullCorner,
    isPosQuiteSharpCorner,
    isPosQuiteDullCorner,
    createPos
}
