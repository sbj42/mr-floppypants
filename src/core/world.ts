import * as p2 from 'p2';
import { Rect, Point, Polygon, Circle } from './geometry';
import { p2AABBToRect, p2AABBFromRect, p2point } from './p2util';
import { Drawable } from './drawable';
import { BodyParam, Body, CollisionOptions } from './body';
import { BodyImpl } from './body-impl';
import { ActorParam, Actor } from './actor';
import { ActorImpl } from './actor-impl';
import { RevoluteConstraint, LockConstraint } from './constraint';
import { RevoluteConstraintImpl, LockConstraintImpl } from './constraint-impl';
import { Game } from './game';
import { ACH_SWIM } from './achievements';
import { EventHelper } from './events';

export const DEFAULT_GRAVITY = 500; // pixels/sec^2?

export const MATERIAL_STANDARD = 'standard';
export const MATERIAL_BOUNCY = 'bouncy';
export type Material = typeof MATERIAL_STANDARD | typeof MATERIAL_BOUNCY;

const P2MATERIAL_STANDARD = new p2.Material(0);
const P2MATERIAL_BOUNCY = new p2.Material(0);

interface BodyType {
    collisionGroup: number;
    collisionMask: number;
}

export const BODYTYPE_BACKGROUND = 'background'; // collides with nothing
export const BODYTYPE_GROUND = 'ground'; // collides with everything except ground and background
export const BODYTYPE_STANDARD = 'standard'; // collides with everything except background

const FENCE_THICKNESS = 200;

const TIME_STEP = 1 / 60; // seconds
const MAX_SUBSTEPS = 20; // Max sub steps to catch up with the wall clock

const WATER_VISCOSITY = 0.5;

const EXTEND_SKY = 500;

const V1 = p2.vec2.create();
const V2 = p2.vec2.create();
const V3 = p2.vec2.create();
const V4 = p2.vec2.create();

export type ActorGenerator = (world: World, atx: number, aty: number) => Actor;

export type WorldTickListener = () => void;

export class World {

    readonly game: Game;
    private readonly _p2world: p2.World;

    private _bound = Rect.ZERO;
    private readonly _fences: p2.Body[] = [];

    private _gravity = DEFAULT_GRAVITY;

    private readonly _bodyTypes = [
        BODYTYPE_BACKGROUND,
        BODYTYPE_STANDARD,
        BODYTYPE_GROUND,
    ];

    private _lastTime = 0;

    private readonly _backdrops: Drawable[] = [];
    private readonly _namedLocations: {[name: string]: Point} = {};
    private _startLocationName = '';
    private _startActorGenerator: ActorGenerator | undefined;

    private readonly _bodies: BodyImpl[] = [];
    private readonly NULL_BODY = new p2.Body();

    private readonly _actors: ActorImpl[] = [];

    private readonly _revoluteConstraints: RevoluteConstraint[] = [];
    private readonly _lockConstraints: LockConstraint[] = [];

    private readonly _waterZones: Rect[] = [];

    private readonly _eventHelper = new EventHelper();

