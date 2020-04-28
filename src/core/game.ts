import { Window } from './window';
import { World } from './world';
import { Drawable } from './drawable';
import { drawTitle } from './ui/title';
import { getImage } from './images';
import { Transform, Point, lineIntersection } from './geometry';
import { drawGrid } from './ui/grid';
import { BodyImpl } from './body-impl';
import { Actor } from './actor';
import { ActorImpl } from './actor-impl';
import { RevoluteConstraintImpl } from './constraint-impl';
import { RevoluteConstraint } from './constraint';
import { OptionsUI } from './ui/options';
import { CORE_ACHIEVEMENTS } from './achievements';
import { EventHelper } from './events';

import './game.css';
import { ToastUI } from './ui/toast';

export const VERSION = '0.1.0';

const STATE_TITLE = 'title';
const STATE_TITLE_FADING = 'title-fading';
const STATE_PLAY = 'play';

const CURSOR_POINT_IMAGE = require('./images/cursor-point.png');
const CURSOR_GRABBING_IMAGE = require('./images/cursor-grabbing.png');
const CURSOR_GRAB_IMAGE = require('./images/cursor-grab.png');

const OPTIONS_IMAGE = require('./images/options.png');
const OPTIONS_ROTATE_RAMPUP = 0.1;
const OPTIONS_ROTATE_SPEED = 700;

const CHEAT_CODE = 'cheat';
const ROTATE_SPEED = 30; // degrees per second
const ZOOM_SPEED = 0.8; // scale per second
const PAN_SPEED = 300; // window-pixels per second

const WIREFRAME_BOUND_COLOR = '#000000';
const WIREFRAME_WATER_COLOR = '#00ffff';

type GameState = typeof STATE_TITLE | typeof STATE_TITLE_FADING | typeof STATE_PLAY;

const TITLE_FADE_DURATION = 2;

export type GameRestartListener = () => void;

export interface GameOptions {
    skipTitle?: boolean;
    zoom?: number;
    timeScale?: number;
    grid?: boolean;
    wireframe?: boolean;
    paused?: boolean;
    cheats?: boolean;
}
export interface SetWorldOptions {
    location?: string | Point;
}

export interface Achievement {
    id: string;
    image: string;
    label: string;
    description: string;
}

export class Game {
    private _world?: World;
    readonly window: Window;
    private _eventHelper = new EventHelper();
    private _closed = false;

    private _lastTime = 0;

    private _state: GameState = STATE_TITLE;
    private _titleFade = 0;
    private _optionsRotateAmount = 0;
    private _optionsRotate = 0;
    private _mouseInOptions = false;

    private _cheats = 0;
    private _grid = false;
    private _timeScale = 1;
    private _wireframe = false;
    private _keyRotateCcw = false;
    private _keyRotateCw = false;
    private _keyZoomIn = false;
    private _keyZoomOut = false;
    private _keyPanUp = false;
    private _keyPanLeft = false;
    private _keyPanRight = false;
    private _keyPanDown = false;
    private _paused = false;

    private _currentActor: Actor | undefined;
    private _dragActor: ActorImpl | undefined;
    private _dragConstraint: RevoluteConstraint | undefined;

    private readonly _allAchievements: {[id: string]: Achievement} = {};
    private readonly _achievements: {[id: string]: true} = {};

    private readonly _optionsUI: OptionsUI;
    private readonly _toastUI: ToastUI;

    constructor(opts: GameOptions = {}) {
        this.window = this._makeWindow();

        window.addEventListener('resize', () => this._onresize());
        document.addEventListener('keydown', (event) => this._onkeydown(event));
        document.addEventListener('keyup', (event) => this._onkeyup(event));
        document.body.appendChild(this.window.canvas);
        this._optionsUI = new OptionsUI(this);
        this._toastUI = new ToastUI();

        if (document.readyState === 'complete') {
            this._onresize();
            this._animate();
        } else {
            window.addEventListener('load', () => {
                this._onresize();
                this._animate();
            });
        }

        if (opts.skipTitle) {
            this._state = STATE_PLAY;
        }
        if (opts.grid) {
            this._grid = true;
        }
        if (opts.wireframe) {
            this._wireframe = true;
        }
        if (opts.paused) {
            this._paused = true;
        }
        if (opts.cheats) {
            this._cheats = CHEAT_CODE.length;
            this._toastUI.addInfo('Cheats Enabled');
            window.localStorage.setItem('cheats', 'enabled');
        }

        if (typeof opts.zoom === 'number') {
            this.window.zoom(opts.zoom);
        }
        if (typeof opts.timeScale === 'number') {
            this._timeScale = opts.timeScale;
        }

        this.addAchievements(CORE_ACHIEVEMENTS);
        const storedAchievements = window.localStorage.getItem('achievements');
        if (storedAchievements) {
            for (const a of storedAchievements.split(',')) {
                this._achievements[a] = true;
            }
        }
        const gameCount = window.localStorage.getItem('game-count');
        window.localStorage.setItem('game-count', gameCount ? String(+gameCount + 1) : '1');
    }

