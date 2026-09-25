# Adventure map lettering

`ui-hand-yozai.woff2` is a local web subset of **Yozai Light v0.868** by lxgw, renamed internally to **Trip Map Hand** for this modified version. The light handwritten strokes are used for map labels and the Adventure Map UI.

- Source: https://github.com/lxgw/yozai-font/releases/tag/v0.868 (`Yozai-Light.ttf`).
- License: SIL Open Font License 1.1; see `Yozai-OFL.txt`. The original font reserves the names “Yozai” and “悠哉”; the subset uses a different internal family name.
- Coverage: 706 source characters collected from the Adventure Map modules, trip data, and confirmed accommodation data. Other characters fall back to the platform's Kai typeface.
- The font is used throughout the Adventure Map UI; dense information uses larger sizes and line spacing for legibility.

The WOFF2 is about 165 KB and is bundled through Vite, so the page does not request a font service at runtime. It was subset from the upstream TTF with FontTools.
