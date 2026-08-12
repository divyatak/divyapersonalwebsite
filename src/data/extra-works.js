/**
 * extra-works.js — the works that do NOT come from the public/projects/ pipeline.
 *
 * The build pipeline (scripts/build-projects.js) only knows about folders under
 * public/projects/. These five live elsewhere (their own repos, their own hosts),
 * so their facts are kept here by hand and merged into /works/[slug] alongside
 * the generated ones.
 *
 * Shape — one entry per work, and every field is literal, never derived:
 *   slug        string   the URL segment: /works/<slug>/
 *   title       string   in its natural case
 *   year        number   the quiet fact line
 *   status      string   'ongoing' | 'finished'  (only 'ongoing' is printed)
 *   with        string   a real credit, or '' when it was solo
 *   url         string   a LIVE destination, or null when there isn't one yet
 *   linkLabel   string   what the link out says ('Play it', 'Open it')
 *   image       string   the hero, served from public/ (also the tile + og image)
 *   imageAlt    string
 *   heroVideo   string   optional clip that REPLACES the static hero on the work
 *                        page — the image then only serves the tile and og:image
 *   orientation string   'landscape' | 'portrait' — the hero's ratio
 *   what        string   what the thing is
 *   why         string   why it exists            (null => simply not printed)
 *   how         string   how it is actually built (null => simply not printed)
 *   tech        string   the stack, printed on the fact line ('A · B · C'), or null
 *   media       array    footage for the page: [{ type: 'video', src }] — real
 *                        captures only, interleaved with the prose on /works/[slug]
 *
 * CONTENT RULE: what/why/how are assembled from Divya's own written source
 * material only (project dossiers, the GDD, the pitch docs). Nothing here is
 * invented. If there is no source for a section it must be null, not filled in.
 */

