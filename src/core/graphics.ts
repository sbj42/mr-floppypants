import { Transform, Polygon, PolyPolygon, Rect, Size, Point, Circle } from './geometry';

export type PaintLike = ColorLike | Paint;

export abstract class Paint {
    static fix(p: PaintLike): Paint {
        if (p instanceof Paint) {
            return p;
        } else {
            return Color.fromString(p);
        }
    }
}

export type ColorLike = Color | string;

export class Color extends Paint {
    readonly r: number;
    readonly g: number;
    readonly b: number;
    readonly a: number;

    constructor(r: number, g: number, b: number, a = 1) {
        super();
        Color.check(r, g, b, a);
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    static check(r: number, g: number, b: number, a: number = 1) {
        if (!isFinite(r) || r < 0 || r > 255
            || !isFinite(g) || g < 0 || g > 255
            || !isFinite(b) || b < 0 || b > 255
            || !isFinite(a) || a < 0 || a > 1) {
            throw new Error(`invalid color ${r},${g},${b},${a}`);
        }
    }

    static fix(c: ColorLike): Color {
        if (c instanceof Color) {
            return c;
        } else {
            return Color.fromString(c);
        }
    }

    static fromString(str: string): Color {
        if (str.charAt(0) === '#') {
            const r = parseInt(str.substr(1, 2), 16);
            const g = parseInt(str.substr(3, 2), 16);
            const b = parseInt(str.substr(5, 2), 16);
            if (str.length === 7) {
                if (isFinite(r) && isFinite(g) && isFinite(b)) {
                    return new Color(r, g, b);
                }
            } else if (str.length === 9) {
                const a = parseInt(str.substr(7, 2), 16);
                if (isFinite(r) && isFinite(g) && isFinite(b) && isFinite(a)) {
                    return new Color(r, g, b, a / 255);
                }
            }
        } else {
            const [rs, gs, bs, as] = str.split(/\s+/, 4);
            const r = parseFloat(rs);
            const g = parseFloat(gs);
            const b = parseFloat(bs);
            const a = typeof as !== 'undefined' ? parseFloat(as) : 1;
            if (isFinite(r) && isFinite(g) && isFinite(b) && isFinite(a)) {
                return new Color(r, g, b, a);
            }
        }
        throw new Error(`cannot parse color "${str}"`);
    }

    static BLACK = new Color(0, 0, 0);
    static WHITE = new Color(255, 255, 255);
    static TRANSPARENT = new Color(0, 0, 0, 0);

    withAlpha(a: number) {
        return new Color(this.r, this.g, this.b, a);
    }

    toCSS() {
        return `rgba(${this.r},${this.g},${this.b},${this.a})`;
    }

    toString() {
        return `(${this.r},${this.g},${this.b},${this.a})`;
    }
}

export interface LinearGradientStop {
    offset: number;
    color: Color;
}

export class LinearGradient extends Paint {
    readonly x0: number;
    readonly y0: number;
    readonly x1: number;
    readonly y1: number;
    private readonly _stops: LinearGradientStop[];

    constructor(x0: number, y0: number, x1: number, y1: number, stops: LinearGradientStop[]) {
        super();
        LinearGradient.check(x0, y0, x1, y1, stops);
        this.x0 = x0;
        this.y0 = y0;
        this.x1 = x1;
        this.y1 = y1;
        this._stops = stops;
    }

    static check(x0: number, y0: number, x1: number, y1: number, stops: LinearGradientStop[]) {
        if (!isFinite(x0)
            || !isFinite(y0)
            || !isFinite(x1)
            || !isFinite(y1)) {
            throw new Error(`invalid gradient points ${x0},${y0} ${x1},${y1}`);
        }
    }

    static fromSimple(x0: number, y0: number, color0: ColorLike,
                      x1: number, y1: number, color1: ColorLike): LinearGradient {
        return new LinearGradient(x0, y0, x1, y1, [{
            offset: 0,
            color: Color.fix(color0),
        }, {
            offset: 1,
            color: Color.fix(color1),
        }]);
    }

    forEachStop(callback: (offset: number, color: Color) => void) {
        for (const stop of this._stops) {
            callback(stop.offset, stop.color);
        }
    }
}

function createLinearGradient(context: CanvasRenderingContext2D, gradient: LinearGradient) {
    const ret = context.createLinearGradient(gradient.x0, gradient.y0, gradient.x1, gradient.y1);
    gradient.forEachStop((offset, color) => {
        ret.addColorStop(offset, color.toCSS());
    });
    return ret;
}

type FillRule = 'nonzero' | 'evenodd';
const DEFAULT_FILLRULE: FillRule = 'evenodd';

type JoinStyle = 'round';
const DEFAULT_JOINSTYLE: JoinStyle = 'round';

type TextAlign = 'center' | 'left' | 'right';
const DEFAULT_TEXTALIGN: TextAlign = 'center';

type TextBaseline = 'middle' | 'top' | 'bottom';
const DEFAULT_TEXTBASELINE: TextBaseline = 'middle';

/**
 * Graphics wraps a canvas 2D rendering context with a simplified interface
 * for drawing graphics.
 */
export class Graphics {
    private readonly _context: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        const context = canvas.getContext('2d', {alpha: false});
        if (context == null) {
            throw new Error(`failed to create 2d context`);
        }
        this._context = context;
    }

    size(): Size {
        return new Size(this._context.canvas.clientWidth, this._context.canvas.clientHeight);
    }

