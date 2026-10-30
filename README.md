# Бъркотия · blog prototypes

Seven interactive design prototypes for a personal blog (stories, opinions and photos), Bulgarian first with an English switch. Open the hub page and try each one, ideally on a phone too.

**Whole-site ideas**

- `planet/`: Her tiny planet. A 3D world you spin; houses are stories, soapboxes are opinions, the moon holds the photos.
- `gravity/`: Gravity playground. Letters, posts and photos fall from the sky; fling them or tilt your phone.
- `wall/`: The endless wall. An infinite fridge-door, cork-board and poster wall you pan and zoom.
- `tv/`: Channel surfing. A retro CRT TV and remote; stories on channel 1, opinions on 2, photos on 3.

**Gallery ideas**

- `gallery-develop/`: Rub undeveloped instant prints until the photo appears.
- `gallery-snowglobe/`: Shake a snow globe; a photo floats up to the glass when the snow settles.
- `gallery-table/`: Real-looking prints on a table to toss around, flip and tidy up.

## Run locally

Plain static files, no build step:

```sh
python3 -m http.server 8642
```

Then open http://localhost:8642.

## Content

All prototypes read the same demo content from `shared/content.js` through the helpers in `shared/site.js`. The posts are placeholder text, and "Бъркотия" is a placeholder name. The demo photos come from Wikimedia Commons and are used under their licences; see `shared/credits.html`.
