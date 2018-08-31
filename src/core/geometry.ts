import * as p2 from 'p2';

export class Size {
    readonly w: number;
    readonly h: number;

    constructor(w: number, h: number) {
        Size.check(w, h);
        this.w = w;
        this.h = h;
    }

    static check(w: number, h: number) {
        if (!isFinite(w) || w < 0 || !isFinite(h) || h < 0) {
            throw new Error(`invalid size ${w}x${h}`);
        }
    }

    static ZERO = new Size(0, 0);

    clip(x: number, y: number): Point {
        Point.check(x, y);
        const nx = Math.max(0, Math.min(this.w, x));
        const ny = Math.max(0, Math.min(this.h, y));
        return new Point(nx, ny);
    }

    toString() {
        return `${this.w}x${this.h}`;
    }
}

export class Point {
    readonly x: number;
    readonly y: number;

    constructor(x: number, y: number) {
        Point.check(x, y);
        this.x = x;
        this.y = y;
    }

    static check(x: number, y: number) {
        if (!isFinite(x) || !isFinite(y)) {
            throw new Error(`invalid point ${x},${y}`);
        }
    }

    static ZERO = new Point(0, 0);

    static fromString(str: string): Point {
        const [xs, ys] = str.split(/,/, 2);
        const [x, y] = [parseFloat(xs), parseFloat(ys)];
        if (!isFinite(x) || !isFinite(y)) {
            throw new Error(`cannot parse point "${str}"`);
        }
        return new Point(x, y);
    }

    translate(dx: number, dy: number) {
        if (!isFinite(dx) || !isFinite(dy)) {
            throw new Error(`invalid translate ${dx},${dy}`);
        }
        return new Point(this.x + dx, this.y + dy);
    }

    /**
     * Return a point that is closer to a target than this point.
     * `momentum` should be between 0 and 1, and represents the
     * slowness of the movement toward the target over repeated calls.
     */
    toward(x: number, y: number, momentum: number) {
        if (!isFinite(momentum) || momentum < 0 || momentum > 1) {
            throw new Error(`invalid momentum ${momentum}`);
        }
        const nx = this.x * momentum + x * (1 - momentum);
        const ny = this.y * momentum + y * (1 - momentum);
        return new Point(nx, ny);
    }

    toString() {
        return `${this.x},${this.y}`;
    }
}

export class Rect {
    readonly x1: number;
    readonly y1: number;
    readonly w: number;
    readonly h: number;

    constructor(x1: number, y1: number, w: number, h: number) {
        Rect.check(x1, y1, w, h);
        this.x1 = x1;
        this.y1 = y1;
        this.w = w;
        this.h = h;
    }

    static check(x1: number, y1: number, w: number, h: number) {
        if (!isFinite(x1) || !isFinite(y1) || !isFinite(w) || !isFinite(h)) {
            throw new Error(`invalid rectangle [${x1},${y1} ${w}x${h}]`);
        }
    }

    static ZERO = new Rect(0, 0, 0, 0);

    get x2() {
        return this.x1 + this.w - 1;
    }

    get y2() {
        return this.y1 + this.h - 1;
    }

    translate(dx: number, dy: number) {
        if (!isFinite(dx) || !isFinite(dy)) {
            throw new Error(`invalid translate ${dx},${dy}`);
        }
        return new Rect(this.x1 + dx, this.y1 + dy, this.w, this.h);
    }

    asPolygon() {
        return new Polygon([
            new Point(this.x1, this.y1),
            new Point(this.x2, this.y1),
            new Point(this.x2, this.y2),
            new Point(this.x1, this.y2),
        ]);
    }

    toString() {
        return `[${this.x1},${this.y1} ${this.w}x${this.h}]`;
    }
}

export class Polygon {
    private readonly _points: Point[];

    constructor(points: Point[]) {
        this._points = points.slice();
    }

    empty() {
        return this._points.length === 0;
    }

    size() {
        return this._points.length;
    }

    point(index: number) {
        if (!isFinite(index) || index < 0 || index >= this._points.length) {
            throw new Error(`invalid index ${index}`);
        }
        return this._points[index];
    }

    forEachPoint(callback: (point: Point, index: number) => void) {
        this._points.forEach(callback);
    }

    mapPoints<T>(callback: (point: Point, index: number) => T): T[] {
        return this._points.map(callback);
    }

    static fromString(str: string): Polygon {
        const p = str.split(/\s+/).filter((s) => s !== '').map((ps) => Point.fromString(ps));
        return new Polygon(p);
    }

    translate(dx: number, dy: number) {
        if (!isFinite(dx) || !isFinite(dy)) {
            throw new Error(`invalid translate ${dx},${dy}`);
        }
        return new Polygon(this._points.map((p) => p.translate(dx, dy)));
    }

    toString() {
        return this._points.map((p) => p.toString()).join(' ');
    }
}

export class PolyPolygon {
    readonly _polygons: Polygon[];

    constructor(polygons: Polygon[]) {
        this._polygons = polygons.slice();
    }

    empty() {
        return this._polygons.length === 0;
    }

    size() {
        return this._polygons.length;
    }

    polygon(index: number) {
        if (!isFinite(index) || index < 0 || index >= this._polygons.length) {
            throw new Error(`invalid index ${index}`);
        }
        return this._polygons[index];
    }

