import * as THREE from "./vendor/three.module.min.js";

/* ============ Contenu ============ */
const MISSIONS = [
  { id: "about",     n: "01", title: "Qui est Hanane ?", tab: "Histoire",     sub: "Mon histoire",           glyph: "H",  color: "#f5c542", x: 62,  y: 62  },
  { id: "animation", n: "02", title: "Animation IA",     tab: "Animation IA", sub: "Vidéos animées 2D & 3D", glyph: "3D", color: "#ff4f7e", x: 150, y: 58  },
  { id: "ads",       n: "03", title: "Ads & UGC IA",     tab: "Ads & UGC IA", sub: "Pubs & vidéos UGC",      glyph: "AD", color: "#4fa3e0", x: 146, y: 146 },
  { id: "contact",   n: "04", title: "Contact",          tab: "Contact",      sub: "Lancer une mission",     glyph: "☎",  color: "#5fbf5f", x: 58,  y: 148 },
];

const VIDEOS = {
  animation: [
    { file: "nems-3d",            title: "Pourquoi choisir ?", client: "L'Atelier de Noor", tags: ["3D", "45 s"] },
    { file: "mamie-3d",           title: "Mamie en panique",   client: "Pub animée",        tags: ["3D", "34 s"] },
    { file: "nems-client-furieux",title: "Le client furieux",  client: "L'Atelier de Noor", tags: ["2D cartoon", "36 s"] },
  ],
  ads: [
    { file: "yumicha-matcha", title: "Le rituel matcha", client: "Yumicha",        tags: ["Pub produit", "29 s"], wide: true },
    { file: "ugc-glace",      title: "UGC avatar IA",    client: "Vidéo UGC",      tags: ["UGC", "13 s"] },
  ],
};

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const isMobile = matchMedia("(max-width: 640px)").matches || matchMedia("(pointer: coarse)").matches;
const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

/* ============ Horloge ============ */
function tick() {
  const t = new Date().toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  $("#clock").textContent = t;
  $("#phoneTime").textContent = t;
}
tick();
setInterval(tick, 20000);

/* ============ Carte (SVG) ============ */
const NS = "http://www.w3.org/2000/svg";
function el(tag, attrs, parent) {
  const n = document.createElementNS(NS, tag);
  for (const k in attrs) n.setAttribute(k, attrs[k]);
  if (parent) parent.appendChild(n);
  return n;
}

function drawMap(svg, big) {
  svg.setAttribute("preserveAspectRatio", big ? "xMidYMid meet" : "xMidYMid slice");
  el("rect", { x: 0, y: 0, width: 200, height: 200, fill: "#2b3038" }, svg);
  // océan + plage
  el("path", { d: "M0 0 H34 C26 40 40 80 28 120 C20 150 32 175 24 200 H0 Z", fill: "#3e6f9e" }, svg);
  el("path", { d: "M34 0 C26 40 40 80 28 120 C20 150 32 175 24 200", stroke: "#c9b27a", "stroke-width": 3, fill: "none" }, svg);
  // parc + blocs
  el("rect", { x: 92, y: 82, width: 30, height: 24, rx: 3, fill: "#3d6a3a" }, svg);
  const blocks = [[44,14,36,30],[90,14,40,26],[138,14,48,30],[44,84,36,36],[132,84,54,32],[44,128,36,52],[92,124,32,24],[132,128,54,52],[92,156,32,30]];
  blocks.forEach(([x, y, w, h]) => el("rect", { x, y, width: w, height: h, rx: 2, fill: "#353b45" }, svg));
  // routes
  const roads = el("g", { stroke: "#7d8591", "stroke-linecap": "round", fill: "none" }, svg);
  [["M38 50 H196", 5], ["M30 120 H196", 5], ["M86 0 V200", 5], ["M128 0 V200", 4], ["M38 0 V200", 3], ["M86 78 L128 78", 3], ["M128 152 H196", 3], ["M60 120 L60 200", 3]]
    .forEach(([d, w]) => el("path", { d, "stroke-width": w }, roads));
  el("path", { d: "M86 0 V200 M38 50 H196", stroke: "#c9a84a", "stroke-width": .6, "stroke-dasharray": "3 3", fill: "none" }, svg);
  // GPS (tracé vers la mission survolée)
  el("path", { id: big ? "gpsBig" : "gpsMini", d: "", stroke: "#b26cf0", "stroke-width": 3, fill: "none", "stroke-linecap": "round", "stroke-linejoin": "round", opacity: .9 }, svg);

  // blips
  MISSIONS.forEach((m) => {
    const g = el("g", { class: "blip", tabindex: 0, role: "button", "aria-label": `Mission ${m.n} : ${m.title}`, "data-go": m.id }, svg);
    el("circle", { cx: m.x, cy: m.y, r: 9, fill: m.color, class: "blip-pulse" }, g);
    el("circle", { cx: m.x, cy: m.y, r: 10, fill: m.color, stroke: "#0d0912", "stroke-width": 2, class: "ring" }, g);
    const t = el("text", { x: m.x, y: m.y + 4, "text-anchor": "middle", "font-size": m.glyph.length > 1 ? 9 : 12, fill: "#0d0912" }, g);
    t.textContent = m.glyph;
    if (big) {
      const lbl = el("text", { x: m.x, y: m.y + 23, "text-anchor": "middle", "font-size": 9, fill: "#f4efe6", stroke: "#0d0912", "stroke-width": 2.5, "paint-order": "stroke" }, g);
      lbl.textContent = m.title.toUpperCase();
    }
    g.addEventListener("mouseenter", () => gps(svg, m));
    g.addEventListener("focus", () => gps(svg, m));
    g.addEventListener("mouseleave", () => gps(svg, null));
  });
  // joueur
  const p = el("g", { transform: "translate(100 108)" }, svg);
  el("circle", { r: 7, fill: "rgba(255,255,255,.15)" }, p);
  el("path", { d: "M0 -7 L5 6 L0 3 L-5 6 Z", fill: "#f4efe6", stroke: "#0d0912", "stroke-width": 1.2 }, p);
}

