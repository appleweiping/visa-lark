# Banner / mascot art

`banner.png` (1280×400) is the current banner, rendered from `banner.svg` — a hand-drawn
pencil-style chibi **lark girl (云雀)** mascot holding a calendar with a green check, soft
warm sky-blue + pink palette matching the extension UI.

Regenerate the PNG after editing the SVG:

```bash
node -e "const {Resvg}=require('@resvg/resvg-js');const fs=require('fs');const r=new Resvg(fs.readFileSync('assets/banner.svg','utf8'),{fitTo:{mode:'width',value:1280},font:{loadSystemFonts:true}});fs.writeFileSync('assets/banner.png',r.render().asPng());"
```

## Upgrading to AI-generated art (Codex GPT-5.5 image2)

This was the intended path but Codex CLI on the build machine could not reach `gpt-5.5`
at build time (endpoint returned *"requires a newer version of Codex"*, and `service_tier`
`flex`/`priority` rejected). When Codex GPT-5.5 + image generation is available, generate a
banner with this prompt and reference set, then drop it in as `banner.png`:

**Reference banners to feed (style anchors):** screenshots of pencil-sketch / 二次元 anime-girl
GitHub READMEs, e.g. repos that use a soft hand-drawn chibi mascot header (search GitHub for
"anime girl banner readme pencil"). Feed 2–3 as style references.

**Prompt:**
> A wide GitHub README banner (1280×400), hand-drawn **pencil-sketch / colored-pencil 二次元
> anime** style, soft and warm. A cute chibi **lark-bird girl** mascot named 云雀: pale hair
> styled like a bird crest with a small pink feather, big friendly eyes, a feather-trimmed
> light dress, tiny wing-arms — one wing holding a small **calendar with a green checkmark**.
> She is gliding along a **dotted flight path** over a faint sketched calendar grid. Palette:
> sky-blue (#6b8cff), soft pink (#ffb4c8), cream paper (#fbfaf7), green check (#2fae6a).
> Leave clear negative space on the RIGHT for title text. Light, airy, friendly, NOT dark.
> Title text area reads "VisaLark 签证云雀". Pencil grain texture throughout.

Keep `banner.svg` as the always-available fallback so the repo never ships without a banner.