    translate(dx: number, dy: number) {
        if (!isFinite(dx) || !isFinite(dy)) {
            throw new Error(`invalid translate ${dx},${dy}`);
        }
        return new PolyPolygon(this._polygons.map((p) => p.translate(dx, dy)));
    }

    forEachPolygon(callback: (polygon: Polygon, index: number) => void) {
        this._polygons.forEach(callback);
    }

    mapPolygons<T>(callback: (polygon: Polygon, index: number) => T): T[] {
        return this._polygons.map(callback);
    }
}

export class Circle {
    readonly center: Point;
    readonly radius: number;

    constructor(center: Point, radius: number) {
        if (!isFinite(radius) || radius < 0) {
            throw new Error(`invalid radius ${radius}`);
        }
        this.center = center;
        this.radius = radius;
    }

    static fromString(str: string): Circle {
        const [cs, rs] = str.split(/\s+/, 2);
        const c = Point.fromString(cs);
        const r = parseFloat(rs);
        if (!isFinite(r)) {
            throw new Error(`cannot parse circle "${str}"`);
        }
        return new Circle(c, r);
    }

    translate(dx: number, dy: number) {
        if (!isFinite(dx) || !isFinite(dy)) {
            throw new Error(`invalid translate ${dx},${dy}`);
        }
        return new Circle(this.center.translate(dx, dy), this.radius);
    }

    toString() {
        return `${this.center.toString()} ${this.radius}`;
    }
}

function translate(x: number, y: number, tx: number, ty: number): [number, number] {
    return [x + tx, y + ty];
}

function flip(x: number, y: number, f: boolean): [number, number] {
    if (!f) {
        return [x, y];
    }
    return [-x, y];
}

function scale(x: number, y: number, v: number): [number, number] {
    return [x * v, y * v];
}

function rotate(x: number, y: number, a: number): [number, number] {
    if (a === 0) {
        return [x, y];
    }
    const s = Math.sin(a * Math.PI / 180);
    const c = Math.cos(a * Math.PI / 180);
    return [- s * y + c * x, c * y + s * x];
}

/**
 * Represents a simple linear transformation from one coordinate system to
 * another.  This is used to describe the position and orientation of things
 * like bodies, images, and the camera.
 *
 * `anchor` represents the point in the thing around which rotation occurs.
 * For the camera this represent the point of focus in world coordinates.
 *
 * When `flip` is true, the thing is flipped horizontally, before rotation.
 *
 * `scale` can be used to zoom the camera, or to make bodies and images larger.
 *
 * `rotate` represents the angle (in degrees) that the thing is to be rotated
 * around the anchor.
 *
 * `translate` is the position of the thing after the other transformations are
 * applied.  For the camera, this is the point of focus in screen coordinates.
 */
export class Transform {
    anchor = Point.ZERO;
    flip = false;
    scale = 1;
    rotate = 0; // in degrees
    translate = Point.ZERO;

    check() {
        if (!isFinite(this.rotate)) {
            throw new Error(`invalid rotate ${this.rotate}`);
        }
        if (!isFinite(this.scale) || this.scale <= 0) {
            throw new Error(`invalid scale ${this.scale}`);
        }
    }

    copy() {
        const ret = new Transform();
        ret.anchor = this.anchor;
        ret.flip = this.flip;
        ret.scale = this.scale;
        ret.rotate = this.rotate;
        ret.translate = this.translate;
        return ret;
    }

    apply(x: number, y: number): Point {
        this.check();
        // anchor
        [x, y] = translate(x, y, -this.anchor.x, -this.anchor.y);
        // flip
        [x, y] = flip(x, y, this.flip);
        // scale
        [x, y] = scale(x, y, this.scale);
        // rotate
        [x, y] = rotate(x, y, this.rotate);
        // translate
        [x, y] = translate(x, y, this.translate.x, this.translate.y);
        return new Point(x, y);
    }

    unapply(x: number, y: number): Point {
        this.check();
        // translate
        [x, y] = translate(x, y, -this.translate.x, -this.translate.y);
        // rotate
        [x, y] = rotate(x, y, -this.rotate);
        // scale
        [x, y] = scale(x, y, 1 / this.scale);
        // flip
        [x, y] = flip(x, y, this.flip);
        // anchor
        [x, y] = translate(x, y, this.anchor.x, this.anchor.y);
        return new Point(x, y);
    }
}

const V1 = p2.vec2.create();
const V2 = p2.vec2.create();
const V3 = p2.vec2.create();
const V4 = p2.vec2.create();
const V5 = p2.vec2.create();

export function lineIntersection(l1x1: number, l1y1: number, l1x2: number, l1y2: number,
                                 l2x1: number, l2y1: number, l2x2: number, l2y2: number) {
    p2.vec2.set(V1, l1x1, l1y1);
    p2.vec2.set(V2, l1x2, l1y2);
    p2.vec2.set(V3, l2x1, l2y1);
    p2.vec2.set(V4, l2x2, l2y2);
    if (!(p2.vec2 as any).getLineSegmentsIntersection(V5, V1, V2, V3, V4)) {
        return undefined;
    }
    return new Point(V5[0], V5[1]);
}
