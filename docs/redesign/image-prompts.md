# Image prompt pack

The redesign ships complete without any generated images: the forest diorama,
map, charts, icons and every illustration in the identification key are drawn
in code from the real dataset. Generated images are an **upgrade** in one
place where a picture genuinely helps people: recognising the four species.

> **Why only species art?** An AI "photo" of Rú Chá itself would look like a
> real record of a real place, which conflicts with the app's rule that nothing
> is presented as real until it is measured. Real photos from the lecturer
> should fill those spots later.

## How to use

1. Generate each image with GPT image (ChatGPT, or `codex exec` if your
   environment can reach OpenAI). Ask for a **transparent background PNG**,
   **1024 × 1024** (habit images: 1536 × 1024).
2. Save it with the exact file name below into
   `app/assets/images/species/`.
3. Run `npm run images`. Each PNG becomes a ~60–120 KB WebP and is picked up
   automatically (no code changes). Originals go to `_originals/` (git-ignored).
4. **Before publishing:** an advisor checks every image against real specimens.
   The app labels them "Hình vẽ minh họa, không phải ảnh thực địa" on the
   species page.

### Shared style (paste before every prompt)

```
Style: modern scientific field-guide plate. Clean botanical illustration with
soft gouache-like shading, crisp edges, true-to-life natural colours, gentle
soft contact shadow under the specimen. Single specimen, centred, generous
empty margin around it. Transparent background (PNG with alpha). No text,
no labels, no scale bar, no frame, no watermark, no signature.
```

---

## 1 · Species plates (core, 4 images, 1024 × 1024, transparent)

Used for species cards, the species page hero, map details and the
identification result.

### `excoecaria.png` · Giá (Excoecaria agallocha)

```
A leafy branch of Excoecaria agallocha (blind-your-eye mangrove). Simple,
alternate, elliptic to ovate glossy leaves 6–10 cm long with entire or very
faintly toothed margins (no spines); two or three older leaves turning
red-orange. Slender, drooping greenish-yellow catkin-like flower spikes near
the leaf axils. One small three-lobed capsule fruit. At the broken end of the
twig, a single bead of milky white latex sap.
```

### `acanthus.png` · Ô rô (Acanthus ilicifolius)

```
A short upright stem of Acanthus ilicifolius (holly-leaved mangrove). Opposite,
stiff, glossy dark-green leaves with wavy, lobed margins, each lobe ending in
a sharp spine, like holly. A terminal flower spike of pale lilac to light
purple two-lipped flowers. One smooth, oblong green capsule fruit about
2–3 cm long.
```

### `pandanus.png` · Dứa dại (Pandanus tectorius)

```
A branch tip of Pandanus tectorius (screw pine). A spiral tuft of long, narrow,
strap-like leaves with small sharp spines along the margins and the midrib.
Hanging below the tuft, one large round compound fruit that looks like a
pineapple, made of many wedge-shaped segments, ripening orange-yellow.
A short piece of grey trunk with one aerial prop root.
```

### `derris.png` · Cóc kèn (Derris trifoliata)

```
A twining woody vine stem of Derris trifoliata. Odd-pinnate compound leaves
with 3 to 5 ovate leaflets with smooth margins. A hanging cluster (raceme) of
small white to pale-pink pea-like flowers. Two or three thin, flat, oval seed
pods with a narrow wing along one edge.
```

---

## 2 · Habit illustrations (optional, 4 images, 1536 × 1024, transparent)

Whole plant at a distance, matching the key's first question ("how does the
whole plant look?"). Shown large on the species page.

Shared addition: `Show the whole plant from a few metres away, standing on a
small patch of grey-brown tidal mud, side view, no surrounding landscape.`

| File | Prompt |
|---|---|
| `excoecaria-habit.png` | `A small mangrove tree, Excoecaria agallocha, about 6 m tall with one clear trunk, a rounded open crown of glossy leaves with a few red-orange old leaves, no prop roots and no pencil-like breathing roots.` |
| `acanthus-habit.png` | `A dense low thicket of Acanthus ilicifolius under 1.5 m tall, many stems from the base, spiny holly-like leaves, a few pale lilac flower spikes on top, growing at the water's edge with shallow water lapping the mud.` |
| `pandanus-habit.png` | `A Pandanus tectorius shrub-tree about 3–4 m tall, branching trunk with several stilt prop roots entering the ground, each branch ending in a spiral tuft of long strap leaves, one orange pineapple-like fruit.` |
| `derris-habit.png` | `A woody vine, Derris trifoliata, climbing and draping over the crown of a small mangrove tree, compound leaves, hanging clusters of small white-pink pea flowers and thin flat pods.` |

---

## Codex CLI (if your environment can reach OpenAI)

This session's network policy blocks `api.openai.com`, so the images could not
be generated here. With access, one command generates the core set:

```bash
codex exec "Generate four transparent-background 1024x1024 PNG botanical plates using the
prompts in docs/redesign/image-prompts.md section 1 (shared style + each species prompt).
Save them as app/assets/images/species/excoecaria.png, acanthus.png, pandanus.png and
derris.png, then run npm run images." --model gpt-5.6-terra
```
