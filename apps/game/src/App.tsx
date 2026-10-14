import { useEffect } from "react";
import { stopSpeaking } from "./audio/narrator";
import { configureSound } from "./audio/sound";
import { useGame } from "./state/store";
import { Confetti } from "./ui/Confetti";
import { DragGhost } from "./ui/dnd/DragGhost";
import { ResultDialog } from "./ui/dialogs/ResultDialog";
import { TeacherPanel } from "./ui/dialogs/TeacherPanel";
import { CollectionScreen } from "./ui/screens/CollectionScreen";
import { MapScreen } from "./ui/screens/MapScreen";
import { PlayScreen } from "./ui/screens/PlayScreen";
import { ProfileScreen } from "./ui/screens/ProfileScreen";
import { TitleScreen } from "./ui/screens/TitleScreen";

export function App() {
  const screen = useGame((s) => s.screen);
  const nonce = useGame((s) => s.screenNonce);
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
      <div className="screen-enter" key={nonce}>
        {screen === "title" && <TitleScreen />}
        {screen === "profile" && <ProfileScreen />}
        {screen === "map" && <MapScreen />}
        {screen === "play" && <PlayScreen />}
        {screen === "collection" && <CollectionScreen />}
      </div>
      <ResultDialog />
      <TeacherPanel />
      <DragGhost />
      <Confetti />
    </div>
  );
}
