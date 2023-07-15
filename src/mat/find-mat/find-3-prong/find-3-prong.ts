/** @internal */
declare const _debug_: Debug; 

import { fromTo } from 'flo-bezier3';
import { Debug } from '../../../debug/debug.js';
import { CpNode } from '../../../cp-node.js';
import { Circle } from '../../../circle.js';
import { PointOnShape } from '../../../point-on-shape.js';
import { createEmptyThreeProngForDebugging } from '../../../debug/three-prong-for-debugging.js';
import { find3ProngForDelta3s } from './find-3-prong-for-delta3s.js';
import { getBoundaryPieceBeziers } from '../../get-boundary-piece-beziers.js';


/**
 * @hidden
 * Find and return a 3-prong from the given boundary piece.
 * @param δs A boundary piece
 * @param extreme The maximum coordinate value used to calculate floating point
 * tolerances.
 */ 
function find3Prong(δs: CpNode[][], extreme: number) {
	const bezierPiecess = δs.map(getBoundaryPieceBeziers);

	if (typeof _debug_ !== 'undefined') { 
		const threeProngs = _debug_.generated.elems.threeProng;
		threeProngs.push(createEmptyThreeProngForDebugging());

		const d = threeProngs[threeProngs.length-1];
		d.boundaries = [];
		for (const bezierPieces of bezierPiecess) {
			const boundary: number[][][] = [];
			d.boundaries.push(boundary);
			for (const bezierPiece of bezierPieces) {
				/* qqq
				let bezier = fromTo(bezierPiece.curve.ps)(
					bezierPiece.ts[0], bezierPiece.ts[1]
				);
				*/
				const bezier = fromTo(
					bezierPiece.curve.ps,
					bezierPiece.ts[0], bezierPiece.ts[1]
				);
				boundary.push(bezier);
			}
		}
		d.traces = [];
	}

	const candidateThreeProngs = [];

	// The best candidate amongst the different 'permutations' of the given δs.
	let threeProng: { 
        circle: Circle, 
        ps: PointOnShape[], 
        δ3s: CpNode[][] 
    };
	let bestIndx = undefined; 
	let smallestError = Number.POSITIVE_INFINITY;
	for (let i=1; i<δs.length-1; i++) {
		for (let k=0; k<3; k++) {
			if (typeof _debug_ !== 'undefined') { 
				const threeProngs = _debug_.generated.elems.threeProng;
				const d = threeProngs[threeProngs.length-1];
				const trace: number[][] = [];
				d.traces.push(trace);
			}

			const threeProngInfo = 
				find3ProngForDelta3s(δs, i, k, bezierPiecess, extreme);
			if (!threeProngInfo) { continue; }

			const { circle, ps, error, δ3s } = threeProngInfo;
			
			if (typeof _debug_ !== 'undefined') { 
				candidateThreeProngs.push({ circle, ps });
			}
			
			if (error < smallestError) {
				smallestError = error;
				
				bestIndx = i-1;
				threeProng = { circle, ps, δ3s };
			}
		}
	}

	//threeProng.δ3s = [δs[0], δs[bestIndx+1], δs[δs.length-1]];

	if (typeof _debug_ !== 'undefined') { 
		const threeProngs = _debug_.generated.elems.threeProng;
		const d = threeProngs[threeProngs.length-1];

		d.generated = _debug_.generated;
		d.circle = threeProng.circle;
		d.poss = threeProng.ps;
		d.cp3ss = threeProng.δ3s;
		d.cpss = δs;
		d.bestIndx = bestIndx;
		d.candidateThreeProngs = candidateThreeProngs;
	}
	
	return threeProng;
}


export { find3Prong }
