import {
    World,
    BodyFactory,
    Point,
    BodyGetOptions,
    Circle,
    BODYTYPE_GROUND,
} from '../../core';
import { grass } from '../front-yard';

const BODYTYPE_BALL = 'golf-ball';
const BODYTYPE_CLUB = 'golf-club';

export const golfCourse = new BodyFactory(require('./images/golfcourse.png'), `
        0,350 86,255 123,255 176,315 306,315 312,308
        352,308 354,310 354,336 379,336 379,310 381,308
        446,310 446,400 447,310
        497,279 595,279 697,342 697,400 698,342 798,342 848,321
        948,319 998,342 1152,342 1198,355 1298,355
        1298,348 1400,348 1400,450 0,450
    `, 0, 355)
    .bodyType(BODYTYPE_GROUND);

export const golfBall = new BodyFactory(require('./images/golfball.png'), Circle.fromString(`10,10 9`), 10, 10)
    .mass(0.2, 1.5)
    .damping(0.2)
    .bodyType(BODYTYPE_BALL, {
        collidesWith: [BODYTYPE_GROUND, BODYTYPE_CLUB],
    });

export const golfClub = new BodyFactory(require('./images/golfclub.png'), `21,3 30,3 30,88 5,95 3,89 21,81`, 0, 90)
    .mass(0.3, 1.5)
    .bodyType(BODYTYPE_CLUB);

export const ACH_GOLF = 'golf';
export const ACH_HOLE = 'hole';
export const ACH_PAR = 'par';
export const ACH_HOLEINONE = 'hole-in-one';

const ACHIEVEMENTS = [{
    id: ACH_GOLF,
    image: require('./images/golfclub.png'),
    label: 'Fore!',
    description: 'Hit the golf ball with the golf club.',
}, {
    id: ACH_HOLE,
    image: require('./images/ach-hole.png'),
    label: 'In the hole',
    description: 'Get the golf ball into the hole.',
}, {
    id: ACH_PAR,
    image: require('./images/ach-hole.png'),
    label: 'Par',
    description: 'Use 2 or fewer strokes to get the ball into the hole.',
}, {
    id: ACH_HOLEINONE,
    image: require('./images/ach-hole.png'),
    label: 'Hole in one',
    description: 'Get the ball into the hole with only one stroke.',
}];

export default function(world: World, atx: number, aty: number) {

    world.game.addAchievements(ACHIEVEMENTS);

    function pos(x: number, y: number) {
        return new Point(atx + x, aty + y);
    }

    function add(factory: BodyFactory, x: number, y: number, options?: BodyGetOptions) {
        const p = pos(x, y);
        return world.addBody(factory.get(p.x, p.y, options));
    }

    add(grass, 1500, 0);
    add(golfCourse, 100, 0);
    const bGolfBall = add(golfBall, 1430, -15);
    const bGolfClub = add(golfClub, 1445, -15);
    let lastHit: number | undefined;
    let hitCount = 0;
    let inCount = 0;
    bGolfBall.on('contact', (otherBody) => {
        if (otherBody === bGolfClub) {
            const now = new Date().getTime();
            if (!lastHit || lastHit < now - 500) {
                lastHit = now;
                hitCount ++;
            }
            world.game.collectAchievement(ACH_GOLF);
        }
    }).on('sleep', () => {
        const { position } = bGolfBall;
        if (position.x > atx + 453 && position.x < atx + 477
            && position.y > aty - 39 && position.y < aty - 17) {
            inCount ++;
            world.game.collectAchievement(ACH_HOLE);
            if (hitCount <= 2) {
                world.game.collectAchievement(ACH_PAR);
            }
            if (hitCount <= 1) {
                world.game.collectAchievement(ACH_HOLEINONE);
            }
        }
    });
    add(grass, -400, 0);

    world.namedLocation('golf-start', pos(1720, -200));
}
