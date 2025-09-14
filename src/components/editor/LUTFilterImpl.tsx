"use client";

import * as THREE from "three";
import { Canvas, useLoader, useThree, extend } from "@react-three/fiber";
import { EffectComposer, LUT, Vignette } from "@react-three/postprocessing";
import { LUTCubeLoader } from "postprocessing";
import { useEffect, useState } from "react";
import { shaderMaterial } from "@react-three/drei";

const AdjustMaterial = shaderMaterial(
  {
    uTexture: null as THREE.Texture | null,
    uBrightness: 1.0,
    uContrast: 1.0,
    uSaturation: 1.0,
    uHue: 0.0,

    uSharpness: 0.0,
    uStructure: 0.0,

    // Bilateral (spatial) radii in pixels
    uSharpSigmaS: 1.25,
    uStructSigmaS: 4.0,

    // Bilateral range sigmas in luma (0..1)
    uSharpSigmaR: 0.10,
    uStructSigmaR: 0.25,

    // Midtone weighting for Structure
    uMidtoneCenter: 0.50,
    uMidtoneWidth: 0.35,

    // Detail threshold to avoid noise
    uDetailThresh: 0.003,

    // 🎨 HSL band adjustments: [red, orange, yellow, green, blue, magenta]
    uHueAdjust: [0, 0, 0, 0, 0, 0],
    uSatAdjust: [0, 0, 0, 0, 0, 0],
    uLightAdjust: [0, 0, 0, 0, 0, 0],
  },
  // vertex shader
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
  // fragment shader
  `
  precision highp float;
  varying vec2 vUv;

  uniform sampler2D uTexture;
  uniform float uBrightness, uContrast, uSaturation, uHue;

  uniform float uSharpness, uStructure;
  uniform float uSharpSigmaS, uStructSigmaS;
  uniform float uSharpSigmaR, uStructSigmaR;
  uniform float uMidtoneCenter, uMidtoneWidth;
  uniform float uDetailThresh;

  uniform float uHueAdjust[6];
  uniform float uSatAdjust[6];
  uniform float uLightAdjust[6];

  const float TWO_PI = 6.28318530718;

  // Centers for [red, orange, yellow, green, blue, magenta] in radians
  const float hueCenters[6] = float[6](
    0.0,
    0.523599,  // 30°
    1.0472,    // 60°
    2.0944,    // 120°
    4.18879,   // 240°
    5.23599    // 300°
  );

  float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec3  clamp3(vec3 c){ return clamp(c, 0.0, 1.0); }

  // Global hue shift (YZC matrix trick)
  vec3 hueShift(vec3 color, float angle) {
    float cosA = cos(angle), sinA = sin(angle);
    mat3 m = mat3(
      0.299 + 0.701*cosA + 0.168*sinA,
      0.587 - 0.587*cosA + 0.330*sinA,
      0.114 - 0.114*cosA - 0.497*sinA,

      0.299 - 0.299*cosA - 0.328*sinA,
      0.587 + 0.413*cosA + 0.035*sinA,
      0.114 - 0.114*cosA + 0.292*sinA,

      0.299 - 0.300*cosA + 1.250*sinA,
      0.587 - 0.588*cosA - 1.050*sinA,
      0.114 + 0.886*cosA - 0.203*sinA
    );
    return m * color;
  }

  // RGB <-> HSL helpers
  float hue2rgb(float p, float q, float t){
    if(t < 0.0) t += 1.0;
    if(t > 1.0) t -= 1.0;
    if(t < 1.0/6.0) return p + (q - p) * 6.0 * t;
    if(t < 1.0/2.0) return q;
    if(t < 2.0/3.0) return p + (q - p) * (2.0/3.0 - t) * 6.0;
    return p;
  }

  vec3 hsl2rgb(vec3 hsl) {
    float h = hsl.x / TWO_PI;
    float s = clamp(hsl.y, 0.0, 1.0);
    float l = clamp(hsl.z, 0.0, 1.0);

    float r, g, b;

    if(s == 0.0){
      r = g = b = l; // achromatic
    } else {
      float q = l < 0.5 ? l * (1.0 + s) : l + s - l * s;
      float p = 2.0 * l - q;
      r = hue2rgb(p, q, h + 1.0/3.0);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1.0/3.0);
    }
    return vec3(r, g, b);
  }

  vec3 rgb2hsl(vec3 c) {
    float maxc = max(c.r, max(c.g, c.b));
    float minc = min(c.r, min(c.g, c.b));
    float h = 0.0;
    float s;
    float l = (maxc + minc) * 0.5;
    float d = maxc - minc;

    if (d < 1e-6) {
      h = 0.0;
      s = 0.0;
    } else {
      s = l > 0.5 ? d / (2.0 - maxc - minc) : d / (maxc + minc);
      if (maxc == c.r) {
        h = (c.g - c.b) / d + (c.g < c.b ? 6.0 : 0.0);
      } else if (maxc == c.g) {
        h = (c.b - c.r) / d + 2.0;
      } else {
        h = (c.r - c.g) / d + 4.0;
      }
      h /= 6.0;
    }
    return vec3(h * TWO_PI, s, l); // hue in radians
  }

  float hueDist(float h1, float h2) {
    float d = abs(h1 - h2);
    return min(d, TWO_PI - d);
  }

  // 13-tap edge-aware bilateral (returns RGB)
  vec3 bilateral13(vec2 uv, vec2 texel, float sigmaS, float sigmaR){
    float cY = luma(texture2D(uTexture, uv).rgb);
    float twoSigS2 = 2.0 * sigmaS * sigmaS;
    float twoSigR2 = 2.0 * sigmaR * sigmaR;

    vec3 acc = vec3(0.0);
    float wsum = 0.0;

    vec2 off[13];
    off[0]=vec2(0.0,0.0);
    off[1]=vec2( 1.0, 0.0); off[2]=vec2(-1.0, 0.0);
    off[3]=vec2( 0.0, 1.0); off[4]=vec2( 0.0,-1.0);
    off[5]=vec2( 2.0, 0.0); off[6]=vec2(-2.0, 0.0);
    off[7]=vec2( 0.0, 2.0); off[8]=vec2( 0.0,-2.0);
    off[9]=vec2( 1.0, 1.0); off[10]=vec2(-1.0, 1.0);
    off[11]=vec2( 1.0,-1.0); off[12]=vec2(-1.0,-1.0);

    for(int i=0;i<13;i++){
      vec2 dpx = off[i] * texel;
      float d2 = dot(off[i], off[i]); // in px^2
      vec3 s = texture2D(uTexture, uv + dpx * sigmaS).rgb;
      float y = luma(s);

      float ws = exp(-d2 / twoSigS2);                 // spatial
      float wr = exp(-((y - cY)*(y - cY)) / twoSigR2); // range (luma)
      float w = ws * wr;

      acc += s * w;
      wsum += w;
    }
    return acc / max(wsum, 1e-6);
  }

  // Midtone weight for "clarity/structure"
  float midtoneWeight(float Y, float c, float w){
    float z = (Y - c) / max(w, 1e-6);
    return exp(-0.5 * z*z);
  }

  // Soft-threshold to avoid amplifying tiny noise
  float softThresh(float x, float t){
    float ax = abs(x);
    if (ax <= t) return 0.0;
    return (ax - t) * sign(x);
  }

  void main() {
    vec2 texSize = vec2(textureSize(uTexture, 0));
    vec2 texel = 1.0 / texSize;

    vec3 src = texture2D(uTexture, vUv).rgb;

    // Base color adjustments (global)
    vec3 col = src * uBrightness;
    col = (col - 0.5) * uContrast + 0.5;
    float Y = luma(col);
    col = mix(vec3(Y), col, uSaturation);
    col = hueShift(col, uHue);

    // 🎨 HSL per-band adjustments
    vec3 hsl = rgb2hsl(col);

    for(int i = 0; i < 6; i++){
      float d = hueDist(hsl.x, hueCenters[i]);
      float sigma = 15.0/360.0 * TWO_PI; // 15° falloff
      float w = exp(-0.5 * (d/sigma) * (d/sigma));

      hsl.x += uHueAdjust[i] * w;
      hsl.y += uSatAdjust[i] * w;
      hsl.z += uLightAdjust[i] * w;
    }

    // wrap hue and clamp S/L
    if (hsl.x < 0.0) hsl.x += TWO_PI;
    if (hsl.x >= TWO_PI) hsl.x -= TWO_PI;
    hsl.y = clamp(hsl.y, 0.0, 1.0);
    hsl.z = clamp(hsl.z, 0.0, 1.0);

    col = hsl2rgb(hsl);

    // Edge-preserving bases for detail controls
    vec3 baseSharp   = bilateral13(vUv, texel, uSharpSigmaS,  uSharpSigmaR);
    vec3 baseStruct  = bilateral13(vUv, texel, uStructSigmaS, uStructSigmaR);

    float Ysrc   = luma(src);
    float Ysharp = luma(baseSharp);
    float Ystr   = luma(baseStruct);

    float dFine = Ysrc - Ysharp; // micro detail
    float dMid  = Ysrc - Ystr;   // local contrast

    dFine = softThresh(dFine, uDetailThresh);
    dMid  = softThresh(dMid,  uDetailThresh) * midtoneWeight(Ysrc, uMidtoneCenter, uMidtoneWidth);

    float Yout = Y + uSharpness * dFine + uStructure * dMid;

    // Color-preserving recomposition by luma gain
    float gain = (Y > 1e-6) ? (Yout / Y) : 1.0;
    vec3 outRGB = clamp3(col * gain);

    gl_FragColor = vec4(outRGB, 1.0);
  }
  `
);

