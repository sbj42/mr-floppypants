import { Window } from '../window';
import { Color } from '../graphics';
import { Point, lineIntersection } from '../geometry';

const GRID_SIZE = 100;
const GRID_COLOR = Color.fromString('#602060');
const GRIDLABEL_FGCOLOR = Color.fromString('#202020');
const GRIDLABEL_BGCOLOR = Color.fromString('#eeeeee88');
const GRIDLABEL_WIDTH = 50;
const GRIDLABEL_HEIGHT = 12;
const GRIDLABEL_FONT = '9px Verdana';
const ANCHOR_COLOR = Color.WHITE;
const ANCHOR_SIZE = 5;
const MOUSEPOS_FGCOLOR = Color.fromString('#202020');
const MOUSEPOS_BGCOLOR = Color.fromString('#eeeeee88');
const MOUSEPOS_FONT = '12px Verdana';
const MOUSEPOS_WIDTH = 100;
const MOUSEPOS_HEIGHT = 18;

export function drawGrid(window: Window) {
    const windowSize = window.size();
    const cameraBounds = window.cameraBounds();

    const x1 = Math.floor(cameraBounds.x1 / GRID_SIZE) * GRID_SIZE;
    const y1 = Math.floor(cameraBounds.y1 / GRID_SIZE) * GRID_SIZE;
    const x2 = Math.ceil(cameraBounds.x2 / GRID_SIZE) * GRID_SIZE;
    const y2 = Math.ceil(cameraBounds.y2 / GRID_SIZE) * GRID_SIZE;

    const { graphics } = window;
    graphics.setTransform();

    const lw2 = GRIDLABEL_WIDTH / 2;
    const lh2 = GRIDLABEL_HEIGHT / 2;

    const drawLabel = (p: Point | undefined, str: string) => {
        if (p) {
            graphics.fillRect(p.x + 0.5 - lw2, p.y + 0.5 - lh2,
                              GRIDLABEL_WIDTH, GRIDLABEL_HEIGHT, GRIDLABEL_BGCOLOR);
            graphics.fillText(p.x + 0.5, p.y + 0.5, str, GRIDLABEL_FGCOLOR, GRIDLABEL_FONT);
        }
    };

    for (let x = x2 - GRID_SIZE; x > x1; x -= GRID_SIZE) {
        const l1 = window.worldToWindow(x, y1);
        const l2 = window.worldToWindow(x, y2);
        graphics.strokeLine(l1.x + 0.5, l1.y + 0.5, l2.x + 0.5, l2.y + 0.5, GRID_COLOR, 1, true);
        const px = lineIntersection(l1.x, l1.y, l2.x, l2.y,
                                    lw2, lh2, windowSize.w - lw2, lh2);
        drawLabel(px, `x=${x}`);
        const py = lineIntersection(l1.x, l1.y, l2.x, l2.y,
                                    windowSize.w - lw2, lh2,
                                    windowSize.w - lw2, windowSize.h - lh2);
        drawLabel(py, `x=${x}`);
    }
    for (let y = y1 + GRID_SIZE; y <= y2; y += GRID_SIZE) {
        const l1 = window.worldToWindow(x1, y);
        const l2 = window.worldToWindow(x2, y);
        graphics.strokeLine(l1.x + 0.5, l1.y + 0.5, l2.x + 0.5, l2.y + 0.5, GRID_COLOR, 1, true);
        const px = lineIntersection(l1.x, l1.y, l2.x, l2.y,
                                    lw2, windowSize.h - lh2,
                                    windowSize.w - lw2, windowSize.h - lh2);
        drawLabel(px, `y=${y}`);
        const py = lineIntersection(l1.x, l1.y, l2.x, l2.y,
                                    lw2, lh2, lw2, windowSize.h - lh2);
        drawLabel(py, `y=${y}`);
    }

    const a = window.anchor();
    graphics.strokeLine(a.x - ANCHOR_SIZE, a.y - ANCHOR_SIZE, a.x + ANCHOR_SIZE, a.y + ANCHOR_SIZE, ANCHOR_COLOR, 1);
    graphics.strokeLine(a.x + ANCHOR_SIZE, a.y - ANCHOR_SIZE, a.x - ANCHOR_SIZE, a.y + ANCHOR_SIZE, ANCHOR_COLOR, 1);

    const m = window.worldMouseLocation();
    if (m) {
        graphics.fillRect(windowSize.w - MOUSEPOS_WIDTH, windowSize.h - MOUSEPOS_HEIGHT,
                          MOUSEPOS_WIDTH, MOUSEPOS_HEIGHT, MOUSEPOS_BGCOLOR);
        graphics.fillText(windowSize.w - MOUSEPOS_WIDTH * 3 / 4, windowSize.h - MOUSEPOS_HEIGHT / 2,
                          m.x.toFixed(0), MOUSEPOS_FGCOLOR, MOUSEPOS_FONT);
        graphics.fillText(windowSize.w - MOUSEPOS_WIDTH / 4, windowSize.h - MOUSEPOS_HEIGHT / 2,
                          m.y.toFixed(0), MOUSEPOS_FGCOLOR, MOUSEPOS_FONT);
    }
}
