const pngRequire = require; // .context('..', true, /\.png$/);

interface ImageCache {
    [key: string]: HTMLImageElement;
}

const IMAGE_CACHE: ImageCache = {};

export function newImage(src: string) {
    const image = new Image();
    image.src = src;
    return image;
}

export function getImage(src: string, noCache = false) {
    if (noCache) {
        return newImage(src);
    }
    let image = IMAGE_CACHE[src];
    if (!image) {
        image = IMAGE_CACHE[src] = newImage(src);
    }
    return image;
}
