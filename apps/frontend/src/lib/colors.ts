// src/lib/colors.ts

/**
 * Converts an HSL color value to HEX. Conversion formula
 * adapted from https://www.30secondsofcode.org/js/s/hsl-to-rgb
 * and https://www.30secondsofcode.org/js/s/rgb-to-hex.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 255].
 *
 * @param   {number}  h       The hue
 * @param   {number}  s       The saturation
 * @param   {number}  l       The lightness
 * @return  {string}          The HEX representation
 */
export function hslToHex(h: number, s: number, l: number): string {
  s /= 100
  l /= 100
  const k = (n: number) => (n + h / 30) % 12
  const a = s * Math.min(l, 1 - l)
  const f = (n: number) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, 9 - k(n), 1))
  const toHex = (c: number) => {
    return Math.round(c * 255)
      .toString(16)
      .padStart(2, "0")
  }
  const r = toHex(f(0))
  const g = toHex(f(8))
  const b = toHex(f(4))
  return `#${r}${g}${b}`
}

/**
 * Converts a HEX color value to HSL. Conversion formula
 * adapted from https://www.30secondsofcode.org/js/s/hex-to-rgb
 * and https://www.30secondsofcode.org/js/s/rgb-to-hsl.
 * Assumes hex is a valid color string and returns h, s, and l
 * in the set [0, 1].
 *
 * @param   {string}  hex     The hex color
 * @return  {number[]}        The HSL representation
 */
export function hexToHsl(hex: string): number[] {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) {
        throw new Error("Invalid HEX color.");
    }

    let r = parseInt(result[1], 16);
    let g = parseInt(result[2], 16);
    let b = parseInt(result[3], 16);

    r /= 255;
    g /= 255;
    b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h = 0, s = 0, l = (max + min) / 2;

    if (max == min){
        h = s = 0; // achromatic
    } else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }

    return [h * 360, s * 100, l * 100];
}
