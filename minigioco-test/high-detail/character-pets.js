import { drawCatPet } from "./pet-cat.js";
import { drawDogPet } from "./pet-dog.js";
import { createPetPose, drawPetShadow, PET_PALETTES } from "./pet-common.js";

/**
 * Animali del diorama ancorati al punto dei piedi in pixel mondo.
 * La posa resta locale al renderer: look/avatar e stato server non vengono alterati.
 * @param {{x:number,y:number,type?:string,time?:number,walking?:boolean,direction?:string,mode?:string,petted?:boolean,reducedMotion?:boolean}} options
 */
export function drawDetailedPet(ctx, {
  x,
  y,
  type = "cat",
  time = 0,
  walking = false,
  direction = "se",
  mode = "stand",
  petted = false,
  reducedMotion = false,
} = {}) {
  if (!ctx || !Number.isFinite(x) || !Number.isFinite(y)) return;
  const kind = type === "dog" ? "dog" : "cat";
  const palette = PET_PALETTES[kind];
  const pose = createPetPose({ time, walking, direction, mode, petted, reducedMotion, type: kind });
  ctx.save();
  drawPetShadow(ctx, x, y, palette, pose);
  if (kind === "dog") drawDogPet(ctx, { x, y, palette, pose });
  else drawCatPet(ctx, { x, y, palette, pose });
  ctx.restore();
}
