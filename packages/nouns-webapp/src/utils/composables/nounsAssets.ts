import { NounSeed, NounData } from '@nouns/assets/dist/types';



/**
 * Get encoded part and background information using a Noun seed
 * @param seed The Noun seed
 */

export const getNounData = (seed: NounSeed, imageData: any): NounData => {
  return {
    parts: [
      imageData.images.bodies[seed.body],
      imageData.images.accessories[seed.accessory],
      imageData.images.heads[seed.head],
      imageData.images.glasses[seed.glasses],
    ],
    background: imageData.bgcolors[seed.background],
  };
};

/**
 * Generate a random Noun seed
 * @param seed The Noun seed
 */
export const getRandomNounSeed = (imageData: any): NounSeed => {
  return {
    background: Math.floor(Math.random() * imageData.bgcolors.length),
    body: Math.floor(Math.random() * imageData.images.bodies.length),
    accessory: Math.floor(Math.random() * imageData.images.accessories.length),
    head: Math.floor(Math.random() * imageData.images.heads.length),
    glasses: Math.floor(Math.random() * imageData.images.glasses.length),
  };
};
