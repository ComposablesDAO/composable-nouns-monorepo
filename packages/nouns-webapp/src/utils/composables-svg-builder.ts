import { DecodedImage } from '@nouns/sdk';

/**
 * Local modifications needed in buildSVG function for Composer, pulled from the nouns-sdk library
 */

/**
 * Decode the RLE image data into a format that's easier to consume in `buildSVG`.
 * @param image The RLE image data
 */
export const decodeImage = (image: string): DecodedImage => {
  const data = image.replace(/^0x/, '');
  const paletteIndex = parseInt(data.substring(0, 2), 16);
  const bounds = {
    top: parseInt(data.substring(2, 4), 16),
    right: parseInt(data.substring(4, 6), 16),
    bottom: parseInt(data.substring(6, 8), 16),
    left: parseInt(data.substring(8, 10), 16),
  };
  const rects = data.substring(10);

  return {
    paletteIndex,
    bounds,
    rects:
      rects
        ?.match(/.{1,4}/g)
        ?.map(rect => [parseInt(rect.substring(0, 2), 16), parseInt(rect.substring(2, 4), 16)]) ??
      [],
  };
};

/**
 * @notice Given an x-coordinate, draw length, and right bound, return the draw
 * length for a single SVG rectangle.
 */
const getRectLength = (currentX: number, drawLength: number, rightBound: number): number => {
  const remainingPixelsInLine = rightBound - currentX;
  return drawLength <= remainingPixelsInLine ? drawLength : remainingPixelsInLine;
};

/**
 * Given RLE parts, palette colors, and a background color, build an SVG image.
 * @param parts The RLE part datas
 * @param paletteColors The hex palette colors
 * @param bgColor The hex background color
 */
export const buildSVG = (
  parts: { data: string, palette?: string[] }[], //COMPOSER LOCAL MOD
  paletteColors: string[],
  bgColor: string,
): string => {
  const svgWithoutEndTag = parts.reduce((result, part) => {
    const svgRects: string[] = [];
    const { bounds, rects } = decodeImage(part.data);
    
    const localPalette = (part.palette) ? (part.palette) :  null; //COMPOSER LOCAL MOD

    let currentX = bounds.left;
    let currentY = bounds.top;

    rects.forEach(draw => {
      let [drawLength, colorIndex] = draw;
      const hexColor = (localPalette) ? localPalette[colorIndex] : paletteColors[colorIndex]; //COMPOSER LOCAL MOD

      let length = getRectLength(currentX, drawLength, bounds.right);
      while (length > 0) {
        // Do not push rect if transparent
        if (colorIndex !== 0) {
          svgRects.push(
            `<rect width="${length * 10}" height="10" x="${currentX * 10}" y="${
              currentY * 10
            }" fill="#${hexColor}" />`,
          );
        }

        currentX += length;
        if (currentX === bounds.right) {
          currentX = bounds.left;
          currentY++;
        }

        drawLength -= length;
        length = getRectLength(currentX, drawLength, bounds.right);
      }
    });
    result += svgRects.join('');
    return result;
  }, `<svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#${bgColor}" />`);

  return `${svgWithoutEndTag}</svg>`;
};
