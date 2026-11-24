# Native Android Clock background catalog

This maps the 88 source definitions in the canonical [background registry](../../components/backgrounds/backgroundRegistry.ts). All 84 enabled entries are in the Compose Clock picker with their approved names and stable IDs. The Android build derives the picker labels, guest-access decisions and supported default styles from that registry. The four disabled drafts remain excluded from the picker.

The existing packaged Backgrounds panel retains the canonical effect modules in the table. Render these modules through the existing Java host's verified access path. The Compose Clock renders the three free entries with native drawing primitives. Premium entries are locked in Compose Clock until [#93](https://github.com/dsbowersock/atmoshaper/issues/93) provides a native verified authority. A saved premium selection remains visible in the picker and the Clock uses a neutral surface. **Open previous background tools** opens the existing packaged Clock Backgrounds panel, where the existing access path applies.

The procedural effects use CSS/SVG, Canvas 2D or WebGL depending on the module. For example, `css-backgrounds · SolidColorBackground` is static CSS, `css-backgrounds · MassageLabMovingGradientBackground` uses animated Canvas 2D, `massage-lab-dot-grid-background` is pointer-reactive Canvas 2D, and `massage-lab-liquid-chrome-background` uses a WebGL shader. Pale Blue Dot uses both procedural rendering and bundled image textures. Its local `earth-blue-marble.jpg` and `earth-topology.png` are copied with checksum verification and the map mask is embedded. The registry's merchandising preview images and videos are not packaged. They do not supply live effects, and the native picker uses text labels without remote thumbnails. No additional missing renderer media was identified in the enabled effect sources.

Clock's read-only import keeps the original WebView record intact and copies only a bounded appearance projection. For the free radial gradient this includes its palette, stops, center, shape and extent. Premium-specific properties remain in the original store for the existing tools and the follow-on migration. Upgrading an earlier native Clock that projected an unsupported choice to neutral can recover the saved preference while preserving newer native time and text settings.

## Catalog map

The renderer column names the source module under `components/backgrounds/effects` and, where the module has multiple exports, the registry's selected export. A row marked **Previous Tools** uses the packaged renderer and remains access-gated. Draft rows have no supported selection or asset availability claim.

