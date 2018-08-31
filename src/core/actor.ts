import { Body } from './body';
import { Point } from './geometry';
import { World } from './world';

export interface ActorParam {
    name?: string;
    head: Body;
    middle: Body;
    hands?: Body[];
    feet?: Body[];
    painPoints?: Body[];
    painVelocity?: number;
    all: Body[];
}

export type ActorPainListener = (velocity2: number) => void;

export interface Actor {
    readonly name?: string;
    readonly world: World;
    readonly head: Body;
    readonly middle: Body;

    forEachHand(callback: (hand: Body) => void): this;
    forEachFoot(callback: (foot: Body) => void): this;

    on(event: 'pain', listener: ActorPainListener): this;

    off(event: 'pain', listener: ActorPainListener): this;

    goto(x: number, y: number): this;
}
