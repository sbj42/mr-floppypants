import { Graphics, Color } from '../graphics';
import { getImage } from '../images';
import { Transform, Point } from '../geometry';

const TITLE1_IMAGE = require('../images/title1.png');
const TITLE2_IMAGE = require('../images/title2.png');

const TITLE_WIDTH = 572;
const TITLE_Y1 = 150;
const TITLE_Y2 = -150;
const TITLE_FLOPPY_ANCHOR = new Point(180, 50);

const INSTRUCTION_Y1 = 115;
const INSTRUCTION_Y2 = -115;

const FADE_COLOR = Color.WHITE;
const BORDER_COLOR = new Color(171, 209, 249);

export function drawTitle(graphics: Graphics, time: number, fade: number) {
    if (!isFinite(fade) || fade < 0 || fade > 1) {
        throw new Error(`invalid fade ${fade}`);
    }
    graphics.setTransform();
    const graphicsSize = graphics.size();

    const mainTitle = getImage(TITLE1_IMAGE);
    const mainTitleFloppy = getImage(TITLE2_IMAGE);

    graphics.fillRect(0, 0, graphicsSize.w, graphicsSize.h, FADE_COLOR.withAlpha(0.3 * (1 - fade)));

    graphics.globalAlpha(1 - fade);

    const titleX = (graphicsSize.w - TITLE_WIDTH) / 2;
    const titleY = TITLE_Y1 + (TITLE_Y2 - TITLE_Y1) * fade;
    const titleTransform = new Transform();
    titleTransform.translate = new Point(titleX, titleY);
    graphics.drawImage(mainTitle, titleTransform);
    titleTransform.anchor = TITLE_FLOPPY_ANCHOR;
    titleTransform.rotate = 25 * Math.min(1, Math.pow(Math.max(0, time - 1) / 2, 6));
    titleTransform.translate = new Point(titleX + TITLE_FLOPPY_ANCHOR.x, titleY + TITLE_FLOPPY_ANCHOR.y);
    graphics.drawImage(mainTitleFloppy, titleTransform);

    graphics.globalAlpha(1);

    const instructionX = graphicsSize.w / 2;
    const instructionY = graphicsSize.h - (INSTRUCTION_Y1 + (INSTRUCTION_Y2 - INSTRUCTION_Y1) * fade);
    graphics.fillText(instructionX, instructionY, 'Click to begin', Color.BLACK, '35px Verdana', 'center', 'bottom');

    const borderH = 100 * (1 - fade);
    graphics.fillRect(0, 0, graphicsSize.w, borderH, BORDER_COLOR);
    graphics.fillRect(0, graphicsSize.h - borderH, graphicsSize.w, borderH, BORDER_COLOR);

    graphics.strokeRect(-10, borderH, graphicsSize.w + 20, graphicsSize.h - 2 * borderH, Color.BLACK, 6, 'round');
}