extend({ AdjustMaterial });

declare module "@react-three/fiber" {
  interface ThreeElements {
    adjustMaterial: {
      uTexture?: THREE.Texture | null;
      uBrightness?: number;
      uContrast?: number;
      uSaturation?: number;
      uHue?: number;
      uSharpness?: number;
      uStructure?: number;
      uHueAdjust?: number[];
      uSatAdjust?: number[];
      uLightAdjust?: number[];
      attach?: string;
      key?: string | number;
    };
  }
};

/* 🔑 Helper to scale image correctly */
function FittedPlane({
  texture,
  brightness,
  contrast,
  saturation,
  hue,
  sharpness,
  structure,

  red_hue,
  red_saturation,
  red_lightness,
  orange_hue,
  orange_saturation,
  orange_lightness,
  yellow_hue,
  yellow_saturation,
  yellow_lightness,
  green_hue,
  green_saturation,
  green_lightness,
  blue_hue,
  blue_saturation,
  blue_lightness,
  magenta_hue,
  magenta_saturation,
  magenta_lightness,

  fit = "contain", // default behavior
}: {

  texture: THREE.Texture;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sharpness: number;
  structure: number;

  red_hue: number;
  red_saturation: number;
  red_lightness: number;
  orange_hue: number;
  orange_saturation: number;
  orange_lightness: number;
  yellow_hue: number;
  yellow_saturation: number;
  yellow_lightness: number;
  green_hue: number;
  green_saturation: number;
  green_lightness: number;
  blue_hue: number;
  blue_saturation: number;
  blue_lightness: number;
  magenta_hue: number;
  magenta_saturation: number;
  magenta_lightness: number;

  fit?: "cover" | "contain";
}) {
  const { viewport } = useThree();
  const aspect = texture.image
    ? texture.image.width / texture.image.height
    : 1;

  const viewportAspect = viewport.width / viewport.height;
  let planeWidth: number;
  let planeHeight: number;

  if (fit === "contain") {
    // ⬅️ Old logic: image always fully visible (letterboxing/pillarboxing)
    if (aspect > viewportAspect) {
      planeWidth = viewport.width;
      planeHeight = viewport.width / aspect;
    } else {
      planeHeight = viewport.height;
      planeWidth = viewport.height * aspect;
    }
  } else {
    // ⬅️ Cover: fill viewport, crop overflow
    if (aspect > viewportAspect) {
      planeHeight = viewport.height;
      planeWidth = viewport.height * aspect;
    } else {
      planeWidth = viewport.width;
      planeHeight = viewport.width / aspect;
    }
  }

  return (
    <mesh>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <adjustMaterial
        uTexture={texture}
        uBrightness={brightness / 100}
        uContrast={contrast / 100}
        uSaturation={saturation / 100}
        uHue={(hue * Math.PI) / 180.0}
        uSharpness={sharpness}
        uStructure={structure}
        uHueAdjust={[red_hue, orange_hue, yellow_hue, green_hue, blue_hue, magenta_hue]}
        uSatAdjust={[red_saturation, orange_saturation, yellow_saturation, green_saturation, blue_saturation, magenta_saturation]}
        uLightAdjust={[red_lightness, orange_lightness, yellow_lightness, green_lightness, blue_lightness, magenta_lightness]}
      />
    </mesh>
  );
};

