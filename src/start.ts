import { Game, Point } from './core';
import neighborhood from './neighborhood';

function start() {
    const GAME = new Game({
        // skipTitle: true,
        // grid: true,
        // wireframe: true,
        // zoom: 0.3,
        // timeScale: 0.1,
        // cheats: true,
    });

    GAME.setWorld(neighborhood(GAME), {
        // location: new Point(3200, -800),
        // location: 'house-attic',
    });

    GAME.on('restart', () => {
        GAME.close();
        start();
    });
}

start();
