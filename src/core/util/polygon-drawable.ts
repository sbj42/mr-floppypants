import { PolyPolygon, PaintLike, Drawable, Window, World } from '..';
import { Polygon } from '../geometry';

export class PolygonDrawable implements Drawable {
    private _polyPolygon: PolyPolygon;
    private readonly _paint: PaintLike;

    constructor(polygon: Polygon, paint: PaintLike) {
        this._polyPolygon = new PolyPolygon([polygon]);
        this._paint = paint;
    }

    addPolygon(polygon: Polygon) {
        this._polyPolygon = new PolyPolygon([...this._polyPolygon.mapPolygons((p) => p), polygon]);
    }

    draw(window: Window, world: World) {
        const { graphics } = window;
        graphics.setTransform(window.getCameraTransform());
        graphics.fillPolyPolygon(this._polyPolygon, this._paint);
    }
}
