# Profile image tools

These two scripts generate everything in `../assets` and the profile `../README.md`.

## Change the wording, projects or links

Edit the `ME` block at the top of `build.mjs`, then run:

```bash
node tools/build.mjs
```

Commit and push the changed `README.md` and `assets/`.

## Change the picture

Needs Python with Pillow and fontTools.

```bash
python tools/prep.py path/to/picture.jpg
```

```bash
node tools/build.mjs
```

A square picture works best. To use only part of a picture, add a crop as fractions of its width and height
(`x0,y0,x1,y1`). The current banner was made with `0.16,0.02,0.84,0.70`.

`prep.py` writes `prep.json` (the picture as a brightness grid, and the name as outlines). `build.mjs` reads it,
so the build itself needs only Node.

## The activity line

The last section of the terminal block (contributions in the last year, with one bar per week) is refreshed by
`.github/workflows/profile-activity.yml`. Once a day it runs `activity.mjs`, which writes `activity.json`, then
`build.mjs`, and commits only if the numbers changed. Run it by hand from the Actions tab, or locally:

```bash
GITHUB_TOKEN=$(gh auth token) node tools/activity.mjs
```

The numbers are the ones visitors see on the contribution graph. Delete `activity.json` and the workflow to remove
the section.

## Notes

- The name is drawn from Consolas Bold outlines (`C:/Windows/Fonts/consolab.ttf`). Pass `--font other.ttf` to `prep.py`
  on a machine without it.
- The `<picture>` elements in the README sit inside links on purpose. Without the outer link GitHub wraps the image in
  its own link and phones stop getting the phone-sized images.
