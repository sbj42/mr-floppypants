import { getImage } from '../images';
import { Achievement } from '../game';
import { achievementCard } from './achievement-card';

export const CARD_HEIGHT = 50;
export const CARD_MARGIN = 10;
export const CARD_PADDING = 3;

export const CARD_WIDTH = 400;
export const CARD_OVERALL_HEIGHT = CARD_HEIGHT + CARD_MARGIN + CARD_PADDING * 2;

const TIMEOUT = 8;

export class ToastUI {
    private _div: HTMLDivElement;

    private readonly _items: HTMLDivElement[] = [];

    constructor() {
        this._div = document.createElement('div');
        this._div.style.position = 'absolute';
        this._div.style.top = '0px';
        this._div.style.bottom = '0px';
        this._div.style.left = '0px';
        this._div.style.right = '0px';
        this._div.style.textAlign = 'center';
        this._div.style.pointerEvents = 'none';
        document.body.appendChild(this._div);
    }

    show(visible: boolean) {
        this._div.style.display = visible ? '' : 'none';
    }

    private _adjust() {
        setTimeout(() => {
            this._items.forEach((item, index) => {
                const dy = this._items.length - index - 1;
                item.style.transition = `1s all`;
                item.style.bottom = `${CARD_OVERALL_HEIGHT * dy}px`;
            });
        }, 0);
    }

    private _remove(item: HTMLDivElement) {
        const index = this._items.indexOf(item);
        if (index >= 0) {
            this._items.splice(index, 1);
            this._div.removeChild(item);
            this._adjust();
        }
    }

    private _fade(item: HTMLDivElement) {
        item.style.transition = `1s all`;
        item.style.opacity = '0';
        setTimeout(() => this._remove(item), 1000);
    }

    _add(element: HTMLDivElement) {
        const outer = document.createElement('div');
        outer.style.position = 'absolute';
        outer.style.bottom = `${-CARD_OVERALL_HEIGHT}px`;
        outer.style.left = '0px';
        outer.style.right = '0px';
        outer.style.pointerEvents = 'none';
        this._div.appendChild(outer);

        const inner = element;
        inner.style.pointerEvents = 'auto';
        inner.addEventListener('click', () => {
            this._remove(outer);
        });
        outer.appendChild(inner);

        this._items.push(outer);
        setTimeout(() => {
            this._fade(outer);
        }, 1000 * TIMEOUT);
        this._adjust();
    }

    addAchievement(achievement: Achievement) {
        this._add(achievementCard(achievement));
    }

    addInfo(message: string) {
        const element = document.createElement('div');
        element.style.position = 'relative';
        element.style.display = 'inline-block';
        element.style.width = `${CARD_WIDTH}px`;
        element.style.height = `${CARD_HEIGHT}px`;
        element.style.margin = `${CARD_MARGIN}px`;
        element.style.padding = `${CARD_PADDING + 10}px`;
        element.style.border = '1px solid #000';
        element.style.backgroundColor = '#ffa';
        element.style.boxShadow = '0px 2px 2px rgba(0,0,0,0.5)';
        element.style.textAlign = 'center';
        element.style.fontFamily = 'sans-serif';
        element.textContent = element.innerText = message;
        this._add(element);
    }

    close() {
        document.body.removeChild(this._div);
    }
}
