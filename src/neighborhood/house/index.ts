import {
    World,
    LinearGradient,
    Polygon,
    Point,
    Circle,
    BodyFactory,
    MATERIAL_BOUNCY,
    BodyGetOptions,
    isFoot,
    Body,
} from '../../core';
import { PolygonDrawable } from '../../core/util/polygon-drawable';

export const floor1 = new BodyFactory(require('./images/floor1.png'), '0,0 50,0 50,50 0,50', 25, 25);
export const floor4 = new BodyFactory(require('./images/floor4.png'), '0,0 200,0 200,50 0,50', 25, 25);
export const floor9 = new BodyFactory(require('./images/floor9.png'), '0,0 450,0 450,50 0,50', 25, 25);
export const floor15 = new BodyFactory(require('./images/floor15.png'), '0,0 750,0 750,50 0,50', 25, 25);

export const wall3 = new BodyFactory(require('./images/wall3.png'), '1,2 28,2 28,146 1,146', 15, 25);
export const wall5 = new BodyFactory(require('./images/wall5.png'), '1,2 28,2 28,242 1,242', 15, 25);

export const window = new BodyFactory(require('./images/window.png'), undefined, 10, 207);

export const stairs = new BodyFactory(require('./images/stairs.png'), `
        0,0 50,0 50,50 100,50
        100,100 150,100 150,150 200,150
        200,200 250,200 250,250 300,250
        300,300 350,300 350,350 400,350
        400,400 450,400 450,450 500,450
        500,500 550,500 550,549 500,549
        0,51
    `, 25, 525);
export const roof = new BodyFactory(require('./images/roof.png'), '0,51 99,0 115,13 17,63', 0, 30);

const chimney1 = new BodyFactory(undefined, '4,5 24,5 24,191 4,203', 0, 164)
    .imageFront(require('./images/chimney.png'));
const chimney2 = new BodyFactory(undefined, '97,5 117,5 117,147 97,152', 0, 164);
export function chimney(world: World, atx: number, aty: number, options?: BodyGetOptions) {
    const b1 = world.addBody(chimney1.get(atx, aty, options));
    const b2 = world.addBody(chimney2.get(atx, aty, options));
    const contact = (otherBody: Body) => {
        const actor = world.game.currentActor();
        if (actor && otherBody.actor === actor) {
            const { position } = actor.middle;
            const bounds1 = b1.bounds();
            const bounds2 = b2.bounds();
            if (position.x > Math.min(bounds1.x1, bounds2.x1) && position.x < Math.max(bounds1.x2, bounds2.x2)
                && position.y > bounds2.y1 && position.y < bounds2.y2) {
                    world.game.collectAchievement(ACH_CHIMNEY);
            }
        }
    };
    b1.on('contact', contact);
    b2.on('contact', contact);
}

export const ball = new BodyFactory(require('./images/ball.png'), Circle.fromString('25,25 24'), 25, 25)
    .mass(0.5, 0.25, MATERIAL_BOUNCY);

export const bed = new BodyFactory(require('./images/bed.png'), `
        0,104 0,-1 13,-1 13,28
        283,28 283,25 292,25 292,104
        283,104 283,73 9,73 9,104
    `, 0, 104)
    .mass(120, 3);
export const pillow = new BodyFactory(require('./images/pillow.png'), '2,14 25,18 48,14 48,6 25,2 2,6', 0, 20)
    .mass(0.1);

export const table = new BodyFactory(require('./images/table.png'), `
        3,3 197,3 197,10 153,10
        153,99 144,99 144,24 55,24
        55,99 46,99 46,10 3,10
    `, 0, 100)
    .mass(100, 2);
export const glass = new BodyFactory(require('./images/glass.png'), '2,2 11,2 11,23 2,23', 0, 24)
    .mass(1, 1.2);