import { ImagePreviewProps } from "@/components/editor/ImagePreview";

export default function LUTFilterImpl({
  image,
  imageProperties,
  fit,
  canvasRef
}: ImagePreviewProps) {

  const texture = useLoader(THREE.TextureLoader, image);
  texture.colorSpace = THREE.SRGBColorSpace;

  const [cubeLUT, setCubeLUT] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (imageProperties.lut) {
      const loader = new LUTCubeLoader();
      loader.load(imageProperties.lut, (result: THREE.Texture) => {
        setCubeLUT(result);
      });
    } else {
      setCubeLUT(null);
    }
  }, [imageProperties.lut]);

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 5], zoom: 100 }}
      style={{ width: "100%", height: "100%" }}
      onCreated={(state) => {
        if (!canvasRef) return;
        canvasRef.current = state;
      }}
    >
      <FittedPlane

        texture={texture}
        brightness={imageProperties.brightness}
        contrast={imageProperties.contrast}
        saturation={imageProperties.saturation}
        hue={imageProperties.hue}
        sharpness={imageProperties.sharpness}
        structure={imageProperties.structure}

        red_hue={imageProperties.red_hue}
        red_saturation={imageProperties.red_saturation}
        red_lightness={imageProperties.red_lightness}
        orange_hue={imageProperties.orange_hue}
        orange_saturation={imageProperties.orange_saturation}
        orange_lightness={imageProperties.orange_lightness}
        yellow_hue={imageProperties.yellow_hue}
        yellow_saturation={imageProperties.yellow_saturation}
        yellow_lightness={imageProperties.yellow_lightness}
        green_hue={imageProperties.green_hue}
        green_saturation={imageProperties.green_saturation}
        green_lightness={imageProperties.green_lightness}
        blue_hue={imageProperties.blue_hue}
        blue_saturation={imageProperties.blue_saturation}
        blue_lightness={imageProperties.blue_lightness}
        magenta_hue={imageProperties.magenta_hue}
        magenta_saturation={imageProperties.magenta_saturation}
        magenta_lightness={imageProperties.magenta_lightness}

        fit={fit}
      />
      <EffectComposer>
        {cubeLUT ? <LUT lut={cubeLUT} /> : <></>}
        <Vignette
          eskil={false}
          offset={imageProperties.vignette_sharpness}
          darkness={imageProperties.vignette_size}
        />
      </EffectComposer>

    </Canvas>
  );
}
