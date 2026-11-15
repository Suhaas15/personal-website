# personal-website

Personal site for Suhaas Srungavarapu. One page, one fixed 3D particle form that morphs as you scroll: a globe, a credit card, a route map, a working clock, an agent graph, a numeral, a stack of papers and a wave.

## How it is put together

| Path | What it is |
| --- | --- |
| `index.html` | The built page. Self-contained apart from three.js and fonts, which load from CDNs. |
| `src/data.json` | All site content: profile, numbers, experience, projects, wins, education, credentials, skills, links. |
| `src/app.js` | Rendering, scroll motion, the three.js particle scene and the in-page editor. |
| `src/style.css` | Styles. |
| `src/shell.js` | `buildDocument()`, which assembles the final HTML from the parts above. |
| `build.js` | Runs `buildDocument()` and writes `index.html`. |

There are no dependencies to install. The build needs only Node.

## Change the content

1. Edit `src/data.json`.
2. Run `node build.js` (or `npm run build`).
3. Open `index.html` in a browser to check it.

In `profile.manifesto`, wrap words in `*asterisks*` to highlight them. In `profile.kicker`, put `×` between two parts to highlight the second. In `profile.about`, leave a blank line between paragraphs. Links with an empty `url` stay hidden.

## Host it

The page is a single static file, so any static host works. For GitHub Pages, open the repository settings, go to Pages, and deploy from the `main` branch root.

## The in-page editor

The page includes an owner-only editor (the "Edit site" button). It saves through the Claude artifact runtime, so it only appears when the page is hosted as a Claude artifact and viewed by its owner. On any other host the button stays hidden and content is changed through `src/data.json` as described above.

## Libraries

- [three.js](https://threejs.org/) r128, loaded from cdnjs
- Fonts from Google Fonts: Big Shoulders Display, Hanken Grotesk, IBM Plex Mono
