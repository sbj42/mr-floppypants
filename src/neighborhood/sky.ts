import { Drawable, Window, Graphics, World, getImage, Transform, Point, Size, LinearGradient } from '../core';

const SKY_GRADIENT = LinearGradient.fromSimple(0, -6000, '#abd1f9', 0, 0, '#71ace8');

import SUN_IMAGE from './images/sun.png';
const SUN_IMAGE_ANCHOR = new Point(98, 108);
const SUN_POSITION = new Size(0.25, 0.25);

import CLOUD1_IMAGE from './images/cloud1.png';
const CLOUD1_SPEED = 300; // seconds per pass
const CLOUD1_POSITION = 0.15;
const CLOUD1_IMAGE_ANCHOR = new Point(250, 100);

import CLOUD2_IMAGE from './images/cloud2.png';
const CLOUD2_SPEED = 500; // seconds per pass
const CLOUD2_POSITION = 0.35;
const CLOUD2_IMAGE_ANCHOR = new Point(250, 100);

function cloudX(timeInMilliseconds: number, speed: number) {
    // t ranges from 0 to 1
    const t = ((1000 + timeInMilliseconds / 1000) % speed) / speed;
    // to avoid the cloud disappearing at the ends of the screen, extend range to -0.25 to 0.25
    return 1.5 * t - 0.25;
}

export class Sky implements Drawable {
    private _background: CanvasGradient | undefined;

    private _drawImage(window: Window, imageSrc: string, anchor: Point, x: number, y: number) {
        const { graphics } = window;
        const transform = new Transform();
        transform.anchor = anchor;
        transform.translate = new Point(x, y);
        graphics.drawImage(getImage(imageSrc), transform);
    }

    private _drawSun(window: Window, world: World) {
        const x = window.size().w * SUN_POSITION.w;
        const y = window.size().h * SUN_POSITION.h;
        this._drawImage(window, SUN_IMAGE, SUN_IMAGE_ANCHOR, x, y);
    }

    private _drawCloud1(window: Window, world: World) {
        const tx = cloudX(world.time(), CLOUD1_SPEED);
        const x = window.size().w * tx;
        const y = window.size().h * CLOUD1_POSITION;
        this._drawImage(window, CLOUD1_IMAGE, CLOUD1_IMAGE_ANCHOR, x, y);
    }

    private _drawCloud2(window: Window, world: World) {
        const tx = cloudX(world.time(), CLOUD2_SPEED);
        const x = window.size().w * tx;
        const y = window.size().h * CLOUD2_POSITION;
        this._drawImage(window, CLOUD2_IMAGE, CLOUD2_IMAGE_ANCHOR, x, y);
    }

    draw(window: Window, world: World) {
        const { graphics } = window;
        const cameraBounds = window.cameraBounds();
        const transform = window.getCameraTransform();
        graphics.setTransform(transform);
        graphics.fillRect(cameraBounds.x1, cameraBounds.y1,
                          cameraBounds.x2 - cameraBounds.x1 + 1, cameraBounds.y2 - cameraBounds.y1 + 1,
                          SKY_GRADIENT);

        transform.scale = 1;
        // const adjust = transform.anchor.y * 0.1;
        transform.anchor = transform.translate;
        // transform.translate = new Point(transform.translate.x, transform.translate.y - adjust);
        graphics.setTransform(transform);
        this._drawSun(window, world);
        this._drawCloud1(window, world);
        this._drawCloud2(window, world);
    }
}