    constructor(game: Game) {
        this.game = game;
        this._p2world = new p2.World({
            gravity: [0, this._gravity],
        });
        this._p2world.sleepMode = p2.World.BODY_SLEEPING;
        this._p2world.addBody(this.NULL_BODY);

        const acm = (m1: p2.Material, m2: p2.Material, friction: number, restitution: number, relaxation?: number) => {
            this._p2world.addContactMaterial(new p2.ContactMaterial(m1, m2, {
                friction,
                restitution,
                relaxation,
            }));
        };
        acm(P2MATERIAL_STANDARD, P2MATERIAL_STANDARD,  5, 0.1 );
        acm(P2MATERIAL_BOUNCY,   P2MATERIAL_STANDARD,  7, 0.65, 8);
        acm(P2MATERIAL_BOUNCY,   P2MATERIAL_BOUNCY,    7, 0.75, 8);

        this._fences.push(this._makeFence());
        this._fences.push(this._makeFence());
        this._fences.push(this._makeFence());
        this._fences.push(this._makeFence());

        this._p2world.on('beginContact', (event: any) => {
            if (event.bodyA._fp_body && event.bodyB._fp_body) {
                const bodyA = event.bodyA._fp_body as BodyImpl;
                const bodyB = event.bodyB._fp_body as BodyImpl;
                const rx = Math.abs(bodyA.p2body.velocity[0] - bodyB.p2body.velocity[0]);
                const ry = Math.abs(bodyA.p2body.velocity[1] - bodyB.p2body.velocity[1]);
                const velocity2 = rx * rx + ry * ry;
                bodyA.emitContact(bodyB, velocity2);
                bodyB.emitContact(bodyA, velocity2);

            }
        }, null);
    }

    private _collisionGroup(bodyType: string) {
        let index = this._bodyTypes.indexOf(bodyType);
        if (index < 0) {
            index = this._bodyTypes.length;
            this._bodyTypes.push(bodyType);
        }
        return 1 << index;
    }

    private _collisionMask(bodyType: string, options?: CollisionOptions) {
        if (bodyType === BODYTYPE_BACKGROUND) {
            return 0;
        } else if (bodyType === BODYTYPE_STANDARD) {
            return ~this._collisionGroup(BODYTYPE_BACKGROUND);
        } else {
            let ret = 0;
            if (options && options.collidesWith) {
                for (const other of options.collidesWith) {
                    ret |= this._collisionGroup(other);
                }
                return ret;
            }
            ret = ~(this._collisionGroup(bodyType) | this._collisionGroup(BODYTYPE_BACKGROUND));
            if (options && options.doesntCollideWith) {
                for (const other of options.doesntCollideWith) {
                    ret &= ~this._collisionGroup(other);
                }
                return ret;
            }
            return ret;
        }
    }

    private _makeFence() {
        const body = new p2.Body({
            mass: 0,
            position: [0, 0],
        });
        this._p2world.addBody(body);
        return body;
    }

    private _updateFence(body: p2.Body, x1: number, y1: number, x2: number, y2: number) {
        const collisionGroup = this._collisionGroup(BODYTYPE_GROUND);
        // tslint:disable-next-line:no-bitwise
        const collisionMask = this._collisionMask(BODYTYPE_GROUND);
        body.position = [0, 0];
        body.fromPolygon([[x1, y1], [x2, y1], [x2, y2], [x1, y2]]);
        for (const s of body.shapes) {
            s.material = P2MATERIAL_STANDARD;
            s.collisionGroup = collisionGroup;
            s.collisionMask = collisionMask;
        }
    }

    private _extendBound(rect: Rect) {
        const aabb1 = p2AABBFromRect(this._bound);
        const aabb2 = p2AABBFromRect(new Rect(rect.x1, rect.y1 - EXTEND_SKY, rect.w, rect.h + EXTEND_SKY));
        aabb1.extend(aabb2);
        const r = this._bound = p2AABBToRect(aabb1);
        const t = FENCE_THICKNESS;
        this._updateFence(this._fences[0], r.x1 - t, r.y1 - t, r.x2 + t, r.y1);
        this._updateFence(this._fences[1], r.x2, r.y1, r.x2 + t, r.y2);
        this._updateFence(this._fences[2], r.x1 - t, r.y2, r.x2 + t, r.y2 + t);
        this._updateFence(this._fences[3], r.x1 - t, r.y1, r.x1, r.y2);
    }

    bound() {
        return this._bound;
    }

    time() {
        return this._lastTime;
    }

    tick(deltaTime: number) {
        if (deltaTime) {
            deltaTime = Math.min(deltaTime, 0.5);
            this._lastTime += deltaTime;
            this._p2world.step(Math.min(TIME_STEP, deltaTime), deltaTime, MAX_SUBSTEPS);
            this._eventHelper.emit('tick');
        }
    }

