import {
    World,
    Point,
    BodyFactory,
    BodyGetOptions,
    Body,
} from '../../core';

const NAME = 'mr-floppypants';
const BODYTYPE = 'mr-floppypants';

const PAIN_VELOCITY = 900;

export const head = new BodyFactory(require('./images/head.png'), '2,33 10,12 24,5 40,12 46,33 34,57 15,57', 25, 32)
    .bodyType(BODYTYPE)
    .mass(2, 0.9);
export const chest = new BodyFactory(require('./images/shirt-middle.png'), '8,2 53,2 53,58 8,58', 30, 6)
    .bodyType(BODYTYPE)
    .mass(7.5, 0.9);
export const arm1 = new BodyFactory(require('./images/arm-left-upper.png'), '28,3 31,13 7,28 2,21', 30, 6)
    .bodyType(BODYTYPE)
    .mass(2);
export const arm2 = new BodyFactory(require('./images/arm-left-lower.png'), '25,3 29,10 7,27 3,22', 27, 6)
    .bodyType(BODYTYPE)
    .mass(1.5);
export const hand = new BodyFactory(require('./images/hand-left.png'), '11,3 21,14 10,25 1,15', 18, 9)
    .bodyType(BODYTYPE)
    .mass(1.5);
export const seat = new BodyFactory(require('./images/pants-top.png'), '9,2 42,2 50,29 3,29', 26, 4)
    .bodyType(BODYTYPE)
    .mass(5);
export const leg1 = new BodyFactory(require('./images/pants-left-upper.png'), '6,2 21,5 16,40 2,37', 14, 6)
    .bodyType(BODYTYPE)
    .mass(2);
export const leg2 = new BodyFactory(require('./images/pants-left-lower.png'), '10,2 24,4 24,41 8,40', 17, 6)
    .bodyType(BODYTYPE)
    .mass(2, 1.4);
export const foot = new BodyFactory(require('./images/shoe-left.png'), '21,3 35,4 36,15 3,15 5,10', 30, 5)
    .bodyType(BODYTYPE)
    .mass(1, 1.5);

export const ACH_OUCH = 'ouch';

const ACHIEVEMENTS = [{
    id: ACH_OUCH,
    image: require('./images/head-ouch.png'),
    label: 'Ouch!',
    description: 'Bump into something hard enough to hurt.',
}];

export default function(world: World, atx: number, aty: number) {

    world.game.addAchievements(ACHIEVEMENTS);

    const tilt = -15;
    const tiltc = Math.cos(tilt * Math.PI / 180);
    const tilts = Math.sin(tilt * Math.PI / 180);

    function pos(x: number, y: number) {
        return new Point(atx + x * tiltc - y * tilts, aty + y * tiltc + x * tilts);
    }

    function add(factory: BodyFactory, x: number, y: number, options?: BodyGetOptions) {
        const p = pos(x, y);
        return world.addBody(factory.get(p.x, p.y, { angle: tilt, ...options }));
    }

    function join(b1: Body, b2: Body, x: number, y: number, lowerLimit?: number, upperLimit?: number) {
        const p = pos(x, y);
        const constraint = world.addRevoluteConstraint(b1, b2, p.x, p.y);
        if (typeof lowerLimit !== 'undefined' && typeof upperLimit !== 'undefined') {
            constraint.limits(lowerLimit, upperLimit);
        }
    }

    const bSeat = add(seat, 0, 80);
    const bLegL1 = add(leg1, -15, 108);
    join(bSeat, bLegL1, -15, 108, -30, 30);
    const bLegR1 = add(leg1, 15, 108, { flip: true });
    join(bSeat, bLegR1, 15, 108, -30, 30);
    const bFootL = add(foot, -16, 175);
    const bFootR = add(foot, 16, 175, { flip: true });
    const bLegL2 = add(leg2, -18, 139);
    join(bLegL1, bLegL2, -18, 139, -25, 25);
    join(bLegL2, bFootL, -16, 175, -25, 25);
    const bLegR2 = add(leg2, 18, 139, { flip: true });
    join(bLegR1, bLegR2, 18, 139, -25, 25);
    join(bLegR2, bFootR, 16, 175, -25, 25);

    const bChest = add(chest, 0, 32);
    join(bChest, bSeat, 0, 80, -25, 25);
    const bHead = add(head, 0, 0);
    join(bHead, bChest, 0, 27, -30, 30);
    const bArmL1 = add(arm1, -23, 32);
    join(bChest, bArmL1, -23, 34, -45, 75);
    const bArmR1 = add(arm1, 23, 32, { flip: true });
    join(bChest, bArmR1, 23, 34, -75, 45);
    const bArmL2 = add(arm2, -47, 49);
    join(bArmL1, bArmL2, -47, 49, -20, 45);
    const bArmR2 = add(arm2, 47, 49, { flip: true });
    join(bArmR1, bArmR2, 47, 49, -45, 20);
    const bHandL = add(hand, -68, 66);
    join(bArmL2, bHandL, -68, 66, -30, 30);
    const bHandR = add(hand, 68, 66, { flip: true });
    join(bArmR2, bHandR, 68, 66, -30, 30);

    const actor = world.addActor({
        name: NAME,
        head: bHead,
        hands: [bHandL, bHandR],
        middle: bChest,
        feet: [bFootL, bFootR],
        painPoints: [bHead, bHandL, bHandR, bFootL, bFootR],
        painVelocity: PAIN_VELOCITY,
        all: [
            bHead, bHandL, bHandR, bFootL, bFootR,
            bArmL2, bArmR2, bArmL1, bArmR1,
            bLegL2, bLegR2, bLegL1, bLegR1,
            bChest, bSeat,
        ],
    });

    let painTimer: any;
    actor.on('pain', () => {
        world.game.collectAchievement(ACH_OUCH);
        if (painTimer) {
            clearTimeout(painTimer);
        }
        actor.head.image(require('./images/head-ouch.png'));
        painTimer = setTimeout(() => {
            actor.head.image(require('./images/head.png'));
        }, 1500);
    });

    return actor;
}
