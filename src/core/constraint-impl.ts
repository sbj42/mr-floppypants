import * as p2 from 'p2';
import { Window } from './window';
import { Point, Circle } from './geometry';
import { RevoluteConstraint, LockConstraint } from './constraint';

const WIREFRAME_PIVOT_COLOR = '#00ff00';
const WIREFRAME_PIVOT_RADIUS = 3;

const V1 = p2.vec2.create();

export class RevoluteConstraintImpl implements RevoluteConstraint {
    readonly p2constraint: p2.RevoluteConstraint;

    constructor(p2constraint: p2.RevoluteConstraint) {
        this.p2constraint = p2constraint;
    }

    get position() {
        const { bodyA, pivotA } = this.p2constraint;
        p2.vec2.rotate(V1, pivotA, bodyA.angle);
        p2.vec2.add(V1, V1, bodyA.position);
        return new Point(V1[0], V1[1]);
    }

    limits(lower: number, upper: number): this;
    limits(lower: undefined, upper: undefined): this;
    limits(lower: number | undefined, upper: number | undefined): this {
        if (typeof lower !== 'undefined' && typeof upper !== 'undefined') {
            this.p2constraint.setLimits(lower * Math.PI / 180, upper * Math.PI / 180);
        }
        return this;
    }

    stiffness(n: number) {
        this.p2constraint.setStiffness(n);
        return this;
    }

    movePivot2(x: number, y: number) {
        p2.vec2.copy(this.p2constraint.pivotB, [x, y]);
        return this;
    }

    motorSpeed(speed: number) {
        if (speed) {
            this.p2constraint.enableMotor();
            this.p2constraint.setMotorSpeed(speed);
        } else {
            this.p2constraint.disableMotor();
        }
        return this;
    }

    drawWireframe(window: Window) {
        const { graphics } = window;
        graphics.strokeCircle(new Circle(this.position, WIREFRAME_PIVOT_RADIUS), WIREFRAME_PIVOT_COLOR, 1);
    }
}

export class LockConstraintImpl implements LockConstraint {
    readonly p2constraint: p2.LockConstraint;

    constructor(p2constraint: p2.LockConstraint) {
        this.p2constraint = p2constraint;
    }
}