    on(event: 'tick', listener: WorldTickListener) {
        this._eventHelper.on(event, listener);
        return this;
    }

    off(event: 'tick', listener: WorldTickListener) {
        this._eventHelper.off(event, listener);
        return this;
    }

    addBackdrop(backdrop: Drawable) {
        this._backdrops.push(backdrop);
        return this;
    }

    forEachBackdrop(callback: (backdrop: Drawable) => void) {
        for (const backdrop of this._backdrops) {
            callback(backdrop);
        }
        return this;
    }

    locationNames() {
        return Object.keys(this._namedLocations);
    }

    namedLocation(name: string): Point;
    namedLocation(name: string, location: Point): this;
    namedLocation(name: string, x: number, y: number): this;
    namedLocation(name: string, x?: Point | number, y?: number): Point | this {
        if (typeof x === 'undefined') {
            const ret = this._namedLocations[name];
            if (!ret) {
                throw new Error(`no such location "${name}"`);
            }
            return ret;
        } else if (x instanceof Point) {
            this._namedLocations[name] = x;
            return this;
        } else {
            this._namedLocations[name] = new Point(x, y as number);
            return this;
        }
    }

    startActorGenerator(gen: ActorGenerator | undefined) {
        this._startActorGenerator = gen;
        return this;
    }

    generateStartActor(atx: number, aty: number) {
        if (this._startActorGenerator) {
            return this._startActorGenerator(this, atx, aty);
        }
    }

    startLocationName(): string;
    startLocationName(name: string): this;
    startLocationName(name?: string): string | this {
        if (typeof name === 'string') {
            this._startLocationName = name;
            return this;
        } else {
            return this._startLocationName;
        }
    }

    _p2material(material: Material) {
        if (material === MATERIAL_BOUNCY) {
            return P2MATERIAL_BOUNCY;
        } else {
            return P2MATERIAL_STANDARD;
        }
    }