function gps(svg, m) {
  const path = svg.querySelector("path[id^=gps]");
  if (!m) return path.setAttribute("d", "");
  // itinéraire en "L" le long des routes
  const midY = m.y < 100 ? 50 : 120;
  path.setAttribute("d", `M100 108 L86 108 L86 ${midY} L${m.x} ${midY} L${m.x} ${m.y}`);
}

drawMap($("#miniSvg"), false);
drawMap($("#bigSvg"), true);

const legend = $("#legend");
MISSIONS.forEach((m) => {
  const li = document.createElement("li");
  li.innerHTML = `<button data-go="${m.id}"><span class="dot" style="background:${m.color}">${m.glyph}</span><span>${m.title}<small>Mission ${m.n} · ${m.sub}</small></span></button>`;
  const b = li.querySelector("button");
  b.addEventListener("mouseenter", () => gps($("#bigSvg"), m));
  b.addEventListener("focus", () => gps($("#bigSvg"), m));
  legend.appendChild(li);
});

/* ============ Onglets des sections ============ */
$$(".pause-tabs").forEach((nav) => {
  const panelId = nav.closest("section").id;
  const mk = (label, attr, val, on) => {
    const b = document.createElement("button");
    b.textContent = label;
    b.setAttribute(attr, val);
    if (on) { b.classList.add("is-on"); b.setAttribute("aria-current", "page"); }
    nav.appendChild(b);
  };
  mk("Carte", "data-open", "bigmap");
  MISSIONS.forEach((m) => mk(m.tab, "data-tab", m.id, m.id === panelId));
});

/* ============ Grilles vidéo ============ */
$$("[data-videos]").forEach((grid) => {
  VIDEOS[grid.dataset.videos].forEach((v) => {
    const b = document.createElement("button");
    b.className = "card" + (v.wide ? " wide" : "");
    b.setAttribute("aria-label", `Lire la vidéo ${v.title}`);
    b.innerHTML = `
      <div class="card-media">
        <img src="assets/posters/${v.file}.jpg" alt="" loading="lazy">
        <video muted loop playsinline preload="none"></video>
        <span class="card-play" aria-hidden="true"></span>
      </div>
      <div class="card-info">
        <div class="card-tags">${v.tags.map((t) => `<span>${t}</span>`).join("")}</div>
        <p class="card-title">${v.title}</p>
        <p class="card-client">${v.client}</p>
      </div>`;
    const prev = b.querySelector("video");
    if (!isMobile) {
      b.addEventListener("mouseenter", () => {
        if (!prev.src) prev.src = `assets/videos/${v.file}.mp4`;
        prev.play().catch(() => {});
      });
      b.addEventListener("mouseleave", () => prev.pause());
    }
    b.addEventListener("click", () => openPlayer(v));
    grid.appendChild(b);
  });
});

