package dev.projetor.controle;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Shell commands for the HY300 projector and parsers for their output. */
public final class ProjectorCommands {

    public static final int KEY_HOME = 3;
    public static final int KEY_BACK = 4;
    public static final int KEY_UP = 19;
    public static final int KEY_DOWN = 20;
    public static final int KEY_LEFT = 21;
    public static final int KEY_RIGHT = 22;
    public static final int KEY_CENTER = 23;
    public static final int KEY_ENTER = 66;
    public static final int KEY_DEL = 67;
    public static final int KEY_VOLUME_UP = 24;
    public static final int KEY_VOLUME_DOWN = 25;
    public static final int KEY_MENU = 82;
    public static final int KEY_PLAY_PAUSE = 85;
    public static final int KEY_NEXT = 87;
    public static final int KEY_PREVIOUS = 88;
    public static final int KEY_REWIND = 89;
    public static final int KEY_FAST_FORWARD = 90;
    public static final int KEY_SLEEP = 223;
    public static final int KEY_WAKEUP = 224;

    /** Active media sessions: which app plays what, and whether it is playing. */
    public static final String MEDIA_QUERY = "dumpsys media_session";

    public static final String VOLUME_QUERY = "dumpsys audio | grep -A 9 '^- STREAM_MUSIC'";

    public static final String APPS_QUERY =
            "cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LEANBACK_LAUNCHER;"
                    + " cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LAUNCHER";

    /** Same clean power-off as the projector's own "Shutdown" option; the IR power key wakes it. */
    public static final String SHUTDOWN = "svc power shutdown";
    public static final String REBOOT = "svc power reboot";

    public static final String OPEN_PROJECTOR_SETTINGS = "am start -n com.htc.htcsettings/com.htc.activity.HomeActivity";
    public static final String OPEN_SETTINGS = "am start -a android.settings.SETTINGS";
    public static final String OPEN_WIFI = "am start -a android.settings.WIFI_SETTINGS";
    // Android TV has no BLUETOOTH_SETTINGS screen; pairing lives in "Add accessory".
    public static final String OPEN_BLUETOOTH = "am start -a com.google.android.intent.action.CONNECT_INPUT";

    private static final Pattern MAX = Pattern.compile("Max:\\s*(\\d+)");
    private static final Pattern STREAM_VOLUME = Pattern.compile("streamVolume:\\s*(\\d+)");
    private static final Pattern CURRENT = Pattern.compile("Current:[^:]*:\\s*(\\d+)");
    private static final Pattern STATE = Pattern.compile("state=PlaybackState \\{state=(\\d+)");
    private static final Pattern COMPONENT = Pattern.compile("[\\w.]+/[\\w.$]+");

    private static final Map<String, String> LABELS = new LinkedHashMap<>();
    private static final Set<String> HIDDEN = new HashSet<>(Arrays.asList(
            "com.android.calculator2",
            "com.htc.htcotaupdate",
            "com.android.gallery3d",
            "com.htc.htcsettings",
            "com.softwinner.TvdFileManager",
            "com.google.android.youtube",
            "com.google.android.youtube.tv",
            "com.google.android.play.games",
            "com.amazon.avod.thirdpartyclient",
            "dev.projetor.controle",
            "dev.projetor.receptor"));

    static {
        LABELS.put("org.smarttube.stable", "YouTube (SmartTube)");
        LABELS.put("com.netflix.ninja", "Netflix");
        LABELS.put("com.netflix.mediaclient", "Netflix");
        LABELS.put("com.amazon.amazonvideo.livingroom", "Prime Video");
        LABELS.put("com.disneyplus.mea", "Disney+");
        LABELS.put("com.wbd.stream", "Max");
        LABELS.put("com.apple.atve.androidtv.appletv", "Apple TV");
        LABELS.put("com.crunchyroll.crunchyroid", "Crunchyroll");
        LABELS.put("com.google.android.apps.youtube.music", "YouTube Music");
        LABELS.put("com.waxrain.airplaydmr2", "AirPlay");
        LABELS.put("com.softwinner.miracastReceiver", "Espelhar tela");
        LABELS.put("com.android.chrome", "Chrome");
        LABELS.put("com.android.music", "Música");
        LABELS.put("com.android.vending", "Play Store");
        LABELS.put("cm.aptoide.pt", "Aptoide");
    }

    private ProjectorCommands() {
    }

    public static final class App {
        public final String packageName;
        public final String component;
        public final String label;

        App(String packageName, String component, String label) {
            this.packageName = packageName;
            this.component = component;
            this.label = label;
        }
    }

    /** What the projector is playing, from {@link #MEDIA_QUERY}. */
    public static final class NowPlaying {
        public final String packageName;
        public final String title;
        public final String subtitle;
        /** PlaybackState: 3 playing, 2 paused, 6 buffering, 1 stopped. */
        public final int state;

        NowPlaying(String packageName, String title, String subtitle, int state) {
            this.packageName = packageName;
            this.title = title;
            this.subtitle = subtitle;
            this.state = state;
        }