    addBody(param: BodyParam): Body {
        const mass = param.mass || 0;
        const material = param.material || MATERIAL_STANDARD;
        const { damping } = param;

        const initialAnchor = param.initialAnchor || Point.ZERO;
        let { bounds } = param;

        const { location } = param;
        const angle = param.angle || 0;
        const flip = param.flip || false;

        const bodyType = param.bodyType || BODYTYPE_STANDARD;
        const { ignoreGravity } = param;

        const p2body = new p2.Body({
            mass,
            position: p2point(location),
        });
        const body = new BodyImpl(this, p2body, param);
        (p2body as any)._fp_body = body;
        this._bodies.push(body);
        this._p2world.addBody(p2body);

        if (typeof damping !== 'undefined') {
            p2body.damping = damping;
        }

        /*
         * param.initialAnchor is a reference point within the image, used to
         * determine the initial location of the body.  The body will start out such
         * that param.initialAnchor in the image is seen at param.location in the world,
         * and the image will be rotated and flipped relative to that point.
         *
         * However, the body's center of mass (and so its "position") is
         * determined by the bounds.  It won't necessarily be the same as the
         * initial anchor.
         */

        const adjustPoint = (point: Point) => {
            const ret: [number, number] = [point.x - initialAnchor.x, point.y - initialAnchor.y];
            if (flip) {
                ret[0] = -ret[0];
            }
            return ret;
        };

        if (bounds instanceof Rect) {
            bounds = bounds.asPolygon();
        }
        if (bounds instanceof Polygon) {
            const polygon = bounds.mapPoints(adjustPoint);
            p2body.fromPolygon(polygon);
            if (flip) {
                body.imageAnchor = new Point(-(p2body.position[0] - location.x - initialAnchor.x),
                                             p2body.position[1] - location.y + initialAnchor.y);
            } else {
                body.imageAnchor = new Point(p2body.position[0] - location.x + initialAnchor.x,
                                             p2body.position[1] - location.y + initialAnchor.y);
            }
        } else if (bounds instanceof Circle) {
            const shape = new p2.Circle({ radius: bounds.radius });
            p2body.position = p2point(location.translate(initialAnchor.x - bounds.center.x,
                                                         initialAnchor.y - bounds.center.y));
            body.imageAnchor = bounds.center;
            p2body.addShape(shape);
        } else if (typeof bounds === 'undefined') {
            body.imageAnchor = initialAnchor;
        } else {
            throw new Error(`unexpected bounds type`);
        }
        p2body.angle = angle * Math.PI / 180;
        const diff: [number, number] = [p2body.position[0] - location.x, p2body.position[1] - location.y];
        p2.vec2.rotate(diff, diff, angle * Math.PI / 180);
        p2body.position = [location.x + diff[0], location.y + diff[1]];
        const collisionGroup = this._collisionGroup(bodyType);
        const collisionMask = this._collisionMask(bodyType, param);
        const p2material = this._p2material(material);
        for (const s of p2body.shapes) {
            s.material = p2material;
            s.collisionGroup = collisionGroup;
            s.collisionMask = collisionMask;
        }
        // (p2body as any).fpDensity = param.density;
        if (ignoreGravity) {
            p2body.gravityScale = 0;
        }
        if (param.neverSleep) {
            p2body.allowSleep = false;
        }
        // if (param.more) {
        //     param.more(this, param.position);
        // }
        if (param.otherBounds) {
            for (const otherBounds of param.otherBounds) {
                const otherBody = this.addBody({
                    ...param,
                    bounds: otherBounds,
                    otherBounds: undefined,
                });
                if (mass !== 0) {
                    this.addLockConstraint(body, otherBody);
                }
            }
        }
        this._extendBound(p2AABBToRect(p2body.getAABB()));
        return body;
    }

    forEachBody(callback: (body: Body) => void) {
        for (const body of this._bodies) {
            callback(body);
        }
        return this;
    }

    addRevoluteConstraint(body1: Body, body2: Body | undefined, x: number, y: number): RevoluteConstraint {
        const b1 = (body1 as BodyImpl).p2body;
        const b2 = body2 ? (body2 as BodyImpl).p2body : this.NULL_BODY;
        const p2constraint = new p2.RevoluteConstraint(b1, b2, {
            worldPivot: [x, y],
        });
        this._p2world.addConstraint(p2constraint);
        const constraint = new RevoluteConstraintImpl(p2constraint);
        this._revoluteConstraints.push(constraint);
        return constraint;
    }

    removeRevoluteConstraint(constraint: RevoluteConstraint) {
        const index = this._revoluteConstraints.indexOf(constraint);
        if (index >= 0) {
            this._revoluteConstraints.splice(index, 1);
            this._p2world.removeConstraint((constraint as RevoluteConstraintImpl).p2constraint);
        }
    }

    forEachRevoluteConstraint(callback: (constraint: RevoluteConstraint) => void) {
        for (const constraint of this._revoluteConstraints) {
            callback(constraint);
        }
    }

    addLockConstraint(body1: Body, body2: Body): LockConstraint {
        const b1 = (body1 as BodyImpl).p2body;
        const b2 = (body2 as BodyImpl).p2body;
        const p2constraint = new p2.LockConstraint(b1, b2);
        this._p2world.addConstraint(p2constraint);
        const constraint = new LockConstraintImpl(p2constraint);
        this._lockConstraints.push(constraint);
        return constraint;
    }

    removeLockConstraint(constraint: LockConstraint) {
        const index = this._lockConstraints.indexOf(constraint);
        if (index >= 0) {
            this._lockConstraints.splice(index, 1);
            this._p2world.removeConstraint((constraint as LockConstraintImpl).p2constraint);
        }
    }

