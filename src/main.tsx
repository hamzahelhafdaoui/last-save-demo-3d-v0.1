import React, {
  useEffect,
  useRef,
  useState,
  Component,
  type ReactNode,
} from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useThree, useFrame } from "@react-three/fiber";
import { AdaptiveDpr } from "@react-three/drei";
import * as T from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";
import { GameRuntime } from "./game/runtime";
import { useGame } from "./state/store";
import { Interface } from "./ui/Interface";
import "./style.css";
function Runtime() {
  const { scene, camera, gl } = useThree(),
    ref = useRef<GameRuntime | null>(null);
  useEffect(() => {
    const game = new GameRuntime(scene, camera as T.PerspectiveCamera, gl);
    ref.current = game;
    game.init().catch((e) => {
      console.error(e);
      useGame.setState({
        mode: "error",
        error:
          "The game could not start. Check WebGL 2 support and reload. Your existing save is safe.",
      });
    });
    return () => {
      game.dispose();
      ref.current = null;
    };
  }, [scene, camera, gl]);
  useFrame((_, dt) => ref.current?.update(dt));
  return <AdaptiveDpr pixelated />;
}
class ErrorBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  render() {
    return this.state.error ? (
      <div className="failure">
        <h1>A doorway closed unexpectedly.</h1>
        <p>Your last save is still on this device.</p>
        <button onClick={() => location.reload()}>Reload the game</button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function App() {
  const quality = useGame((s) => s.save.settings.quality);
  return (
    <ErrorBoundary>
      <Canvas
        shadows={quality !== "low"}
        dpr={quality === "low" ? 1 : quality === "high" ? [1, 1.8] : [1, 1.25]}
        camera={{ fov: 60, near: 0.1, far: 450 }}
        gl={{
          antialias: quality !== "low",
          powerPreference: "high-performance",
          toneMapping: T.ACESFilmicToneMapping,
          toneMappingExposure: 1.12,
        }}
        onCreated={({ gl, scene }) => {
          const room = new RoomEnvironment(),
            pmrem = new T.PMREMGenerator(gl);
          scene.environment = pmrem.fromScene(room, 0.04).texture;
          room.dispose();
          pmrem.dispose();
          gl.shadowMap.type = T.PCFSoftShadowMap;
          gl.domElement.tabIndex = 0;
          gl.domElement.setAttribute(
            "aria-label",
            "LAST SAVE. WASD move, Shift sprint, Space jump, drag to look, E interact.",
          );
        }}
      >
        <Runtime />
      </Canvas>
      <Interface />
    </ErrorBoundary>
  );
}
createRoot(document.getElementById("root")!).render(<App />);
