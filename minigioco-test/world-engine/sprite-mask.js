// Motore Asso World: sprite mask.


export function installSpriteMask(engine) {
  engine.spriteMask = function(cv) {
    if (cv._hitMask !== undefined)
        return cv._hitMask;
    let mask = null;
    try {
        const data = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data;
        mask = { w: cv.width, h: cv.height, data };
    }
    catch (e) {
        mask = null; // canvas non leggibile → fallback al rettangolo
    }
    cv._hitMask = mask;
    return mask;
};
}
