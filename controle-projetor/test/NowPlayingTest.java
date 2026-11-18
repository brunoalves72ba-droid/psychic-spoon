import dev.projetor.controle.ProjectorCommands;

/** Parsing of `dumpsys media_session` (Android 11 layout). Run with: ./build.sh test */
public class NowPlayingTest {

    static int failures;

    public static void main(String[] args) {
        String dump = String.join("\n",
                "MEDIA SESSION SERVICE (dumpsys media_session)",
                "Sessions Stack - have 2 sessions:",
                "  Music com.android.music/MediaPlaybackService (userId=0)",
                "    ownerPid=812, ownerUid=10044, userId=0",
                "    package=com.android.music",
                "    active=true",
                "    flags=3",
                "    state=PlaybackState {state=2, position=0, buffered position=0, speed=0.0, updated=1, actions=0, custom actions=[], active item id=-1, error=null}",
                "    metadata: size=3, description=Antiga, Artista, null",
                "  SmartTube org.smarttube.stable/SmartTube (userId=0)",
                "    ownerPid=1201, ownerUid=10071, userId=0",
                "    package=org.smarttube.stable",
                "    active=true",
                "    state=PlaybackState {state=3, position=81234, buffered position=0, speed=1.0, updated=2, actions=0, custom actions=[], active item id=-1, error=null}",
                "    metadata: size=7, description=Show ao vivo, parte 2, Canal da Banda, null",
                "    queueTitle=null, size=0");
        ProjectorCommands.NowPlaying np = ProjectorCommands.parseNowPlaying(dump);
        check("escolhe a sessão tocando em vez da pausada", np != null && np.packageName.equals("org.smarttube.stable"));
        check("título com vírgula fica inteiro", np != null && np.title.equals("Show ao vivo, parte 2"));
        check("subtítulo é o canal", np != null && np.subtitle.equals("Canal da Banda"));
        check("estado tocando", np != null && np.isPlaying() && np.appLabel().equals("YouTube (SmartTube)"));

        String paused = dump.replace("state=3,", "state=1,");
        ProjectorCommands.NowPlaying p = ProjectorCommands.parseNowPlaying(paused);
        check("sem nada tocando, mostra a pausada", p != null && p.packageName.equals("com.android.music") && !p.isPlaying()
                && p.title.equals("Antiga") && p.subtitle.equals("Artista"));
        check("sem sessões, nada", ProjectorCommands.parseNowPlaying("Sessions Stack - have 0 sessions:") == null
                && ProjectorCommands.parseNowPlaying(null) == null);
        if (failures > 0) System.exit(1);
    }

    static void check(String what, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "ok   " : "ERRO ") + what);
    }
}
