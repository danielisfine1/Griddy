"use client";

import * as THREE from "three";
import { Canvas, useLoader, useThree, extend } from "@react-three/fiber";
import { EffectComposer, LUT, Vignette } from "@react-three/postprocessing";
import { LUTCubeLoader } from "postprocessing";
import { useEffect, useState } from "react";
import { shaderMaterial } from "@react-three/drei";

import { RootState } from "@react-three/fiber";

const AdjustMaterial = shaderMaterial(
  {
    uTexture: null as THREE.Texture | null,
    uBrightness: 1.0,
    uContrast: 1.0,
    uSaturation: 1.0,
    uHue: 0.0,

    uSharpness: 0.0,          // 0..1
    uStructure: 0.0,          // 0..1

    // Bilateral (spatial) radii in pixels
    uSharpSigmaS: 1.25,       // small radius ~ “Sharpen”
    uStructSigmaS: 4.0,       // larger radius ~ “Structure”

    // Bilateral range sigmas in luma (0..1)
    uSharpSigmaR: 0.10,
    uStructSigmaR: 0.25,

    // Midtone weighting for Structure
    uMidtoneCenter: 0.50,
    uMidtoneWidth: 0.35,

    // Detail threshold to avoid noise
    uDetailThresh: 0.003,
  },
  `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
  `,
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

  float luma(vec3 c){ return dot(c, vec3(0.299, 0.587, 0.114)); }
  vec3  clamp3(vec3 c){ return clamp(c, 0.0, 1.0); }

  vec3 hueShift(vec3 color, float angle) {
    float cosA = cos(angle), sinA = sin(angle);
    mat3 m = mat3(
      0.299 + 0.701*cosA + 0.168*sinA,
      0.587 - 0.587*cosA + 0.330*sinA,
      0.114 - 0.114*cosA - 0.497*sinA,

      0.299 - 0.299*cosA - 0.328*sinA,
      0.587 + 0.413*cosA + 0.035*sinA,
      0.114 - 0.114*cosA + 0.292*sinA,

      0.299 - 0.3*cosA + 1.25*sinA,
      0.587 - 0.588*cosA - 1.05*sinA,
      0.114 + 0.886*cosA - 0.203*sinA
    );
    return m * color;
  }

  // 13-tap bilateral around uv (edge-aware)
  vec3 bilateral13(vec2 uv, vec2 texel, float sigmaS, float sigmaR){
    float cY = luma(texture2D(uTexture, uv).rgb);
    float twoSigS2 = 2.0 * sigmaS * sigmaS;
    float twoSigR2 = 2.0 * sigmaR * sigmaR;

    vec3 acc = vec3(0.0);
    float wsum = 0.0;

    // sample pattern (dx,dy) in pixels
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

      float ws = exp(-d2 / twoSigS2);          // spatial
      float wr = exp(-( (y - cY)*(y - cY) ) / twoSigR2); // range (luma)
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

    // Base color adjustments
    vec3 col = src * uBrightness;
    col = (col - 0.5) * uContrast + 0.5;
    float Y = luma(col);
    col = mix(vec3(Y), col, uSaturation);
    col = hueShift(col, uHue);

    // Edge-preserving bases
    vec3 baseSharp   = bilateral13(vUv, texel, uSharpSigmaS,  uSharpSigmaR);
    vec3 baseStruct  = bilateral13(vUv, texel, uStructSigmaS, uStructSigmaR);

    float Ysrc   = luma(src);
    float Ysharp = luma(baseSharp);
    float Ystr   = luma(baseStruct);

    // Detail layers in luma
    float dFine = Ysrc - Ysharp;   // micro detail
    float dMid  = Ysrc - Ystr;     // local contrast

    // Threshold + midtone bias
    dFine = softThresh(dFine, uDetailThresh);
    dMid  = softThresh(dMid,  uDetailThresh) * midtoneWeight(Ysrc, uMidtoneCenter, uMidtoneWidth);

    // Apply amounts
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
      attach?: string;
      key?: string | number;
    };
  }
}

/* 🔑 Helper to scale image correctly */
function FittedPlane({ texture, brightness, contrast, saturation, hue, sharpness, structure }: {
  texture: THREE.Texture;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  sharpness: number;
  structure: number;
}) {
  const { viewport } = useThree();
  const aspect = texture.image
    ? texture.image.width / texture.image.height
    : 1;

  /* Fit plane into viewport */
  const planeWidth = aspect > 1 ? viewport.width : viewport.height * aspect;
  const planeHeight = aspect > 1 ? viewport.width / aspect : viewport.height;

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
      />
    </mesh>
  );
}

export default function LUTFilterImpl({
  image,
  lut,
  brightness,
  contrast,
  saturation,
  hue,
  vignette_size,
  vignette_sharpness,
  sharpness,
  structure,
  canvasRef
}: {
  image: string;
  brightness: number;
  contrast: number;
  saturation: number;
  hue: number;
  vignette_size: number;
  vignette_sharpness: number;
  sharpness: number;
  structure: number;
  lut: string | null;
  canvasRef: React.RefObject<RootState>;
}) {

  const texture = useLoader(THREE.TextureLoader, image);
  texture.colorSpace = THREE.SRGBColorSpace;

  const [cubeLUT, setCubeLUT] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (lut) {
      const loader = new LUTCubeLoader();
      loader.load(lut, (result: THREE.Texture) => {
        setCubeLUT(result);
      });
    } else {
      setCubeLUT(null);
    }
  }, [lut]);

  return (
    <Canvas
      orthographic
      camera={{ position: [0, 0, 5], zoom: 100 }}
      style={{ width: "100%", height: "100%" }}
      onCreated={(state) => {
        canvasRef.current = state;
      }}
    >
      <FittedPlane
        texture={texture}
        brightness={brightness}
        contrast={contrast}
        saturation={saturation}
        hue={hue}
        sharpness={sharpness}
        structure={structure}
      />
      <EffectComposer>
        {cubeLUT ? <LUT lut={cubeLUT} /> : <></>}
        <Vignette
          eskil={false}
          offset={vignette_sharpness}
          darkness={vignette_size}
        />
      </EffectComposer>

    </Canvas>
  );
}