const player = $("#player"), pv = $("#playerVideo");
function openPlayer(v) {
  pv.src = `assets/videos/${v.file}.mp4`;
  pv.poster = `assets/posters/${v.file}.jpg`;
  $("#playerTitle").textContent = `${v.title} · ${v.client}`;
  player.hidden = false;
  pv.play().catch(() => {});
}
function closePlayer() {
  pv.pause();
  pv.removeAttribute("src");
  pv.load();
  player.hidden = true;
}
$("[data-close-player]").addEventListener("click", closePlayer);
player.addEventListener("click", (e) => { if (e.target === player) closePlayer(); });

/* ============ Navigation ============ */
let current = null;
function setHash(h) {
  try { history.replaceState(null, "", h || location.pathname + location.search); } catch (e) {}
}
const overlays = ["bigmap", ...MISSIONS.map((m) => m.id)];

function showOverlay(id) {
  overlays.forEach((o) => ($("#" + o).hidden = o !== id));
  current = id;
  document.body.classList.toggle("in-menu", !!id);
  world.setPaused(!!id);
  if (id) {
    const sec = $("#" + id);
    const body = sec.querySelector(".panel-body");
    if (body) body.scrollTop = 0;
    (sec.querySelector(".is-on") || sec.querySelector("button"))?.focus({ preventScroll: true });
    if (MISSIONS.some((m) => m.id === id)) setHash("#" + id);
  } else {
    setHash("");
  }
}

let travelling = false;
function launchMission(id, instant) {
  const m = MISSIONS.find((x) => x.id === id);
  if (!m || travelling) return;
  if (instant || reduced) return showOverlay(id);
  travelling = true;
  showOverlay(null);
  document.body.classList.add("travelling");
  $("#mbSmall").textContent = `Mission ${m.n}`;
  $("#mbTitle").textContent = m.title;
  const banner = $("#missionBanner");
  banner.classList.remove("show");
  void banner.offsetWidth;
  banner.classList.add("show");
  world.boost();
  setTimeout(() => { travelling = false; document.body.classList.remove("travelling"); showOverlay(id); }, 1350);
}

document.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  const tab = e.target.closest("[data-tab]");
  const open = e.target.closest("[data-open]");
  const close = e.target.closest("[data-close]");
  if (go) launchMission(go.dataset.go, current && current !== "bigmap" ? true : false);
  else if (tab) showOverlay(tab.dataset.tab);
  else if (open) showOverlay(open.dataset.open);
  else if (close) showOverlay(null);
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    if (!player.hidden) return closePlayer();
    if (current) return showOverlay(null);
  }
  if ((e.key === "m" || e.key === "M") && !e.metaKey && !e.ctrlKey && player.hidden) {
    showOverlay(current === "bigmap" ? null : "bigmap");
  }
  if ((e.key === "Enter" || e.key === " ") && e.target.classList?.contains("blip")) {
    e.preventDefault();
    e.target.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  }
});

/* ============ Téléphone : décrocher ============ */
const acceptBtn = $("#acceptBtn"), callChoice = $("#callChoice");
acceptBtn.addEventListener("click", () => {
  const open = callChoice.hidden;
  callChoice.hidden = !open;
  acceptBtn.closest(".phone-screen").classList.toggle("calling", open);
  acceptBtn.setAttribute("aria-expanded", String(open));
  acceptBtn.textContent = open ? "Raccrocher" : "Décrocher · Lancer une mission";
});

