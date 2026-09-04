// Motore Asso World: pet foot point.
import * as dependencies from "./dependencies";

export function installPetFootPoint(engine) {
  engine.petFootPoint = function(pet) {
    if (pet.perch) {
        const p = dependencies.tileTop(pet.perch.tx, pet.perch.ty);
        return {
            x: p.x + (pet.perch.ox || 0),
            y: p.y + dependencies.HTH - pet.perch.lift + (pet.perch.oy || 0),
            perched: true,
        };
    }
    const p = dependencies.tileTop(pet.fx, pet.fy);
    return { x: p.x, y: p.y + dependencies.HTH, perched: false };
};
}
