import * as p2 from 'p2';
import {
    Body,
    BodyParam,
    BodyContactListener,
    BodyGrabbedListener,
    BodyReleasedListener,
    BodySleepListener,
} from './body';
import { Window } from './window';
import { Point, Polygon, Circle, Transform } from './geometry';
import { getImage } from './images';
import { EventHelper } from './events';
import { Actor } from './actor';
import { World } from './world';
import { ActorImpl } from './actor-impl';
import { p2AABBToRect } from './p2util';

const WIREFRAME_ACTIVE_COLOR = '#ff0000';
const WIREFRAME_SLEEPY_COLOR = '#ffff00';
const WIREFRAME_SLEEPING_COLOR = '#0000ff';

const V1 = p2.vec2.create();

export class BodyImpl implements Body {
    readonly world: World;
    readonly p2body: p2.Body;
    actor?: ActorImpl;

    readonly param: BodyParam;

    imageAnchor = Point.ZERO;
    private readonly _imageBack?: HTMLImageElement;
    private _image?: HTMLImageElement;
    private readonly _imageFront?: HTMLImageElement;

    private _eventHelper = new EventHelper();
    private _awake: boolean;

    constructor(world: World, p2body: p2.Body, param: BodyParam) {
        this.world = world;
        this.p2body = p2body;
        this.param = param;
        if (param.imageBack) {
            this._imageBack = getImage(param.imageBack);
        }
        if (param.image) {
            this._image = getImage(param.image);
        }
        if (param.imageFront) {
            this._imageFront = getImage(param.imageFront);
        }
        this._awake = p2body.sleepState === p2.Body.AWAKE;
        p2body.on('wakeup', () => {
            this._awake = true;
        }, null);
        p2body.on('sleep', () => {
            if (this._awake) {
                this._awake = false;
                this._eventHelper.emit('sleep');
            }
        }, null);
    }

    get name() {
        return this.param.name;
    }

    bounds() {
        return p2AABBToRect(this.p2body.aabb);
    }

    image(imageSrc: string) {
        this._image = getImage(imageSrc);
        return this;
    }

    _drawImage(window: Window, image?: HTMLImageElement) {
        if (image) {
            const { graphics } = window;
            const transform = new Transform();
            transform.anchor = this.imageAnchor;
            transform.rotate = this.p2body.angle * 180 / Math.PI;
            transform.translate = new Point(this.p2body.position[0], this.p2body.position[1]);
            transform.flip = this.param.flip || false;
            graphics.drawImage(image, transform);
        }
    }

    drawImageBack(window: Window) {
        this._drawImage(window, this._imageBack);
    }

    drawImage(window: Window) {
        this._drawImage(window, this._image);
    }

    drawImageFront(window: Window) {
        this._drawImage(window, this._imageFront);
    }

    drawWireframe(window: Window) {
        const { graphics } = window;
        let dotted = false;
        let color = WIREFRAME_ACTIVE_COLOR;
        if (this.p2body.sleepState === p2.Body.SLEEPY) {
            color = WIREFRAME_SLEEPY_COLOR;
        }
        if (this.p2body.sleepState === p2.Body.SLEEPING) {
            color = WIREFRAME_SLEEPING_COLOR;
            dotted = true;
        }
        for (const shape of this.p2body.shapes) {
            const {vertices, radius} = shape as any;
            if (vertices) {
                const points = vertices.map((vertex: number[], index: number) => {
                    p2.vec2.toGlobalFrame(V1, vertex, shape.position, shape.angle);
                    p2.vec2.toGlobalFrame(V1, V1, this.p2body.position, this.p2body.angle);
                    return new Point(V1[0], V1[1]);
                });
                graphics.strokePolygon(new Polygon(points), color, 1, dotted);
            } else if (radius) {
                p2.vec2.toGlobalFrame(V1, shape.position,
                                      this.p2body.position, this.p2body.angle);
                graphics.strokeCircle(new Circle(new Point(V1[0], V1[1]), radius), color, 1, dotted);
            }
        }
    }

    get position() {
        return new Point(this.p2body.position[0], this.p2body.position[1]);
    }

    on(event: 'sleep', listener: BodySleepListener): this;
    on(event: 'contact', listener: BodyContactListener): this;
    on(event: 'grabbed', listener: BodyGrabbedListener): this;
    on(event: 'released', listener: BodyReleasedListener): this;
    on(event: 'sleep' | 'contact' | 'grabbed' | 'released',
       listener: BodySleepListener | BodyContactListener | BodyGrabbedListener | BodyReleasedListener) {
        this._eventHelper.on(event, listener);
        return this;
    }

    off(event: 'sleep', listener: BodySleepListener): this;
    off(event: 'contact', listener: BodyContactListener): this;
    off(event: 'grabbed', listener: BodyGrabbedListener): this;
    off(event: 'released', listener: BodyReleasedListener): this;
    off(event: 'sleep' | 'contact' | 'grabbed' | 'released',
        listener: BodySleepListener | BodyContactListener | BodyGrabbedListener | BodyReleasedListener) {
        this._eventHelper.off(event, listener);
        return this;
    }

    emitContact(otherBody: Body, velocity2: number) {
        this._eventHelper.emit('contact', otherBody, velocity2);
    }

    emitGrabbed(actor: Actor, hand: Body, window: Window) {
        this._eventHelper.emit('grabbed', actor, hand, window);
    }

    emitReleased(actor: Actor, hand: Body) {
        this._eventHelper.emit('released', actor, hand);
    }

    goto(x: number, y: number) {
        p2.vec2.set(this.p2body.position, x, y);
        return this;
    }
}
