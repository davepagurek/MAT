"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const flo_bezier3_1 = require("flo-bezier3");
const point_on_shape_1 = require("../../../point-on-shape");
const pair_set_1 = require("./pair-set");
const find_bb_intersections_1 = require("../../../bounding-box/find-bb-intersections");
// TODO - DELTA is arbitrary
const DELTA = 1e-9;
/**
 * Find and return all intersections on all given loops.
 * @param loops
 */
function getIntersections(loops) {
    let { boxes, boxInfoMap } = getBoxInfos(loops);
    let boxIntersections = getBoxIntersections(boxes, boxInfoMap);
    //console.log(boxIntersections.length);
    // Check curve intersection amongst possibilities
    /** A map from bezier nodes to all its intersecting beziers */
    let intersections = new Map();
    let checkedPairs = new Map();
    //console.log(boxIntersections.length);
    for (let i = 0; i < boxIntersections.length; i++) {
        let boxIntersection = boxIntersections[i];
        //console.log(boxIntersection)
        /*
        if (boxIntersection.box1[0][0] === boxIntersection.box2[0][0] &&
            boxIntersection.box1[0][1] === boxIntersection.box2[0][1] &&
            //boxIntersection.box1[1][0] === boxIntersection.box2[1][0] &&
            boxIntersection.box1[1][1] === boxIntersection.box2[1][1]) {
            console.log(boxIntersection)
        }
        */
        //if (i === 5) {
        /*
        _debug_.fs.draw.rect(
            _debug_.generated.g,
            boxIntersection.box1, 'nofill thin2 blue'
        );
        _debug_.fs.draw.rect(
            _debug_.generated.g,
            boxIntersection.box2, 'nofill thin2 blue'
        );
            */
        //console.log(boxIntersection);
        //}
        let curves = [
            boxInfoMap.get(boxIntersection.box1).curve,
            boxInfoMap.get(boxIntersection.box2).curve,
        ];
        if (pair_set_1.pairSet_has(checkedPairs, curves)) {
            continue;
        }
        pair_set_1.pairSet_add(checkedPairs, curves);
        let pss = curves.map(curve => curve.ps);
        let tPairs = flo_bezier3_1.bezier3Intersection(pss[0], pss[1]);
        /*
        console.log('-------');
        console.log(tPairs.toString());
        console.log(pss[0].toString());
        console.log(pss[1].toString());
        console.log('-------');
        */
        for (let tPair of tPairs) {
            // TODO - the below check is temporary - there is a better way
            // TODO - eliminate the fact that intersections are found twice
            if ((Math.abs(tPair[0]) < DELTA && Math.abs(tPair[1] - 1) < DELTA) ||
                (Math.abs(tPair[0] - 1) < DELTA && Math.abs(tPair[1]) < DELTA) ||
                (Math.abs(tPair[0]) < DELTA && Math.abs(tPair[1]) < DELTA) ||
                (Math.abs(tPair[0] - 1) < DELTA && Math.abs(tPair[1] - 1) < DELTA)) {
                continue;
            }
            /*
            if (_debug_ !== undefined) {
                let p = evaluate(pss[0], tPair[0]);
                _debug_.fs.draw.crossHair(p, 'nofill thin1 red', 2);
            }
            */
            let xInfos = [];
            let pos1 = new point_on_shape_1.PointOnShape(curves[0], tPair[0]);
            xInfos.push({
                loop: curves[0].loop,
                pos: pos1,
                opposite: undefined,
                loopTree: undefined,
            });
            let pos2 = new point_on_shape_1.PointOnShape(curves[1], tPair[1]);
            xInfos.push({
                loop: curves[1].loop,
                pos: pos2,
                opposite: xInfos[0],
                loopTree: undefined,
            });
            xInfos[0].opposite = xInfos[1];
            _debug_.fs.draw.crossHair(_debug_.generated.g, pos1.p, 'blue nofill thin2', 0.01);
            _debug_.fs.draw.crossHair(_debug_.generated.g, pos2.p, 'blue nofill thin2', 0.01);
            console.log(tPair[0], tPair[1], pss);
            for (let j = 0; j < 2; j++) {
                let intersectingCurves = intersections.get(curves[j]);
                if (!intersectingCurves) {
                    intersectingCurves = [];
                    intersections.set(curves[j], intersectingCurves);
                }
                intersectingCurves.push(xInfos[j]);
            }
        }
    }
    return intersections;
}
exports.getIntersections = getIntersections;
/**
 * Returns an array of lines of the bounding hulls of the Loop beziers' control
 * points including a map that maps each line to its hull, path and curve.
 * @param loops An array of Loops
 */
function getBoxInfos(loops) {
    /** Map that maps a line segment to some info. */
    let boxInfoMap = new Map();
    let boxes = [];
    // Get lines making up the hulls of the paths
    for (let loop of loops) {
        loop.curves.forEach(function (curve) {
            let box = flo_bezier3_1.getBoundingBox(curve.ps);
            boxes.push(box);
            boxInfoMap.set(box, { box, loop, curve });
        });
    }
    return { boxes, boxInfoMap };
}
function getBoxIntersections(boxes, boxInfoMap) {
    // Get possible intersections between curves
    let boxIntersections = find_bb_intersections_1.default(boxes);
    return boxIntersections;
}