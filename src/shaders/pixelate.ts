// src/shaders/pixelate.ts

export const pixelateVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

export const pixelateFragmentShader = `
uniform sampler2D tDiffuse;
uniform float pixelSize;
uniform vec2 resolution;
uniform float colorDepth;

varying vec2 vUv;

void main() {
  // 像素化
  vec2 pixelUv = floor(vUv * resolution / pixelSize) * pixelSize / resolution;

  // 采样
  vec4 color = texture2D(tDiffuse, pixelUv);

  // 色带减少 (posterization)
  color.rgb = floor(color.rgb * colorDepth) / colorDepth;

  gl_FragColor = color;
}
`;
