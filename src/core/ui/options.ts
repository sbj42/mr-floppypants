import { Graphics, Color } from '../graphics';
import { Point, Transform } from '../geometry';
import { getImage } from '../images';
import { Game, VERSION } from '../game';
import { achievementCard } from './achievement-card';
import { CARD_WIDTH } from './toast';

import TITLE1_IMAGE from '../images/title1.png';
import TITLE2_IMAGE from '../images/title2.png';

const TITLE_WIDTH = 572;
const TITLE_Y = 20;

const FADE_COLOR = new Color(255, 255, 255, 0.3);

export class OptionsUI {
    private _game: Game;
    private _isVisible = false;

    private _div: HTMLDivElement;
    private _achievementsDiv: HTMLDivElement;

    constructor(game: Game) {
        this._game = game;
        this._div = document.createElement('div');
        this._div.style.display = 'none';
        this._div.style.position = 'absolute';
        this._div.style.top = '0px';
        this._div.style.bottom = '0px';
        this._div.style.left = '0px';
        this._div.style.right = '0px';
        this._div.style.textAlign = 'center';
        document.body.appendChild(this._div);
        const inner = document.createElement('div');
        this._div.appendChild(inner);
        const versionDiv = document.createElement('div');
        versionDiv.textContent = versionDiv.innerText = `version ${VERSION}`;
        versionDiv.style.fontSize = '16px';
        versionDiv.style.fontFamily = 'sans-serif';
        versionDiv.style.marginTop = '140px';
        versionDiv.style.marginBottom = '40px';
        inner.appendChild(versionDiv);
        const optionsOuterDiv = document.createElement('div');
        optionsOuterDiv.style.cssFloat = 'left';
        optionsOuterDiv.style.marginLeft = '100px';
        inner.appendChild(optionsOuterDiv);
        const restartButton = document.createElement('button');
        restartButton.textContent = restartButton.innerText = 'Reset Game';
        restartButton.style.fontSize = '20px';
        restartButton.addEventListener('click', () => this._game.restart());
        optionsOuterDiv.appendChild(restartButton);
        const backButton = document.createElement('button');
        backButton.textContent = backButton.innerText = 'Return to Game';
        backButton.style.marginLeft = '40px';
        backButton.style.fontSize = '20px';
        backButton.addEventListener('click', () => this._game.showOptions(false));
        optionsOuterDiv.appendChild(backButton);
        const achievementsOuterDiv = document.createElement('div');
        achievementsOuterDiv.style.cssFloat = 'right';
        achievementsOuterDiv.style.marginRight = '100px';
        inner.appendChild(achievementsOuterDiv);
        const achievementsLabelDiv = document.createElement('div');
        achievementsLabelDiv.textContent = achievementsLabelDiv.innerText = `Achievements:`;
        achievementsLabelDiv.style.fontSize = '20px';
        achievementsLabelDiv.style.fontFamily = 'sans-serif';
        achievementsLabelDiv.style.marginTop = '20px';
        achievementsLabelDiv.style.marginBottom = '20px';
        achievementsOuterDiv.appendChild(achievementsLabelDiv);
        this._achievementsDiv = document.createElement('div');
        this._achievementsDiv.style.overflowY = 'auto';
        this._achievementsDiv.style.width = `${CARD_WIDTH + 100}px`;
        achievementsOuterDiv.appendChild(this._achievementsDiv);
        const resetAchievementsButton = document.createElement('button');
        resetAchievementsButton.textContent = resetAchievementsButton.innerText = 'Reset Game and Achievements';
        resetAchievementsButton.style.marginTop = '20px';
        resetAchievementsButton.style.fontSize = '20px';
        resetAchievementsButton.style.border = '2px solid red';
        resetAchievementsButton.addEventListener('click', () => {
            this._game.resetAll();
        });
        achievementsOuterDiv.appendChild(resetAchievementsButton);
        this.onResize();
    }

    onResize() {
        this._achievementsDiv.style.height = `${document.body.clientHeight - 350}px`;
    }

    show(visible: boolean) {
        this._isVisible = visible;
        this._div.style.display = visible ? '' : 'none';
        if (visible) {
            while (this._achievementsDiv.firstChild) {
                this._achievementsDiv.removeChild(this._achievementsDiv.firstChild);
            }
            this._game.forEachAchievement((achievement, collected) => {
                this._achievementsDiv.appendChild(achievementCard(achievement, collected));
            });
        }
    }

    get isVisible() {
        return this._isVisible;
    }

    draw(graphics: Graphics) {
        if (this.isVisible) {
            const graphicsSize = graphics.size();
            graphics.setTransform();
            graphics.fillRect(0, 0, graphicsSize.w, graphicsSize.h, FADE_COLOR);

            const mainTitle = getImage(TITLE1_IMAGE);
            const mainTitleFloppy = getImage(TITLE2_IMAGE);

            const titleX = (graphicsSize.w - TITLE_WIDTH) / 2;
            const titleTransform = new Transform();
            titleTransform.translate = new Point(titleX, TITLE_Y);
            graphics.drawImage(mainTitle, titleTransform);
            graphics.drawImage(mainTitleFloppy, titleTransform);
        }
    }

    close() {
        document.body.removeChild(this._div);
    }
}