export const extraWorks = [
  {
    slug: 'metro-museum',
    title: 'Metro Museum of the Forgotten',
    year: 2026,
    status: 'ongoing',
    with: 'with Kahran Singh',
    url: null,
    linkLabel: null,
    image: '/clips/poster-7.jpg',
    imageAlt: 'A 3D museum interior with mannequin figures at sunset, from the Metro Museum build',
    orientation: 'landscape',
    heroVideo: '/clips/cut-7a.mp4', // nothing static on this page — the museum moves
    tech: 'Three.js · Vite · Python',
    media: [
      { type: 'video', src: '/clips/cut-7b.mp4' },
      { type: 'video', src: '/clips/cut-7c.mp4' },
      { type: 'video', src: '/clips/cut-7d.mp4' },
      { type: 'video', src: '/clips/cut-7e.mp4' },
    ],
    what:
      "A first-person walking piece set inside an endless Delhi Metro train that is also a museum. " +
      "The exhibits are real lost things, taken from the Delhi Metro's public lost-and-found ledger: " +
      "lunch boxes, single earbuds, hundreds of umbrellas, rings, sleeping bags. The train's cars become " +
      "galleries, the lost things become exhibits, and some of them speak, one to three sentences each, " +
      "in first person. The player is a visitor: free pace, no objectives, and the doors at every station " +
      "stop are a standing invitation to leave.",
    why:
      "Car by car the museum drifts from the mundane, bottles and helmets, toward the things no " +
      "lost-and-found could shelve: habits, names, versions of yourself. It starts with the objects we " +
      "lose and turns the lens inward, until the subject is the losing itself. The question underneath " +
      "is that our objects shape us, so what happens to the self an object held when the object is lost? " +
      "The ledger is the material, not the point. The piece tries to sit with the feeling of what gets " +
      "left behind, without flinching or resolving it into a lesson.",
    how:
      "It runs in a browser: Three.js and Vite, with custom shaders and post-processing doing the " +
      "emotional work of light and colour. The exhibits come out of a self-built Python pipeline, " +
      "Selenium and BeautifulSoup and Pandas, that scrapes and cleans the public ledger into the dataset " +
      "the game reads. Around that sits a toolchain I built for myself: a look-dev sandbox where the art " +
      "direction is found with live sliders rather than decreed in a spec, an isometric editor for coach " +
      "interiors, a parametric model editor, and a curation desk for choosing which records become " +
      "exhibits. Two performance passes so far, one of which cut 89% of the draw calls.",
  },
  {
    slug: 'everything-bazaar',
    title: 'Everything Bazaar',
    year: 2026,
    status: 'ongoing',
    with: '',
    url: 'https://everythingbazaar.netlify.app',
    linkLabel: 'Play it',
    image: '/clips/poster-6.jpg',
    imageAlt: 'A dark shop screen with a product box, from Everything Bazaar',
    orientation: 'landscape',
    // all bazaar footage is Divya's own captures (CLips/), cut to the 5.2s unit:
    // 6a Old Friend box in the machine world · 6b RAIN·29 in the Package Studio ·
    // 6c the pink bottle in the studio · 6d RIVER!! dispensed in the dark row
    heroVideo: '/clips/cut-6a.mp4',
    tech: 'React · Three.js',
    media: [
      { type: 'video', src: '/clips/cut-6b.mp4' },
      { type: 'image', src: '/playground/bazaar-loneliness.webp', alt: 'The Loneliness vending machine, five bottles lit inside it' },
      { type: 'image', src: '/playground/bazaar-selection.webp', alt: 'The slot selection screen of the Meaninglessness machine' },
      { type: 'video', src: '/clips/cut-6c.mp4' },
      { type: 'image', src: '/playground/bazaar-product.webp', alt: 'A generated product in the Package Studio: a cream bottle with a cork cap, labelled Gathered' },
      { type: 'video', src: '/clips/cut-6d.mp4' },
      { type: 'image', src: '/playground/bazaar-boredom.webp', alt: 'The Boredom vending machine in the dark row' },
    ],

    what:
      "A row of five vending machines on a webpage. You walk the row, pick a feeling like loneliness or " +
      "boredom, and a machine dispenses a procedurally generated product: a bottle, a can, a chip packet, " +
      "a slim box, with a name, a brand identity, marketing copy, rendered in 3D. You can rotate it and " +
      "read the pitch. Each machine is a different brand world, from scientific to luxury, five ways the " +
      "same thing offers itself. The system never repeats.",
    why:
      "The subject is desire, and how we live with it now that culture, community and ritual have been " +
      "replaced by brands as the things that organise our wanting. We say who we are by what we buy, " +
      "which is legitimate, and the honest question the piece holds is how else you would even express " +
      "yourself. The whole transaction stays invisible because it is banal. What soap am I buying is too " +
      "ordinary, too unthought, to register as a statement about my position in society. So the piece " +
      "takes the most unthought act there is and holds it still until it turns strange and worth looking " +
      "at, from inside the culture, as someone who also buys and also builds brands. The five brands are " +
      "not pretending to care either. The wish is genuine: real craft, a real desire to help. Nobody in " +
      "the chain is lying. It refuses the verdict and leaves you with nothing to conclude.",
    how:
      "Built in React and Three.js. The package shapes are procedural geometry and the label artwork is " +
      "generated on an HTML5 canvas, so there are no pre-made models anywhere in it. The discipline is " +
      "that the products have to be genuinely desirable. If a product reads as fake or jokey the piece " +
      "fails, so visual quality was the first thing to de-risk.",
  },
  {
    slug: 'bioluminescent-flow',
    title: 'Bioluminescent Flow',
    year: 2026,
    status: 'finished',
    with: '',
    url: 'https://divyatak.github.io/creative-visuals/particles/',
    linkLabel: 'Open it',
    image: '/playground/bioluminescent-flow.webp',
    imageAlt: 'Two hands moving through a glowing particle field, from Bioluminescent Flow',
    orientation: 'landscape',
    heroVideo: '/clips/cut-2b.mp4', // the page itself carries no stills
    tech: 'Three.js · GPU compute shaders · MediaPipe',
    media: [
      { type: 'video', src: '/clips/cut-2a.mp4' },
    ],
    what:
      "A field of glowing bioluminescent algae simulated on the GPU. Move your hand through it, tracked " +
      "live by webcam, and the particles brighten and scatter, the light rippling around your fingers, " +
      "like dragging your hand through real bioluminescent plankton in dark water.",
    why:
      "There is no interface and no instruction. You just move, and the field comes alive where you touch " +
      "it. It is the purest expression of the instinct under all of my interactive work: presence makes a " +
      "surface come alive. No UI, no text, no goal. A hand, a field, and immediate sensory feedback.",
    how:
      "Three.js with GPUComputationRenderer, so the whole simulation runs as a GPU particle system in " +
      "compute shaders, with custom glow and rim shaders on top. Thousands of points respond in real " +
      "time. The hand is read from the webcam by MediaPipe HandLandmarker.",
  },
  {
    slug: 'webcam-magic',
    title: 'Webcam Magic',
    year: 2026,
    status: 'finished',
    with: '',
    url: 'https://divyatak.github.io/creative-visuals/webcam/',
    linkLabel: 'Open it',
    image: '/playground/webcam-magic.webp',
    imageAlt: 'A face rendered as a pixel mirror, from Webcam Magic',
    orientation: 'landscape',
    tech: 'p5.js · MediaPipe',
    media: [
      { type: 'video', src: '/clips/cut-1a.mp4' },
      { type: 'video', src: '/clips/cut-1b.mp4' },
      { type: 'video', src: '/clips/cut-1c.mp4' },
      { type: 'video', src: '/clips/cut-1d.mp4' },
    ],
    what:
      "A real-time piece that transforms a webcam feed through hand gestures. Seven visual modes: duotone " +
      "ripple, shifted erase, thermal paint, halftone sculpt, ASCII smear, mosaic sharpen, static calm. " +
      "Each one answers hand movement differently. Mode switching happens on a peace sign, and finger " +
      "speed controls the effect radius, so faster movement creates larger disruptions.",
    why:
      "The technology is not the point, the embodied interaction is. There is no interface to learn, your " +
      "hand is the instrument, and the piece works in any space with a screen and a webcam.",
    how:
      "p5.js for the visuals and MediaPipe HandLandmarker for real-time hand tracking, with plain HTML, " +
      "CSS and JavaScript around them. It needs a webcam and a secure context for camera access.",
  },
  {
    slug: 'e-motion',
    title: '(e)motion',
    year: 2026,
    status: 'ongoing',
    with: '',
    url: 'https://divyatak.github.io/creative-visuals/emotion/',
    linkLabel: 'Open it',
    image: '/playground/e-motion.webp',
    imageAlt: 'A pink flower mid-bloom on a dark phone-shaped stage, from (e)motion',
    orientation: 'portrait',
    heroVideo: '/clips/cut-9a.mp4', // bud to bloom, cropped to the phone stage
    tech: 'MediaPipe · One Euro filter · HTML5 canvas',
    media: [
      { type: 'video', src: '/clips/cut-9b.mp4', width: 606, height: 1080 },
    ],
    // her own catalogue copy from creative-visuals, verbatim
    what:
      'Puppet a video with your hand. Gather your fingers to a bud, then open like petals — the ' +
      'flower blooms exactly as far as you spread. Videos set to music, one gesture each.',
    why: null,
    how:
      'A webcam and one hand. MediaPipe HandLandmarker reads the hand live; how far the fingers ' +
      'spread scrubs a pre-rendered frame sequence, smoothed through a One Euro filter so the ' +
      'bloom follows the hand without jitter. The stage is phone-shaped, with the raw mirrored ' +
      'self-view kept in the corner.',
  },
  {
    slug: 'the-line-before',
    title: 'The Line Before',
    year: 2025,
    status: 'finished',
    with: 'with Kahran Singh',
    url: 'https://divya.studiotypo.xyz',
    linkLabel: 'Open it',
    image: '/playground/the-line-before.webp',
    imageAlt: 'Generative flowers grown from poems, from The Line Before',
    orientation: 'landscape',
    heroVideo: '/clips/cut-5a.mp4', // the garden in motion, from Divya's capture
    tech: 'React · Three.js',
    media: [
      { type: 'video', src: '/clips/cut-5b.mp4' },
    ],
    what:
      "The Line Before takes 230 fragments from Kahran's body of nearly 400 poems and lets visitors " +
      "assemble new poems through a sequence of instinctive emotional choices. Each fragment is scored " +
      "along four axes of emotional duality: sublimate and crystallise, grip and release, echo and " +
      "ignite, smother and howl. Visitors choose between the poles, and each choice surfaces a line. Four " +
      "choices make a poem. The completed poem becomes a generative flower whose colours, petals and " +
      "structure reflect the emotional affinities of its fragments, and the flower drifts into a " +
      "persistent garden made of every previous visitor's poem.",
    why:
      "It is the fullest expression of the Joyus collaboration: Kahran's poetry, my visual and " +
      "interaction design, and an audience that completes the system. It asks a question about " +
      "intelligence and authorship that feels urgent and honest. When a machine scores a fragment, a poet " +
      "writes it, and you feel the resulting line in your chest, whose intelligence is that? The piece " +
      "proposes that intelligence is emergent, arising through the interaction between poetic " +
      "expression, computational interpretation, and human intuition.",
    how:
      "A web build in React and Three.js: a 3D garden that each finished poem grows a flower into, with " +
      "the poem itself overlaid on the scene. The scoring of the 230 fragments along the four axes was " +
      "done with a large language model as a collaborator. Each interaction takes under a minute, and " +
      "the garden keeps growing across visitors.",
  },
]

export default extraWorks