    get world() {
        return this._world;
    }

    setWorld(world: World, opts: SetWorldOptions) {
        this._world = world;
        let startLocationName = this._world.startLocationName();
        if (typeof opts.location === 'string') {
            startLocationName = opts.location;
        }
        let startLocation = this._world.namedLocation(startLocationName);
        if (opts.location instanceof Point) {
            startLocation = new Point(opts.location.x, opts.location.y);
        }
        this.window.location(startLocation.x, startLocation.y);
        const actor = this._world.generateStartActor(startLocation.x, startLocation.y);
        this.currentActor(actor);
    }

    goto(location: string | Point) {
        if (this._world && typeof location === 'string') {
            const loc = this._world.namedLocation(location);
            location = new Point(loc.x, loc.y);
        }
        if (location instanceof Point) {
            this.window.location(location.x, location.y);
            const actor = this.currentActor();
            if (actor) {
                actor.goto(location.x, location.y);
            }
        }
    }

    addAchievements(achievements: Achievement[]) {
        for (const a of achievements) {
            if (!this._allAchievements[a.id]) {
                this._allAchievements[a.id] = a;
            }
        }
        return this;
    }

    collectAchievement(id: string) {
        const a = this._allAchievements[id];
        if (!a || this._achievements[id]) {
            return;
        }
        this._achievements[id] = true;
        this._toastUI.addAchievement(a);
        const aList: string[] = [];
        for (const x in this._achievements) {
            if (Object.prototype.hasOwnProperty.call(this._achievements, x)) {
                aList.push(x);
            }
        }
        aList.sort();
        window.localStorage.setItem('achievements', aList.join(','));
        return this;
    }

    forEachAchievement(callback: (achievement: Achievement, collected: boolean) => void) {
        const achievements: Achievement[] = [];
        for (const id in this._allAchievements) {
            if (Object.prototype.hasOwnProperty.call(this._allAchievements, id)) {
                achievements.push(this._allAchievements[id]);
            }
        }
        achievements.sort((a, b) => {
            if (a.label < b.label) {
                return -1;
            }
            if (a.label > b.label) {
                return 1;
            }
            return 0;
        });
        for (const a of achievements) {
            callback(a, this._achievements[a.id] || false);
        }
        return this;
    }

    resetAll() {
        for (const id in this._achievements) {
            if (Object.prototype.hasOwnProperty.call(this._achievements, id)) {
                delete this._achievements[id];
            }
        }
        window.localStorage.clear();
        this.restart();
    }

    showOptions(show: boolean) {
        this._optionsUI.show(show);
        this._toastUI.show(!show);
    }

    private _makeWindow() {
        const window = new Window();
        window.on('mousedown', () => {
            if (this._state === STATE_TITLE) {
                this._state = STATE_TITLE_FADING;
                return;
            } else if (this._state !== STATE_PLAY) {
                return;
            } else if (this._mouseInOptions) {
                this.showOptions(true);
                this.window.clearMouseIsDown();
                return;
            }
            this._tryDragStart(window);
        });
        window.on('mousemove', () => {
            if (this._state !== STATE_PLAY) {
                return;
            }
            if (this._dragConstraint) {
                this._drag();
            } else if (this.window.mouseIsDown()) {
                this._tryDragStart(window);
            }
        });
        window.on('mouseup', () => {
            if (this._state !== STATE_PLAY) {
                return;
            }
            if (this._dragConstraint) {
                this._dragEnd();
            }
        });
        return window;
    }

    private _onresize() {
        this.window.size(document.body.clientWidth, document.body.clientHeight);
        this._optionsUI.onResize();
    }

    private _tryDragStart(window: Window) {
        this._dragEnd();
        const p = this.window.worldMouseLocation();
        if (p && this._world) {
            const hit = this._world.actorHitTest(p.x, p.y);
            if (hit) {
                this.currentActor(hit.actor);
                this._dragConstraint = this._world.addRevoluteConstraint(hit.body, undefined, p.x, p.y);
                // Lower stiffness (from the default of, what, infinity?), so that it's hard to
                // just pull the actor through a wall.
                this._dragConstraint.stiffness(2000);
                this._dragActor = hit.actor as ActorImpl;
                this._dragActor.dragStart(hit.body, window);
            }
        }
    }

    private _drag() {
        const p = this.window.worldMouseLocation();
        if (p && this._dragConstraint) {
            this._dragConstraint.movePivot2(p.x, p.y);
        }
    }

