import { Point } from './geometry';

// tslint:disable-next-line:no-empty-interface
export interface Constraint {
}

export interface RevoluteConstraint extends Constraint {
    readonly position: Point;

    limits(lower: number, upper: number): this;

    stiffness(n: number): this;

    movePivot2(x: number, y: number): this;

    motorSpeed(speed: number): this;
}

// tslint:disable-next-line:no-empty-interface
export interface LockConstraint extends Constraint {
}
