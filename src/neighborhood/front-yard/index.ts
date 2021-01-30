import {
    World,
    BodyFactory,
    Point,
    Polygon,
    BodyGetOptions,
    BODYTYPE_BACKGROUND,
    Body,
    Circle,
    Window,
} from '../../core';
import { PolygonDrawable } from '../../core/util/polygon-drawable';
import { GROUND_GRADIENT } from '../ground';

import IMG_GRASS1 from './images/grass1.png';
import IMG_GRASS2 from './images/grass2.png';

export const grass = new BodyFactory(IMG_GRASS1, '0,25 0,125 500,125 500,25', 0, 25)
    .imageFront(IMG_GRASS2);

import IMG_TREE1_1 from './images/tree1-1.png';
import IMG_TREE1_2 from './images/tree1-2.png';

export const tree1 = new BodyFactory(undefined, [`
        325,328 353,265 409,260 423,213
        500,213 500,292 395,296 360,347
    `, `
        373,532 472,542 500,491 581,514
        649,485 694,537 682,593 766,623
        766,668 716,665 649,702 602,642
        511,670 464,611 373,621
    `], 500, 1500)
    .imageBack(IMG_TREE1_1)
    .imageFront(IMG_TREE1_2);

import IMG_TIRE1 from './images/tire1.png';
import IMG_TIRE2 from './images/tire2.png';

export const tire = new BodyFactory(IMG_TIRE1, [`
        22,1 36,1 45,7 45,35 11,35 11,10
    `, `
    21,173 39,173 45,170 44,138 12,138 12,166
    `], 28, 3)
    .imageFront(IMG_TIRE2)
    .mass(15);

import IMG_ROPE from './images/rope.png';

export const rope = new BodyFactory(IMG_ROPE, `1,1 9,1 9,209 1,209`, 5, 5)
    .mass(1)
    .bodyType(BODYTYPE_BACKGROUND)
    .neverSleep();

import IMG_CAR1 from './images/car1.png';
import IMG_CAR2 from './images/car2.png';
import IMG_WHEEL from './images/wheel.png';

const CAR_MAX_MOTOR_SPEED = 40;
const carMain = new BodyFactory(undefined, `
        7.5,75 16.5,72 19.5,42 114,33
        126,12 138,18 133.5,37.5 159,81
        318,81 295.5,42 306,21 297,7.5
        312,6 348,42 466.5,70.5 466.5,105
        7.5,105
    `, 0, 150)
    .imageBack(IMG_CAR1)
    .imageFront(IMG_CAR2)
    .mass(100, 3);
const carWheel = new BodyFactory(IMG_WHEEL, Circle.fromString('38,38 37'), 38, 38)
    .mass(12, 0.6);
export function car(world: World, atx: number, aty: number, options?: BodyGetOptions) {
    const bBody = world.addBody(carMain.get(atx, aty, options));
    const bWheel1 = world.addBody(carWheel.get(atx + 110, aty - 38, options));
    const bWheel2 = world.addBody(carWheel.get(atx + 392, aty - 38, options));
    const constraint1 = world.addRevoluteConstraint(bBody, bWheel1, atx + 110, aty - 38);
    const constraint2 = world.addRevoluteConstraint(bBody, bWheel2, atx + 392, aty - 38);
    let grabWindow: Window | undefined;
    let grabCount = 0;
    const onMouseMove = () => {
        if (grabWindow) {
            const mousePos = grabWindow.windowMouseLocation();
            if (mousePos) {
                const { x } = mousePos;
                const dx = (x * 2 / grabWindow.size().w) - 1;
                if (dx > 0.25 || dx < -0.25) {
                    world.game.collectAchievement(ACH_CAR);
                }
                constraint1.motorSpeed(- dx * CAR_MAX_MOTOR_SPEED);
                constraint2.motorSpeed(- dx * CAR_MAX_MOTOR_SPEED);
            }
        }
    };
    bBody.on('grabbed', (actor, hand, window) => {
        if (grabCount === 0) {
            grabWindow = window;
            grabWindow.on('mousemove', onMouseMove);
        }
        grabCount ++;
    });
    bBody.on('released', (actor) => {
        grabCount --;
        if (grabCount === 0 && grabWindow) {
            grabWindow.off('mousemove', onMouseMove);
            grabWindow = undefined;
            constraint1.motorSpeed(0);
            constraint2.motorSpeed(0);
        }
    });
}