    private _dragEnd() {
        if (this._dragConstraint && this._dragActor && this._world) {
            this._world.removeRevoluteConstraint(this._dragConstraint);
            this._dragConstraint = undefined;
            this._dragActor.dragEnd();
            this._dragActor = undefined;
        }
    }

    cheating() {
        return this._cheats === CHEAT_CODE.length;
    }

    private _onkeydown(event: KeyboardEvent) {
        const key = event.key.toLowerCase();
        if (this.cheating()) {
            if (!event.repeat) {
                if (!this._optionsUI.isVisible) {
                    if (key === 'g') {
                        this._grid = !this._grid;
                    } else if (key === 'h') {
                        this._wireframe = !this._wireframe;
                    } else if (key === 'q') {
                        this._keyRotateCw = true;
                    } else if (key === 'e') {
                        this._keyRotateCcw = true;
                    } else if (key === 'r') {
                        this._keyZoomIn = true;
                    } else if (key === 'f') {
                        this._keyZoomOut = true;
                    } else if (key === 'w') {
                        this._keyPanUp = true;
                    } else if (key === 'a') {
                        this._keyPanLeft = true;
                    } else if (key === 's') {
                        this._keyPanDown = true;
                    } else if (key === 'd') {
                        this._keyPanRight = true;
                    } else if (key === ' ') {
                        this._paused = !this._paused;
                    }
                }
            }
        } else {
            if (key === CHEAT_CODE[this._cheats]) {
                this._cheats ++;
                if (this.cheating()) {
                    this._toastUI.addInfo('Cheats Enabled');
                    window.localStorage.setItem('cheats', 'enabled');
                }
            } else {
                this._cheats = 0;
            }
        }
        if (key === 'escape') {
            this.showOptions(!this._optionsUI.isVisible);
        }
    }

    private _onkeyup(event: KeyboardEvent) {
        if (this.cheating()) {
            if (!event.repeat) {
                if (event.key === 'q' || event.key === 'Q') {
                    this._keyRotateCw = false;
                } else if (event.key === 'e' || event.key === 'E') {
                    this._keyRotateCcw = false;
                } else if (event.key === 'r' || event.key === 'R') {
                    this._keyZoomIn = false;
                } else if (event.key === 'f' || event.key === 'F') {
                    this._keyZoomOut = false;
                } else if (event.key === 'w' || event.key === 'W') {
                    this._keyPanUp = false;
                } else if (event.key === 'a' || event.key === 'A') {
                    this._keyPanLeft = false;
                } else if (event.key === 's' || event.key === 'S') {
                    this._keyPanDown = false;
                } else if (event.key === 'd' || event.key === 'D') {
                    this._keyPanRight = false;
                }
            }
        }
    }

    private _animate() {
        requestAnimationFrame((time) => {
            if (this._closed) {
                return;
            }
            time = time / 1000;
            if (this._lastTime === 0) {
                this._lastTime = time;
            }
            const deltaTime = time - this._lastTime;
            this._lastTime = time;
            this._tick(deltaTime);
            this._animate();
        });
    }

    time() {
        return this._lastTime;
    }

