# Mochi's house

A first-person 3D house you can walk around in your browser, with Mochi the orange tabby cat, a garden you can dig into, a street of shops, and a day–night cycle. Built with three.js (r128) as a single HTML file, with no other libraries.

## Run it

- **Online:** open `mochis-house.html` in a modern browser (Chrome, Edge, Firefox or Safari). It loads three.js and the fonts from the internet.
- **Offline:** open `offline/mochis-house.html`. It uses the copy of three.js next to it, so it works without internet (fonts fall back to system fonts).

Click **Step inside**, then click the view to look around with the mouse. On a phone or tablet, use the on-screen joystick and buttons.

## Controls

| Key | Action |
| --- | --- |
| W A S D / arrows | Walk (Shift to run) |
| Mouse / drag | Look around |
| E | Use what you're looking at: doors, drawers, switches, seats, items, shops, Mochi |
| F / left click | Use the item you're holding |
| G / right click | Throw the item |
| Q | Put the item down where you're looking |
| R | Item option (e.g. shovel shape) |
| C | Crouch (dive when swimming) |
| Space | Jump |
| N | Skip ahead to evening or morning |
| T | Change how fast time passes |
| M | Show or hide the map |
| H | Help |

## Project structure

`mochis-house.html` is generated. Edit the files in `src/`, then rebuild.

| File | What it contains |
| --- | --- |
| `src/01_head.html` | Page, styles and on-screen interface |
| `src/02_core.js` | Renderer, helpers, procedural textures, materials |
| `src/02b_kit.js` | Drawers, cabinet doors, hollow cabinets, light units, seats |
| `src/03_shell.js` | Floors, walls, windows, doors, ceiling, switches |
| `src/04_living.js` | Living room, kitchen and dining furniture |
| `src/05_bedrooms.js` | Both bedrooms |
| `src/05b_bathroom.js` | Bathroom wing, bath, shower, toilet, water effects |
| `src/06_outdoor.js` | Garden, diggable terrain, street, sky and lights |
| `src/07_cat.js` | Mochi: model, poses, wandering and petting |
| `src/07b_interact.js` | Look-and-press-E interaction system and sounds |
| `src/07c_items.js` | Items you can pick up, use, throw and drop with physics |
| `src/07d_garden.js` | Digging, soil layers, finds and the wheelie bin |
| `src/07e_gate.js` | Automatic gate and its indoor control panel |
| `src/07f_shops.js` | The four shops, products, buying and selling |
| `src/07g_shoring.js` | Cave-ins and plank shoring |
| `src/07h_tools.js` | Pickaxe, power auger, gold pan, ladder, dynamite |
| `src/07i_shoes.js` | Shoe rack, feet, pond and footprints |
| `src/07j_dirt.js` | Getting dirty, swimming, showering and bathing |
| `src/07k_clock.js` | Game clock, sun path and sky colours |
| `src/08_player.js` | Player movement, controls, HUD, minimap and main loop |

## Rebuild

The parts are joined in filename order into one HTML file.

- macOS / Linux: `./build.sh`
- Any system with Python 3: `python build.py`

Both scripts also refresh `offline/mochis-house.html`.

## Credits

three.js is © three.js authors, MIT licence (see `offline/THREE-LICENSE.txt`). Fonts: Fraunces and DM Sans from Google Fonts.
