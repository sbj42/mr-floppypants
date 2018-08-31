import {
    World,
    BodyFactory,
    Point,
    BodyGetOptions,
} from '../../core';
import mazeGenerator from '../../misc/maze-generator';

const WIDTH = 22;
const HEIGHT = 4;
const LEFT_SHIFT = 7;

const N_EDGE = `
    0,50 0,0 600,0 600,50
    579,56 523,52 504,42 370,54 296,46 216,55 179,46 140,58 47,42
`;
const S_EDGE = `
    600,550 600,600 0,600 0,550
    41,547 78,554 169,539 260,554 306,549 402,560 503,544 550,554
`;
const WS_TURN = `
    0,0 600,0 600,600 550,600
    556,539 546,494 549,432 556,409 559,331 516,284 467,180 433,158
    402,97 338,71 277,67 215,45 188,51 133,51 91,58
`;
const NW_CORNER = `
    50,0 54,24 0,50 0,0
`;
const NE_CORNER = `
    550,0 600,0 600,50 566,56 544,20
`;
const SW_CORNER = `
    0,550 34,545 54,579 50,600 0,600
`;
const SE_CORNER = `
    550,600 545,575 600,550 600,600
`;
const NES_END = `
    42,44 69,60 121,57 142,38 335,62 366,86 500,124 538,247
    542,342 516,418 445,520 392,556 344,543 292,554 147,552 78,542 44,553
    0,550 0,600 600,600 600,0 0,0 0,50
`;

export const caveW = new BodyFactory(undefined, [NES_END], 300, 300)
    .imageBack(require('./images/cave-w.png'));
export const caveWS = new BodyFactory(undefined, [WS_TURN, SW_CORNER], 300, 300)
    .imageBack(require('./images/cave-ws.png'));
export const caveWE = new BodyFactory(undefined, [N_EDGE, S_EDGE], 300, 300)
    .imageBack(require('./images/cave-we.png'));
export const caveWSE = new BodyFactory(undefined, [N_EDGE, SW_CORNER, SE_CORNER], 300, 300)
    .imageBack(require('./images/cave-wse.png'));
export const caveWSEN = new BodyFactory(undefined, [NW_CORNER, NE_CORNER, SW_CORNER, SE_CORNER], 300, 300)
    .imageBack(require('./images/cave-wsen.png'));

export const rock1 = new BodyFactory(require('./images/rock1.png'), `
        19,12 37,6 62,11 78,25 93,29 87,67 91,85
        85,95 38,85 18,94 7,84 10,62 6,43 16,30
    `, 50, 50)
    .mass(50, 3);

export const pool = new BodyFactory(undefined, undefined, 300, 300)
    .imageFront(require('./images/cavepool.png'));

export function cavepool(world: World, atx: number, aty: number) {
    world.addBody(pool.get(atx, aty));
    world.addWaterZone(atx - 300, aty - 220, 600, 520);
}

const CAVES: {[nesw: string]: [BodyFactory, number]} = {
    '0001': [caveW, 0],
    '0010': [caveW, 270],
    '0100': [caveW, 180],
    '1000': [caveW, 90],
    '0011': [caveWS, 0],
    '0110': [caveWS, 270],
    '1100': [caveWS, 180],
    '1001': [caveWS, 90],
    '0101': [caveWE, 0],
    '1010': [caveWE, 90],
    '0111': [caveWSE, 0],
    '1110': [caveWSE, 270],
    '1101': [caveWSE, 180],
    '1011': [caveWSE, 90],
    '1111': [caveWSEN, 0],
};

export default function(world: World, atx: number, aty: number) {

    function pos(cx: number, cy: number, x = 0, y = 0) {
        return new Point(cx * 600 + 300 + x, cy * 600 + 300 + y);
    }

    function add(factory: BodyFactory, cx: number, cy: number, x: number, y: number, options?: BodyGetOptions) {
        const p = pos(cx, cy, x, y);
        return world.addBody(factory.get(p.x, p.y, options));
    }

    function addCave(nesw: (boolean | undefined)[], cx: number, cy: number) {
        const cave = CAVES[nesw.map((e) => e ? '1' : '0').join('')];
        if (!cave) {
            return undefined;
        }
        const [bodyFactory, angle] = cave;
        const p = pos(cx, cy);
        return world.addBody(bodyFactory.get(p.x, p.y, { angle }));
    }

    addCave([true,  true,  false, false], 0, 0);
    addCave([false, true,  false, true ], 1, 0);
    addCave([false, false, true,  true ], 2, 0);
    const ENTRANCE_X = 2;
    const ENTRANCE_Y = 1;

    const previsit: number[][] = [];
    for (let x = 1; x < WIDTH; x += 2) {
        previsit.push([x, 1 + Math.floor(Math.random() * (HEIGHT - 1))]);
    }
    const maze = mazeGenerator({
        width: WIDTH,
        height: HEIGHT,
        previsit,
        horizontalBias: true,
    });

    for (let x = 0; x < WIDTH; x ++) {
        for (let y = 0; y < HEIGHT; y ++) {
            const place = maze[y][x];
            if (x === LEFT_SHIFT + ENTRANCE_X && y === 0) {
                place.north = true;
            }
            if (!(place.north || place.east || place.south || place.west)) {
                continue;
            }
            addCave([place.north, place.east, place.south, place.west], x - LEFT_SHIFT, y + ENTRANCE_Y);
            if (!place.south && place.east && place.west && Math.random() < 0.2) {
                add(rock1, x - LEFT_SHIFT, y + ENTRANCE_Y, 0, 160);
            }
            if (place.north && !place.south && !place.west && !place.east) {
                const p = pos(x - LEFT_SHIFT, y + ENTRANCE_Y);
                cavepool(world, p.x, p.y);
            }
        }
    }

    world.namedLocation('cave-entrance', pos(0, 0));
}
