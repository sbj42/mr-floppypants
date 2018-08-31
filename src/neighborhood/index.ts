import { World, Game } from '../core';

import { Sky } from './sky';
import { Ground } from './ground';

import house from './house';
import frontYard from './front-yard';
import cave from './cave';
import golf from './golf';
import mrFloppypants from './mr-floppypants';

export default function(game: Game) {
    const world = new World(game);

    world.addBackdrop(new Sky());
    world.addBackdrop(new Ground());

    house(world, 0, 0);
    cave(world, -25, 0);
    frontYard(world, 2425, 0);
    golf(world, -2025, 0);

    world.startLocationName('house-bed');
    world.startActorGenerator(mrFloppypants);

    return world;
}
