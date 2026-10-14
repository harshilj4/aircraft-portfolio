# Asset credits

## Current aircraft

[FlightGear CRJ700-family](https://github.com/FGMEMBERS-NONGPL/CRJ700-family), initially by **Ryan “Skyop” Miller**, with D-JSB, Daniel M and the contributors listed in the bundled README. Exterior AC3D models and blank/engine textures are **CC BY 4.0 or later**, as stated in the bundled LICENSE. [License](https://creativecommons.org/licenses/by/4.0/).

Modifications: removed simulator interior, landing gear and unrelated objects; triangulated, smoothed and combined the flight exterior and engines into five material batches; converted to GLB; added a black/gold livery shader and flight animation. The 2,056,840-byte GLB has 12,917 triangles. The active model is `crj700-cruise.glb`; flap/spoiler overlay surfaces are grouped with the wing-detail batch for consistent depth bias. Sources, converter, original README and license accompany it in `public/models/crj700/`. This is an adapted aircraft asset, not an original aircraft model by the portfolio owner.

## Cabin and environments

Poly Haven assets, [CC0](https://polyhaven.com/license):

- [Kloofendal 48d Partly Cloudy (Pure Sky)](https://polyhaven.com/a/kloofendal_48d_partly_cloudy_puresky), Greg Zaal and Jarod Guest — local 1K HDR, 1,435,119 bytes.
- [Qwantani Sunset (Pure Sky)](https://polyhaven.com/a/qwantani_sunset_puresky) — local 1K HDR, 1,061,624 bytes.
- [Modern Arm Chair 01](https://polyhaven.com/a/modern_arm_chair_01) — simplified to geometry and two diffuse maps, packed into a 932,944-byte GLB with 8,916 triangles. Normal and ARM maps omitted.
- [American Walnut Veneer](https://polyhaven.com/a/american_walnut_veneer) — local diffuse texture, 579,182 bytes.

Assets are local. The cabin bundle and its textures/chair load on boarding. The selected exterior sky loads on demand; midnight uses the morning environment for subtle reflections against a black background.

## Retained earlier asset

The earlier Citation X asset is retained in `public/models/citation-x/` with source, converter, original README and GPL-2.0-or-later license. It is not loaded by the current application. Originally modeled by Syd Adams for FlightGear, from [SurferTim/CitationX](https://github.com/SurferTim/CitationX).

The sunset cloud opacity map is extracted from the credited Kloofendal sky photograph, downsampled to 1024 × 512 (338,893 bytes), and recoloured by the atmospheric shader. It adds one texture sample to the existing sunset background draw; no volumetric clouds. The tail HJ / Jadawala marking is generated locally as a small canvas texture, with both sides instanced into one draw call.