/* ============ Monde 3D ============ */
const world = (() => {
  const canvas = $("#world");
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: !isMobile, powerPreference: "high-performance" });
  } catch (e) {
    return { setPaused() {}, boost() {}, ready: Promise.resolve() };
  }
  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.25 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xe0705e, 40, 210);
  const camera = new THREE.PerspectiveCamera(58, 1, 0.1, 900);
  camera.position.set(0, 2.4, 8);

  // ciel
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(600, 32, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, fog: false, depthWrite: false,
      uniforms: { top: { value: new THREE.Color("#1f0f33") }, mid: { value: new THREE.Color("#b23d6e") }, hor: { value: new THREE.Color("#ffb05a") } },
      vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix*modelViewMatrix*vec4(position,1.0); }",
      fragmentShader: "uniform vec3 top; uniform vec3 mid; uniform vec3 hor; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.12 ? mix(mid, top, smoothstep(0.12, 0.6, h)) : mix(hor, mid, smoothstep(-0.02, 0.12, h)); gl_FragColor = vec4(c,1.0); }",
    })
  );
  scene.add(sky);

  // soleil + halo
  const glowTex = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 128;
    const g = c.getContext("2d"), gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    gr.addColorStop(0, "rgba(255,230,160,1)"); gr.addColorStop(0.25, "rgba(255,190,110,.7)"); gr.addColorStop(1, "rgba(255,120,80,0)");
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
  })();
  const sun = new THREE.Mesh(new THREE.CircleGeometry(26, 48), new THREE.MeshBasicMaterial({ color: 0xffd98a, fog: false }));
  sun.position.set(0, 26, -520);
  scene.add(sun);
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTex, fog: false, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.set(240, 240, 1); halo.position.set(0, 26, -510);
  scene.add(halo);

  scene.add(new THREE.HemisphereLight(0xffb38a, 0x2a1640, 1.15));
  const dir = new THREE.DirectionalLight(0xff9a5a, 1.4);
  dir.position.set(-10, 12, -60);
  scene.add(dir);

  // sol, route, trottoirs
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(800, 800), new THREE.MeshLambertMaterial({ color: 0x2a1d2e }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -0.02;
  scene.add(ground);
  const road = new THREE.Mesh(new THREE.PlaneGeometry(12, 800), new THREE.MeshLambertMaterial({ color: 0x29232f }));
  road.rotation.x = -Math.PI / 2; road.position.z = -300;
  scene.add(road);
  [-7.5, 7.5].forEach((x) => {
    const s = new THREE.Mesh(new THREE.BoxGeometry(3, 0.25, 800), new THREE.MeshLambertMaterial({ color: 0x5a4652 }));
    s.position.set(x, 0.12, -300); scene.add(s);
  });

  const LOOP = 300;
  const movers = [];

  // marquages au sol
  const dashGeo = new THREE.BoxGeometry(0.18, 0.02, 2.4);
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xe6b84a });
  for (let z = 0; z < LOOP; z += 6) {
    [-0.18, 0.18].forEach((x) => {
      const d = new THREE.Mesh(dashGeo, dashMat);
      d.position.set(x, 0.02, -z + 10);
      scene.add(d); movers.push(d);
    });
  }

  // façades avec fenêtres éclairées
  function facadeTex() {
    const c = document.createElement("canvas"); c.width = 64; c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#000"; g.fillRect(0, 0, 64, 128);
    const warm = ["#ffcf7a", "#ffb35c", "#ff8f6b", "#ffe2a8", "#c9a0ff"];
    for (let y = 6; y < 124; y += 10) for (let x = 5; x < 60; x += 11) {
      if (Math.random() < 0.38) { g.fillStyle = warm[(Math.random() * warm.length) | 0]; g.fillRect(x, y, 6, 6); }
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.magFilter = THREE.NearestFilter;
    return t;
  }
  const wallColors = [0x3b2340, 0x4a2a45, 0x2f2236, 0x553049, 0x3a2a3f];
  const mats = wallColors.map((c) => {
    const t = facadeTex();
    return new THREE.MeshLambertMaterial({ color: c, emissive: 0xffffff, emissiveMap: t, emissiveIntensity: 0.85 });
  });
  const boxGeo = new THREE.BoxGeometry(1, 1, 1);
  const perSide = isMobile ? 18 : 30;
  [-1, 1].forEach((side) => {
    let z = 4;
    for (let i = 0; i < perSide; i++) {
      const w = 6 + Math.random() * 7, d = 6 + Math.random() * 6, h = 8 + Math.random() * (Math.random() < 0.2 ? 40 : 18);
      const b = new THREE.Mesh(boxGeo, mats[(Math.random() * mats.length) | 0]);
      b.scale.set(w, h, d);
      b.position.set(side * (10 + w / 2 + Math.random() * 3), h / 2, -z);
      scene.add(b); movers.push(b);
      z += d + 1 + Math.random() * 3;
      if (z > LOOP) break;
    }
  });

  // palmiers
  const trunkMat = new THREE.MeshLambertMaterial({ color: 0x24131f });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x1d1a1f });
  function palm() {
    const g = new THREE.Group();
    const h = 7 + Math.random() * 3;
    const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.2, h, 6), trunkMat);
    trunk.position.y = h / 2; trunk.rotation.z = (Math.random() - 0.5) * 0.12;
    g.add(trunk);
    for (let i = 0; i < 8; i++) {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.05, 2.8), leafMat);
      const piv = new THREE.Group();
      piv.position.y = h;
      piv.rotation.y = (i / 8) * Math.PI * 2 + Math.random() * 0.3;
      leaf.position.z = 1.3; leaf.rotation.x = 0.45 + Math.random() * 0.25;
      piv.add(leaf); g.add(piv);
    }
    return g;
  }
  for (let z = 0; z < LOOP; z += isMobile ? 22 : 15) {
    [-7.2, 7.2].forEach((x) => {
      const p = palm(); p.position.set(x, 0.25, -z - (x > 0 ? 7 : 0));
      scene.add(p); movers.push(p);
    });
  }

  // lampadaires lumineux
  const lampMat = new THREE.MeshBasicMaterial({ color: 0xffd9a0 });
  for (let z = 0; z < LOOP; z += 30) {
    [-6.4, 6.4].forEach((x) => {
      const pole = new THREE.Mesh(new THREE.BoxGeometry(0.08, 5, 0.08), trunkMat);
      pole.position.set(x, 2.5, -z - 15);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 8, 6), lampMat);
      lamp.position.set(x * 0.9, 5, -z - 15);
      scene.add(pole, lamp); movers.push(pole, lamp);
    });
  }

  // boucle
  let speed = reduced ? 0 : 9, target = speed, paused = false, last = performance.now();
  const mouse = { x: 0, y: 0 };
  addEventListener("pointermove", (e) => {
    mouse.x = e.clientX / innerWidth - 0.5;
    mouse.y = e.clientY / innerHeight - 0.5;
  });

  function resize() {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 72 : 58;
    camera.updateProjectionMatrix();
  }
  addEventListener("resize", resize);
  resize();

  let t = 0;
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    if (!paused) {
      speed += (target - speed) * Math.min(1, dt * 2.2);
      t += dt;
      const dz = speed * dt;
      for (const m of movers) {
        m.position.z += dz;
        if (m.position.z > 14) m.position.z -= LOOP;
      }
      camera.position.x += (mouse.x * 1.6 - camera.position.x) * 0.04;
      camera.position.y = 2.4 + (reduced ? 0 : Math.sin(t * 7) * 0.03) - mouse.y * 0.4;
      camera.lookAt(camera.position.x * 0.3, 3.2, -100);
      const fovBoost = (speed - 9) * 0.18;
      const baseFov = innerWidth / innerHeight < 0.8 ? 72 : 58;
      camera.fov = baseFov + Math.max(0, fovBoost);
      camera.updateProjectionMatrix();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(frame);
  }
  renderer.render(scene, camera);
  requestAnimationFrame(frame);

  return {
    setPaused(p) { paused = p; last = performance.now(); },
    boost() {
      if (reduced) return;
      target = 70;
      setTimeout(() => (target = 9), 1100);
    },
    ready: Promise.resolve(),
  };
})();

