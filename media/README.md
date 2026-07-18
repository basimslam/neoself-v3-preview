# media/

Drop finished images here. They replace the generated placeholders immediately —
no code change, no restart.

Prompts for every slot: [`../docs/media-brief.md`](../docs/media-brief.md)

## Slots the site requests

| File | Size | Budget | Notes |
|---|---|---|---|
| `hero.jpg` | 1600 × 900 | **180KB** | LCP element. Lower-left third empty. |
| `hero-mobile.jpg` | 900 × 1600 | **150KB** | Portrait recompose, not a crop. Same man. |
| `clean.jpg` | 1200 × 1500 | 100KB | |
| `repair.jpg` | 1200 × 1500 | 100KB | |
| `defend.jpg` | 1200 × 1500 | 100KB | |
| `system.jpg` | 1200 × 1500 | 100KB | |
| `repair-scale.jpg` | 1200 × 1500 | 100KB | In-scale. Required, not optional. |
| `repair-dropper.jpg` | 1200 × 1500 | 100KB | |
| `defend-cast.jpg` | 1200 × 1500 | 100KB | Four tones. Do not retouch the cast out. |

Also referenced in `dev/mock/products.json`, not yet rendered by a template:
`clean-scale.jpg`, `clean-texture.jpg`, `defend-scale.jpg`, `system-scale.jpg`.

## Three things that will bite you

**The `.jpg` extension is just what the template asks for.** The server sends
whatever bytes are in the file, so a WebP or AVIF named `repair.jpg` works and is
what you want. Export AVIF or WebP; JPEG wastes 30–40% at the same quality.

**Check the weight after export.** An AVIF at default quality is often 400KB —
well over budget, on the LCP element, on a three-year-old Redmi over 4G.

**Check the ground is cold.** Sample the background: it should read `#f1f3f4`.
Image models default to warm cream for "skincare" and a warm image on this cool
page looks broken in a way that's hard to name. Regenerate rather than
colour-correct — corrected warmth reads muddy.

## Branding

Generate blank, composite the wordmark after. Models cannot render text and will
give you different garbage in every image, which defeats the consistency you're
after. Full method in the media brief, §"Branding".

## Checking your work

```bash
npm run dev                          # localhost:3000
npm run shoot / home                 # full-page screenshots at real viewports
node tools/contrast.mjs /            # measured WCAG over your actual image
```

The contrast tool matters here: the hero headline sits in ink over a paper scrim
over **your** photograph. A darker image than expected can push it under AA, and
it looked fine at 2.25:1 before anyone measured.