export const plate = new BodyFactory(require('./images/plate.png'), '3,3 44,3 29,12 17,12', 0, 13)
    .mass(1, 2);
export const chair = new BodyFactory(require('./images/chair.png'), `
        2,137 2,1 9,1 9,77 53,77 53,137 46,137 46,111 9,111 9,137
    `, 1, 138)
    .mass(30, 2);

export const bathtub = new BodyFactory(require('./images/bathtub1.png'), `
        6,5 21,4 46,72 200,72
        238,11 251,11 206,100 183,100
        183,88 62,88 62,100 42,100
        1,18
    `, 1, 102)
    .mass(300, 3)
    .imageFront(require('./images/bathtub2.png'));
export const sink = new BodyFactory(require('./images/sink1.png'), `
        3,31 11,3 27,5 18,30
        21,58 60,58 84,31 92,33
        78,61 51,70 80,140 1,140
    `, 1, 142)
    .mass(250, 3)
    .imageFront(require('./images/sink2.png'));

export const hatch = new BodyFactory(require('./images/hatch.png'), `
        4,10 202,10 207,4 225,4
        230,10 246,10 246,30 230,30
        225,36 207,36 202,30 4,30
    `, 12, 20)
    .mass(50)
    .ignoreGravity();

export const box = new BodyFactory(require('./images/box.png'), ` 0,0 97,0 97,97 0,97 `, 48, 48)
    .mass(40, 2);

export const ACH_BATH = 'bath';
export const ACH_CHIMNEY = 'chimney';
export const ACH_FOOTBALL = 'football';

const ACHIEVEMENTS = [{
    id: ACH_FOOTBALL,
    image: require('./images/ball.png'),
    label: 'Football',
    description: 'Kick the soccer ball (with a foot)',
}, {
    id: ACH_CHIMNEY,
    image: require('./images/ach-chimney.png'),
    label: 'A tight spot',
    description: 'Squeeze into the chimney',
}, {
    id: ACH_BATH,
    image: require('./images/ach-bath.png'),
    label: 'Take a bath',
    description: 'Lay down in the bathtub',
}];

