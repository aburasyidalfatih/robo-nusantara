import { useEffect } from "react";
import { stopSpeaking } from "./audio/narrator";
import { configureSound } from "./audio/sound";
import { useGame } from "./state/store";
import { Confetti } from "./ui/Confetti";
import { DragGhost } from "./ui/dnd/DragGhost";
import { ResultDialog } from "./ui/dialogs/ResultDialog";
import { TeacherPanel } from "./ui/dialogs/TeacherPanel";
import { MapScreen } from "./ui/screens/MapScreen";
import { PlayScreen } from "./ui/screens/PlayScreen";
import { TitleScreen } from "./ui/screens/TitleScreen";

export function App() {
  const screen = useGame((s) => s.screen);
  const sfx = useGame((s) => s.settings.sfx);
  const music = useGame((s) => s.settings.music);

  useEffect(() => configureSound({ sfx, music }), [sfx, music]);

  useEffect(() => {
    const onHide = () => document.hidden && stopSpeaking();
    document.addEventListener("visibilitychange", onHide);
    return () => document.removeEventListener("visibilitychange", onHide);
  }, []);

  return (
    <div className="app">
      {screen === "title" && <TitleScreen />}
      {screen === "map" && <MapScreen />}
      {screen === "play" && <PlayScreen />}
      <ResultDialog />
      <TeacherPanel />
      <DragGhost />
      <Confetti />
    </div>
  );
}
