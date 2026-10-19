import React, { useState, useEffect, useMemo, useRef, Suspense } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { useGame } from "../state/store";
import { objective, type Appearance } from "../state/model";
import { command } from "../game/runtime";
import {
  regions,
  futureRegions,
  glossary,
  itemNames,
} from "../content/regions";
import { silverClasp, surface } from "../render/amazigh";
import { makeSword, box } from "../render/kit";
function Item({ id }: { id: string }) {
  const ref = useRef<T.Group>(null);
  const object = useMemo(() => {
    if (id === "oasis-clasp") {
      const g = new T.Group();
      silverClasp(g, 0, 0, 0, 2.4);
      return g;
    }
    if (id === "dawnwake") {
      const g = makeSword();
      g.position.y = 0.45;
      g.rotation.z = -0.32;
      return g;
    }
    if (id === "moonfern-lantern") {
      const g = new T.Group();
      box(g, 0, 0, 0, 0.5, 0.8, 0.5, "#9cb8a6");
      box(g, 0, 0.45, 0, 0.7, 0.1, 0.7, "#b79b75");
      box(g, 0, -0.45, 0, 0.7, 0.1, 0.7, "#b79b75");
      return g;
    }
    if (id === "velvet-jacket") {
      const g = new T.Group();
      g.add(
        new T.Mesh(
          new T.CylinderGeometry(0.42, 0.65, 1.25, 16, 1, true),
          surface("#4b7671", "weave"),
        ),
      );
      silverClasp(g, 0, 0.3, 0.48, 0.7);
      return g;
    }
    const g = new T.Group();
    g.add(
      new T.Mesh(
        new T.OctahedronGeometry(0.5),
        new T.MeshStandardMaterial({
          color: "#b6e5db",
          metalness: 0.4,
          roughness: 0.2,
          emissive: "#78b3ae",
          emissiveIntensity: 0.3,
        }),
      ),
    );
    return g;
  }, [id]);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.22;
  });
  return (
    <group ref={ref}>
      <primitive object={object} />
    </group>
  );
}
export function ItemView({ id }: { id: string }) {
  return (
    <Canvas
      camera={{ position: [0.6, 0.3, 3.2], fov: 40 }}
      dpr={[1, 1.25]}
      gl={{ alpha: true, antialias: true }}
      onCreated={({ gl, scene }) => {
        const room = new RoomEnvironment(),
          pmrem = new T.PMREMGenerator(gl);
        scene.environment = pmrem.fromScene(room, 0.04).texture;
        scene.environmentIntensity = 0.6;
        room.dispose();
        pmrem.dispose();
      }}
    >
      <ambientLight intensity={1.7} />
      <directionalLight position={[3, 4, 5]} intensity={4} color="#ffe4b2" />
      <directionalLight position={[-3, 1, -2]} intensity={3} color="#93cbd9" />
      <Item id={id} />
      <OrbitControls enablePan={false} enableZoom={false} />
    </Canvas>
  );
}
function Modal({
  title,
  overline,
  children,
  close = "resume",
}: {
  title: string;
  overline: string;
  children: React.ReactNode;
  close?: string;
}) {
  return (
    <div className="modal-backdrop">
      <section
        className="panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <button
          className="close"
          aria-label="Close panel"
          onClick={() => command(close)}
        >
          ×
        </button>
        <span className="eyebrow">{overline}</span>
        <h1>{title}</h1>
        {children}
      </section>
    </div>
  );
}
function Customizer() {
  const a = useGame((s) => s.save.appearance),
    update = useGame((s) => s.customize);
  const presets: {
    id: Appearance["preset"];
    name: string;
    fur: string;
    hair: string;
  }[] = [
    { id: "amber", name: "Cedar fox", fur: "#bc874f", hair: "#633c2d" },
    { id: "moon", name: "Pale fox", fur: "#c7bfcd", hair: "#535477" },
    { id: "russet", name: "Russet fox", fur: "#a85c43", hair: "#432d32" },
  ];
  return (
    <div className="customize">
      <div className="customize-caption">
        <span className="eyebrow">THE COURTYARD MIRROR</span>
        <h2>A face for every world.</h2>
        <p>Drag the scene to turn your character.</p>
      </div>
      <section
        className="customizer"
        role="dialog"
        aria-label="Create your character"
      >
        <span className="eyebrow">ONE CHARACTER. EVERY WORLD.</span>
        <h1>This is you.</h1>
        <label>
          Your name
          <input
            aria-label="Character name"
            maxLength={24}
            value={a.name}
            onChange={(e) => update({ name: e.target.value })}
          />
        </label>
        <span className="label">Appearance</span>
        <div className="preset-row">
          {presets.map((p) => (
            <button
              key={p.id}
              className={a.preset === p.id ? "selected" : ""}
              onClick={() => update({ preset: p.id, fur: p.fur, hair: p.hair })}
            >
              {p.name}
            </button>
          ))}
        </div>
        <div className="swatches">
          <label>
            Fur tone
            <input
              aria-label="Fur tone"
              type="color"
              value={a.fur}
              onChange={(e) => update({ fur: e.target.value })}
            />
          </label>
          <label>
            Hair
            <input
              aria-label="Hair color"
              type="color"
              value={a.hair}
              onChange={(e) => update({ hair: e.target.value })}
            />
          </label>
          <label>
            Eyes
            <input
              aria-label="Eye color"
              type="color"
              value={a.eyes}
              onChange={(e) => update({ eyes: e.target.value })}
            />
          </label>
          <label>
            Outfit
            <input
              aria-label="Outfit color"
              type="color"
              value={a.primary}
              onChange={(e) => update({ primary: e.target.value })}
            />
          </label>
          <label>
            Scarf
            <input
              aria-label="Scarf color"
              type="color"
              value={a.secondary}
              onChange={(e) => update({ secondary: e.target.value })}
            />
          </label>
        </div>
        <label>
          Forelock
          <select
            aria-label="Hairstyle"
            value={a.hairStyle}
            onChange={(e) => update({ hairStyle: Number(e.target.value) })}
          >
            <option value={0}>Windswept</option>
            <option value={1}>Tousled</option>
            <option value={2}>Wild at heart</option>
          </select>
        </label>
        <label className="toggle">
          <input
            type="checkbox"
            checked={a.accessory}
            onChange={(e) => update({ accessory: e.target.checked })}
          />{" "}
          Traveler’s satchel
        </label>
        <p className="muted">
          Your look, your clothing, your memories — they travel with you.
        </p>
        <button className="primary" onClick={() => command("finish-customize")}>
          This is my story <span>→</span>
        </button>
      </section>
    </div>
  );
}
function Inventory() {
  const s = useGame((g) => g.save),
    update = useGame((g) => g.update),
    [selected, setSelected] = useState(
      s.inventory.includes("dawnwake") ? "dawnwake" : s.inventory[0] || "",
    );
  return (
    <Modal
      title="Things that travel with you."
      overline={`${s.appearance.name.toUpperCase()} · INVENTORY`}
    >
      <div className="inventory-layout">
        <div className="inventory-list">
          {s.inventory.length ? (
            s.inventory.map((id) => (
              <button
                key={id}
                className={id === selected ? "item selected" : "item"}
                onClick={() => setSelected(id)}
              >
                <span>
                  {id === "dawnwake" ? "†" : id === "velvet-jacket" ? "♧" : "◇"}
                </span>
                <div>
                  {itemNames[id]}
                  <small>
                    {id === "dawnwake"
                      ? "FANTASY RELIC · TIZI HIGHLANDS"
                      : id === "velvet-jacket"
                        ? "WOVEN CLOTHING · TARGA OASIS"
                        : id === "oasis-clasp"
                          ? "SILVER KEEPSAKE · TARGA OASIS"
                          : "COMMUNITY KEEPSAKE"}
                  </small>
                </div>
              </button>
            ))
          ) : (
            <p className="muted">
              Every empty space is a story you haven’t found yet.
            </p>
          )}
        </div>
        <div className="item-detail">
          {selected && (
            <>
              <div className="item-preview">
                <ItemView id={selected} />
              </div>
              <span className="eyebrow">
                {selected === "dawnwake"
                  ? "A BLADE CARRYING MANY STORIES."
                  : selected === "velvet-jacket"
                    ? "WOVEN IN AN OASIS. WORN ON EVERY ROAD."
                    : "SOME THINGS ARE WORTH REMEMBERING."}
              </span>
              <h2>{itemNames[selected]}</h2>
              {selected === "dawnwake" && (
                <button
                  className="primary"
                  onClick={() =>
                    update((v) => ({
                      ...v,
                      equipment: { ...v.equipment, sword: !v.equipment.sword },
                      home: {
                        ...v.home,
                        sword: v.equipment.sword ? v.home.sword : false,
                      },
                    }))
                  }
                >
                  {s.equipment.sword
                    ? "Stow the Dawnblade"
                    : "Equip the Dawnblade"}
                </button>
              )}
              {selected === "velvet-jacket" && (
                <button
                  className="primary"
                  onClick={() =>
                    update((v) => ({
                      ...v,
                      equipment: {
                        ...v.equipment,
                        jacket: !v.equipment.jacket,
                      },
                    }))
                  }
                >
                  {s.equipment.jacket
                    ? "Wear starting outfit"
                    : "Wear oasis mantle"}
                </button>
              )}
            </>
          )}
        </div>
      </div>
      <p className="muted">
        Unique objects remain yours across every doorway. Items are saved on
        this device.
      </p>
    </Modal>
  );
}
function Journal() {
  const s = useGame((g) => g.save),
    goal = objective(s);
  return (
    <Modal title="The water, the road, the trust." overline="YOUR JOURNEY BOOK">
      <p className="journal-intro">
        “We don’t lose a world when we leave it. We carry a little of it into
        the next.”
      </p>
      <div className="journal-current">
        <span className="eyebrow">YOUR NEXT CHAPTER</span>
        <h2>{goal.title}</h2>
        <p>{goal.detail}</p>
      </div>
      <div className="chapters">
        {[
          [
            "forest",
            "Water",
            "Open the three intake gates and record the restored spring.",
          ],
          [
            "crossing",
            "Passage",
            "Reopen the caravan passage and recover the delivery record.",
          ],
          [
            "archive",
            "Trust",
            "Reconcile delivery, family seals and the shared reserve; choose an agreement.",
          ],
        ].map(([id, title, detail]) => (
          <div key={id}>
            <span className={s.quest.echoes.includes(id as any) ? "done" : ""}>
              {s.quest.echoes.includes(id as any) ? "✦" : "◇"}
            </span>
            <section>
              <h3>{title}</h3>
              <p>{detail}</p>
            </section>
          </div>
        ))}
      </div>
      {s.granaryDecision && (
        <p className="agreement">
          Recorded agreement:{" "}
          {s.granaryDecision === "witnessed"
            ? "A witnessed measure for both households."
            : "Disputed cells sealed; the communal reserve opened."}
        </p>
      )}
      <details className="region-notes">
        <summary>Words carried on the journey</summary>
        {glossary.map((entry) => (
          <p key={entry.word}>
            <b>{entry.word}</b> — {entry.meaning}.
          </p>
        ))}
      </details>
      <details className="region-notes">
        <summary>Beyond these two doorways</summary>
        {futureRegions.map((region) => (
          <section key={region.name}>
            <h3>
              {region.name} <small>· Not yet open</small>
            </h3>
            <p>{region.identity}.</p>
          </section>
        ))}
      </details>
      <p className="muted">
        {s.quest.sword
          ? "The Dawnblade remembers your deeds. Follow the water to Targa Oasis."
          : "Carry the water testimony, passage record and granary agreement to the Dawn Terrace."}
      </p>
    </Modal>
  );
}
function Pause() {
  const s = useGame((g) => g.save),
    update = useGame((g) => g.update),
    storage = useGame((g) => g.storage),
    [confirm, setConfirm] = useState(false);
  return (
    <Modal title="Take a breath." overline="LAST SAVE">
      <p className="muted">
        {storage
          ? "Your story is saved on this device."
          : "Browser storage is unavailable. Export your save to preserve this session."}
      </p>
      <div className="settings">
        <label>
          Experience
          <select
            aria-label="Experience mode"
            value={s.experience}
            onChange={(e) =>
              update((v) => ({ ...v, experience: e.target.value as any }))
            }
          >
            <option value="tour">Story tour · forgiving</option>
            <option value="adventure">Adventure · challenges & retries</option>
            <option value="quest">Living quest · experimental combat</option>
          </select>
        </label>
        <label>
          Sound & music
          <input
            aria-label="Sound volume"
            type="range"
            min="0"
            max="1"
            step=".05"
            value={s.settings.volume}
            onChange={(e) =>
              update((v) => ({
                ...v,
                settings: { ...v.settings, volume: Number(e.target.value) },
              }))
            }
          />
          <span>{Math.round(s.settings.volume * 100)}%</span>
        </label>
        <label>
          Graphics
          <select
            value={s.settings.quality}
            aria-label="Graphics quality"
            onChange={(e) =>
              update((v) => ({
                ...v,
                settings: { ...v.settings, quality: e.target.value as any },
              }))
            }
          >
            <option value="low">Low · lighter shadows</option>
            <option value="medium">Balanced</option>
            <option value="high">High</option>
          </select>
        </label>
        <label>
          Camera sensitivity
          <input
            aria-label="Camera sensitivity"
            type="range"
            min=".4"
            max="1.8"
            step=".1"
            value={s.settings.sensitivity}
            onChange={(e) =>
              update((v) => ({
                ...v,
                settings: {
                  ...v.settings,
                  sensitivity: Number(e.target.value),
                },
              }))
            }
          />
        </label>
        <label>
          Camera motion
          <input
            type="checkbox"
            checked={s.settings.motion}
            onChange={(e) =>
              update((v) => ({
                ...v,
                settings: { ...v.settings, motion: e.target.checked },
              }))
            }
          />
        </label>
      </div>
      <div className="controls-table">
        <span>Move / look</span>
        <b>WASD / drag</b>
        <span>Sprint / jump</span>
        <b>Shift / Space</b>
        <span>Interact / pause</span>
        <b>E / Escape</b>
        <span>Strike / dodge</span>
        <b>F / Q · Living Quest</b>
        <span>Inventory / journal</span>
        <b>I / J</b>
        <span>Zoom / clean view</span>
        <b>Wheel / H</b>
        <span>Mobile</span>
        <b>Left joystick · right drag</b>
      </div>
      <button className="primary" onClick={() => command("resume")}>
        Return to the world <span>→</span>
      </button>
      <details className="investor">
        <summary>Investor Demo Mode</summary>
        <p className="muted">
          Live gameplay and authored sequences. Replay unlocks after the
          Dawnblade is earned.
        </p>
        <div className="investor-actions">
          <button onClick={() => command("replay-opening")}>
            Replay opening
          </button>
          <button
            disabled={!s.quest.sword}
            onClick={() => command("replay-sword")}
          >
            Replay the Dawnblade
          </button>
          <button
            onClick={() => {
              useGame.setState({ hud: false });
              command("resume");
            }}
          >
            Hide HUD · press H to restore
          </button>
          <button onClick={() => command("unstuck")}>
            Return to this world’s entrance
          </button>
          <button
            onClick={() => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(
                new Blob([JSON.stringify(s, null, 2)], {
                  type: "application/json",
                }),
              );
              a.download = "last-save-progress.json";
              a.click();
              URL.revokeObjectURL(a.href);
            }}
          >
            Export progress
          </button>
          <button onClick={() => setConfirm(true)}>
            Start a fresh demonstration
          </button>
        </div>
        {confirm && (
          <div className="confirm">
            <p>Reset local progress and begin a new story?</p>
            <button onClick={() => command("reset")}>Reset & begin</button>
            <button onClick={() => setConfirm(false)}>Keep my story</button>
          </div>
        )}
      </details>
      <a
        className="source-link"
        href="https://github.com/hamzahelhafdaoui/last-save-demo-3d-v0.1/tree/experiment/amazigh"
        target="_blank"
        rel="noreferrer"
      >
        Editable source on GitHub ↗
      </a>
    </Modal>
  );
}
export function Interface() {
  const g = useGame(),
    s = g.save,
    mode = g.mode,
    goal = objective(s),
    cinema = ["opening", "cinematic", "ending"].includes(mode);
  return (
    <>
      <div id="flash" aria-hidden="true" />
      {(mode === "loading" || mode === "transition") && (
        <div className="loading">
          <span className="crest">✦</span>
          <h2>{g.loading}</h2>
          <p>One character. Every world.</p>
        </div>
      )}
      {mode === "title" && (
        <section className="title">
          <div className="title-top">
            <span>AMAN · AN ALTERNATE CHAPTER</span>
            <span>ATLAS HIGHLANDS & SOUTHERN OASIS</span>
          </div>
          <div className="title-body">
            <span className="eyebrow">STORIES CARRIED. WATER SHARED.</span>
            <h1>
              LAST SAVE<span className="aman-title">AMAN</span>
            </h1>
            <p>Every place stays with you.</p>
            <button className="primary" onClick={() => command("start")}>
              {s.created ? "Continue your story" : "Begin the journey"}{" "}
              <span>→</span>
            </button>
            <small>
              An original North African and Amazigh-inspired fantasy.
            </small>
          </div>
          <div
            className="experience-select"
            role="group"
            aria-label="Choose experience"
          >
            <span className="eyebrow">CHOOSE YOUR PACE</span>
            {(
              [
                [
                  "tour",
                  "Story tour",
                  "A welcoming journey. Explore, help and bring your stories home.",
                ],
                [
                  "adventure",
                  "Adventure",
                  "The same communities. A timed passage, real retries.",
                ],
                [
                  "quest",
                  "Living quest",
                  "An herbalist’s errand, trail encounters and a keepsake.",
                ],
              ] as const
            ).map(([id, title, detail]) => (
              <button
                key={id}
                aria-pressed={s.experience === id}
                className={s.experience === id ? "selected" : ""}
                onClick={() => g.update((v) => ({ ...v, experience: id }))}
              >
                <span>{title}</span>
                <small>{detail}</small>
                {id === "quest" && <em>EXPERIMENTAL</em>}
              </button>
            ))}
          </div>
          <div className="title-bottom">
            <span>ONE CHARACTER. EVERY WORLD.</span>
            <button onClick={() => command("pause")}>Controls & comfort</button>
          </div>
        </section>
      )}
      {mode === "customize" && <Customizer />}
      <div id="hud" hidden={mode !== "play" || !g.hud}>
        <div className="world-name">
          <span className="crest">✧</span>
          <div>
            <span className="eyebrow">
              {s.world === "lumen"
                ? "TIZI HIGHLANDS"
                : s.world === "city"
                  ? "ANOTHER WORLD. THE SAME YOU."
                  : "YOUR PERMANENT SANCTUARY"}
            </span>
            <h2>{g.region}</h2>
          </div>
        </div>
        <div className="objective">
          <span className="eyebrow">
            {s.quest.accepted && !s.quest.sword
              ? `${s.quest.echoes.length} / 3 COMMUNITY RECORDS`
              : "YOUR STORY"}
          </span>
          <h3>{goal.title}</h3>
          <p>{goal.detail}</p>
          {g.distance > 4 && <small>✧ {Math.round(g.distance)} m</small>}
        </div>
        {s.experience === "quest" && g.enemyCount > 0 && (
          <div className="encounter-hud">
            <span className="eyebrow">
              HOLLOW WARDENS · {g.enemyCount} REMAIN
            </span>
            <div className="health">
              <span style={{ width: g.health + "%" }} />
            </div>
            <p>F strike · Q dodge · watch their wind-up</p>
          </div>
        )}
        {g.challengeRemaining > 0 && (
          <div className="challenge-clock">
            Crossing fades in {Math.ceil(g.challengeRemaining)}s
          </div>
        )}
        <nav className="hud-nav">
          <button aria-label="Inventory" onClick={() => command("inventory")}>
            ◇ <span>Inventory</span>
            <kbd>I</kbd>
          </button>
          <button aria-label="Journal" onClick={() => command("journal")}>
            ▤ <span>Journal</span>
            <kbd>J</kbd>
          </button>
          <button aria-label="Pause game" onClick={() => command("pause")}>
            ☰ <span>Menu</span>
            <kbd>Esc</kbd>
          </button>
        </nav>
        <p className="desktop-help">
          WASD move <i>·</i> Drag look <i>·</i> Shift sprint <i>·</i> Space jump
        </p>
        {g.prompt && (
          <div className="interaction">
            <span>{g.region}</span>
            <div>
              <kbd>E</kbd>
              {g.prompt}
            </div>
          </div>
        )}
      </div>
      {mode === "play" && !g.hud && (
        <button
          className="restore-controls"
          onClick={() => useGame.setState({ hud: true })}
        >
          Show controls
        </button>
      )}
      <div
        className={
          "touch-controls " + (mode === "play" && g.hud ? "active" : "")
        }
      >
        <div id="joystick" role="group" aria-label="Movement joystick">
          <div className="joystick-ring" />
          <div id="stick" />
        </div>
        <span id="touch-hint">Drag right to look</span>
        {s.experience === "quest" && (
          <>
            <button
              className="touch-strike"
              aria-label="Strike"
              onPointerDown={(e) => {
                e.preventDefault();
                command("strike");
              }}
            >
              ⚔
            </button>
            <button
              className="touch-dodge"
              aria-label="Dodge"
              onPointerDown={(e) => {
                e.preventDefault();
                command("dodge");
              }}
            >
              ↯
            </button>
          </>
        )}
        <button id="jump" aria-label="Jump">
          ↟
        </button>
        <button
          id="action"
          aria-label={g.prompt || "Interact"}
          hidden={!g.prompt}
        >
          ✦
        </button>
      </div>
      {g.notice && mode === "play" && g.hud && (
        <div className="notice" key={g.notice.id} role="status">
          <span className="eyebrow">{g.notice.sub}</span>
          <h2>{g.notice.title}</h2>
        </div>
      )}
      {mode === "pause" && <Pause />}
      {mode === "inventory" && <Inventory />}
      {mode === "journal" && <Journal />}
      {mode === "dialogue" && g.dialogue && (
        <div className="dialogue-wrap">
          <section
            className="dialogue"
            role="dialog"
            aria-label={`Conversation with ${g.dialogue.speaker}`}
          >
            <span className="eyebrow">{g.dialogue.role}</span>
            <h2>{g.dialogue.speaker}</h2>
            {g.dialogue.lines.map((l, i) => (
              <p key={i}>{l}</p>
            ))}
            <button
              className="primary"
              onClick={() => command("dialogue-confirm")}
            >
              {g.dialogue.button}
              <span>→</span>
            </button>
            {g.dialogue.alternate && (
              <button
                className="dialogue-alternate"
                onClick={() => command("dialogue-alternate")}
              >
                {g.dialogue.alternate.label}
              </button>
            )}
          </section>
        </div>
      )}
      {cinema && (
        <>
          <div className="letterbox top" />
          <div className="letterbox bottom" />
          <button className="skip" onClick={() => command("skip")}>
            {mode === "opening"
              ? "Skip opening"
              : mode === "ending"
                ? "Return to the room"
                : "Skip sequence"}{" "}
            ↗
          </button>
          {mode === "opening" && (
            <div
              className="opening-words"
              style={{
                opacity: g.cinematicTime < 2 ? 0 : g.cinematicTime > 18 ? 0 : 1,
              }}
            >
              {g.cinematicTime < 10 ? (
                <>
                  <span className="eyebrow">EVERY DOORWAY IS A BEGINNING.</span>
                  <h2>
                    Somewhere,
                    <br />a world is waiting.
                  </h2>
                </>
              ) : (
                <>
                  <span className="eyebrow">YOUR STORY CONTINUES.</span>
                  <h1>
                    LAST SAVE<span className="aman-title">AMAN</span>
                  </h1>
                </>
              )}
            </div>
          )}
          {g.cinematic === "arrival" && (
            <div className="cinematic-caption">
              <span className="eyebrow">BEYOND THE FIRST DOOR</span>
              <h1>Tizi Highlands</h1>
            </div>
          )}
          {g.cinematic === "dawnwake" && (
            <div className="cinematic-caption">
              <span className="eyebrow">
                {g.cinematicTime < 8
                  ? "A STORY KEPT BY MANY HANDS"
                  : g.cinematicTime < 22
                    ? "SOME THINGS REFUSE TO BE FORGOTTEN."
                    : "THE DAWN REMEMBERS YOU."}
              </span>
            </div>
          )}
          {mode === "ending" && g.cinematicTime > 4 && (
            <div className="ending-words">
              <h2>
                One character.
                <br />
                Every world.
              </h2>
              <p>Your story continues.</p>
              <span>LAST SAVE</span>
            </div>
          )}
        </>
      )}
      {mode === "reveal" && (
        <div className="reveal">
          <span className="eyebrow">A STORY WORTH CARRYING</span>
          <div className="reveal-model">
            <ItemView id="dawnwake" />
          </div>
          <h1>THE DAWNBLADE</h1>
          <p>“The work of many hands. The beginning of another story.”</p>
          <button className="primary" onClick={() => command("reveal-close")}>
            Carry it into the next world <span>→</span>
          </button>
        </div>
      )}
      {mode === "error" && (
        <div className="failure" role="alert">
          <span className="crest">✦</span>
          <h1>A doorway closed unexpectedly.</h1>
          <p>{g.error}</p>
          <button className="primary" onClick={() => location.reload()}>
            Reload the game
          </button>
          <a href="https://github.com/hamzahelhafdaoui/last-save-demo-3d-v0.1/tree/experiment/amazigh">
            Source code & issues ↗
          </a>
        </div>
      )}
    </>
  );
}