    setTransform(transform?: Transform): Graphics {
        this._context.setTransform(1, 0, 0, 1, 0, 0);
        this.addTransform(transform);
        return this;
    }

    addTransform(transform: Transform | undefined): Graphics {
        if (transform) {
            this._context.translate(transform.translate.x, transform.translate.y);
            this._context.rotate(transform.rotate * Math.PI / 180);
            this._context.scale(transform.scale, transform.scale);
            if (transform.flip) {
                this._context.scale(-1, 1);
            }
            this._context.translate(-transform.anchor.x, -transform.anchor.y);
        }
        return this;
    }

    drawImage(image: HTMLImageElement, transform: Transform | undefined): Graphics {
        this._context.save();
        this.addTransform(transform);
        this._context.drawImage(image, 0, 0);
        this._context.restore();
        return this;
    }

    private _drawCircle(circle: Circle) {
        this._context.beginPath();
        this._context.arc(circle.center.x, circle.center.y, circle.radius, 0, Math.PI * 2);
    }

    private _drawPolygonHelper(polygon: Polygon) {
        polygon.forEachPoint((point, i) => {
            if (i === 0) {
                this._context.moveTo(point.x, point.y);
            } else {
                this._context.lineTo(point.x, point.y);
            }
        });
        if (!polygon.empty()) {
            const point = polygon.point(0);
            this._context.lineTo(point.x, point.y);
        }
    }

    private _drawPolygon(polygon: Polygon) {
        this._context.beginPath();
        this._drawPolygonHelper(polygon);
    }

    private _drawPolypolygon(polypolygon: PolyPolygon) {
        this._context.beginPath();
        polypolygon.forEachPolygon((polygon) => {
            this._drawPolygonHelper(polygon);
        });
    }

    strokeLine(x1: number, y1: number, x2: number, y2: number, color: ColorLike, width: number, dotted = false) {
        this._context.beginPath();
        this._context.moveTo(x1, y1);
        this._context.lineTo(x2, y2);
        this._stroke(color, width, dotted, DEFAULT_JOINSTYLE);
        return this;
    }

    strokeCircle(circle: Circle, color: ColorLike, width: number, dotted = false) {
        this._drawCircle(circle);
        this._stroke(color, width, dotted, DEFAULT_JOINSTYLE);
        return this;
    }

    strokePolygon(polygon: Polygon, color: ColorLike, width: number, dotted = false, join = DEFAULT_JOINSTYLE) {
        this._drawPolygon(polygon);
        this._stroke(color, width, dotted, join);
        return this;
    }

    fillPolygon(polygon: Polygon, paint: PaintLike, fillRule = DEFAULT_FILLRULE) {
        this._drawPolygon(polygon);
        this._fill(paint, fillRule);
        return this;
    }

    strokePolyPolygon(polypolygon: PolyPolygon, color: ColorLike, width: number,
                      join = DEFAULT_JOINSTYLE, dotted = false) {
        this._drawPolypolygon(polypolygon);
        this._stroke(color, width, dotted, join);
        return this;
    }

    fillPolyPolygon(polypolygon: PolyPolygon, paint: PaintLike, fillRule = DEFAULT_FILLRULE) {
        this._drawPolypolygon(polypolygon);
        this._fill(paint, fillRule);
        return this;
    }

    private _fillStyle(p: PaintLike) {
        const paint = Paint.fix(p);
        if (paint instanceof Color) {
            this._context.fillStyle = paint.toCSS();
        } else if (paint instanceof LinearGradient) {
            this._context.fillStyle = createLinearGradient(this._context, paint);
        } else {
            throw new Error(`bad paint type ${paint}`);
        }
    }

    private _fill(paint: PaintLike, fillRule: FillRule) {
        this._fillStyle(paint);
        this._context.fill(fillRule);
    }

    private _strokeStyle(c: ColorLike, width: number, dotted: boolean, join: JoinStyle) {
        const color = Color.fix(c);
        this._context.lineWidth = width;
        this._context.lineJoin = join;
        this._context.strokeStyle = color.toCSS();
        this._context.setLineDash(dotted ? [1, 3] : []);
    }

    private _stroke(color: ColorLike, width: number, dotted: boolean, join: JoinStyle) {
        this._strokeStyle(color, width, dotted, join);
        this._context.stroke();
    }

    fillRect(x1: number, y1: number, w: number, h: number, paint: PaintLike) {
        Rect.check(x1, y1, w, h);
        this._fillStyle(paint);
        this._context.fillRect(x1, y1, w, h);
        return this;
    }

    strokeRect(x1: number, y1: number, w: number, h: number,
               color: ColorLike, width: number, join = DEFAULT_JOINSTYLE, dotted = false) {
        Rect.check(x1, y1, w, h);
        this._strokeStyle(color, width, dotted, join);
        this._context.strokeRect(x1, y1, w, h);
        return this;
    }

    globalAlpha(alpha: number = 1) {
        if (!isFinite(alpha) || alpha < 0 || alpha > 1) {
            throw new Error(`invalid alpha ${alpha}`);
        }
        this._context.globalAlpha = alpha;
        return this;
    }

    fillText(x: number, y: number, text: string, paint: PaintLike, font: string,
             align = DEFAULT_TEXTALIGN, baseline = DEFAULT_TEXTBASELINE) {
        Point.check(x, y);
        this._fillStyle(paint);
        this._context.textAlign = align;
        this._context.textBaseline = baseline;
        this._context.font = font;
        this._context.fillText(text, x, y);
        return this;
    }

}
