import { Window } from './window';
import { World } from './world';

export interface Drawable {
    draw(window: Window, world: World): void;
}
