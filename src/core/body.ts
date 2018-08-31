import { Point, Rect, Polygon, Circle, PolyPolygon } from './geometry';
import { Material, World } from './world';
import { Actor } from './actor';
import { Window } from './window';

export type BodyBounds = Rect | Polygon | Circle | undefined;

export interface CollisionOptions {
    collidesWith?: string[];
    doesntCollideWith?: string[];
}

export interface BodyParam extends CollisionOptions {
    name?: string;

    mass?: number; // 0 or undefined = static (it never moves)
    density?: number; // used for buoyancy in water (default = ?)
    material?: Material; // default is MATERIAL_STANDARD
    damping?: number;

    initialAnchor?: Point; // center of body in image (default 0,0)
    bounds: BodyBounds; // relative to top-left of image
    otherBounds?: BodyBounds[];
    imageBack?: string;
    image?: string;
    imageFront?: string;

    location: Point;
    angle?: number;
    flip?: boolean;

    bodyType?: string;
    ignoreGravity?: boolean;
    neverSleep?: boolean;
}

export type BodyContactListener = (otherBody: Body, velocity2: number) => void;
export type BodyGrabbedListener = (actor: Actor, hand: Body, window: Window) => void;
export type BodyReleasedListener = (actor: Actor, hand: Body) => void;
export type BodySleepListener = () => void;

export interface Body {
    readonly name?: string;
    readonly world: World;
    readonly position: Point;
    readonly actor?: Actor;

    bounds(): Rect;

    image(imageSrc: string): this;

    on(event: 'sleep', listener: BodySleepListener): this;
    on(event: 'contact', listener: BodyContactListener): this;
    on(event: 'grabbed', listener: BodyGrabbedListener): this;
    on(event: 'released', listener: BodyReleasedListener): this;

    off(event: 'sleep', listener: BodySleepListener): this;
    off(event: 'contact', listener: BodyContactListener): this;
    off(event: 'grabbed', listener: BodyGrabbedListener): this;
    off(event: 'released', listener: BodyReleasedListener): this;

    goto(x: number, y: number): this;
}

export interface BodyGetOptions {
    flip?: boolean;
    angle?: number;
}

export class BodyFactory {
    private _initialAnchor?: Point;
    private _bounds?: BodyBounds;
    private _otherBounds?: BodyBounds[];
    private _imageBack?: string;
    private _image?: string;
    private _imageFront?: string;
    private _mass?: number;
    private _density?: number;
    private _material?: Material;
    private _damping?: number;
    private _ignoreGravity?: boolean;
    private _bodyType?: string;
    private _collisionOptions?: CollisionOptions;
    private _neverSleep?: boolean;

    constructor(image: string | undefined, bounds: BodyBounds | string | string[],
                ax?: number, ay?: number) {
        this._image = image;
        if (typeof bounds === 'string') {
            bounds = Polygon.fromString(bounds);
        } else if (Array.isArray(bounds)) {
            this._otherBounds = bounds.slice(1).map((str) => Polygon.fromString(str));
            bounds = Polygon.fromString(bounds[0]);
        }
        this._bounds = bounds;
        if (typeof ax !== 'undefined' && typeof ay !== 'undefined') {
            this._initialAnchor = new Point(ax, ay);
        }
    }

    mass(mass: number, density?: number, material?: Material) {
        this._mass = mass;
        this._density = density;
        this._material = material;
        return this;
    }

    damping(damping: number) {
        this._damping = damping;
        return this;
    }

    ignoreGravity() {
        this._ignoreGravity = true;
        return this;
    }

    imageBack(imageBack: string) {
        this._imageBack = imageBack;
        return this;
    }

    imageFront(imageFront: string) {
        this._imageFront = imageFront;
        return this;
    }

    bodyType(bodyType: string, options?: CollisionOptions) {
        this._bodyType = bodyType;
        this._collisionOptions = options;
        return this;
    }

    neverSleep() {
        this._neverSleep = true;
        return this;
    }

    get(atx: number, aty: number, options?: BodyGetOptions): BodyParam {
        return {
            location: new Point(atx, aty),
            bounds: this._bounds,
            otherBounds: this._otherBounds,
            imageBack: this._imageBack,
            image: this._image,
            imageFront: this._imageFront,
            ...options,
            initialAnchor: this._initialAnchor,

            mass: this._mass,
            density: this._density,
            material: this._material,
            damping: this._damping,
            ignoreGravity: this._ignoreGravity,
            bodyType: this._bodyType,
            ...this._collisionOptions,
            neverSleep: this._neverSleep,
        };
    }
}

export function isFoot(body: Body) {
    let ret = false;
    if (body.actor) {
        body.actor.forEachFoot((foot) => {
            if (foot === body) {
                ret = true;
            }
        });
    }
    return ret;
}
