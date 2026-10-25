# Icon attribution

Except for `kettlebell.svg` (see below), the SVG artwork in [`../assets/icons/`](../assets/icons/) is from the solid style in **Font Awesome Free 6.7.2** by Fonticons, Inc. The icons are licensed under the [Creative Commons Attribution 4.0 International License (CC BY 4.0)](https://creativecommons.org/licenses/by/4.0/). Font Awesome's license and attribution terms are documented at <https://fontawesome.com/license/free>.

The bundled files are local copies from the versioned [`FortAwesome/Font-Awesome` 6.7.2 `svgs/solid` directory](https://github.com/FortAwesome/Font-Awesome/tree/6.7.2/svgs/solid). Each SVG retains its upstream source and license comment. No icon is downloaded at runtime.

`toothbrush.svg` uses the official `tooth.svg` artwork as a semantic alias: Font Awesome Free 6.7.2 does not include a toothbrush glyph. The configuration keeps the established `toothbrush` ID so existing calendars continue to validate. All other Font Awesome SVG files use the matching upstream icon ID.

When distributing a modified copy of the artwork, retain attribution and comply with CC BY 4.0. The Font Awesome name and logo are trademarks of Fonticons, Inc.

## Fitness symbols

`shoe-prints.svg` is the unmodified Font Awesome Free 6.7.2 solid icon, under the same CC BY 4.0 terms above. `leaf.svg` is the existing recovery symbol.

`kettlebell.svg` is an unmodified local copy from [Pictogrammers Material Design Icons](https://github.com/Templarian/MaterialDesign/blob/f08b713c8eef826e6bfe826c65240326546648ea/svg/kettlebell.svg), pinned to commit `f08b713c8eef826e6bfe826c65240326546648ea`. Copyright Pictogrammers / Material Design Icons contributors; licensed under Apache 2.0. The upstream collection license notice and full Apache 2.0 license are bundled in `assets/icons/LICENSE-material-design.txt` and `assets/icons/LICENSE-Apache-2.0.txt`. Its per-file manifest metadata overrides the Font Awesome defaults. No geometry was changed.