export const ACH_CAR = 'car';
export const ACH_SWING = 'swing';

const ACHIEVEMENTS = [{
    id: ACH_CAR,
    image: IMG_WHEEL,
    label: 'Take the wheel',
    description: 'Take the car out for a spin.',
}, {
    id: ACH_SWING,
    image: IMG_TIRE1,
    label: 'Ride the tire',
    description: 'Go for a swing on the tire swing.',
}];

export default function(world: World, atx: number, aty: number) {

    world.game.addAchievements(ACHIEVEMENTS);

    const HILL_BG = new PolygonDrawable(
        Polygon.fromString('3500,1 4460,-200 4960,-100 5440,-200 5900,-390 6400,-390 7312,1').translate(atx, aty),
        GROUND_GRADIENT,
    );

    world.addBackdrop(HILL_BG);

    function pos(x: number, y: number) {
        return new Point(atx + x, aty + y);
    }

    function add(factory: BodyFactory, x: number, y: number, options?: BodyGetOptions) {
        const p = pos(x, y);
        return world.addBody(factory.get(p.x, p.y, options));
    }

    function join(b1: Body, b2: Body, x: number, y: number, lowerLimit?: number, upperLimit?: number) {
        const p = pos(x, y);
        const constraint = world.addRevoluteConstraint(b1, b2, p.x, p.y);
        if (typeof lowerLimit !== 'undefined' && typeof upperLimit !== 'undefined') {
            constraint.limits(lowerLimit, upperLimit);
        }
    }

    // // right yard

    add(grass, 0, 0);
    add(grass, 500, 0);
    add(grass, 1000, 0);
    add(grass, 1500, 0);
    add(grass, 2000, 0);
    add(grass, 2500, 0);
    add(grass, 3000, 0);
    add(grass, 3500, 0, { angle: -11.5 });
    add(grass, 3990, -100, { angle: -11.5 });
    add(grass, 4480, -200, { angle: 11.5 });
    add(grass, 4960, -100, { angle: -11.5 });
    add(grass, 5440, -198, { angle: -23.2 });
    add(grass, 5900, -394);
    add(grass, 6395, -394, { angle: 23.2 });
    add(grass, 6850, -198, { angle: 23.2 });
    add(grass, 7305, 0);

    const bTree = add(tree1, 650, 0);
    const bTire = add(tire, 850, -230);
    const bRope1 = add(rope, 850, -430);
    join(bTire, bRope1, 850, -230, -45, 45);
    const bRope2 = add(rope, 850, -630);
    join(bRope1, bRope2, 850, -430, -45, 45);
    const bRope3 = add(rope, 850, -830);
    join(bRope2, bRope3, 850, -630, -45, 45);
    join(bRope3, bTree, 850, -830);
    let grabCount = 0;
    let swingTrack: boolean[] = [];
    bTire.on('grabbed', (actor, hand, window) => {
        grabCount ++;
    });
    bTire.on('released', (actor) => {
        grabCount --;
        if (grabCount === 0) {
            swingTrack = [];
        }
    });
    world.on('tick', () => {
        if (grabCount) {
            const { x } = bTire.position;
            if (x < atx + 550) {
                if (!swingTrack.length || swingTrack[swingTrack.length - 1] === true) {
                    swingTrack.push(false);
                }
            } else if (x > atx + 900) {
                if (!swingTrack.length || swingTrack[swingTrack.length - 1] === false) {
                    swingTrack.push(true);
                }
            }
            if (swingTrack.length >= 4) {
                world.game.collectAchievement(ACH_SWING);
            }
        }
    });

    const pCar = pos(1500, 0);
    car(world, pCar.x, pCar.y);

    // fpThings.tree1(pos([2650, 0]));

    world.namedLocation('frontyard-tree', pos(650, -200));
    world.namedLocation('frontyard-car', pos(1450, -200));
    world.namedLocation('frontyard-hill', pos(3450, -200));
}