/* ============ Chargement ============ */
const loader = $("#loader"), fill = $("#loaderFill"), playBtn = $("#playBtn");
let pct = 0;
const prog = setInterval(() => { pct = Math.min(90, pct + 7 + Math.random() * 10); fill.style.width = pct + "%"; }, 120);

function enter() {
  if (loader.classList.contains("out")) return;
  loader.classList.add("out");
  setTimeout(() => (loader.hidden = true), 850);
  const hash = location.hash.slice(1);
  if (MISSIONS.some((m) => m.id === hash)) showOverlay(hash);
}
playBtn.addEventListener("click", enter);
loader.addEventListener("click", (e) => { if (!playBtn.hidden) enter(); });
addEventListener("keydown", (e) => { if (!loader.hidden && !playBtn.hidden && (e.key === "Enter" || e.key === " ")) enter(); }, { once: false });

Promise.all([
  document.fonts?.ready ?? Promise.resolve(),
  new Promise((r) => (document.readyState === "complete" ? r() : addEventListener("load", r))),
  new Promise((r) => setTimeout(r, 900)),
]).then(() => {
  clearInterval(prog);
  fill.style.width = "100%";
  playBtn.hidden = false;
  playBtn.focus({ preventScroll: true });
  setTimeout(enter, 2600);
});
