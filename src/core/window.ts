import { Graphics } from './graphics';
import { EventHelper } from './events';
import { Size, Point, Transform, Rect } from './geometry';

const ANCHOR_RATIO = new Size(0.5, 0.6);
const PAN_MOMENTUM = 0.95;
const PAN_BORDER = 0.1;

type WindowMouseListener = () => void;

export class Window {

    readonly canvas = document.createElement('canvas');
    private _size = Size.ZERO;
    private _eventHelper = new EventHelper();

    private _cameraTransform = new Transform();
    readonly graphics = new Graphics(this.canvas);

    constructor() {
        this.canvas.addEventListener('mousedown', (event) => this._mouseDown(event));
        this.canvas.addEventListener('mousemove', (event) => this._mouseMove(event), true);
        window.addEventListener('mouseup', (event) => this._mouseUp(event), true);
        this.canvas.addEventListener('mouseout', (event) => this._mouseOut(event));
    }

    anchor() {
        return new Point(this._size.w * ANCHOR_RATIO.w, this._size.h * ANCHOR_RATIO.h);
    }

    size(): Size;
    size(w: number, h: number): Window;
    size(w?: number, h?: number): Size | Window {
        if (typeof w !== 'undefined' && typeof h !== 'undefined') {
            if (!isFinite(w) || w < 0 || !isFinite(h) || h < 0) {
                throw new Error(`invalid size ${w}x${h}`);
            }
            this._size = new Size(w, h);
            this.canvas.width = w;
            this.canvas.height = h;
            this._cameraTransform.translate = new Point(this._size.w * ANCHOR_RATIO.w, this._size.h * ANCHOR_RATIO.h);
            return this;
        } else {
            return this._size;
        }
    }

    location(): Point;
    location(x: number, y: number): Window;
    location(x?: number, y?: number): Point | Window {
        if (typeof x !== 'undefined' && typeof y !== 'undefined') {
            if (!isFinite(x) || !isFinite(y)) {
                throw new Error(`invalid point ${x},${y}`);
            }
            this._cameraTransform.anchor = new Point(x, y);
            return this;
        } else {
            return this._cameraTransform.anchor;
        }
    }

    zoom(): number;
    zoom(zoom: number): Window;
    zoom(zoom?: number): number | Window {
        if (typeof zoom !== 'undefined') {
            if (!isFinite(zoom) || zoom <= 0) {
                throw new Error(`invalid zoom ${zoom}`);
            }
            this._cameraTransform.scale = zoom;
            return this;
        } else {
            return this._cameraTransform.scale;
        }
    }

    angle(): number;
    angle(angle: number): Window;
    angle(angle?: number): number | Window {
        if (typeof angle !== 'undefined') {
            if (!isFinite(angle)) {
                throw new Error(`invalid angle ${angle}`);
            }
            this._cameraTransform.rotate = angle;
            return this;
        } else {
            return this._cameraTransform.rotate;
        }
    }

    panToward(x: number, y: number): Window {
        if (!isFinite(x) || !isFinite(y)) {
            throw new Error(`invalid point ${x},${y}`);
        }
        const np = this.location().toward(x, y, PAN_MOMENTUM);
        const bx = (1 - PAN_BORDER) * this._size.w;
        const by = (1 - PAN_BORDER) * this._size.h;
        const nx = Math.min(Math.max(np.x, x - bx), x + bx);
        const ny = Math.min(Math.max(np.y, y - by), y + by);
        this.location(nx, ny);
        return this;
    }

    cameraBounds(): Rect {
        const p1 = this.windowToWorld(0, 0);
        const p2 = this.windowToWorld(this._size.w - 1, 0);
        const p3 = this.windowToWorld(0, this._size.h - 1);
        const p4 = this.windowToWorld(this._size.w - 1, this._size.h - 1);

        const x1 = Math.min(p1.x, p2.x, p3.x, p4.x);
        const y1 = Math.min(p1.y, p2.y, p3.y, p4.y);
        const x2 = Math.max(p1.x, p2.x, p3.x, p4.x);
        const y2 = Math.max(p1.y, p2.y, p3.y, p4.y);

        return new Rect(x1, y1, x2 - x1 + 1, y2 - y1 + 1);
    }

    worldToWindow(x: number, y: number): Point {
        if (!isFinite(x) || !isFinite(y)) {
            throw new Error(`invalid point ${x},${y}`);
        }
        return this._cameraTransform.apply(x, y);
    }

    windowToWorld(x: number, y: number): Point {
        if (!isFinite(x) || !isFinite(y)) {
            throw new Error(`invalid point ${x},${y}`);
        }
        const ret = this._cameraTransform.unapply(x, y);
        return new Point(ret.x, ret.y);
    }

    on(event: 'mousemove' | 'mousedown' | 'mouseup', listener: WindowMouseListener) {
        this._eventHelper.on(event, listener);
        return this;
    }

    off(event: 'mousemove' | 'mousedown' | 'mouseup', listener: WindowMouseListener) {
        this._eventHelper.off(event, listener);
        return this;
    }

    private _clientMouseLocation: Point | undefined;
    private _mouseIsDown = false;

    mouseIsDown() {
        return this._mouseIsDown;
    }

    clearMouseIsDown() {
        this._mouseIsDown = false;
        return this;
    }

    windowMouseLocation() {
        const l = this._clientMouseLocation;
        if (l) {
            return this._size.clip(l.x, l.y);
        }
    }

    worldMouseLocation() {
        const l = this.windowMouseLocation();
        if (l) {
            return this.windowToWorld(l.x, l.y);
        }
    }

    getCameraTransform() {
        return this._cameraTransform.copy();
    }

    private _handleMouseEvent(event: MouseEvent) {
        this._clientMouseLocation = new Point(event.clientX - this.canvas.clientLeft,
                                              event.clientY - this.canvas.clientTop);
    }

    private _mouseDown(event: MouseEvent) {
        if (!this._mouseIsDown && event.button === 0) {
            this._mouseIsDown = true;
            this._handleMouseEvent(event);
            this._eventHelper.emit('mousedown');
            if ((event as any).setCapture) {
                (event as any).setCapture();
            }
        }
    }

    private _mouseMove(event: MouseEvent) {
        this._handleMouseEvent(event);
        this._eventHelper.emit('mousemove');
    }

    private _mouseUp(event: MouseEvent) {
        if (this._mouseIsDown && event.button === 0) {
            this._mouseIsDown = false;
            this._handleMouseEvent(event);
            this._eventHelper.emit('mouseup');
            const client = this._clientMouseLocation;
            const window = this.windowMouseLocation();
            if (client && window && (client.x !== window.x || client.y !== window.y)) {
                this._clientMouseLocation = undefined;
            }
        }
        if ((event as any).releaseCapture) {
            (event as any).releaseCapture();
        }
    }

    private _mouseOut(event: MouseEvent) {
        if (!this._mouseIsDown) {
            this._clientMouseLocation = undefined;
        }
    }

}
