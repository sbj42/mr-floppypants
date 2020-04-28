import { Actor, ActorParam, ActorPainListener } from './actor';
import { BodyImpl } from './body-impl';
import { EventHelper } from './events';
import { Body } from './body';
import * as p2 from 'p2';
import { Window } from './window';
import { Game } from './game';
import { World } from './world';
import { ACH_GRAB, ACH_GRAB2 } from './achievements';

export class ActorImpl implements Actor {
    readonly world: World;
    private _p2world: p2.World;
    readonly param: ActorParam;

    private _dragBody: Body | undefined;
    private _dragWindow: Window | undefined;
    private _holding: ({body: BodyImpl; constraint: p2.LockConstraint} | undefined)[] = [];
    private _releasing: number | undefined;

    private readonly _eventHelper = new EventHelper();

    constructor(world: World, p2world: p2.World, param: ActorParam) {
        this.world = world;
        this._p2world = p2world;
        this.param = param;
        const { painPoints, painVelocity } = param;
        if (painPoints && painVelocity) {
            for (const painPoint_ of painPoints) {
                const painPoint = painPoint_ as BodyImpl;
                painPoint.on('contact', (otherBody, velocity2) => {
                    if (velocity2 > painVelocity * painVelocity) {
                        this.emitPain(velocity2);
                    }
                });
            }
        }
        const { hands } = param;
        if (hands) {
            hands.forEach((hand, index) => {
                const p2body = (hand as BodyImpl).p2body;
                this._p2world.on('beginContact', (event: any) => {
                    const { bodyA, bodyB } = event;
                    if (bodyA === p2body && bodyB._fp_body) {
                        this._onHandContact(index, bodyB._fp_body);
                    } else if (bodyB === p2body && bodyA._fp_body) {
                        this._onHandContact(index, bodyA._fp_body);
                    }
                }, null);
            });
        }
        for (const body of param.all) {
            (body as BodyImpl).actor = this;
        }
    }

    get name() {
        return this.param.name;
    }

    _onHandContact(handIndex: number, otherBody: BodyImpl) {
        const { hands } = this.param;
        if (hands) {
            const hand = hands[handIndex] as BodyImpl;
            if (typeof this._dragWindow !== 'undefined' && hand === this._dragBody
                && !this._holding[handIndex] && otherBody.p2body.type !== p2.Body.STATIC) {
                this.world.game.collectAchievement(ACH_GRAB);
                const constraint = new p2.LockConstraint(hand.p2body, otherBody.p2body);
                this._p2world.addConstraint(constraint);
                this._holding[handIndex] = {
                    body: otherBody,
                    constraint,
                };
                const grabCount = this._holding.reduce((prev, holding) => prev + (holding ? 1 : 0), 0);
                if (grabCount >= 2) {
                    this.world.game.collectAchievement(ACH_GRAB2);
                }
                otherBody.emitGrabbed(this, hand, this._dragWindow);
            }
        }
    }

    get head() {
        return this.param.head;
    }

    get middle() {
        return this.param.middle;
    }

    forEachHand(callback: (hand: Body) => void) {
        if (this.param.hands) {
            this.param.hands.forEach(callback);
        }
        return this;
    }

    forEachFoot(callback: (foot: Body) => void) {
        if (this.param.feet) {
            this.param.feet.forEach(callback);
        }
        return this;
    }

    on(event: 'pain', listener: ActorPainListener) {
        this._eventHelper.on(event, listener);
        return this;
    }

    off(event: 'pain', listener: ActorPainListener) {
        this._eventHelper.off(event, listener);
        return this;
    }

    emitPain(velocity2: number) {
        this._eventHelper.emit('pain', velocity2);
    }

    hitTest(world: p2.World, x: number, y: number) {
        const p2bodies = this.param.all.map((b) => (b as BodyImpl).p2body);
        const hitBody = world.hitTest([x, y], p2bodies, 1);
        if (hitBody.length > 0) {
            return (hitBody[0] as any)._fp_body as BodyImpl;
        }
    }

    dragStart(dragBody: Body, window: Window) {
        this._dragBody = dragBody;
        this._dragWindow = window;
        for (const body of this.param.all) {
            (body as BodyImpl).p2body.wakeUp();
        }
        const { hands } = this.param;
        if (hands) {
            hands.forEach((hand, index) => {
                if (hand === dragBody && this._holding[index]) {
                    this._releasing = index;
                }
            });
        }
    }

    dragEnd() {
        if (typeof this._releasing !== 'undefined') {
            const holding = this._holding[this._releasing];
            if (holding != null) {
                const { hands } = this.param;
                if (hands) {
                    const hand = hands[this._releasing];
                    const constraint = holding.constraint;
                    holding.body.emitReleased(this, hand);
                    this._p2world.removeConstraint(constraint);
                    this._holding[this._releasing] = undefined;
                }
            }
            this._releasing = undefined;
        }
        this._dragBody = undefined;
    }

    goto(x: number, y: number) {
        const dx = x - this.head.position.x;
        const dy = y - this.head.position.y;
        for (const body of this.param.all) {
            body.goto(body.position.x + dx, body.position.y + dy);
        }
        return this;
    }
}
