import { getClosestBoundaryPoint } from '../../closest-boundary-point/get-closest-boundary-point.js';
/**
 * @internal
 * @param x
 * @param bezierPiece3s
 * @param extreme
 */
function getClosestPoints(x, bezierPiece3s) {
    return bezierPiece3s.map(bezierPieces => {
        const posInfo = getClosestBoundaryPoint(bezierPieces, x, undefined, // curve
        undefined // t
        );
        return posInfo ? posInfo.pos : undefined;
    });
}
export { getClosestPoints };
//# sourceMappingURL=get-closest-points.js.map