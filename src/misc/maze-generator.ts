export interface MazeOptions {
    width: number;
    height: number;
    previsit?: number[][];
    horizontalBias?: boolean;
    loopFactor?: number;
}

export interface MazeCell {
    north?: boolean;
    south?: boolean;
    east?: boolean;
    west?: boolean;
}

type Direction = [number, number, string, string];

const DIRECTIONS: Direction[] = [
    [ 0, -1, 'north', 'south'],
    [ 1,  0, 'east',  'west' ],
    [ 0,  1, 'south', 'north'],
    [-1,  0, 'west',  'east' ],
];

export default function mazeGenerator(param: MazeOptions) {
    const {width, height, previsit, horizontalBias, loopFactor} = param;

    function isVisited(pos: number[]) {
        if (pos[0] < 0 || pos[0] >= width || pos[1] < 0 || pos[1] >= height) {
            return true;
        }
        return visited[pos[1]][pos[0]];
    }

    function markVisited(pos: number[]) {
        visited[pos[1]][pos[0]] = true;
    }

    function getNeighbors(pos: number[]) {
        const ret = [];
        for (const d of DIRECTIONS) {
            if (!isVisited([pos[0] + d[0], pos[1] + d[1]])) {
                ret.push(d);
                if (horizontalBias) {
                    ret.push(d);
                    if (d[0] !== 0) {
                        ret.push(d);
                    }
                }
            }
        }
        return ret;
    }

    function get(pos: number[]) {
        return grid[pos[1]][pos[0]];
    }

    function hasPath(pos: number[]) {
        const cell = grid[pos[1]][pos[0]];
        return cell.north || cell.east || cell.south || cell.west;
    }

    function connect(pos: number[], d: Direction) {
        (get(pos) as any)[d[2]] = true;
        const npos = [pos[0] + d[0], pos[1] + d[1]];
        (get(npos) as any)[d[3]] = true;
        return npos;
    }

    const visited: boolean[][] = [];

    const grid: MazeCell[][] = [];
    for (let y = 0; y < height; y ++) {
        const gridRow: MazeCell[] = [];
        const visitedRow: boolean[] = [];
        grid.push(gridRow);
        visited.push(visitedRow);
        for (let x = 0; x < width; x ++) {
            gridRow.push({});
            visitedRow.push(false);
        }
    }
    if (previsit) {
        previsit.forEach(markVisited);
    }

    let cur = [0, 0];
    const stack: number[][] = [];
    markVisited(cur);

    for (;;) {
        const neighbors = getNeighbors(cur);
        if (neighbors.length) {
            const dir = neighbors[Math.floor(Math.random() * neighbors.length)];
            stack.push(cur);
            cur = connect(cur, dir);
            markVisited(cur);
        } else if (stack.length) {
            cur = stack.pop() as number[];
        } else {
            break;
        }
    }

    if (loopFactor) {
        for (let y = 0; y < height - 1; y ++) {
            for (let x = 0; x < width - 1; x ++) {
                if (Math.random() < loopFactor) {
                    const dir = DIRECTIONS[Math.random() < (horizontalBias ? 0.75 : 0.5) ? 1 : 2];
                    const npos = [x + dir[0], y + dir[1]];
                    if (hasPath([x, y]) && hasPath(npos)) {
                        connect([x, y], dir);
                    }
                }
            }
        }
    }

    return grid;
}
