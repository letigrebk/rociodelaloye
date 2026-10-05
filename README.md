# rociodelaloye.com

The website of Rocío Delaloye, artist working with video, live simulations and multimedia installations.

The homepage is a **WORLD**: one large open field you drag and scroll through, holding images and video fragments from every work at hand-placed positions and scales. **INDEX** is the same body of work as a plain list. Clicking a piece opens its project page.

## What's here now

`prototype/` is the working prototype of the homepage, built before the real site.

- `prototype/index.html`: the field, Index, project pages and transitions, in one file.
- `prototype/media/`: web-sized stills (JPEG, max 1600 px) and silent video loops (H.264 MP4, no audio, with a poster frame each).

To open it locally, serve the folder (videos and images load by relative path):

```sh
cd prototype && python3 -m http.server 8000
# then visit http://localhost:8000
```

The small switch in the bottom-right corner exists only for reviewing options:

- **Field**: Plain, Lines (subtle drafting lines), Traces (a few enormous, near-invisible curves and hairlines under the work).
- **Open**: Gather (the work's fragments float together into the project page) or Simple (only the clicked piece grows into place).

`#index` opens the Index. `#map` shows the whole field at once (for checking the composition).

## Plan for the real site

- **Astro**: static site; WORLD, INDEX, project pages, About, CV/Exhibitions.
- **Sanity**: CMS for projects (title, year, medium, duration, text, credits, images, loops, full video link), About, CV, and the WORLD composition (position, size and depth of every piece), with a compose mode to arrange the field by dragging.
- **Cloudflare Pages**: hosting, rebuilt automatically when content is published in Sanity.
- **Video**: short loops served as files; full-length works embedded from a video host.
- **Domain**: rociodelaloye.com moves from Squarespace once the new site is ready.