    addActor(param: ActorParam) {
        const actor = new ActorImpl(this, this._p2world, param);
        this._actors.push(actor);
        return actor;
    }

    actorHitTest(x: number, y: number): {actor: Actor; body: Body} | undefined {
        for (const actor of this._actors) {
            const body = actor.hitTest(this._p2world, x, y);
            if (body) {
                return { actor, body };
            }
        }
    }

    forEachActor(callback: (actor: Actor) => void) {
        for (const actor of this._actors) {
            callback(actor);
        }
        return this;
    }

    addWaterZone(x: number, y: number, w: number, h: number) {
        const waterAABB = new p2.AABB({
            lowerBound: [x, y],
            upperBound: [x + w, y + h],
        }) as any;

        const shapePosition = V1;
        const centerOfBouyancy = V2;
        const viscousForce = V3;
        let shapeAngle = 0;
        const c = WATER_VISCOSITY;
        const v = V4;
        const aabb = new p2.AABB() as any;

        this._waterZones.push(new Rect(x, y, w, h));

        this._p2world.on('postStep', () => {
            for (const p2body of this._p2world.bodies) {
                if (p2body.type === p2.Body.STATIC) {
                    continue;
                }
                if (p2body.sleepState === p2.Body.SLEEPING) {
                    continue;
                }
                for (const shape of p2body.shapes) {
                    // Get shape world transform
                    (p2body as any).vectorToWorldFrame(shapePosition, shape.position);
                    p2.vec2.add(shapePosition, shapePosition, p2body.position);
                    shapeAngle = shape.angle + p2body.angle;

                    // Get shape AABB
                    shape.computeAABB(aabb, shapePosition, shapeAngle);
                    if (!aabb.overlaps(waterAABB)) {
                        continue;
                    }

                    const body = (p2body as any)._fp_body as BodyImpl;
                    // var areaUnderWater;
                    if (aabb.lowerBound[1] > waterAABB.lowerBound[1]) {
                        // Fully submerged
                        p2.vec2.copy(centerOfBouyancy, shapePosition);
                        // areaUnderWater = shape.area;
                        if (body && body.actor && this.game.currentActor() === body.actor) {
                            this.game.collectAchievement(ACH_SWIM);
                        }
                    } else if (aabb.upperBound[1] > waterAABB.lowerBound[1]) {
                        // Partially submerged
                        const width = aabb.upperBound[0] - aabb.lowerBound[0];
                        const height = waterAABB.lowerBound[1] - aabb.upperBound[1];
                        // areaUnderWater = width * height;
                        p2.vec2.set(centerOfBouyancy, aabb.lowerBound[0] + width / 2, aabb.lowerBound[1] + height / 2);
                    } else {
                        continue;
                    }
                    const density = (body && body.param.density) || 1;

                    // // Compute lift force
                    // p2.vec2.subtract(liftForce, waterAABB.lowerBound, centerOfBouyancy);
                    // p2.vec2.scale(liftForce, liftForce, areaUnderWater * k);
                    // liftForce[0] = 0;
                    const liftForce: [number, number] = [
                        0,
                        - DEFAULT_GRAVITY * 1.15 * p2body.mass / p2body.shapes.length / density,
                    ];

                    // Make center of bouycancy relative to the body
                    p2.vec2.subtract(centerOfBouyancy, centerOfBouyancy, p2body.position);

                    // Viscous force
                    (p2body as any).getVelocityAtPoint(v, centerOfBouyancy);
                    p2.vec2.scale(viscousForce, v, -c * p2body.mass / p2body.shapes.length);

                    // Apply forces
                    p2body.applyForce(viscousForce, centerOfBouyancy);
                    p2body.applyForce(liftForce, centerOfBouyancy);
                }
            }
        }, null);
        return this;
    }

    forEachWaterZone(callback: (bounds: Rect) => void) {
        for (const bounds of this._waterZones) {
            callback(bounds);
        }
        return this;
    }

}