    private _tick(deltaTime: number) {
        if (!this._paused && !this._optionsUI.isVisible && this._world) {
            this._world.tick(deltaTime * this._timeScale);
        }
        if (!this._optionsUI.isVisible && this._currentActor && !this._dragConstraint) {
            this.window.panToward(this._currentActor.head.position.x, this._currentActor.head.position.y);
        }

        if (this._keyRotateCw) {
            this.window.angle(this.window.angle() + deltaTime * ROTATE_SPEED);
        } else if (this._keyRotateCcw) {
            this.window.angle(this.window.angle() - deltaTime * ROTATE_SPEED);
        }
        if (this._keyZoomIn) {
            this.window.zoom(this.window.zoom() * (1 + deltaTime * ZOOM_SPEED));
        } else if (this._keyZoomOut) {
            this.window.zoom(this.window.zoom() / (1 + deltaTime * ZOOM_SPEED));
        }
        if (this._keyPanUp || this._keyPanDown || this._keyPanLeft || this._keyPanRight) {
            let cur = this.window.location();
            const amount = deltaTime * PAN_SPEED / this.window.zoom();
            const sin = Math.sin(this.window.angle() * Math.PI / 180);
            const cos = Math.cos(this.window.angle() * Math.PI / 180);
            if (this._keyPanUp) {
                cur = new Point(cur.x - sin * amount, cur.y - cos * amount);
            } else if (this._keyPanDown) {
                cur = new Point(cur.x + sin * amount, cur.y + cos * amount);
            }
            if (this._keyPanLeft) {
                cur = new Point(cur.x - cos * amount, cur.y + sin * amount);
            } else if (this._keyPanRight) {
                cur = new Point(cur.x + cos * amount, cur.y - sin * amount);
            }
            this._currentActor = undefined;
            this.window.location(cur.x, cur.y);
        }

        if (this._state === STATE_TITLE_FADING) {
            if (this._titleFade >= 1) {
                this._state = STATE_PLAY;
                this.window.zoom(1);
                this._timeScale = 1;
            } else {
                this._titleFade += deltaTime / TITLE_FADE_DURATION;
                if (this._titleFade >= 1) {
                    this._titleFade = 1;
                }
            }
        }
        if (this._state === STATE_TITLE || this._state === STATE_TITLE_FADING) {
            this.window.zoom(Math.pow(2, 1 - this._titleFade));
            this._timeScale = Math.pow(0.25, 1 - this._titleFade);
        }

        const { graphics } = this.window;
        const mouse = this.window.windowMouseLocation();

        if (this._world) {
            this._world.forEachBackdrop((backdrop) => this._drawBackdrop(backdrop));

            graphics.setTransform(this.window.getCameraTransform());
            this._world.forEachBody((body) => (body as BodyImpl).drawImageBack(this.window));
            this._world.forEachBody((body) => (body as BodyImpl).drawImage(this.window));
            this._world.forEachBody((body) => (body as BodyImpl).drawImageFront(this.window));

            if (this._wireframe) {
                const bound = this._world.bound();
                graphics.strokeRect(bound.x1, bound.y1, bound.w, bound.h, WIREFRAME_BOUND_COLOR, 2);
                this._world.forEachBody((body) => (body as BodyImpl).drawWireframe(this.window));
                this._world.forEachRevoluteConstraint((constraint) => {
                    (constraint as RevoluteConstraintImpl).drawWireframe(this.window);
                });
                this._world.forEachWaterZone((wBound) => {
                    graphics.strokeRect(wBound.x1, wBound.y1, wBound.w, wBound.h, WIREFRAME_WATER_COLOR, 1);
                });
            }
        }

        if (this._grid) {
            drawGrid(this.window);
        }

        {
            graphics.setTransform();
            const transform = new Transform();
            transform.anchor = new Point(25, 25);
            transform.translate = new Point(this.window.size().w - 30, 30);
            this._mouseInOptions = false;
            if (mouse) {
                const dist = Math.max(Math.abs(mouse.x - transform.translate.x),
                                      Math.abs(mouse.y - transform.translate.y));
                this._mouseInOptions = dist < 26 && !this._optionsUI.isVisible;
            }
            if (this._mouseInOptions) {
                this._optionsRotateAmount = Math.min(1, this._optionsRotateAmount + OPTIONS_ROTATE_RAMPUP);
            } else {
                this._optionsRotateAmount = Math.max(0, this._optionsRotateAmount - OPTIONS_ROTATE_RAMPUP);
            }
            this._optionsRotate += deltaTime * OPTIONS_ROTATE_SPEED * this._optionsRotateAmount;
            transform.rotate = this._optionsRotate;
            transform.scale = 1 + 0.15 * this._optionsRotateAmount;
            graphics.drawImage(getImage(OPTIONS_IMAGE), transform);
        }

        this._optionsUI.draw(graphics);

        if (this._state === STATE_TITLE || this._state === STATE_TITLE_FADING) {
            drawTitle(graphics, this.time(), this._titleFade);
        }

        if (mouse && !this._optionsUI.isVisible) {
            const imageSrc = (this._state === STATE_TITLE || this._state === STATE_TITLE_FADING
                              || this._mouseInOptions) ? CURSOR_POINT_IMAGE
                             : (this.window.mouseIsDown() ? CURSOR_GRABBING_IMAGE : CURSOR_GRAB_IMAGE);
            const mouseImage = getImage(imageSrc);
            const mouseTransform = new Transform();
            mouseTransform.anchor = new Point(8, 10);
            mouseTransform.translate = mouse;
            graphics.setTransform();
            graphics.drawImage(mouseImage, mouseTransform);
        }
    }

    private _drawBackdrop(backdrop: Drawable) {
        if (this._world) {
            backdrop.draw(this.window, this._world);
        }
    }

    currentActor(): Actor | undefined;
    currentActor(actor: Actor | undefined): this;
    currentActor(actor?: Actor | undefined): Actor | undefined | this {
        if (arguments.length === 0) {
            return this._currentActor;
        } else {
            this._currentActor = actor;
            return this;
        }
    }

    on(event: 'restart', listener: GameRestartListener) {
        this._eventHelper.on(event, listener);
        return this;
    }

    off(event: 'restart', listener: GameRestartListener) {
        this._eventHelper.off(event, listener);
        return this;
    }

    restart() {
        this._eventHelper.emit('restart');
    }

    close() {
        document.body.removeChild(this.window.canvas);
        this._optionsUI.close();
        this._toastUI.close();
        this._closed = true;
    }

}
