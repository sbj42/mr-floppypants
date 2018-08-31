import { Drawable, Window, World, LinearGradient } from '../core';

export const GROUND_GRADIENT = LinearGradient.fromSimple(0, 0, '#8a4425', 0, 5000, '#421a09');

export class Ground implements Drawable {
    draw(window: Window, world: World) {
        const { graphics } = window;
        const cameraBounds = window.cameraBounds();
        graphics.setTransform(window.getCameraTransform());
        // const zero = window.worldToWindow(0, 0);
        graphics.fillRect(cameraBounds.x1, 0,
                          cameraBounds.x2 - cameraBounds.x1 + 1, Math.max(cameraBounds.y2, 0),
                          GROUND_GRADIENT);
    }
}
