# Taqniat redesign: direction and decisions

## 1. Audit

taqniat.ae could not be fetched from the build environment (blocked by network policy), so the audit is based on public company profiles. Before launch, someone with access to the live site should check the items marked **confirm** below.

What we know about the company:

- Taqniat is an Abu Dhabi ICT company that describes itself as product-based, with 85+ software professionals.
- It builds technology products locally and positions itself around safe, reliable, secure ICT environments.
- Four service lines: custom software application development, support of delivered applications, skilled IT resources (staffing), and consultancy on IT processes and technology selection.
- Disciplines: software engineering, UI development, QA automation, systems engineering, project management, maintenance.
- Technology: Oracle RAC, Oracle GoldenGate, Oracle high availability, Kafka, MongoDB, Hadoop, Spark.
- Contact: Sheikh Rashid Bin Saeed St, Abu Dhabi. +971 2 414 7333.

Keep: the four services (they map cleanly to a lifecycle), the local-build and security positioning, the data and high-availability depth, the phone and address.

Rewrite: everything else. The current positioning reads as a list of services. The new site leads with what the work is for (systems that can't stop) and shows how Taqniat covers the whole stack and the whole lifecycle.

Reorganise: services, disciplines and technologies were separate lists. They now hang off one model: the architecture stack. The hero shows the stack, the architecture section explains it, services and disciplines are the people and process around it.

**Confirm before launch:** brand colours and logo, contact email, industries served, case studies (the three in the page are representative placeholders written from the public tech profile, not real client work), certifications, any Arabic version of the site.

## 2. Visual direction

One world: a dark engineering environment lit like a product studio. Surfaces you could touch, not glowing sci-fi.

- Palette: graphite ink background, cool ceramic grey, brushed steel, and one accent, signal orange (`#F26A3D`). Orange is used only for things that are live or actionable: data in motion, the selected node, the primary button. No gradients carrying the identity.
- Materials (small set, used everywhere): ceramic, brushed steel, dark technical matte, one glass layer. Lighting comes from a studio environment map, so reflections are soft and consistent.
- Type: Geist for display and body, Geist Mono for labels and metadata, IBM Plex Sans Arabic for the Arabic wordmark.
- Shape: pill radius for every interactive control, 20px for panels, 0 for 3D plates in CSS.
- Theme: the page is dark only. The 3D lighting, materials and contrast are tuned for one environment, and flipping sections to light would break the sense of being inside one space.

## 3. 3D language

The core object is an exploded architecture stack: Interface, Application, Integration, Data, Infrastructure. Each plate carries details that say what it is (UI tiles, service modules, a ring bus, database disks, rack blades). Orange packets travel through conduits between layers, which is the one piece of constant motion and it means something: data moving through the system.

Every 3D element maps to something real:

| Element | Meaning |
| --- | --- |
| Hero stack | Taqniat works across every layer of a system |
| Architecture graph | How the layers connect, and what Taqniat does at each |
| Service prism | One capability, four faces of the lifecycle |
| Work plates | Each project shown as its exploded architecture |
| Trust planes | Principles stacked in depth, one behind another |

WebGL is used in two places only (hero, architecture). Everything else is CSS 3D, which is cheaper and stays crisp.

## 4. Page structure

1. Hero: what we do, why it matters, one primary action.
2. Overview: who Taqniat is in one paragraph and three facts.
3. Services: pinned, scroll-driven prism. Build, Support, Staff, Advise.
4. Architecture: interactive 3D system graph. Click a layer to see what Taqniat does there and what it connects to.
5. Engineering: disciplines grouped into three clusters, and the stack we run in production.
6. Work: three projects as perspective plates with exploded architecture diagrams.
7. Industries: typographic selector.
8. Why Taqniat: four principles in depth.
9. Contact: one CTA, phone, address, short form.
10. Footer.

## 5. Interaction and motion

Motion explains hierarchy and space. Nothing loops except the data packets.

- Hero: the stack follows the cursor a little, separates further as you scroll (the system opening up), and a hovered layer lifts and names itself.
- Sections arrive through depth: a slight scale and tilt that settles flat as the section reaches reading position.
- Services: scrolling turns the prism one face per service. Tabs jump straight to a face.
- Architecture: selecting a node lifts it, lights its connections, dims the rest, and opens a panel. Connected nodes are listed and clickable, so you can walk the system.
- Work: plates tilt toward the cursor and their layers separate.
- Primary buttons are magnetic on fine pointers.
- `prefers-reduced-motion`: no pinning, no scrubbing, no tilt, no magnetic pull. 3D scenes render a single still frame. The page looks finished when still.

## 6. Responsive

- Desktop and laptop: full scenes, labels on the hero stack, pinned services.
- Tablet: same scenes at lower pixel ratio, services unpinned.
- Mobile: hero stack is smaller and sits behind the headline, fewer details per plate, no glass transmission, no labels. Architecture graph keeps the 3D but node selection is driven by a touch-friendly chip list. Services become a vertical sequence with each prism face shown flat.
- No WebGL: a pre-rendered poster of each scene, and all content (including every architecture node) is in the HTML.

## 7. Performance

- Three.js is loaded with a dynamic import after first paint. The poster image is the LCP element.
- Render loops only run while the scene is on screen and the tab is visible.
- Pixel ratio capped (1.75 desktop, 1.25 mobile). Instancing for repeated parts. No textures except a generated contact shadow.
- Fonts self-hosted, Latin subsets only.
