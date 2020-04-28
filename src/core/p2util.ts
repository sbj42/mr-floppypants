import { Point, Rect, Polygon } from './geometry';
import * as p2 from 'p2';

export function p2point(point: Point): [number, number] {
    return [point.x, point.y];
}

export function p2AABBFromRect(rect: Rect) {
    return new p2.AABB({
        lowerBound: [rect.x1, rect.y1],
        upperBound: [rect.x2, rect.y2],
    });
}

export function p2AABBToRect(aabb: p2.AABB) {
    const {lowerBound, upperBound} = aabb as any;
    return new Rect(lowerBound[0], lowerBound[1], upperBound[0] - lowerBound[0], upperBound[1] - lowerBound[1]);
}

export function p2polygon(polygon: Polygon) {
    const ret: number[][] = [];
    polygon.forEachPoint((p) => ret.push(p2point(p)));
    return ret;
}