        public boolean isPlaying() {
            return state == 3 || state == 6;
        }

        public String appLabel() {
            return label(packageName);
        }
    }

    /**
     * Picks the session that is playing (else paused) from `dumpsys media_session`. Each session block
     * has "package=", "active=", "state=PlaybackState {state=N, ..." and "metadata: ..., description=
     * title, subtitle, description". Returns null when nothing is playing or paused.
     */
    public static NowPlaying parseNowPlaying(String out) {
        if (out == null) return null;
        NowPlaying best = null;
        String pkg = null;
        boolean active = false;
        int state = 0;
        String title = "";
        String subtitle = "";
        String[] lines = (out + "\npackage=").split("\n");
        for (String raw : lines) {
            String line = raw.trim();
            if (line.startsWith("package=")) {
                if (pkg != null && active && (state == 3 || state == 6 || state == 2)) {
                    NowPlaying np = new NowPlaying(pkg, title, subtitle, state);
                    if (best == null || (np.isPlaying() && !best.isPlaying())) best = np;
                }
                pkg = line.substring(8).trim();
                active = false;
                state = 0;
                title = "";
                subtitle = "";
            } else if (line.startsWith("active=")) {
                active = line.equals("active=true");
            } else if (line.startsWith("state=PlaybackState {state=")) {
                Matcher m = STATE.matcher(line);
                if (m.find()) state = Integer.parseInt(m.group(1));
            } else if (line.startsWith("metadata:") && line.contains("description=")) {
                String d = line.substring(line.indexOf("description=") + 12);
                // MediaDescription.toString(): "title, subtitle, description"
                int last = d.lastIndexOf(", ");
                int prev = last > 0 ? d.lastIndexOf(", ", last - 1) : -1;
                if (prev >= 0) {
                    title = clean(d.substring(0, prev));
                    subtitle = clean(d.substring(prev + 2, last));
                } else {
                    title = clean(d);
                }
            }
        }
        return best;
    }

    private static String clean(String s) {
        String t = s.trim();
        return t.equals("null") ? "" : t;
    }

    public static String key(int keycode) {
        return "input keyevent " + keycode;
    }

    public static String setVolume(int volume) {
        return "cmd media_session volume --stream 3 --set " + volume;
    }

    /** Returns {current, max}, or null if the output could not be read. */
    public static int[] parseVolume(String out) {
        if (out == null) return null;
        Matcher max = MAX.matcher(out);
        if (!max.find()) return null;
        Matcher cur = STREAM_VOLUME.matcher(out);
        if (!cur.find()) {
            cur = CURRENT.matcher(out);
            if (!cur.find()) return null;
        }
        return new int[] {Integer.parseInt(cur.group(1)), Integer.parseInt(max.group(1))};
    }

    public static List<App> parseApps(String out) {
        return parseApps(out, null);
    }

    /** Same as {@link #parseApps(String)}, naming unknown apps with {@code realLabels} (package to label). */
    public static List<App> parseApps(String out, Map<String, String> realLabels) {
        Map<String, App> byPackage = new LinkedHashMap<>();
        Set<String> labels = new HashSet<>();
        if (out != null) {
            for (String line : out.split("\n")) {
                String component = line.trim();
                if (!COMPONENT.matcher(component).matches()) continue;
                String pkg = component.substring(0, component.indexOf('/'));
                if (HIDDEN.contains(pkg) || byPackage.containsKey(pkg)) continue;
                String label = label(pkg);
                if (!LABELS.containsKey(pkg) && realLabels != null && realLabels.containsKey(pkg)) label = realLabels.get(pkg);
                if (!labels.add(label)) continue;
                byPackage.put(pkg, new App(pkg, component, label));
            }
        }
        List<String> order = new ArrayList<>(LABELS.keySet());
        List<App> apps = new ArrayList<>(byPackage.values());
        apps.sort((a, b) -> {
            int ia = order.indexOf(a.packageName);
            int ib = order.indexOf(b.packageName);
            if (ia < 0) ia = Integer.MAX_VALUE;
            if (ib < 0) ib = Integer.MAX_VALUE;
            if (ia != ib) return Integer.compare(ia, ib);
            return a.label.compareToIgnoreCase(b.label);
        });
        return apps;
    }

    public static String launch(App app) {
        return "am start -n '" + app.component + "'";
    }

    /** `input text` only types ASCII; accents are dropped and spaces become %s. Returns null if nothing to type. */
    public static String inputText(String text) {
        String plain = Normalizer.normalize(text, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        StringBuilder b = new StringBuilder();
        for (char c : plain.toCharArray()) {
            if (c == ' ') b.append("%s");
            else if (c > 32 && c < 127) b.append(c);
        }
        if (b.length() == 0) return null;
        return "input text '" + b.toString().replace("'", "'\\''") + "'";
    }

    private static String label(String pkg) {
        String known = LABELS.get(pkg);
        if (known != null) return known;
        String last = pkg.substring(pkg.lastIndexOf('.') + 1);
        return last.isEmpty() ? pkg : Character.toUpperCase(last.charAt(0)) + last.substring(1);
    }
}