| Stable ID | Display name | Surface | Packaged renderer source |
| --- | --- | --- | --- |
| `massage-lab-moving-gradient` | Lava Lamp | Native animated gradient | `css-backgrounds · MassageLabMovingGradientBackground` |
| `static-gradient` | In Transition | Native linear/radial gradient | `css-backgrounds · StaticGradientBackground` |
| `solid-color` | Solid Color | Native solid color | `css-backgrounds · SolidColorBackground` |
| `massage-lab-particles-draft` | Particles | Disabled draft | `css-backgrounds · MassageLabParticlesDraftBackground` |
| `massage-lab-noise-texture-draft` | Noise texture | Disabled draft | `css-backgrounds · MassageLabNoiseTextureDraftBackground` |
| `massage-lab-grid-pattern-draft` | Grid pattern | Disabled draft | `css-backgrounds · MassageLabGridPatternDraftBackground` |
| `massage-lab-animated-grid-draft` | Animated grid | Disabled draft | `css-backgrounds · MassageLabAnimatedGridDraftBackground` |
| `massage-lab-retro-grid` | Endless Perspective | Previous Tools | `massage-lab-retro-grid-background` |
| `massage-lab-aerial-rays` | Skybreak | Previous Tools | `massage-lab-aerial-rays-background` |
| `massage-lab-dna` | DNA | Previous Tools | `massage-lab-dna-background · MassageLabDnaBackground` |
| `massage-lab-twisted-cubes` | Hypercube | Previous Tools | `massage-lab-twisted-cubes-background · MassageLabTwistedCubesBackground` |
| `massage-lab-wave-current` | Tidal Glass | Previous Tools | `massage-lab-wave-current-background` |
| `massage-lab-electric-mist` | Electric Glow | Previous Tools | `massage-lab-electric-mist-background` |
| `massage-lab-astral-flow` | Celestial Breath | Previous Tools | `massage-lab-astral-flow-background` |
| `massage-lab-deep-space-nebula` | Clouded Cosmos | Previous Tools | `massage-lab-deep-space-nebula-background` |
| `massage-lab-grid-bloom` | Connective Pulse | Previous Tools | `massage-lab-grid-bloom-background` |
| `massage-lab-chrome-flow` | Reflective Currents | Previous Tools | `massage-lab-chrome-flow-background` |
| `massage-lab-light-speed` | Starlight | Previous Tools | `massage-lab-light-speed-background` |
| `massage-lab-ferrofluid` | Fluid Filament | Previous Tools | `massage-lab-ferrofluid-background` |
| `massage-lab-lightfall` | Lightfall | Previous Tools | `massage-lab-lightfall-background` |
| `massage-lab-liquid-ether` | Fluid Infusion | Previous Tools | `massage-lab-liquid-ether-background` |
| `massage-lab-prism` | Prismatic | Previous Tools | `massage-lab-prism-background` |
| `massage-lab-dark-veil` | Shadows | Previous Tools | `massage-lab-dark-veil-background` |
| `massage-lab-light-pillar` | Monolight | Previous Tools | `massage-lab-light-pillar-background` |
| `massage-lab-silk` | Silk | Previous Tools | `massage-lab-silk-background` |
| `massage-lab-floating-lines` | Arc Currant | Previous Tools | `massage-lab-floating-lines-background` |
| `massage-lab-side-rays` | Lateral Rays | Previous Tools | `massage-lab-side-rays-background` |
| `massage-lab-light-rays` | Cascading Rays | Previous Tools | `massage-lab-light-rays-background` |
| `massage-lab-pixel-blast` | Nomad | Previous Tools | `massage-lab-pixel-blast-background` |
| `massage-lab-color-bends` | Prismatic Ribbons | Previous Tools | `massage-lab-color-bends-background` |
| `massage-lab-evil-eye` | Ember Iris | Previous Tools | `massage-lab-evil-eye-background` |
| `massage-lab-line-waves` | Filament Waves | Previous Tools | `massage-lab-line-waves-background` |
| `massage-lab-radar` | Deep Search | Previous Tools | `massage-lab-radar-background` |
| `massage-lab-soft-aurora` | Polar Aurora | Previous Tools | `massage-lab-soft-aurora-background` |
| `massage-lab-plasma` | Charged Foam | Previous Tools | `massage-lab-plasma-background` |
| `massage-lab-plasma-wave` | Folded Plasma | Previous Tools | `massage-lab-plasma-wave-background` |
| `massage-lab-particles` | Particle Drift | Previous Tools | `massage-lab-particles-background` |
| `massage-lab-gradient-blinds` | Slats | Previous Tools | `massage-lab-gradient-blinds-background` |
| `massage-lab-grainient` | Velvet Grain | Previous Tools | `massage-lab-grainient-background` |
| `massage-lab-grid-scan` | Neon Survey | Previous Tools | `massage-lab-grid-scan-background` |
| `massage-lab-synthesis` | Emulsion | Previous Tools | `massage-lab-synthesis-background` |
| `massage-lab-beams` | Rising Monoliths | Previous Tools | `massage-lab-beams-background` |
| `massage-lab-pixel-snow` | Snowglobe | Previous Tools | `massage-lab-pixel-snow-background` |
| `massage-lab-lightning` | Electric Storm | Previous Tools | `massage-lab-lightning-background` |
| `massage-lab-prismatic-burst` | Kaleidoscope Rays | Previous Tools | `massage-lab-prismatic-burst-background` |
| `massage-lab-galaxy` | Constellations | Previous Tools | `massage-lab-galaxy-background` |
| `massage-lab-dither` | Dithered Smoke | Previous Tools | `massage-lab-dither-background` |
| `massage-lab-faulty-terminal` | Scanline | Previous Tools | `massage-lab-faulty-terminal-background` |
| `massage-lab-ripple-grid` | Ripple Grid | Previous Tools | `massage-lab-ripple-grid-background` |
| `massage-lab-dot-field` | Dot Field | Previous Tools | `massage-lab-dot-field-background` |
| `massage-lab-dot-grid` | Pegboard | Previous Tools | `massage-lab-dot-grid-background` |
| `massage-lab-threads` | Threads | Previous Tools | `massage-lab-threads-background` |
| `massage-lab-iridescence` | Soapfilm | Previous Tools | `massage-lab-iridescence-background` |
| `massage-lab-waves` | Currents | Previous Tools | `massage-lab-waves-background` |
| `massage-lab-grid-distortion` | Mosaic Warp | Previous Tools | `massage-lab-grid-distortion-background` |
| `massage-lab-orb` | Halo | Previous Tools | `massage-lab-orb-background` |
| `massage-lab-letter-glitch` | Code Confetti | Previous Tools | `massage-lab-letter-glitch-background` |
| `massage-lab-grid-motion` | Mantra Drift | Previous Tools | `massage-lab-grid-motion-background` |
| `massage-lab-shape-grid` | Geometric Current | Previous Tools | `massage-lab-shape-grid-background` |
| `massage-lab-liquid-chrome` | Molten Mirror | Previous Tools | `massage-lab-liquid-chrome-background` |
| `massage-lab-balatro` | Chromatic Swirl | Previous Tools | `massage-lab-balatro-background` |
| `massage-lab-novatrix` | Drift | Previous Tools | `massage-lab-novatrix-background` |
| `massage-lab-matrix-rain` | Encrypted | Previous Tools | `massage-lab-matrix-rain-background` |
| `massage-lab-photon-beam` | Convergence | Previous Tools | `massage-lab-photon-beam-background` |
| `massage-lab-aurora` | Interstellar | Previous Tools | `css-backgrounds · MassageLabAuroraBackground` |
| `massage-lab-dotted-glow` | Shimmer | Previous Tools | `css-backgrounds · MassageLabDottedGlowBackground` |
| `massage-lab-sparkles` | Fireflies | Previous Tools | `massage-lab-sparkles` |
| `massage-lab-gradient-animation` | Color Drift | Previous Tools | `css-backgrounds · MassageLabGradientAnimationBackground` |
| `massage-lab-background-beams` | Roaming Sweep | Previous Tools | `css-backgrounds · MassageLabBackgroundBeams` |
| `massage-lab-collision-beams` | Firework Dust | Previous Tools | `css-backgrounds · MassageLabBackgroundBeamsWithCollision` |
| `massage-lab-background-lines` | Signal Comets | Previous Tools | `css-backgrounds · MassageLabBackgroundLines` |
| `massage-lab-glowing-stars` | Star Lattice | Previous Tools | `css-backgrounds · MassageLabGlowingStarsBackground` |
| `massage-lab-meteors` | Falling Sky | Previous Tools | `css-backgrounds · MassageLabMeteorsBackground` |
| `massage-lab-shooting-stars` | Wish | Previous Tools | `massage-lab-shooting-stars-background` |
| `massage-lab-reveal-dots` | Speckled Veil | Previous Tools | `css-backgrounds · MassageLabCanvasRevealDotsBackground` |
| `massage-lab-3d-globe` | Pale Blue Dot | Previous Tools | `massage-lab-3d-globe-background` |
| `massage-lab-spotlight` | Spotlight | Previous Tools | `css-backgrounds · MassageLabSpotlightNewBackground` |
| `massage-lab-lamp-effect` | Lamp Glow | Previous Tools | `css-backgrounds · MassageLabLampEffectBackground` |
| `massage-lab-wavy-background` | Ribbons | Previous Tools | `massage-lab-wavy-background` |
| `massage-lab-vortex` | Orbits | Previous Tools | `massage-lab-vortex-background` |
| `massage-lab-pixel-liquid` | Simulation | Previous Tools | `massage-lab-pixel-liquid-background` |
| `massage-lab-tile-grid` | Tile grid | Previous Tools | `massage-lab-tile-grid-background` |
| `massage-lab-hex-grid` | Hex grid | Previous Tools | `massage-lab-hex-grid-background` |
| `massage-lab-aurora-bars` | Equalizer | Previous Tools | `massage-lab-aurora-bars-background` |
| `massage-lab-bubble` | Bubbles | Previous Tools | `css-backgrounds · MassageLabBubbleBackground` |
| `massage-lab-gradient` | Colorfield Drift | Previous Tools | `css-backgrounds · MassageLabGradientBackground` |
| `massage-lab-stars` | Drifting Starfield | Previous Tools | `css-backgrounds · MassageLabStarsBackground` |
| `massage-lab-hole` | Descent | Previous Tools | `css-backgrounds · MassageLabHoleBackground` |