export default function(world: World, atx: number, aty: number) {

    world.game.addAchievements(ACHIEVEMENTS);

    const HOUSE_BG = new PolygonDrawable(
        Polygon.fromString('0,0 0,-1650 2400,-1650 2400,0').translate(atx, aty),
        LinearGradient.fromSimple(500, 1650, '#e0f4ca', 1900, 0, '#a9cb84'),
    );

    const ATTIC_BG = new PolygonDrawable(
        Polygon.fromString('-100,-1650 1200,-2300 2500,-1650').translate(atx, aty),
        LinearGradient.fromSimple(1200, 2300, '#5c3611', 1200, 1650, '#835323'),
    );

    world.addBackdrop(HOUSE_BG);
    world.addBackdrop(ATTIC_BG);

    // to simplify positioning, the parts of the house are set up on a grid
    // of 50x50 cells.
    function pos(x: number, y: number) {
        return new Point(atx + 50 * x, aty + 50 * y);
    }

    function add(factory: BodyFactory, x: number, y: number, options?: BodyGetOptions) {
        const p = pos(x, y);
        return world.addBody(factory.get(p.x, p.y, options));
    }

    function addWindow(x: number, y: number) {
        const p = pos(x, y);
        HOUSE_BG.addPolygon(Polygon.fromString(`0,0 0,-200, 100,-200, 100,0`).translate(p.x, p.y));
        add(window, x, y);
    }

    // first floor y=(0 to -10)

    add(floor1,   0, 0);
    add(stairs,   1, 0);
    add(floor4,  12, 0);
    add(floor1,  16, 0);
    add(floor15, 17, 0);
    add(floor1,  32, 0);
    add(floor15, 33, 0);
    add(floor1,  48, 0);

    add(wall5,   0, -10);
    add(wall5,  16, -10);
    add(wall5,  32, -10);
    add(wall5,  48, -10);

    addWindow(19, -3);
    addWindow(28, -3);
    addWindow(40, -3);

    // second floor y=(-11 to -21)

    add(floor1,   0, -11);
    add(floor4,  12, -11);
    add(floor1,  16, -11);
    add(floor15, 17, -11);
    add(floor1,  32, -11);
    add(floor4,  33, -11);
    add(stairs,  47, -11, { flip: true });
    add(floor1,  48, -11);

    add(wall3,   0, -14);
    add(wall3,   0, -21);
    add(wall5,  16, -21);
    add(wall5,  32, -21);
    add(wall5,  48, -21);
    add(wall5,  48, -16);

    addWindow(6, -14);
    addWindow(19, -14);
    addWindow(28, -14);

    add(table,  23, -11.5);
    add(plate,  23, -13.45);
    add(glass,  24, -13.45);
    add(glass,  25.7, -13.45);
    add(plate,  26, -13.45);
    add(chair,  22.5, -11.5);
    add(chair,  27.5, -11.5, { flip: true });

    // third floor y=(-22 to -32)

    add(floor1,   0, -22);
    add(floor15,  1, -22);
    add(floor1,  16, -22);
    add(floor15, 17, -22);
    add(floor1,  32, -22);
    add(floor4,  33, -22);
    add(floor1,  48, -22);

    add(wall3,   0, -25);
    add(wall3,   0, -32);
    add(wall5,  16, -32);
    add(wall5,  32, -32);
    add(wall3,  48, -32);
    add(wall3,  48, -25);

    addWindow(10, -25);
    addWindow(19, -25);
    addWindow(40, -25);

    add(sink, 0.9, -22.5);
    const bBathtub = add(bathtub, 6, -22.5);
    bBathtub.on('contact', (otherBody) => {
        const actor = world.game.currentActor();
        if (actor && otherBody.actor === actor) {
            const { position } = actor.middle;
            const bounds = bBathtub.bounds();
            if (position.x > bounds.x1 && position.x < bounds.x2
                && position.y > bounds.y1 && position.y < bounds.y2) {
                    world.game.collectAchievement(ACH_BATH);
            }
        }
    });

    const bBAll = add(ball, 21, -23);
    bBAll.on('contact', (otherBody) => {
        if (isFoot(otherBody)) {
            world.game.collectAchievement(ACH_FOOTBALL);
        }
    });

    add(bed, 22, -22.5);
    add(pillow, 22.25, -24);

    // attic y=(-33 to -46)

    add(floor1,   0, -33);
    add(floor4,   1, -33);
    add(floor1,   5, -33);
    add(floor1,  11, -33);
    add(floor4,  12, -33);
    add(floor1,  16, -33);
    add(floor15, 17, -33);
    add(floor1,  32, -33);
    add(floor15, 33, -33);
    add(floor1,  48, -33);

    const bHatch = add(hatch, 5.75, -33);
    const bHatchP = bHatch.position.translate(-118, -1);
    world.addRevoluteConstraint(bHatch, undefined, bHatchP.x, bHatchP.y).limits(0, 0);

    add(box, 23, -34.5);
    add(box, 29, -34.5);
    add(box, 31, -34.5);
    add(box, 30, -36.5);

    // roof

    for (let i = 0; i < 13; i ++) {
        add(roof, -2 + i * 2, -33.5 - i);
        if (i !== 6) {
            add(roof, 50.5 - i * 2, -33.5 - i, { flip: true });
        } else {
            const p = pos(50.5 - i * 2, -33.5 - i);
            chimney(world, p.x, p.y, { flip: true });
        }
    }

    world.namedLocation('house-bed', pos(25.3, -28));
    world.namedLocation('house-attic', pos(26, -37));
    world.namedLocation('house-kitchen', pos(20.5, -15));
    world.namedLocation('house-roof', pos(25, -50));
}
