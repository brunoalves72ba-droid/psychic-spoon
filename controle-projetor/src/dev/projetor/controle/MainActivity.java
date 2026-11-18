package dev.projetor.controle;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.pm.ActivityInfo;
import android.content.res.ColorStateList;
import android.content.res.Configuration;
import android.graphics.Color;
import android.graphics.Insets;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.hardware.ConsumerIrManager;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.NetworkRequest;
import android.os.Build;
import android.hardware.display.DisplayManager;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.text.InputType;
import android.text.TextUtils;
import android.view.Display;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowManager;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.HorizontalScrollView;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.Space;
import android.widget.TextView;
import android.widget.Toast;
import java.io.IOException;
import java.io.InputStream;
import java.net.ConnectException;
import java.net.Inet4Address;
import java.net.NoRouteToHostException;
import java.net.SocketTimeoutException;
import java.security.KeyPair;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;

public class MainActivity extends Activity {

    private static final int PORT = 5555;
    private static final String DEFAULT_HOST = "192.168.0.5";
    private static final String[] TAB_NAMES = {"Controle", "Mídia", "Touchpad", "Apps", "Ajustes"};
    private static final int[] TAB_ICONS = {R.drawable.ic_remote, R.drawable.ic_music, R.drawable.ic_mouse,
            R.drawable.ic_apps, R.drawable.ic_settings};
    /** A touch that barely moves would register as a tap on the projector, so swipes start past this. */
    private static final int SWIPE_START_PX = 16;
    /** A full scan of the Wi-Fi takes a couple of seconds, so automatic ones are spaced out. */
    private static final long SCAN_INTERVAL_MS = 20000;

    private static final Map<String, Object[]> BRANDS = new HashMap<>();

    static {
        BRANDS.put("org.smarttube.stable", new Object[] {0xFFE62117, "YT"});
        BRANDS.put("com.netflix.mediaclient", new Object[] {0xFFE50914, "N"});
        BRANDS.put("com.netflix.ninja", new Object[] {0xFFE50914, "N"});
        BRANDS.put("com.amazon.amazonvideo.livingroom", new Object[] {0xFF00A8E1, "PV"});
        BRANDS.put("com.disneyplus.mea", new Object[] {0xFF1A3DD1, "D+"});
        BRANDS.put("com.wbd.stream", new Object[] {0xFF0033E6, "M"});
        BRANDS.put("com.apple.atve.androidtv.appletv", new Object[] {0xFF3A3A3C, "tv"});
        BRANDS.put("com.crunchyroll.crunchyroid", new Object[] {0xFFF47521, "CR"});
        BRANDS.put("com.google.android.apps.youtube.music", new Object[] {0xFFFF0033, "♪"});
        BRANDS.put("com.waxrain.airplaydmr2", new Object[] {0xFF636366, "AP"});
        BRANDS.put("com.softwinner.miracastReceiver", new Object[] {0xFF0F9D8A, "ET"});
        BRANDS.put("com.android.chrome", new Object[] {0xFF4285F4, "C"});
        BRANDS.put("com.android.music", new Object[] {0xFF8E5CF6, "♫"});
        BRANDS.put("com.android.vending", new Object[] {0xFF01875F, "PS"});
        BRANDS.put("cm.aptoide.pt", new Object[] {0xFFFE6446, "A"});
    }

    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final ExecutorService inputWorker = Executors.newSingleThreadExecutor();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final Object inputLock = new Object();

    private SharedPreferences prefs;
    private volatile AdbClient client;
    private volatile InputInjector injector;
    private volatile String host;
    private volatile boolean connected;
    private volatile boolean loaded;
    private volatile boolean waking;
    private volatile long lastFailure;
    private volatile long lastInjectorFailure;
    private volatile long lastScan;
    /** How the app reaches the projector: ADB (debugging on) or the receiver app (debugging off). */
    private static final int MODE_ADB = 1;
    private static final int MODE_RECEIVER = 2;
    private volatile int mode;
    private final ReceiverClient receiver = new ReceiverClient();
    /** Address of a receiver that answered but does not know this phone yet. */
    private volatile String pairingHost;
    private boolean pairingAsked;
    private AlertDialog pairDialog;
    private volatile String scanMessage;
    private ConnectivityManager.NetworkCallback wifiCallback;
    private volatile String menuHint;
    private volatile int volume = -1;
    private volatile int maxVolume = 20;
    private volatile int volumeBeforeMute = 5;
    private int wakeAttempts;

    // pending touchpad input, guarded by inputLock
    private int pendingDx;
    private int pendingDy;
    private int pendingScrollX;
    private int pendingScrollY;
    private boolean pendingScrollEnd;
    private boolean flushScheduled;
    // swipe state, inputWorker thread only
    private boolean touching;
    private int touchX;
    private int touchY;
    private int swipeStartX;
    private int swipeStartY;
    private int keyScrollAcc;

    private View statusDot;
    private TextView statusText;
    private final View[] pages = new View[5];
    private LinearLayout appsGrid;
    private EditText textField;
    private EditText hostField;
    private TouchpadView touchpad;
    private LinearLayout shortcutsCard;
    private LinearLayout shortcutsRow;
    private TextView appsCount;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("controle", MODE_PRIVATE);
        host = prefs.getString("host", DEFAULT_HOST);
        Style.init(this);
        // phones stay upright; tablets turn freely and get the two-column layout when wide enough
        if (getResources().getConfiguration().smallestScreenWidthDp < 600) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_PORTRAIT);
        }
        getWindow().setBackgroundDrawable(new ColorDrawable(Style.BG));
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        if (Build.VERSION.SDK_INT >= 30) {
            getWindow().setDecorFitsSystemWindows(false);
        } else {
            getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                    | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        }
        setContentView(buildUi());
        selectTab(prefs.getInt("tab", 0), false);
        applyRefreshRate();
        watchWifi();
    }

    // ---------------------------------------------------------------- 120 Hz

    /**
     * Asks the display for its 120 Hz mode (or its fastest) at the current resolution, so lists,
     * springs and the clickpad animate at 120 frames per second on phones that support it. Off in
     * Ajustes, the system decides. On Android 15+ the views also vote for a high frame rate while
     * they draw, which matters on phones that lower the rate on their own (LTPO).
     */
    private void applyRefreshRate() {
        boolean on = prefs.getBoolean("hz120", true);
        Display display = currentDisplay();
        WindowManager.LayoutParams lp = getWindow().getAttributes();
        lp.preferredDisplayModeId = 0;
        lp.preferredRefreshRate = 0;
        if (on && display != null) {
            Display.Mode[] modes = display.getSupportedModes();
            Display.Mode current = display.getMode();
            float[][] table = new float[modes.length][];
            for (int i = 0; i < modes.length; i++) {
                table[i] = new float[] {modes[i].getPhysicalWidth(), modes[i].getPhysicalHeight(), modes[i].getRefreshRate()};
            }
            int pick = DisplayModes.pick(table, current.getPhysicalWidth(), current.getPhysicalHeight(), current.getRefreshRate());
            if (pick >= 0) {
                lp.preferredDisplayModeId = modes[pick].getModeId();
                lp.preferredRefreshRate = modes[pick].getRefreshRate();
            }
        }
        getWindow().setAttributes(lp);
        voteFrameRate(getWindow().getDecorView(), on);
        handler.postDelayed(this::showRefreshRate, 400);
    }

    @SuppressWarnings("deprecation")
    private Display currentDisplay() {
        if (Build.VERSION.SDK_INT >= 30) {
            try {
                Display d = getDisplay();
                if (d != null) return d;
            } catch (RuntimeException e) {
                // not a visual context yet: fall back to the window manager's display below
            }
        }
        return getWindowManager().getDefaultDisplay();
    }

    /** Android 15's per-view frame rate vote (looked up by name, as this app compiles against 14). */
    private static void voteFrameRate(View v, boolean high) {
        if (Build.VERSION.SDK_INT < 35) return;
        try {
            float value = View.class.getField(high ? "REQUESTED_FRAME_RATE_CATEGORY_HIGH"
                    : "REQUESTED_FRAME_RATE_CATEGORY_DEFAULT").getFloat(null);
            java.lang.reflect.Method set = View.class.getMethod("setRequestedFrameRate", float.class);
            voteTree(v, set, value);
        } catch (ReflectiveOperationException | RuntimeException ignored) {
            // older Android 15 previews: the display mode request above still applies
        }
    }

    private static void voteTree(View v, java.lang.reflect.Method set, float value) throws ReflectiveOperationException {
        set.invoke(v, value);
        if (v instanceof ViewGroup) {
            ViewGroup g = (ViewGroup) v;
            for (int i = 0; i < g.getChildCount(); i++) voteTree(g.getChildAt(i), set, value);
        }
    }

    private final DisplayManager.DisplayListener displayListener = new DisplayManager.DisplayListener() {
        @Override
        public void onDisplayAdded(int displayId) {
        }

        @Override
        public void onDisplayRemoved(int displayId) {
        }

        @Override
        public void onDisplayChanged(int displayId) {
            showRefreshRate();
        }
    };

    private void showRefreshRate() {
        Display d = currentDisplay();
        if (refreshValue == null || d == null) return;
        refreshValue.setText(Math.round(d.getRefreshRate()) + " Hz");
    }

    /** Rotation and window resizes rebuild the screen in place; the connection is kept. */
    @Override
    public void onConfigurationChanged(Configuration newConfig) {
        super.onConfigurationChanged(newConfig);
        int tab = currentTab < 0 ? 0 : currentTab;
        currentTab = -1;
        setContentView(buildUi());
        selectTab(tab, false);
        applyRefreshRate();
        showVolume();
        showApps(lastApps);
        if (hostField != null) hostField.setText(host);
    }

    @Override
    protected void onPause() {
        super.onPause();
        handler.removeCallbacks(mediaPoll);
        DisplayManager dm = getSystemService(DisplayManager.class);
        if (dm != null) dm.unregisterDisplayListener(displayListener);
    }

    /** While Controle or Mídia is showing, asks every 3 s what the projector is playing (ADB only). */
    private final Runnable mediaPoll = new Runnable() {
        @Override
        public void run() {
            handler.removeCallbacks(this);
            if (connected && mode == MODE_ADB && (currentTab == 0 || currentTab == 1)) {
                onWorker(MainActivity.this::loadNowPlaying);
            }
            handler.postDelayed(this, 3000);
        }
    };

    private void loadNowPlaying() {
        String out = runShell(ProjectorCommands.MEDIA_QUERY);
        if (out == null) return;
        nowPlaying = ProjectorCommands.parseNowPlaying(out);
        runOnUiThread(this::showNowPlaying);
    }

    @Override
    protected void onResume() {
        super.onResume();
        lastFailure = 0;
        lastScan = 0;
        worker.execute(() -> {
            if (ensureConnected() && loaded) loadVolume();
        });
        handler.removeCallbacks(mediaPoll);
        handler.postDelayed(mediaPoll, 800);
        DisplayManager dm = getSystemService(DisplayManager.class);
        if (dm != null) dm.registerDisplayListener(displayListener, handler);
        showRefreshRate();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
        if (wifiCallback != null) {
            try {
                getSystemService(ConnectivityManager.class).unregisterNetworkCallback(wifiCallback);
            } catch (RuntimeException ignored) {
                // already gone
            }
        }
        worker.execute(() -> {
            if (client != null) client.close();
            receiver.close();
        });
        inputWorker.execute(() -> {
            if (injector != null) injector.close();
        });
        worker.shutdown();
        inputWorker.shutdown();
    }

    // ---------------------------------------------------------------- connection (worker thread)

    private boolean ensureConnected() {
        if (mode == MODE_ADB && client != null && client.isConnected()) return true;
        if (mode == MODE_RECEIVER && receiver.isConnected()) return true;
        connected = false;
        mode = 0;
        if (SystemClock.elapsedRealtime() - lastFailure < 3000) return false;
        try {
            if (client == null) {
                KeyPair keys = AdbClient.loadOrCreateKeyPair(getFilesDir());
                String name = "controle-celular@" + Build.MODEL.replace(' ', '_');
                client = new AdbClient(keys, name);
                injector = new InputInjector(keys, name);
            }
        } catch (Exception e) {
            lastFailure = SystemClock.elapsedRealtime();
            setStatus(describe(e), Style.RED);
            return false;
        }
        String saved = host;
        Exception error = null;
        if (!TextUtils.isEmpty(saved)) {
            error = tryConnect(saved);
            if (error == null) return true;
            // ADB refused: debugging is off, but the receiver app may be there. Skip when nothing answered.
            boolean unreachable = error instanceof SocketTimeoutException || error instanceof NoRouteToHostException;
            if (!unreachable && tryReceiver(saved)) return true;
        }
        // The last address did not answer (or there is none yet): look for the projector on this Wi-Fi.
        LanScanner.Result found = discover();
        if (found != null) {
            for (String h : found.adb) {
                if (h.equals(saved)) continue;
                error = tryConnect(h);
                if (error == null) return true;
            }
            for (String h : found.receivers) {
                if (tryReceiver(h)) return true;
            }
        }
        lastFailure = SystemClock.elapsedRealtime();
        if (waking) setStatus("Ligando o projetor… aguarde", Style.AMBER);
        else if (pairingHost != null) setStatus("Receptor encontrado: digite o código que aparece no projetor", Style.AMBER);
        else if ((found == null || found.isEmpty()) && scanMessage != null) setStatus(scanMessage, Style.RED);
        else if (error != null) setStatus(describe(error), Style.RED);
        return false;
    }

    /** Connects to {@code target} and remembers it; returns null on success, else the failure. */
    private Exception tryConnect(String target) {
        try {
            if (!waking) setStatus("Conectando a " + target + "…", Style.MUTED);
            client.connect(target, PORT, () -> setStatus(
                    "Aceite o pedido na tela do projetor (marque \"Sempre permitir\")", Style.AMBER));
        } catch (Exception e) {
            return e;
        }
        connected = true;
        mode = MODE_ADB;
        waking = false;
        if (!target.equals(host)) {
            host = target;
            prefs.edit().putString("host", target).apply();
            runOnUiThread(() -> {
                if (hostField != null) hostField.setText(target);
            });
        }
        setStatus("Conectado · " + target, Style.GREEN);
        inputWorker.execute(this::ensureInjector);
        if (!loaded) {
            loaded = true;
            loadVolume();
            loadApps();
        }
        return null;
    }

    /**
     * Scans the phone's Wi-Fi for the projector, by ADB over the network (port 5555) or by the
     * receiver app (port 7790). Returns null when it is too soon to scan again; sets
     * {@link #scanMessage} when nothing is found.
     */
    private LanScanner.Result discover() {
        if (SystemClock.elapsedRealtime() - lastScan < SCAN_INTERVAL_MS) return null;
        lastScan = SystemClock.elapsedRealtime();
        int[] net = wifiAddress();
        if (net == null) {
            scanMessage = "Conecte o celular ao mesmo Wi-Fi do projetor";
            return null;
        }
        if (!waking) setStatus("Procurando o projetor no Wi-Fi…", Style.MUTED);
        LanScanner.Result found = LanScanner.scan(LanScanner.hosts(net[0], net[1]), PORT, ReceiverClient.PORT, 400, 64);
        lastScan = SystemClock.elapsedRealtime();
        if (found.isEmpty()) {
            scanMessage = "Projetor não encontrado neste Wi-Fi. Ele está ligado, com a depuração por rede ou o receptor?";
            return found;
        }
        scanMessage = null;
        return found;
    }

    /** Connects to the receiver app; true when it knows this phone. Asks for the pairing code otherwise. */
    private boolean tryReceiver(String target) {
        try {
            receiver.connect(target, ReceiverClient.PORT, 2500);
        } catch (IOException e) {
            return false;
        }
        try {
            String token = prefs.getString("receptor_" + receiver.id(), null);
            if (token == null || !receiver.auth(token)) {
                pairingHost = target;
                if (!pairingAsked) {
                    pairingAsked = true;
                    runOnUiThread(this::askPairing);
                }
                return false;
            }
        } catch (IOException e) {
            return false;
        }
        receiverReady(target);
        return true;
    }

    private void receiverReady(String target) {
        pairingHost = null;
        mode = MODE_RECEIVER;
        connected = true;
        waking = false;
        if (!target.equals(host)) {
            host = target;
            prefs.edit().putString("host", target).apply();
            runOnUiThread(() -> {
                if (hostField != null) hostField.setText(target);
            });
        }
        setStatus("Conectado · " + target + " · receptor", Style.GREEN);
        if (!loaded) {
            loaded = true;
            loadVolume();
            loadApps();
        }
    }

    /** Asks for the 4-digit code the receiver shows on the projector. */
    private void askPairing() {
        if (pairDialog != null && pairDialog.isShowing()) return;
        String target = pairingHost != null ? pairingHost : host;
        if (TextUtils.isEmpty(target)) {
            Toast.makeText(this, "Procure o projetor no Wi-Fi primeiro", Toast.LENGTH_SHORT).show();
            return;
        }
        EditText code = field("Código", InputType.TYPE_CLASS_NUMBER);
        code.setGravity(Gravity.CENTER);
        code.setTextSize(26);
        code.setLetterSpacing(0.3f);
        FrameLayout box = new FrameLayout(this);
        box.setPadding(dp(22), dp(10), dp(22), 0);
        box.addView(code, new FrameLayout.LayoutParams(-1, dp(60)));
        pairDialog = new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle("Parear com o projetor")
                .setMessage("Digite o código de 4 números que apareceu na tela do projetor.")
                .setView(box)
                .setNegativeButton("Agora não", null)
                .setPositiveButton("Parear", (d, w) -> finishPairing(code.getText().toString()))
                .show();
        worker.execute(() -> {
            try {
                if (!receiver.isConnected() || !target.equals(receiver.host())) {
                    receiver.connect(target, ReceiverClient.PORT, 2500);
                }
                receiver.startPairing();
            } catch (IOException e) {
                setStatus("Receptor não encontrado em " + target, Style.RED);
                runOnUiThread(() -> {
                    if (pairDialog != null) pairDialog.dismiss();
                });
            }
        });
    }

    private void finishPairing(String code) {
        worker.execute(() -> {
            try {
                String token = receiver.finishPairing(code);
                if (token == null) {
                    setStatus("Código errado. Toque em \"Parear com o receptor\" na aba Mais.", Style.RED);
                    return;
                }
                prefs.edit().putString("receptor_" + receiver.id(), token).apply();
                if (mode == MODE_ADB) setStatus("Receptor pareado · a depuração já pode ser desligada", Style.GREEN);
                else receiverReady(receiver.host());
            } catch (IOException e) {
                setStatus("Falha ao parear: " + e.getMessage(), Style.RED);
            }
        });
    }

    private void pairManually() {
        if (pairingHost == null) pairingHost = host;
        askPairing();
    }

    /**
     * Installs the receiver on the projector through ADB, turns it on in the accessibility settings
     * and pairs with it, reading the code the receiver writes for this purpose. Needs debugging on.
     */
    private void installReceiver() {
        if (mode != MODE_ADB) {
            new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                    .setTitle("Precisa da depuração ligada")
                    .setMessage("Para o app instalar o receptor, a depuração por rede precisa estar ligada e o app "
                            + "conectado ao projetor. Outra forma: copie o arquivo ReceptorControle.apk para um pen "
                            + "drive, instale no projetor e ative \"Receptor do Controle\" em Configurações > "
                            + "Acessibilidade.")
                    .setPositiveButton("OK", null)
                    .show();
            return;
        }
        setStatus("Instalando o receptor no projetor…", Style.AMBER);
        worker.execute(() -> {
            String tmp = "/data/local/tmp/receptor";
            try {
                byte[] apk = readAsset("receptor.apk");
                String b64 = Base64.getEncoder().encodeToString(apk);
                client.shell("rm -f " + tmp + ".b64 " + tmp + ".apk");
                for (int i = 0; i < b64.length(); i += 3000) {
                    client.shell("echo -n " + b64.substring(i, Math.min(b64.length(), i + 3000)) + " >> " + tmp + ".b64");
                }
                client.shell("base64 -d " + tmp + ".b64 > " + tmp + ".apk");
                String size = client.shell("stat -c %s " + tmp + ".apk").trim();
                if (!size.equals(String.valueOf(apk.length))) throw new IOException("cópia incompleta");
                String out = client.shell("pm install -r " + tmp + ".apk");
                client.shell("rm -f " + tmp + ".b64 " + tmp + ".apk");
                if (!out.contains("Success")) throw new IOException(out.trim());

                String service = "dev.projetor.receptor/dev.projetor.receptor.ReceptorService";
                String enabled = client.shell("settings get secure enabled_accessibility_services").trim();
                if (!enabled.contains(service)) {
                    String list = enabled.isEmpty() || enabled.equals("null") ? service : enabled + ":" + service;
                    client.shell("settings put secure enabled_accessibility_services " + list);
                }
                client.shell("settings put secure accessibility_enabled 1");

                setStatus("Receptor instalado · pareando…", Style.AMBER);
                ReceiverClient rc = new ReceiverClient();
                IOException last = null;
                for (int i = 0; i < 30; i++) {
                    try {
                        rc.connect(host, ReceiverClient.PORT, 2000);
                        last = null;
                        break;
                    } catch (IOException e) {
                        last = e;
                        SystemClock.sleep(500);
                    }
                }
                if (last != null) throw new IOException("o receptor não respondeu");
                rc.startPairing();
                String code = "";
                for (int i = 0; i < 15 && code.length() != 4; i++) {
                    SystemClock.sleep(300);
                    code = client.shell("cat /sdcard/Android/data/dev.projetor.receptor/files/codigo.txt 2>/dev/null").trim();
                }
                String token = rc.finishPairing(code);
                rc.close();
                if (token == null) throw new IOException("o pareamento não deu certo");
                prefs.edit().putString("receptor_" + rc.id(), token).apply();
                setStatus("Receptor pronto · a depuração já pode ser desligada", Style.GREEN);
            } catch (IOException | RuntimeException e) {
                setStatus("Falha ao instalar o receptor: " + e.getMessage(), Style.RED);
            }
        });
    }

    private byte[] readAsset(String name) throws IOException {
        try (InputStream in = getAssets().open(name)) {
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            byte[] buf = new byte[16384];
            int n;
            while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
            return out.toByteArray();
        }
    }

    /** {IPv4 address, prefix length} of the phone on Wi-Fi (or Ethernet), or null when it has none. */
    @SuppressWarnings("deprecation")
    private int[] wifiAddress() {
        ConnectivityManager cm = getSystemService(ConnectivityManager.class);
        if (cm == null) return null;
        for (Network n : cm.getAllNetworks()) {
            NetworkCapabilities caps = cm.getNetworkCapabilities(n);
            if (caps == null || !(caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)
                    || caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET))) continue;
            LinkProperties lp = cm.getLinkProperties(n);
            if (lp == null) continue;
            for (LinkAddress la : lp.getLinkAddresses()) {
                if (la.getAddress() instanceof Inet4Address) {
                    byte[] b = la.getAddress().getAddress();
                    int ip = ((b[0] & 0xff) << 24) | ((b[1] & 0xff) << 16) | ((b[2] & 0xff) << 8) | (b[3] & 0xff);
                    return new int[] {ip, la.getPrefixLength()};
                }
            }
        }
        return null;
    }

    /** Connects as soon as the phone joins a Wi-Fi, so the app is ready when it reaches home. */
    private void watchWifi() {
        ConnectivityManager cm = getSystemService(ConnectivityManager.class);
        if (cm == null) return;
        wifiCallback = new ConnectivityManager.NetworkCallback() {
            @Override
            public void onAvailable(Network network) {
                onWorker(() -> {
                    lastFailure = 0;
                    lastScan = 0;
                    if (ensureConnected() && loaded) loadVolume();
                });
            }

            @Override
            public void onLost(Network network) {
                onWorker(() -> {
                    if (wifiAddress() != null) return;
                    if (client != null) client.close();
                    receiver.close();
                    connected = false;
                    mode = 0;
                    setStatus("Sem Wi-Fi · conecte o celular ao Wi-Fi do projetor", Style.RED);
                });
            }
        };
        try {
            cm.registerNetworkCallback(new NetworkRequest.Builder()
                    .addTransportType(NetworkCapabilities.TRANSPORT_WIFI).build(), wifiCallback);
        } catch (RuntimeException e) {
            wifiCallback = null;
        }
    }

    private void onWorker(Runnable task) {
        try {
            worker.execute(task);
        } catch (RejectedExecutionException ignored) {
            // the screen is closing
        }
    }

    /** "Procurar o projetor no Wi-Fi": scans now, even if the current address still works. */
    private void searchNetwork() {
        setStatus("Procurando o projetor no Wi-Fi…", Style.MUTED);
        worker.execute(() -> {
            lastScan = 0;
            LanScanner.Result result = discover();
            if (result == null || result.isEmpty()) {
                setStatus(scanMessage != null ? scanMessage : "Projetor não encontrado", Style.RED);
                return;
            }
            String found = !result.adb.isEmpty() ? result.adb.get(0) : result.receivers.get(0);
            if (found.equals(host) && connected) {
                setStatus("Conectado · " + found + (mode == MODE_RECEIVER ? " · receptor" : ""), Style.GREEN);
                return;
            }
            if (client != null) client.close();
            receiver.close();
            mode = 0;
            pairingAsked = false;
            connected = false;
            loaded = false;
            host = found;
            prefs.edit().putString("host", found).apply();
            runOnUiThread(() -> hostField.setText(found));
            inputWorker.execute(() -> {
                if (injector != null) injector.close();
                lastInjectorFailure = 0;
            });
            lastFailure = 0;
            ensureConnected();
        });
    }

    private static String describe(Exception e) {
        if (e instanceof SocketTimeoutException || e instanceof NoRouteToHostException) {
            return "Projetor não responde. Está ligado e no mesmo Wi-Fi?";
        }
        if (e instanceof ConnectException) return "Projetor desligado ou depuração ADB desativada";
        String m = e.getMessage();
        return m == null ? e.getClass().getSimpleName() : m;
    }

    private String runShell(String command) {
        for (int attempt = 0; attempt < 2; attempt++) {
            if (!ensureConnected() || mode != MODE_ADB) return null;
            try {
                return client.shell(command);
            } catch (IOException e) {
                connected = false;
                setStatus("Conexão perdida, reconectando…", Style.MUTED);
            }
        }
        return null;
    }

    private void send(String command) {
        worker.execute(() -> runShell(command));
    }

    private void reconnect() {
        String typed = hostField.getText().toString().trim();
        host = typed;
        prefs.edit().putString("host", typed).apply();
        worker.execute(() -> {
            if (client != null) client.close();
            receiver.close();
            mode = 0;
            pairingAsked = false;
            loaded = false;
            lastFailure = 0;
            ensureConnected();
        });
        inputWorker.execute(() -> {
            if (injector != null) injector.close();
            lastInjectorFailure = 0;
        });
    }

    private void setStatus(String text, int color) {
        runOnUiThread(() -> {
            statusShown = text;
            statusColor = color;
            statusText.setText(text);
            statusDot.setBackground(Style.oval(color));
        });
    }

    // ---------------------------------------------------------------- fast input (inputWorker thread)

    private boolean ensureInjector() {
        InputInjector in = injector;
        if (in == null) return false;
        if (in.isReady()) return true;
        if (!connected || SystemClock.elapsedRealtime() - lastInjectorFailure < 3000) return false;
        try {
            in.connect(host, PORT);
            return true;
        } catch (IOException e) {
            lastInjectorFailure = SystemClock.elapsedRealtime();
            return false;
        }
    }

    /** Keys go straight into the remote's input device when possible, else through `input keyevent`. */
    private void sendKey(int keycode) {
        if (mode == MODE_RECEIVER) {
            receiverKey(keycode);
            return;
        }
        if (!InputInjector.supportsKey(keycode)) {
            send(ProjectorCommands.key(keycode));
            return;
        }
        inputWorker.execute(() -> {
            if (ensureInjector()) {
                try {
                    injector.key(keycode);
                    return;
                } catch (IOException ignored) {
                    // fall back to the slow path below
                }
            }
            send(ProjectorCommands.key(keycode));
        });
    }

    /**
     * Without debugging, keys go to the receiver. Keys it cannot do (Menu, or arrows when nothing on
     * screen has focus) and, if chosen in Mais, all arrows go by infrared like the original remote.
     */
    private void receiverKey(int keycode) {
        String name = keyName(keycode);
        int ir = irCode(keycode);
        boolean arrow = keycode == ProjectorCommands.KEY_UP || keycode == ProjectorCommands.KEY_DOWN
                || keycode == ProjectorCommands.KEY_LEFT || keycode == ProjectorCommands.KEY_RIGHT
                || keycode == ProjectorCommands.KEY_CENTER;
        inputWorker.execute(() -> {
            ConsumerIrManager emitter = infrared();
            if (arrow && emitter != null && prefs.getBoolean("setas_ir", false)) {
                transmitIr(emitter, ir);
                return;
            }
            String reply = null;
            if (name != null && receiver.isConnected()) {
                try {
                    reply = receiver.request("KEY " + name);
                } catch (IOException e) {
                    connected = false;
                    onWorker(this::ensureConnected);
                }
            }
            if (!"OK".equals(reply) && ir >= 0 && emitter != null) transmitIr(emitter, ir);
        });
    }

    private void transmitIr(ConsumerIrManager emitter, int command) {
        try {
            emitter.transmit(IrCodes.CARRIER_HZ, IrCodes.necPattern(IrCodes.ADDRESS, command));
        } catch (RuntimeException e) {
            setStatus("Falha ao enviar infravermelho: " + e.getMessage(), Style.RED);
        }
    }

    private static String keyName(int keycode) {
        switch (keycode) {
            case ProjectorCommands.KEY_UP: return "UP";
            case ProjectorCommands.KEY_DOWN: return "DOWN";
            case ProjectorCommands.KEY_LEFT: return "LEFT";
            case ProjectorCommands.KEY_RIGHT: return "RIGHT";
            case ProjectorCommands.KEY_CENTER: return "CENTER";
            case ProjectorCommands.KEY_BACK: return "BACK";
            case ProjectorCommands.KEY_HOME: return "HOME";
            case ProjectorCommands.KEY_MENU: return "MENU";
            case ProjectorCommands.KEY_PLAY_PAUSE: return "PLAY_PAUSE";
            case ProjectorCommands.KEY_NEXT: return "NEXT";
            case ProjectorCommands.KEY_PREVIOUS: return "PREVIOUS";
            case ProjectorCommands.KEY_REWIND: return "REWIND";
            case ProjectorCommands.KEY_FAST_FORWARD: return "FAST_FORWARD";
            case ProjectorCommands.KEY_VOLUME_UP: return "VOLUME_UP";
            case ProjectorCommands.KEY_VOLUME_DOWN: return "VOLUME_DOWN";
            case ProjectorCommands.KEY_DEL: return "DEL";
            case ProjectorCommands.KEY_ENTER: return "ENTER";
            case ProjectorCommands.KEY_SLEEP: return "SLEEP";
            case ProjectorCommands.KEY_WAKEUP: return "WAKEUP";
            default: return null;
        }
    }

    /** The original remote's button for a key, or -1. Wake-up is its power button. */
    private static int irCode(int keycode) {
        switch (keycode) {
            case ProjectorCommands.KEY_UP: return IrCodes.UP;
            case ProjectorCommands.KEY_DOWN: return IrCodes.DOWN;
            case ProjectorCommands.KEY_LEFT: return IrCodes.LEFT;
            case ProjectorCommands.KEY_RIGHT: return IrCodes.RIGHT;
            case ProjectorCommands.KEY_CENTER: return IrCodes.OK;
            case ProjectorCommands.KEY_BACK: return IrCodes.BACK;
            case ProjectorCommands.KEY_HOME: return IrCodes.HOME;
            case ProjectorCommands.KEY_MENU: return IrCodes.OPTIONS;
            case ProjectorCommands.KEY_VOLUME_UP: return IrCodes.VOLUME_UP;
            case ProjectorCommands.KEY_VOLUME_DOWN: return IrCodes.VOLUME_DOWN;
            case ProjectorCommands.KEY_WAKEUP: return IrCodes.POWER;
            default: return -1;
        }
    }

    private void queueInput(int dx, int dy, int sx, int sy, boolean scrollEnd) {
        synchronized (inputLock) {
            pendingDx += dx;
            pendingDy += dy;
            pendingScrollX += sx;
            pendingScrollY += sy;
            pendingScrollEnd |= scrollEnd;
            if (flushScheduled) return;
            flushScheduled = true;
        }
        inputWorker.execute(this::flushInput);
    }

    /** Sends everything queued since the last write, so fast finger moves are coalesced. */
    private void flushInput() {
        while (true) {
            int dx;
            int dy;
            int sx;
            int sy;
            boolean end;
            synchronized (inputLock) {
                dx = pendingDx;
                dy = pendingDy;
                sx = pendingScrollX;
                sy = pendingScrollY;
                end = pendingScrollEnd;
                pendingDx = pendingDy = pendingScrollX = pendingScrollY = 0;
                pendingScrollEnd = false;
                if (dx == 0 && dy == 0 && sx == 0 && sy == 0 && !end) {
                    flushScheduled = false;
                    return;
                }
            }
            if (mode == MODE_RECEIVER) {
                try {
                    if (dx != 0 || dy != 0) receiver.request("MOVE " + dx + " " + dy);
                    if (sx != 0 || sy != 0) receiver.request("SCROLL " + sx + " " + sy);
                    if (end) receiver.request("SCROLL_END");
                } catch (IOException e) {
                    connected = false;
                    onWorker(this::ensureConnected);
                }
                continue;
            }
            if (!ensureInjector()) {
                touching = false;
                continue;
            }
            try {
                if (dx != 0 || dy != 0) injector.move(dx, dy);
                if (sx != 0 || sy != 0) scrollBy(sx, sy);
                if (end) endScroll();
            } catch (IOException e) {
                touching = false;
            }
        }
    }

    /** Drags a virtual finger on the projector screen, starting from the centre. */
    private void scrollBy(int sx, int sy) throws IOException {
        if (!injector.canSwipe()) {
            keyScrollAcc += sy;
            while (Math.abs(keyScrollAcc) >= 60) {
                injector.key(keyScrollAcc < 0 ? ProjectorCommands.KEY_DOWN : ProjectorCommands.KEY_UP);
                keyScrollAcc -= Integer.signum(keyScrollAcc) * 60;
            }
            return;
        }
        int w = injector.screenWidth();
        int h = injector.screenHeight();
        if (!touching) {
            swipeStartX += sx;
            swipeStartY += sy;
            if (Math.abs(swipeStartX) + Math.abs(swipeStartY) < SWIPE_START_PX) return;
            touchX = w / 2;
            touchY = h / 2;
            injector.touchDown(touchX, touchY);
            touching = true;
            sx = swipeStartX;
            sy = swipeStartY;
            swipeStartX = swipeStartY = 0;
        }
        int nx = touchX + sx;
        int ny = touchY + sy;
        int margin = 24;
        if (nx < margin || nx > w - margin || ny < margin || ny > h - margin) {
            injector.touchUp();
            touchX = w / 2;
            touchY = h / 2;
            injector.touchDown(touchX, touchY);
            nx = touchX + sx;
            ny = touchY + sy;
        }
        touchX = Math.max(0, Math.min(w - 1, nx));
        touchY = Math.max(0, Math.min(h - 1, ny));
        injector.touchMove(touchX, touchY);
    }

    private void endScroll() throws IOException {
        swipeStartX = swipeStartY = 0;
        keyScrollAcc = 0;
        if (touching) {
            touching = false;
            injector.touchUp();
        }
    }

    private void click() {
        inputWorker.execute(() -> {
            if (mode == MODE_RECEIVER) {
                try {
                    receiver.request("CLICK");
                } catch (IOException e) {
                    connected = false;
                    onWorker(this::ensureConnected);
                }
                return;
            }
            if (!ensureInjector()) return;
            try {
                injector.click();
            } catch (IOException ignored) {
                // next action reconnects
            }
        });
    }

    // ---------------------------------------------------------------- power

    private void powerOn() {
        if (!checkInfrared("ligar")) return;
        worker.execute(() -> {
            boolean on = false;
            AdbClient c = client;
            if (mode == MODE_ADB && c != null && c.isConnected()) {
                try {
                    on = c.shell("echo ok").trim().equals("ok");
                } catch (IOException e) {
                    connected = false;
                }
            } else if (mode == MODE_RECEIVER && receiver.isConnected()) {
                try {
                    on = receiver.request("PING").equals("OK");
                } catch (IOException e) {
                    connected = false;
                }
            }
            boolean alreadyOn = on;
            runOnUiThread(() -> {
                if (alreadyOn) Toast.makeText(this, "O projetor já está ligado", Toast.LENGTH_SHORT).show();
                else sendPower(true);
            });
        });
    }

    private void powerOff() {
        if (!checkInfrared("desligar")) return;
        if (connected) {
            sendPower(false);
            return;
        }
        new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle("Projetor não conectado")
                .setMessage("O app não está conectado ao projetor, então não sei se ele está ligado. "
                        + "Se estiver desligado, este sinal vai ligá-lo.")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Enviar mesmo assim", (d, w) -> sendPower(false))
                .show();
    }

    private ConsumerIrManager infrared() {
        try {
            ConsumerIrManager ir = (ConsumerIrManager) getSystemService(Context.CONSUMER_IR_SERVICE);
            return ir != null && ir.hasIrEmitter() ? ir : null;
        } catch (RuntimeException e) {
            return null;
        }
    }

    private boolean checkInfrared(String action) {
        if (infrared() != null) return true;
        new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle("Sem infravermelho")
                .setMessage("Não encontrei um emissor infravermelho neste celular. "
                        + "Use o controle original para " + action + " o projetor.")
                .setPositiveButton("OK", null)
                .show();
        return false;
    }

    /**
     * Sends the original remote's power button by infrared. Turning on then waits for the projector
     * to come back on the Wi-Fi; turning off makes the projector show its own power menu.
     */
    private void sendPower(boolean turningOn) {
        ConsumerIrManager ir = infrared();
        if (ir == null) return;
        setStatus("Enviando sinal infravermelho… aponte o celular para o projetor", Style.AMBER);
        new Thread(() -> {
            try {
                ir.transmit(IrCodes.CARRIER_HZ, IrCodes.power());
            } catch (RuntimeException e) {
                setStatus("Falha ao enviar infravermelho: " + e.getMessage(), Style.RED);
                return;
            }
            if (turningOn) {
                waking = true;
                setStatus("Ligando o projetor… aguarde", Style.AMBER);
                runOnUiThread(() -> {
                    wakeAttempts = 0;
                    handler.removeCallbacks(wakePoll);
                    handler.postDelayed(wakePoll, 6000);
                });
            } else {
                waking = false;
                String hint = menuHint != null ? menuHint : "No menu do projetor, escolha a opção de desligar com as setas e OK";
                menuHint = null;
                setStatus(hint, Style.AMBER);
                runOnUiThread(() -> {
                    handler.removeCallbacks(wakePoll);
                    selectTab(0);
                });
            }
        }, "ir").start();
    }

    private final Runnable wakePoll = new Runnable() {
        @Override
        public void run() {
            if (connected || !waking) return;
            if (wakeAttempts++ >= 24) {
                waking = false;
                setStatus("O projetor não respondeu. Tente de novo apontando para ele.", Style.RED);
                return;
            }
            onWorker(() -> {
                lastFailure = 0;
                ensureConnected();
            });
            handler.postDelayed(this, 5000);
        }
    };

    private void confirmReboot() {
        if (mode == MODE_RECEIVER) {
            if (!checkInfrared("reiniciar")) return;
            menuHint = "No menu do projetor, escolha Reiniciar com as setas e OK";
            sendPower(false);
            return;
        }
        new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle("Reiniciar o projetor?")
                .setMessage("A conexão cai durante o reinício e volta sozinha em cerca de 1 minuto.")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Reiniciar", (d, w) -> {
                    powerCommand(ProjectorCommands.REBOOT, "Projetor reiniciando…", "Projetor reiniciando…");
                    waking = true;
                    wakeAttempts = 0;
                    handler.removeCallbacks(wakePoll);
                    handler.postDelayed(wakePoll, 20000);
                })
                .show();
    }

    private void powerCommand(String command, String during, String after) {
        worker.execute(() -> {
            if (!ensureConnected()) return;
            setStatus(during, Style.AMBER);
            try {
                client.shell(command);
            } catch (IOException ignored) {
                // the projector drops the connection as it powers down
            }
            client.close();
            connected = false;
            loaded = false;
            inputWorker.execute(() -> {
                touching = false;
                if (injector != null) injector.close();
            });
            setStatus(after, Style.MUTED);
        });
    }

    // ---------------------------------------------------------------- volume & apps (worker thread)

    private void loadVolume() {
        int[] v = mode == MODE_RECEIVER ? receiverVolume(null) : ProjectorCommands.parseVolume(runShell(ProjectorCommands.VOLUME_QUERY));
        if (v == null) return;
        volume = v[0];
        maxVolume = v[1];
        runOnUiThread(this::showVolume);
    }

    private void setVolume(int target) {
        int v = Math.max(0, Math.min(maxVolume, target));
        worker.execute(() -> {
            if (mode == MODE_RECEIVER) {
                int[] r = receiverVolume(v);
                if (r != null) {
                    volume = r[0];
                    maxVolume = r[1];
                    runOnUiThread(this::showVolume);
                }
                return;
            }
            if (runShell(ProjectorCommands.setVolume(v)) != null) {
                volume = v;
                runOnUiThread(this::showVolume);
            }
        });
    }

    private void stepVolume(int keycode, int delta) {
        sendKey(keycode);
        if (volume >= 0) {
            volume = Math.max(0, Math.min(maxVolume, volume + delta));
            showVolume();
        }
        handler.postDelayed(() -> worker.execute(this::loadVolume), 700);
    }

    private void toggleMute() {
        if (volume > 0) {
            volumeBeforeMute = volume;
            setVolume(0);
        } else {
            setVolume(volumeBeforeMute > 0 ? volumeBeforeMute : 5);
        }
    }

    private void showVolume() {
        for (PillSlider s : volumeSliders) {
            s.setMax(maxVolume);
            s.setValue(volume, true);
        }
        for (TextView t : volumeValues) t.setText(volume < 0 ? "–" : String.valueOf(volume));
        boolean muted = volume == 0;
        for (ImageView i : muteIcons) i.setImageResource(muted ? R.drawable.ic_volume_up : R.drawable.ic_volume_off);
        for (TextView t : muteTexts) t.setText(muted ? "Ativar som" : "Sem som");
    }

    private void loadApps() {
        List<ProjectorCommands.App> apps = mode == MODE_RECEIVER ? receiverApps()
                : ProjectorCommands.parseApps(runShell(ProjectorCommands.APPS_QUERY));
        runOnUiThread(() -> showApps(apps));
    }

    /** Sends a command to the receiver (worker thread), reconnecting once if needed; null on failure. */
    private String receiverRequest(String line) {
        for (int attempt = 0; attempt < 2; attempt++) {
            if (!ensureConnected() || mode != MODE_RECEIVER) return null;
            try {
                return receiver.request(line);
            } catch (IOException e) {
                connected = false;
                setStatus("Conexão perdida, reconectando…", Style.MUTED);
            }
        }
        return null;
    }

    /** Reads the volume, or sets it when {@code target} is given; {current, max} or null. */
    private int[] receiverVolume(Integer target) {
        String r = receiverRequest(target == null ? "VOLUME" : "VOLUME " + target);
        if (r == null || !r.startsWith("OK ")) return null;
        String[] p = r.split(" ");
        try {
            return new int[] {Integer.parseInt(p[1]), Integer.parseInt(p[2])};
        } catch (RuntimeException e) {
            return null;
        }
    }

    private List<ProjectorCommands.App> receiverApps() {
        try {
            if (!ensureConnected() || mode != MODE_RECEIVER) return new ArrayList<>();
            StringBuilder components = new StringBuilder();
            Map<String, String> labels = new HashMap<>();
            for (String line : receiver.requestLines("APPS")) {
                int tab = line.indexOf('\t');
                String component = tab < 0 ? line : line.substring(0, tab);
                components.append(component).append('\n');
                int slash = component.indexOf('/');
                if (tab >= 0 && slash > 0) labels.put(component.substring(0, slash), line.substring(tab + 1));
            }
            return ProjectorCommands.parseApps(components.toString(), labels);
        } catch (IOException | RuntimeException e) {
            connected = false;
            return new ArrayList<>();
        }
    }

    private void launchApp(ProjectorCommands.App app) {
        worker.execute(() -> {
            if (mode == MODE_RECEIVER) receiverRequest("LAUNCH " + app.component);
            else runShell(ProjectorCommands.launch(app));
        });
    }

    /** Opens a settings screen on the projector: by name through the receiver, else by the ADB command. */
    private void openScreen(String name, String adbCommand) {
        worker.execute(() -> {
            if (mode == MODE_RECEIVER) receiverRequest("OPEN " + name);
            else runShell(adbCommand);
        });
    }

    // ---------------------------------------------------------------- UI (iOS-style; phone and tablet)

    /** One "Tocando agora" card; the wide layout shows two (Controle and Mídia), so they live in a list. */
    private static final class NowPlayingViews {
        TextView art;
        TextView title;
        TextView subtitle;
        TextView state;
        ImageView play;
    }

    private boolean tablet;
    private boolean wide;
    private PillTabBar tabBar;
    private LinearLayout column;
    private int currentTab = -1;
    private final List<PillSlider> volumeSliders = new ArrayList<>();
    private final List<TextView> volumeValues = new ArrayList<>();
    private final List<ImageView> muteIcons = new ArrayList<>();
    private final List<TextView> muteTexts = new ArrayList<>();
    private final List<NowPlayingViews> nowPlayingViews = new ArrayList<>();
    private final List<LinearLayout> shortcutRows = new ArrayList<>();
    private final List<View> shortcutCards = new ArrayList<>();
    private List<ProjectorCommands.App> lastApps = new ArrayList<>();
    private volatile ProjectorCommands.NowPlaying nowPlaying;
    private String appFilter = "";
    private String statusShown = "Desconectado";
    private TextView refreshValue;
    private int statusColor = Style.MUTED;

    private View buildUi() {
        Configuration cfg = getResources().getConfiguration();
        tablet = cfg.smallestScreenWidthDp >= 600;
        wide = cfg.screenWidthDp >= 720;
        volumeSliders.clear();
        volumeValues.clear();
        muteIcons.clear();
        muteTexts.clear();
        nowPlayingViews.clear();
        shortcutRows.clear();
        shortcutCards.clear();

        FrameLayout root = new FrameLayout(this);
        root.addView(wallpaper(), new FrameLayout.LayoutParams(-1, -1));
        column = vertical();
        root.addView(column, new FrameLayout.LayoutParams(-1, -1));
        column.addView(buildHeader(), matchWrap(dp(tablet ? 32 : 20), dp(10), dp(tablet ? 32 : 20), 0));

        tabBar = new PillTabBar(this, TAB_NAMES, TAB_ICONS, tablet ? 58 : 62);
        tabBar.setListener(this::selectTab);

        FrameLayout content = new FrameLayout(this);
        pages[0] = scrolling(buildControlPage());
        pages[1] = scrolling(buildMediaPage());
        pages[2] = buildTouchpadPage();
        pages[3] = scrolling(buildAppsPage());
        pages[4] = scrolling(buildSettingsPage());
        for (View p : pages) {
            p.setVisibility(View.GONE);
            content.addView(p, new FrameLayout.LayoutParams(-1, -1));
        }

        if (tablet) {
            // iPadOS: the tab bar floats at the top, centred
            LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(dp(Math.min(600, cfg.screenWidthDp - 48)), -2);
            tp.gravity = Gravity.CENTER_HORIZONTAL;
            tp.topMargin = dp(16);
            tp.bottomMargin = dp(4);
            column.addView(tabBar, tp);
            column.addView(content, new LinearLayout.LayoutParams(-1, 0, 1f));
        } else {
            column.addView(content, new LinearLayout.LayoutParams(-1, 0, 1f));
            FrameLayout.LayoutParams bp = new FrameLayout.LayoutParams(-1, -2, Gravity.BOTTOM);
            bp.setMargins(dp(14), 0, dp(14), dp(10));
            root.addView(tabBar, bp);
        }
        root.setOnApplyWindowInsetsListener(this::applyInsets);
        return root;
    }

    /**
     * The wallpaper, fixed behind the pages (it does not scroll, as on iOS), with a soft wine
     * shade at the top and bottom so the title and the tab bar stay readable over its glowing lines.
     */
    private View wallpaper() {
        FrameLayout layer = new FrameLayout(this);
        ImageView image = new ImageView(this);
        image.setImageResource(R.drawable.fundo);
        image.setScaleType(ImageView.ScaleType.CENTER_CROP);
        layer.addView(image, new FrameLayout.LayoutParams(-1, -1));
        View shade = new View(this);
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0xE01F0B0D, 0x591F0B0D, 0x261F0B0D, 0x401F0B0D, 0xB31F0B0D});
        shade.setBackground(g);
        layer.addView(shade, new FrameLayout.LayoutParams(-1, -1));
        return layer;
    }

    @SuppressWarnings("deprecation")
    private WindowInsets applyInsets(View v, WindowInsets insets) {
        int left;
        int top;
        int right;
        int bottom;
        int ime = 0;
        if (Build.VERSION.SDK_INT >= 30) {
            Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            left = bars.left;
            top = bars.top;
            right = bars.right;
            bottom = bars.bottom;
            ime = insets.getInsets(WindowInsets.Type.ime()).bottom;
        } else {
            left = insets.getSystemWindowInsetLeft();
            top = insets.getSystemWindowInsetTop();
            right = insets.getSystemWindowInsetRight();
            bottom = insets.getSystemWindowInsetBottom();
        }
        boolean typing = ime > bottom;
        column.setPadding(left, top, right, tablet || typing ? Math.max(bottom, ime) : 0);
        if (!tablet) {
            FrameLayout.LayoutParams lp = (FrameLayout.LayoutParams) tabBar.getLayoutParams();
            lp.leftMargin = left + dp(14);
            lp.rightMargin = right + dp(14);
            lp.bottomMargin = bottom + dp(10);
            tabBar.setLayoutParams(lp);
            // like iOS, the tab bar steps aside while the keyboard is up
            tabBar.setVisibility(typing ? View.INVISIBLE : View.VISIBLE);
        }
        return insets;
    }

    /** Large title, connection status in a capsule, and the power command pills. */
    private View buildHeader() {
        LinearLayout header = vertical();
        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout titles = vertical();
        TextView eyebrow = text("HY300", 13, Style.TEXT2, Style.semibold);
        eyebrow.setLetterSpacing(0.08f);
        titles.addView(eyebrow);
        TextView title = text("Projetor", 34, Style.TEXT, Style.bold);
        title.setPadding(0, dp(2), 0, 0);
        titles.addView(title);

        LinearLayout chip = new LinearLayout(this);
        chip.setGravity(Gravity.CENTER_VERTICAL);
        chip.setBackground(Style.capsule(Style.FILL4));
        chip.setPadding(dp(11), dp(6), dp(13), dp(6));
        statusDot = new View(this);
        statusDot.setBackground(Style.oval(statusColor));
        chip.addView(statusDot, new LinearLayout.LayoutParams(dp(8), dp(8)));
        statusText = text(statusShown, 13, 0xD9EBEBF5, Style.medium);
        statusText.setMaxLines(2);
        statusText.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams stp = new LinearLayout.LayoutParams(-2, -2);
        stp.leftMargin = dp(7);
        chip.addView(statusText, stp);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-2, -2);
        cp.topMargin = dp(10);
        titles.addView(chip, cp);
        top.addView(titles, new LinearLayout.LayoutParams(0, -2, 1f));

        if (tablet) {
            top.addView(powerPills());
        } else {
            top.addView(circleButton(R.drawable.ic_settings, 40, Style.glassOval(hairline()), Style.TEXT, "Ajustes", () -> selectTab(4)));
        }
        header.addView(top);
        if (!tablet) header.addView(powerPills(), matchWrap(0, dp(14), 0, 0));
        return header;
    }

    /** Command pills: Ligar and Desligar (infrared) and Procurar (Wi-Fi). */
    private View powerPills() {
        LinearLayout row = new LinearLayout(this);
        row.setGravity(Gravity.CENTER_VERTICAL);
        row.addView(commandPill(R.drawable.ic_power, "Ligar", Style.GREEN, this::powerOn), pillParams(!tablet));
        row.addView(commandPill(R.drawable.ic_power, "Desligar", Style.RED, this::powerOff), pillParams(!tablet));
        row.addView(commandPill(R.drawable.ic_search, tablet ? "Procurar" : "Buscar", Style.ACCENT, this::searchNetwork), pillParams(!tablet));
        return row;
    }

    private LinearLayout.LayoutParams pillParams(boolean fill) {
        LinearLayout.LayoutParams lp = fill ? new LinearLayout.LayoutParams(0, dp(42), 1f) : new LinearLayout.LayoutParams(-2, dp(42));
        lp.setMargins(dp(4), 0, dp(4), 0);
        return lp;
    }

    private void selectTab(int index) {
        selectTab(index, true);
    }

    /** Shows a tab: the old page fades, the new one rises in a little, both on hardware layers. */
    private void selectTab(int index, boolean animate) {
        if (index < 0 || index >= pages.length) index = 0;
        final int previous = currentTab;
        currentTab = index;
        tabBar.select(index, animate);
        for (int i = 0; i < pages.length; i++) {
            if (i != index && i != previous) pages[i].setVisibility(View.GONE);
        }
        View in = pages[index];
        in.animate().cancel();
        if (animate && previous >= 0 && previous != index) {
            final View out = pages[previous];
            out.animate().cancel();
            out.animate().alpha(0f).setDuration(110).withLayer().withEndAction(() -> {
                if (currentTab != previous) out.setVisibility(View.GONE);
                out.setAlpha(1f);
            }).start();
            in.setVisibility(View.VISIBLE);
            in.setAlpha(0f);
            in.setTranslationX(dp(index > previous ? 22 : -22));
            in.animate().alpha(1f).translationX(0f).setStartDelay(40).setDuration(420)
                    .setInterpolator(Style.SPRING_SOFT).withLayer().start();
        } else {
            in.setVisibility(View.VISIBLE);
            in.setAlpha(1f);
            in.setTranslationX(0f);
        }
        prefs.edit().putInt("tab", index).apply();
        if (index <= 1) {
            handler.removeCallbacks(mediaPoll);
            handler.post(mediaPoll);
        }
    }

    // -- Controle

    private View buildControlPage() {
        if (wide) {
            LinearLayout cols = new LinearLayout(this);
            cols.setPadding(dp(32), dp(8), dp(32), dp(40));
            LinearLayout left = vertical();
            left.addView(remoteColumn(400));
            LinearLayout right = vertical();
            right.addView(nowPlayingCard(false), matchWrap(0, dp(4), 0, 0));
            right.addView(volumeCard(), matchWrap(0, dp(16), 0, 0));
            right.addView(shortcutsCard(), matchWrap(0, dp(16), 0, 0));
            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1f);
            lp.rightMargin = dp(16);
            cols.addView(left, lp);
            LinearLayout.LayoutParams rp = new LinearLayout.LayoutParams(0, -2, 1f);
            rp.leftMargin = dp(16);
            cols.addView(right, rp);
            return cols;
        }
        LinearLayout page = page();
        page.addView(remoteColumn(tablet ? 400 : 330));
        page.addView(nowPlayingMini(), matchWrap(0, dp(22), 0, 0));
        page.addView(shortcutsCard(), matchWrap(0, dp(16), 0, 0));
        return constrained(page, 620);
    }

    /** Quick pills, the clickpad and the round buttons with the volume rocker, like the Siri Remote. */
    private View remoteColumn(int padDp) {
        LinearLayout col = vertical();
        HorizontalScrollView quickScroll = new HorizontalScrollView(this);
        quickScroll.setHorizontalScrollBarEnabled(false);
        quickScroll.setClipToPadding(false);
        LinearLayout quick = new LinearLayout(this);
        quick.addView(quickPill(R.drawable.ic_home, "Início", () -> sendKey(ProjectorCommands.KEY_HOME)), quickParams());
        quick.addView(quickPill(R.drawable.ic_chevron_back, "Voltar", () -> sendKey(ProjectorCommands.KEY_BACK)), quickParams());
        quick.addView(quickPill(R.drawable.ic_menu_lines, "Menu", () -> sendKey(ProjectorCommands.KEY_MENU)), quickParams());
        View mute = quickPill(R.drawable.ic_volume_off, "Sem som", this::toggleMute);
        muteIcons.add((ImageView) ((ViewGroup) mute).getChildAt(0));
        muteTexts.add((TextView) ((ViewGroup) mute).getChildAt(1));
        quick.addView(mute, quickParams());
        quick.addView(quickPill(R.drawable.ic_apps, "Apps", () -> selectTab(3)), quickParams());
        quickScroll.addView(quick);
        col.addView(quickScroll, matchWrap(-dp(4), dp(10), -dp(4), 0));

        ClickpadView pad = new ClickpadView(this);
        pad.setMaxSize(dp(padDp));
        pad.setListener(this::sendKey);
        col.addView(pad, matchWrap(0, dp(22), 0, 0));
        TextView hint = text("Toque nas bordas, deslize para navegar ou toque no centro para OK", 12.5f, Style.TEXT3, Style.regular);
        hint.setGravity(Gravity.CENTER);
        col.addView(hint, matchWrap(dp(12), dp(10), dp(12), 0));

        // round buttons on the left, volume rocker on the right
        LinearLayout buttons = new LinearLayout(this);
        buttons.setGravity(Gravity.CENTER);
        LinearLayout grid = vertical();
        LinearLayout r1 = new LinearLayout(this);
        r1.addView(remoteButton(R.drawable.ic_chevron_back, "Voltar", () -> sendKey(ProjectorCommands.KEY_BACK)));
        r1.addView(withLeft(remoteButton(R.drawable.ic_tv, "Início", () -> sendKey(ProjectorCommands.KEY_HOME)), dp(18)));
        LinearLayout r2 = new LinearLayout(this);
        r2.addView(remoteButton(R.drawable.ic_play_pause, "Play ou pausa", this::playPause));
        r2.addView(withLeft(remoteButton(R.drawable.ic_menu_lines, "Menu", () -> sendKey(ProjectorCommands.KEY_MENU)), dp(18)));
        grid.addView(r1);
        LinearLayout.LayoutParams r2p = new LinearLayout.LayoutParams(-2, -2);
        r2p.topMargin = dp(18);
        grid.addView(r2, r2p);
        buttons.addView(grid);
        buttons.addView(volumeRocker(), spaced(dp(26)));
        col.addView(buttons, matchWrap(0, dp(24), 0, 0));
        return col;
    }

    private View remoteButton(int icon, String description, Runnable action) {
        return circleButton(icon, 68, Style.glassOval(hairline()), Style.TEXT, description, action);
    }

    /** Volume capsule with + on top and − below, each half lights up while pressed. */
    private View volumeRocker() {
        LinearLayout rocker = vertical();
        rocker.setBackground(Style.glassKey(999f, hairline()));
        rocker.setClipToOutline(true);
        rocker.addView(rockerHalf(R.drawable.ic_plus, "Aumentar volume", () -> stepVolume(ProjectorCommands.KEY_VOLUME_UP, 1)),
                new LinearLayout.LayoutParams(dp(68), dp(77)));
        View line = new View(this);
        line.setBackgroundColor(0x24FFFFFF);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(dp(26), Math.max(1, dp(0.7f)));
        lp.gravity = Gravity.CENTER_HORIZONTAL;
        rocker.addView(line, lp);
        rocker.addView(rockerHalf(R.drawable.ic_minus, "Diminuir volume", () -> stepVolume(ProjectorCommands.KEY_VOLUME_DOWN, -1)),
                new LinearLayout.LayoutParams(dp(68), dp(77)));
        return rocker;
    }

    private View rockerHalf(int icon, String description, Runnable action) {
        FrameLayout half = new FrameLayout(this);
        half.setBackground(Style.rowBackground());
        half.setContentDescription(description);
        half.addView(icon(icon, Style.TEXT), new FrameLayout.LayoutParams(dp(24), dp(24), Gravity.CENTER));
        onTap(half, action);
        return half;
    }

    // -- Mídia

    private View buildMediaPage() {
        LinearLayout page = page();
        page.addView(sectionTitle("Mídia"), matchWrap(dp(4), dp(6), 0, dp(12)));
        page.addView(nowPlayingCard(true));
        page.addView(volumeCard(), matchWrap(0, dp(16), 0, 0));
        TextView note = text("Os botões funcionam no app que estiver tocando no projetor: SmartTube, Netflix, música e outros. "
                + "Voltar e avançar 10 s pulam dentro do vídeo; anterior e próxima trocam de faixa.", 13, Style.TEXT2, Style.regular);
        note.setLineSpacing(dp(2), 1f);
        page.addView(note, matchWrap(dp(16), dp(12), dp(16), 0));
        return constrained(page, 680);
    }

    /** "Tocando agora" with artwork, title and the transport controls. */
    private View nowPlayingCard(boolean large) {
        LinearLayout card = vertical();
        card.setBackground(Style.glassCard(dp(26), hairline()));
        card.setPadding(dp(18), dp(18), dp(18), dp(20));
        NowPlayingViews v = new NowPlayingViews();

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        int art = large ? 84 : 68;
        v.art = text("♪", art * 0.36f, 0xFFFFFFFF, Style.bold);
        v.art.setGravity(Gravity.CENTER);
        v.art.setElevation(dp(6));
        top.addView(v.art, new LinearLayout.LayoutParams(dp(art), dp(art)));
        LinearLayout texts = vertical();
        v.state = text("PROJETOR", 12, Style.TEXT2, Style.semibold);
        v.state.setLetterSpacing(0.06f);
        texts.addView(v.state);
        v.title = text("Nada tocando", large ? 21 : 18, Style.TEXT, Style.semibold);
        v.title.setMaxLines(2);
        v.title.setEllipsize(TextUtils.TruncateAt.END);
        v.title.setPadding(0, dp(5), 0, 0);
        texts.addView(v.title);
        v.subtitle = text("", 15, Style.TEXT2, Style.regular);
        v.subtitle.setMaxLines(1);
        v.subtitle.setEllipsize(TextUtils.TruncateAt.END);
        v.subtitle.setPadding(0, dp(3), 0, 0);
        texts.addView(v.subtitle);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, -2, 1f);
        tp.leftMargin = dp(16);
        top.addView(texts, tp);
        card.addView(top);

        LinearLayout transport = new LinearLayout(this);
        transport.setGravity(Gravity.CENTER);
        transport.addView(transportButton(R.drawable.ic_prev, 50, "Anterior", () -> sendKey(ProjectorCommands.KEY_PREVIOUS)), weighted(0));
        transport.addView(skipButton(false), weighted(0));
        FrameLayout play = new FrameLayout(this);
        play.setBackground(Style.glassOval(hairline()));
        play.setContentDescription("Play ou pausa");
        v.play = icon(R.drawable.ic_play, Style.TEXT);
        play.addView(v.play, new FrameLayout.LayoutParams(dp(34), dp(34), Gravity.CENTER));
        onTap(play, this::playPause);
        Style.press(play, 0.9f);
        FrameLayout playWrap = new FrameLayout(this);
        int playSize = large ? 76 : 68;
        playWrap.addView(play, new FrameLayout.LayoutParams(dp(playSize), dp(playSize), Gravity.CENTER));
        LinearLayout.LayoutParams pp = new LinearLayout.LayoutParams(dp(playSize + 12), dp(playSize + 12));
        transport.addView(playWrap, pp);
        transport.addView(skipButton(true), weighted(0));
        transport.addView(transportButton(R.drawable.ic_next, 50, "Próxima", () -> sendKey(ProjectorCommands.KEY_NEXT)), weighted(0));
        card.addView(transport, matchWrap(0, dp(large ? 26 : 20), 0, 0));

        nowPlayingViews.add(v);
        showNowPlaying(v);
        return card;
    }

    /** Compact card on the phone's Controle tab; opens the Mídia tab. */
    private View nowPlayingMini() {
        LinearLayout card = new LinearLayout(this);
        card.setGravity(Gravity.CENTER_VERTICAL);
        card.setBackground(Style.glassCard(dp(22), hairline()));
        card.setPadding(dp(12), dp(12), dp(10), dp(12));
        NowPlayingViews v = new NowPlayingViews();
        v.art = text("♪", 20, 0xFFFFFFFF, Style.bold);
        v.art.setGravity(Gravity.CENTER);
        card.addView(v.art, new LinearLayout.LayoutParams(dp(52), dp(52)));
        LinearLayout texts = vertical();
        v.state = text("PROJETOR", 11, Style.TEXT2, Style.semibold);
        v.state.setLetterSpacing(0.06f);
        texts.addView(v.state);
        v.title = text("Nada tocando", 16, Style.TEXT, Style.semibold);
        v.title.setMaxLines(1);
        v.title.setEllipsize(TextUtils.TruncateAt.END);
        v.title.setPadding(0, dp(3), 0, 0);
        texts.addView(v.title);
        v.subtitle = text("", 13, Style.TEXT2, Style.regular);
        v.subtitle.setMaxLines(1);
        v.subtitle.setEllipsize(TextUtils.TruncateAt.END);
        texts.addView(v.subtitle);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, -2, 1f);
        tp.leftMargin = dp(12);
        card.addView(texts, tp);
        FrameLayout play = new FrameLayout(this);
        play.setContentDescription("Play ou pausa");
        v.play = icon(R.drawable.ic_play, Style.TEXT);
        play.addView(v.play, new FrameLayout.LayoutParams(dp(26), dp(26), Gravity.CENTER));
        onTap(play, this::playPause);
        Style.press(play, 0.85f);
        card.addView(play, new LinearLayout.LayoutParams(dp(48), dp(48)));
        card.addView(transportButton(R.drawable.ic_next, 44, "Próxima", () -> sendKey(ProjectorCommands.KEY_NEXT)));
        onTap(card, () -> selectTab(1));
        Style.press(card, 0.97f);
        nowPlayingViews.add(v);
        showNowPlaying(v);
        return card;
    }

    private View transportButton(int icon, int sizeDp, String description, Runnable action) {
        FrameLayout b = new FrameLayout(this);
        b.setContentDescription(description);
        b.addView(icon(icon, Style.TEXT), new FrameLayout.LayoutParams(dp(sizeDp * 0.56f), dp(sizeDp * 0.56f), Gravity.CENTER));
        onTap(b, action);
        Style.press(b, 0.86f);
        FrameLayout wrap = new FrameLayout(this);
        wrap.addView(b, new FrameLayout.LayoutParams(dp(sizeDp), dp(sizeDp), Gravity.CENTER));
        return wrap;
    }

    /** Circular arrow with "10" inside: back 10 s, or forward when mirrored. */
    private View skipButton(boolean forward) {
        FrameLayout b = new FrameLayout(this);
        b.setContentDescription(forward ? "Avançar 10 segundos" : "Voltar 10 segundos");
        ImageView arrow = icon(R.drawable.ic_replay, Style.TEXT);
        if (forward) arrow.setScaleX(-1f);
        b.addView(arrow, new FrameLayout.LayoutParams(dp(34), dp(34), Gravity.CENTER));
        TextView ten = text("10", 10, Style.TEXT, Style.bold);
        FrameLayout.LayoutParams tl = new FrameLayout.LayoutParams(-2, -2, Gravity.CENTER);
        tl.topMargin = dp(2);
        b.addView(ten, tl);
        onTap(b, () -> sendKey(forward ? ProjectorCommands.KEY_FAST_FORWARD : ProjectorCommands.KEY_REWIND));
        Style.press(b, 0.86f);
        FrameLayout wrap = new FrameLayout(this);
        wrap.addView(b, new FrameLayout.LayoutParams(dp(56), dp(56), Gravity.CENTER));
        return wrap;
    }

    private void playPause() {
        sendKey(ProjectorCommands.KEY_PLAY_PAUSE);
        ProjectorCommands.NowPlaying np = nowPlaying;
        if (np != null) {
            nowPlaying = new ProjectorCommands.NowPlaying(np.packageName, np.title, np.subtitle, np.isPlaying() ? 2 : 3);
            showNowPlaying();
        }
    }

    private void showNowPlaying() {
        for (NowPlayingViews v : nowPlayingViews) showNowPlaying(v);
    }

    private void showNowPlaying(NowPlayingViews v) {
        ProjectorCommands.NowPlaying np = nowPlaying;
        int artPx = v.art.getLayoutParams() != null ? v.art.getLayoutParams().width : dp(68);
        if (np == null) {
            v.art.setText("♪");
            v.art.setBackground(Style.appIcon(Style.BERRY, artPx));
            v.state.setText(mode == MODE_RECEIVER ? "SEM DEPURAÇÃO" : "PROJETOR");
            v.state.setTextColor(Style.TEXT2);
            v.title.setText(mode == MODE_RECEIVER ? "Controle de mídia" : "Nada tocando");
            v.subtitle.setText(mode == MODE_RECEIVER ? "Os botões controlam o player aberto" : "Abra um vídeo ou música no projetor");
            v.play.setImageResource(R.drawable.ic_play);
            return;
        }
        String app = appLabel(np.packageName);
        Object[] brand = BRANDS.get(np.packageName);
        int color = brand != null ? (Integer) brand[0] : Style.BERRY;
        v.art.setText(brand != null ? (String) brand[1] : app.substring(0, 1).toUpperCase());
        v.art.setBackground(Style.appIcon(color, artPx));
        v.state.setText(np.isPlaying() ? "TOCANDO" : "PAUSADO");
        v.state.setTextColor(np.isPlaying() ? Style.ACCENT : Style.GOLD);
        v.title.setText(np.title.isEmpty() ? app : np.title);
        v.subtitle.setText(np.subtitle.isEmpty() ? app : np.subtitle + " · " + app);
        v.play.setImageResource(np.isPlaying() ? R.drawable.ic_pause : R.drawable.ic_play);
    }

    private String appLabel(String pkg) {
        for (ProjectorCommands.App a : lastApps) if (a.packageName.equals(pkg)) return a.label;
        String last = pkg.substring(pkg.lastIndexOf('.') + 1);
        ProjectorCommands.NowPlaying np = nowPlaying;
        if (np != null && np.packageName.equals(pkg)) return np.appLabel();
        return last.isEmpty() ? pkg : Character.toUpperCase(last.charAt(0)) + last.substring(1);
    }

    /** Volume like the Control Center: capsule slider, the level, and −, Sem som, +. */
    private View volumeCard() {
        LinearLayout card = vertical();
        card.setBackground(Style.glassCard(dp(26), hairline()));
        card.setPadding(dp(18), dp(16), dp(18), dp(18));
        LinearLayout head = new LinearLayout(this);
        head.setGravity(Gravity.CENTER_VERTICAL);
        head.addView(text("Volume", 17, Style.TEXT, Style.semibold), new LinearLayout.LayoutParams(0, -2, 1f));
        TextView value = text(volume < 0 ? "–" : String.valueOf(volume), 15, Style.TEXT2, Style.semibold);
        value.setFontFeatureSettings("tnum");
        volumeValues.add(value);
        head.addView(value);
        card.addView(head);

        PillSlider slider = new PillSlider(this, false);
        slider.setIcons(R.drawable.ic_volume_down, R.drawable.ic_volume_up);
        slider.setMax(maxVolume);
        slider.setValue(volume, false);
        slider.setListener((v, done) -> {
            for (TextView t : volumeValues) t.setText(String.valueOf(v));
            if (done) setVolume(v);
        });
        volumeSliders.add(slider);
        card.addView(slider, new LinearLayout.LayoutParams(-1, dp(56)) {{ topMargin = dp(14); }});

        LinearLayout buttons = new LinearLayout(this);
        buttons.setGravity(Gravity.CENTER_VERTICAL);
        buttons.addView(circleButton(R.drawable.ic_minus, 48, Style.glassOval(hairline()), Style.TEXT, "Diminuir volume",
                () -> stepVolume(ProjectorCommands.KEY_VOLUME_DOWN, -1)));
        LinearLayout mute = new LinearLayout(this);
        mute.setGravity(Gravity.CENTER);
        mute.setBackground(Style.glassKey(999f, hairline()));
        ImageView muteIcon = icon(R.drawable.ic_volume_off, Style.TEXT);
        mute.addView(muteIcon, new LinearLayout.LayoutParams(dp(20), dp(20)));
        TextView muteText = text("Sem som", 15, Style.TEXT, Style.semibold);
        muteText.setPadding(dp(8), 0, 0, 0);
        mute.addView(muteText);
        muteIcons.add(muteIcon);
        muteTexts.add(muteText);
        onTap(mute, this::toggleMute);
        Style.press(mute, 0.96f);
        LinearLayout.LayoutParams mp = new LinearLayout.LayoutParams(0, dp(48), 1f);
        mp.setMargins(dp(10), 0, dp(10), 0);
        buttons.addView(mute, mp);
        buttons.addView(circleButton(R.drawable.ic_plus, 48, Style.glassOval(hairline()), Style.TEXT, "Aumentar volume",
                () -> stepVolume(ProjectorCommands.KEY_VOLUME_UP, 1)));
        card.addView(buttons, matchWrap(0, dp(14), 0, 0));
        return card;
    }

    /** First apps of the projector as icons; "Ver todos" opens the Apps tab. */
    private View shortcutsCard() {
        LinearLayout card = vertical();
        card.setBackground(Style.glassCard(dp(26), hairline()));
        card.setPadding(dp(16), dp(14), dp(16), dp(16));
        LinearLayout head = new LinearLayout(this);
        head.setGravity(Gravity.CENTER_VERTICAL);
        head.addView(text("Atalhos", 17, Style.TEXT, Style.semibold), new LinearLayout.LayoutParams(0, -2, 1f));
        TextView all = text("Ver todos", 15, Style.ACCENT, Style.medium);
        onTap(all, () -> selectTab(3));
        head.addView(all);
        card.addView(head);
        LinearLayout row = new LinearLayout(this);
        card.addView(row, matchWrap(-dp(4), dp(12), -dp(4), 0));
        shortcutRows.add(row);
        shortcutCards.add(card);
        renderShortcuts(row, card);
        return card;
    }

    // -- Touchpad

    private View buildTouchpadPage() {
        LinearLayout page = vertical();
        page.setPadding(dp(tablet ? 32 : 16), dp(8), dp(tablet ? 32 : 16), dp(tablet ? 24 : 96));
        LinearLayout tips = new LinearLayout(this);
        tips.setGravity(Gravity.CENTER);
        tips.addView(tipPill("Um dedo move"), wrapped(dp(3)));
        tips.addView(tipPill("Toque clica"), wrapped(dp(3)));
        tips.addView(tipPill("Dois dedos rolam"), wrapped(dp(3)));
        page.addView(tips, matchWrap(0, dp(6), 0, dp(12)));

        touchpad = new TouchpadView(this);
        touchpad.setSensitivity(sensitivityFromPrefs());
        touchpad.setListener(new TouchpadView.Listener() {
            @Override
            public void onMove(int dx, int dy) {
                queueInput(dx, dy, 0, 0, false);
            }

            @Override
            public void onClick() {
                click();
            }

            @Override
            public void onScroll(int dx, int dy) {
                queueInput(0, 0, dx, dy, false);
            }

            @Override
            public void onScrollEnd() {
                queueInput(0, 0, 0, 0, true);
            }
        });
        page.addView(touchpad, new LinearLayout.LayoutParams(-1, 0, 1f));
        LinearLayout row = new LinearLayout(this);
        row.addView(actionPill(R.drawable.ic_click, "Clique", Style.tintedGlass(Style.ACCENT_FILL, hairline()), 0xFFFFFFFF, this::click), weighted(dp(5)));
        row.addView(actionPill(R.drawable.ic_chevron_back, "Voltar", Style.glassKey(999f, hairline()), Style.TEXT, () -> sendKey(ProjectorCommands.KEY_BACK)), weighted(dp(5)));
        row.addView(actionPill(R.drawable.ic_home, "Início", Style.glassKey(999f, hairline()), Style.TEXT, () -> sendKey(ProjectorCommands.KEY_HOME)), weighted(dp(5)));
        page.addView(row, matchWrap(-dp(5), dp(12), -dp(5), 0));
        if (!tablet) return page;
        FrameLayout box = new FrameLayout(this);
        box.addView(page, new FrameLayout.LayoutParams(Math.min(dp(760), getResources().getDisplayMetrics().widthPixels), -1, Gravity.CENTER_HORIZONTAL));
        return box;
    }

    // -- Apps

    private View buildAppsPage() {
        LinearLayout page = page();
        LinearLayout head = new LinearLayout(this);
        head.setGravity(Gravity.CENTER_VERTICAL);
        head.addView(sectionTitle("Apps"), new LinearLayout.LayoutParams(0, -2, 1f));
        appsCount = text("", 13, Style.TEXT2, Style.semibold);
        appsCount.setBackground(Style.capsule(Style.FILL4));
        appsCount.setPadding(dp(10), dp(4), dp(10), dp(4));
        appsCount.setVisibility(View.GONE);
        head.addView(appsCount);
        head.addView(withLeft(circleButton(R.drawable.ic_refresh, 36, Style.glassOval(hairline()), Style.TEXT, "Atualizar lista",
                () -> worker.execute(this::loadApps)), dp(10)));
        page.addView(head, matchWrap(dp(4), dp(6), 0, dp(12)));

        LinearLayout search = new LinearLayout(this);
        search.setGravity(Gravity.CENTER_VERTICAL);
        search.setBackground(Style.rounded(Style.FILL4, dp(12)));
        search.setPadding(dp(10), 0, dp(10), 0);
        search.addView(icon(R.drawable.ic_search, Style.TEXT2), new LinearLayout.LayoutParams(dp(18), dp(18)));
        EditText query = new EditText(this);
        query.setHint("Buscar");
        query.setSingleLine(true);
        query.setBackground(null);
        query.setTextColor(Style.TEXT);
        query.setHintTextColor(Style.TEXT2);
        Style.type(query, 17, Style.regular);
        query.setPadding(dp(8), 0, 0, 0);
        query.addTextChangedListener(new android.text.TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void onTextChanged(CharSequence s, int a, int b, int c) {
            }

            @Override
            public void afterTextChanged(android.text.Editable e) {
                appFilter = e.toString().trim();
                renderApps();
            }
        });
        search.addView(query, new LinearLayout.LayoutParams(0, dp(42), 1f));
        page.addView(search, matchWrap(0, 0, 0, dp(18)));

        appsGrid = vertical();
        page.addView(appsGrid);
        renderApps();
        return constrained(page, 900);
    }

    private void showApps(List<ProjectorCommands.App> apps) {
        lastApps = apps;
        appsCount.setText(apps.size() == 1 ? "1 app" : apps.size() + " apps");
        appsCount.setVisibility(apps.isEmpty() ? View.GONE : View.VISIBLE);
        renderApps();
        for (int i = 0; i < shortcutRows.size(); i++) renderShortcuts(shortcutRows.get(i), shortcutCards.get(i));
        showNowPlaying();
    }

    private void renderApps() {
        if (appsGrid == null) return;
        appsGrid.removeAllViews();
        List<ProjectorCommands.App> shown = new ArrayList<>();
        String f = appFilter.toLowerCase();
        for (ProjectorCommands.App a : lastApps) if (f.isEmpty() || a.label.toLowerCase().contains(f)) shown.add(a);
        if (shown.isEmpty()) {
            TextView empty = text(lastApps.isEmpty() ? "Conecte ao projetor para ver os apps." : "Nenhum app com esse nome.",
                    15, Style.TEXT2, Style.regular);
            empty.setGravity(Gravity.CENTER);
            appsGrid.addView(empty, matchWrap(0, dp(30), 0, 0));
            return;
        }
        int widthDp = Math.min(900, getResources().getConfiguration().screenWidthDp) - (tablet ? 64 : 32);
        int columns = Math.max(4, widthDp / (tablet ? 116 : 88));
        LinearLayout row = null;
        for (int i = 0; i < shown.size(); i++) {
            if (i % columns == 0) {
                row = new LinearLayout(this);
                appsGrid.addView(row, matchWrap(0, 0, 0, dp(18)));
            }
            row.addView(appTile(shown.get(i), tablet ? 68 : 60), cell(0));
        }
        for (int i = shown.size() % columns; i != 0 && i < columns; i++) row.addView(new Space(this), cell(0));
    }

    private void renderShortcuts(LinearLayout row, View card) {
        row.removeAllViews();
        int n = Math.min(wide ? 5 : 4, lastApps.size());
        for (int i = 0; i < n; i++) row.addView(appTile(lastApps.get(i), 54), cell(0));
        for (int i = n; i < (wide ? 5 : 4); i++) row.addView(new Space(this), cell(0));
        card.setVisibility(n == 0 ? View.GONE : View.VISIBLE);
    }

    /** App icon like the iOS home screen: squircle with the brand colour and a label below. */
    private View appTile(ProjectorCommands.App app, int sizeDp) {
        Object[] brand = BRANDS.get(app.packageName);
        int color = brand != null ? (Integer) brand[0] : Style.mix(0xFF000000 | (app.packageName.hashCode() & 0xFFFFFF), Style.GRAY2, 0.35f);
        String mark = brand != null ? (String) brand[1] : app.label.substring(0, 1).toUpperCase();
        LinearLayout tile = vertical();
        tile.setGravity(Gravity.CENTER_HORIZONTAL);
        tile.setContentDescription(app.label);
        TextView badge = text(mark, sizeDp * 0.34f, 0xFFFFFFFF, Style.bold);
        badge.setGravity(Gravity.CENTER);
        badge.setBackground(Style.appIcon(color, dp(sizeDp)));
        badge.setElevation(dp(3));
        tile.addView(badge, new LinearLayout.LayoutParams(dp(sizeDp), dp(sizeDp)));
        TextView label = text(app.label, 12, 0xE6FFFFFF, Style.medium);
        label.setGravity(Gravity.CENTER);
        label.setMaxLines(2);
        label.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = dp(7);
        tile.addView(label, lp);
        onTap(tile, () -> {
            launchApp(app);
            Toast.makeText(this, "Abrindo " + app.label, Toast.LENGTH_SHORT).show();
        });
        Style.press(tile, 0.9f);
        return tile;
    }

    // -- Ajustes (grouped lists, like iOS Settings)

    private View buildSettingsPage() {
        LinearLayout page = page();
        page.addView(sectionTitle("Ajustes"), matchWrap(dp(4), dp(6), 0, dp(4)));

        LinearLayout proj = section(page, "Projetor", null);
        row(proj, R.drawable.ic_tune, Style.ROSE, "Ajustes do projetor", null,
                () -> openScreen("PROJECTOR_SETTINGS", ProjectorCommands.OPEN_PROJECTOR_SETTINGS));
        row(proj, R.drawable.ic_settings, Style.GRAY2, "Configurações", null, () -> openScreen("SETTINGS", ProjectorCommands.OPEN_SETTINGS));
        row(proj, R.drawable.ic_wifi, Style.PLUM, "Wi-Fi", null, () -> openScreen("WIFI", ProjectorCommands.OPEN_WIFI));
        row(proj, R.drawable.ic_bluetooth, Style.MAUVE, "Bluetooth", null, () -> openScreen("BLUETOOTH", ProjectorCommands.OPEN_BLUETOOTH));

        LinearLayout power = section(page, "Energia", "Ligar e Desligar ficam no topo e usam o infravermelho do celular.");
        row(power, R.drawable.ic_moon, Style.INDIGO, "Dormir", null, () -> sendKey(ProjectorCommands.KEY_SLEEP));
        row(power, R.drawable.ic_sun, Style.GOLD, "Acordar", null, () -> sendKey(ProjectorCommands.KEY_WAKEUP));
        row(power, R.drawable.ic_restart, Style.RED, "Reiniciar", null, this::confirmReboot);

        LinearLayout typing = section(page, "Digitar no projetor", "Selecione antes um campo de busca no projetor.");
        LinearLayout inputRow = new LinearLayout(this);
        inputRow.setGravity(Gravity.CENTER_VERTICAL);
        inputRow.setPadding(dp(16), dp(6), dp(8), dp(6));
        textField = field("Nome de um filme, música…", InputType.TYPE_CLASS_TEXT);
        textField.setBackground(null);
        textField.setPadding(0, 0, 0, 0);
        textField.setImeOptions(EditorInfo.IME_ACTION_SEND);
        textField.setOnEditorActionListener((v, actionId, event) -> {
            sendTypedText();
            return true;
        });
        inputRow.addView(textField, new LinearLayout.LayoutParams(0, dp(46), 1f));
        inputRow.addView(circleButton(R.drawable.ic_send, 38, Style.oval(Style.ACCENT_FILL), 0xFFFFFFFF, "Enviar texto", this::sendTypedText));
        typing.addView(inputRow);
        row(typing, R.drawable.ic_backspace, Style.RED, "Apagar", null, () -> sendKey(ProjectorCommands.KEY_DEL));
        row(typing, R.drawable.ic_enter, Style.GREEN, "Enter", null, () -> sendKey(ProjectorCommands.KEY_ENTER));

        LinearLayout conn = section(page, "Conexão", "O app acha o projetor sozinho quando o celular está no mesmo Wi-Fi. "
                + "Com a depuração por rede ligada, aceite o pedido na tela do projetor na primeira vez.");
        LinearLayout ipRow = new LinearLayout(this);
        ipRow.setGravity(Gravity.CENTER_VERTICAL);
        ipRow.setPadding(dp(16), dp(4), dp(16), dp(4));
        ipRow.addView(iconSquare(R.drawable.ic_wifi, Style.PLUM));
        TextView ipLabel = text("IP do projetor", 16.5f, Style.TEXT, Style.regular);
        ipLabel.setPadding(dp(14), 0, 0, 0);
        ipRow.addView(ipLabel);
        hostField = field("192.168.0.5", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        hostField.setBackground(null);
        hostField.setGravity(Gravity.END | Gravity.CENTER_VERTICAL);
        hostField.setTextColor(Style.TEXT2);
        hostField.setPadding(0, 0, 0, 0);
        hostField.setText(host);
        hostField.setImeOptions(EditorInfo.IME_ACTION_GO);
        hostField.setOnEditorActionListener((v, actionId, event) -> {
            reconnect();
            return true;
        });
        ipRow.addView(hostField, new LinearLayout.LayoutParams(0, dp(48), 1f));
        conn.addView(ipRow);
        row(conn, R.drawable.ic_link, Style.ROSE, "Conectar a este IP", null, this::reconnect);
        row(conn, R.drawable.ic_search, Style.COPPER, "Procurar o projetor no Wi-Fi", null, this::searchNetwork);

        LinearLayout free = section(page, "Sem a depuração", "Instale uma vez o Receptor do Controle no projetor (com a "
                + "depuração ligada). Depois o app funciona igual com ela desligada. Menu e Acordar vão pelo infravermelho; "
                + "Reiniciar abre o menu de energia do projetor.");
        row(free, R.drawable.ic_download, Style.GOLD, "Instalar o receptor no projetor", null, this::installReceiver);
        row(free, R.drawable.ic_link, Style.ROSE, "Parear com o receptor", null, this::pairManually);
        View irRow = row(free, R.drawable.ic_ir, Style.COPPER, "Setas e OK pelo infravermelho", null, null);
        IosSwitch arrows = new IosSwitch(this);
        arrows.setChecked(prefs.getBoolean("setas_ir", false), false);
        arrows.setListener(on -> prefs.edit().putBoolean("setas_ir", on).apply());
        ((LinearLayout) irRow).addView(arrows);

        LinearLayout screen = section(page, "Tela", "Quando o celular tem tela de 120 Hz, o app pede esse modo, e as animações "
                + "ficam com 120 quadros por segundo. Se a taxa não subir, ligue a taxa de atualização alta nas "
                + "configurações de tela do celular. Desligue para gastar menos bateria.");
        View hzRow = row(screen, R.drawable.ic_tv, Style.MAUVE, "Animações a 120 Hz", null, null);
        IosSwitch hz = new IosSwitch(this);
        hz.setChecked(prefs.getBoolean("hz120", true), false);
        hz.setListener(on -> {
            prefs.edit().putBoolean("hz120", on).apply();
            applyRefreshRate();
        });
        ((LinearLayout) hzRow).addView(hz);
        View nowRow = row(screen, R.drawable.ic_tv, Style.GRAY2, "Taxa da tela agora", "", null);
        refreshValue = (TextView) ((LinearLayout) nowRow).getChildAt(2);
        refreshValue.setFontFeatureSettings("tnum");

        LinearLayout pad = section(page, "Touchpad", null);
        LinearLayout speedRow = vertical();
        speedRow.setPadding(dp(16), dp(12), dp(16), dp(14));
        speedRow.addView(text("Velocidade do cursor", 16.5f, Style.TEXT, Style.regular));
        PillSlider speed = new PillSlider(this, false);
        speed.setFillColor(Style.ACCENT);
        speed.setMax(8);
        speed.setValue(prefs.getInt("speed", 3), false);
        speed.setListener((v, done) -> {
            prefs.edit().putInt("speed", v).apply();
            if (touchpad != null) touchpad.setSensitivity(sensitivityFromPrefs());
        });
        speedRow.addView(speed, new LinearLayout.LayoutParams(-1, dp(34)) {{ topMargin = dp(12); }});
        pad.addView(speedRow);

        boolean hasIr = infrared() != null;
        LinearLayout ir = section(page, "Infravermelho", "Ligar, Desligar e, quando preciso, as setas usam o emissor do celular. "
                + "Aponte a ponta de cima do celular para o projetor.");
        row(ir, R.drawable.ic_ir, hasIr ? Style.GREEN : Style.RED, "Emissor do celular", hasIr ? "Disponível" : "Não encontrado", null);

        TextView version = text("Controle Projetor 6.2", 13, Style.TEXT3, Style.regular);
        version.setGravity(Gravity.CENTER);
        page.addView(version, matchWrap(0, dp(26), 0, 0));
        return constrained(page, 680);
    }

    /** Grouped section: grey caption, rounded cell, optional footnote. Returns the cell to add rows to. */
    private LinearLayout section(LinearLayout page, String header, String footer) {
        TextView h = text(header.toUpperCase(), 13, Style.TEXT2, Style.regular);
        h.setLetterSpacing(0.02f);
        page.addView(h, matchWrap(dp(16), dp(26), dp(16), dp(7)));
        LinearLayout cell = vertical();
        cell.setBackground(Style.glassCard(dp(12), hairline()));
        cell.setClipToOutline(true);
        page.addView(cell, matchWrap(0, 0, 0, 0));
        if (footer != null) {
            TextView f = text(footer, 13, Style.TEXT2, Style.regular);
            f.setLineSpacing(dp(1.5f), 1f);
            page.addView(f, matchWrap(dp(16), dp(7), dp(16), 0));
        }
        return cell;
    }

    /** Settings row: coloured icon square, title, optional value, chevron when it does something. */
    private View row(LinearLayout cell, int icon, int color, String title, String value, Runnable action) {
        if (cell.getChildCount() > 0) {
            View sep = new View(this);
            sep.setBackgroundColor(Style.SEPARATOR);
            LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-1, Math.max(1, dp(0.5f)));
            sp.leftMargin = dp(60);
            cell.addView(sep, sp);
        }
        LinearLayout r = new LinearLayout(this);
        r.setGravity(Gravity.CENTER_VERTICAL);
        r.setMinimumHeight(dp(52));
        r.setPadding(dp(16), dp(8), dp(14), dp(8));
        r.addView(iconSquare(icon, color));
        TextView t = text(title, 16.5f, Style.TEXT, Style.regular);
        t.setPadding(dp(14), 0, dp(8), 0);
        r.addView(t, new LinearLayout.LayoutParams(0, -2, 1f));
        if (value != null) r.addView(text(value, 16, Style.TEXT2, Style.regular));
        if (action != null) {
            ImageView chevron = icon(R.drawable.ic_chevron_right, 0x4DEBEBF5);
            LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(dp(14), dp(14));
            cp.leftMargin = dp(8);
            r.addView(chevron, cp);
            r.setBackground(Style.rowBackground());
            onTap(r, action);
        }
        cell.addView(r);
        return r;
    }

    private View iconSquare(int icon, int color) {
        FrameLayout sq = new FrameLayout(this);
        sq.setBackground(Style.rounded(color, dp(7.5f)));
        sq.addView(icon(icon, 0xFFFFFFFF), new FrameLayout.LayoutParams(dp(18), dp(18), Gravity.CENTER));
        sq.setLayoutParams(new LinearLayout.LayoutParams(dp(30), dp(30)));
        return sq;
    }

    // -- shared pieces

    private float sensitivityFromPrefs() {
        return 0.8f + prefs.getInt("speed", 3) * 0.3f;
    }

    private void sendTypedText() {
        String typed = textField.getText().toString();
        if (mode == MODE_RECEIVER) {
            if (typed.isEmpty()) return;
            String encoded = Base64.getEncoder().encodeToString(typed.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            worker.execute(() -> receiverRequest("TEXT " + encoded));
            textField.setText("");
            return;
        }
        String command = ProjectorCommands.inputText(typed);
        if (command == null) return;
        send(command);
        textField.setText("");
    }

    private LinearLayout page() {
        LinearLayout page = vertical();
        page.setPadding(dp(tablet ? 32 : 16), dp(8), dp(tablet ? 32 : 16), dp(tablet ? 40 : 120));
        return page;
    }

    /** On wide screens, centres the page and keeps it at a readable width. */
    private View constrained(View content, int maxDp) {
        if (!tablet) return content;
        FrameLayout box = new FrameLayout(this);
        int w = Math.min(dp(maxDp), getResources().getDisplayMetrics().widthPixels);
        box.addView(content, new FrameLayout.LayoutParams(w, -2, Gravity.CENTER_HORIZONTAL));
        return box;
    }

    private TextView sectionTitle(String s) {
        return text(s, 28, Style.TEXT, Style.bold);
    }

    private LinearLayout vertical() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        return l;
    }

    private ImageView icon(int res, int tint) {
        ImageView i = new ImageView(this);
        i.setImageResource(res);
        i.setImageTintList(ColorStateList.valueOf(tint));
        return i;
    }

    private ScrollView scrolling(View content) {
        ScrollView s = new ScrollView(this);
        s.setFillViewport(true);
        s.setVerticalScrollBarEnabled(false);
        s.setOverScrollMode(View.OVER_SCROLL_NEVER);
        s.addView(content);
        return s;
    }

    private View circleButton(int icon, int sizeDp, Drawable background, int tint, String description, Runnable action) {
        FrameLayout b = new FrameLayout(this);
        b.setBackground(background);
        b.setContentDescription(description);
        int iconSize = Math.round(sizeDp * 0.42f);
        b.addView(icon(icon, tint), new FrameLayout.LayoutParams(dp(iconSize), dp(iconSize), Gravity.CENTER));
        onTap(b, action);
        Style.press(b, 0.9f);
        b.setLayoutParams(new LinearLayout.LayoutParams(dp(sizeDp), dp(sizeDp)));
        return b;
    }

    /** Tinted capsule: soft fill in the colour, icon and text in a lighter shade of it. */
    private View commandPill(int icon, String label, int color, Runnable action) {
        LinearLayout p = new LinearLayout(this);
        p.setGravity(Gravity.CENTER);
        p.setBackground(Style.tintedGlass(color, hairline()));
        p.setPadding(dp(tablet ? 14 : 8), 0, dp(tablet ? 16 : 10), 0);
        p.setContentDescription(label);
        int fg = Style.mix(color, 0xFFFFFFFF, 0.35f);
        p.addView(icon(icon, fg), new LinearLayout.LayoutParams(dp(16), dp(16)));
        TextView t = text(label, tablet ? 15 : 14.5f, fg, Style.semibold);
        t.setSingleLine(true);
        t.setPadding(dp(6), 0, 0, 0);
        p.addView(t);
        onTap(p, action);
        Style.press(p, 0.94f);
        return p;
    }

    private View quickPill(int icon, String label, Runnable action) {
        LinearLayout p = new LinearLayout(this);
        p.setGravity(Gravity.CENTER);
        p.setBackground(Style.glassKey(999f, hairline()));
        p.setPadding(dp(13), 0, dp(15), 0);
        p.setContentDescription(label);
        p.addView(icon(icon, Style.TEXT), new LinearLayout.LayoutParams(dp(16), dp(16)));
        TextView t = text(label, 14.5f, Style.TEXT, Style.semibold);
        t.setPadding(dp(7), 0, 0, 0);
        p.addView(t);
        onTap(p, action);
        Style.press(p, 0.94f);
        return p;
    }

    private LinearLayout.LayoutParams quickParams() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, dp(38));
        lp.setMargins(dp(4), 0, dp(4), 0);
        return lp;
    }

    private View actionPill(int icon, String label, Drawable background, int foreground, Runnable action) {
        LinearLayout p = new LinearLayout(this);
        p.setGravity(Gravity.CENTER);
        p.setBackground(background);
        p.setMinimumHeight(dp(52));
        p.setContentDescription(label);
        p.addView(icon(icon, foreground), new LinearLayout.LayoutParams(dp(19), dp(19)));
        TextView t = text(label, 16, foreground, Style.semibold);
        t.setPadding(dp(8), 0, 0, 0);
        p.addView(t);
        onTap(p, action);
        Style.press(p, 0.95f);
        return p;
    }

    private View tipPill(String label) {
        TextView t = text(label, 12.5f, Style.TEXT2, Style.medium);
        t.setBackground(Style.capsule(Style.FILL4));
        t.setPadding(dp(11), dp(6), dp(11), dp(6));
        return t;
    }

    private void onTap(View v, Runnable action) {
        v.setClickable(true);
        v.setOnClickListener(view -> {
            view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            action.run();
        });
    }

    private EditText field(String hint, int inputType) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setInputType(inputType);
        e.setSingleLine(true);
        e.setTextColor(Style.TEXT);
        e.setHintTextColor(Style.TEXT3);
        Style.type(e, 16.5f, Style.regular);
        e.setBackground(Style.rounded(Style.FILL4, dp(12)));
        e.setPadding(dp(14), 0, dp(14), 0);
        return e;
    }

    private TextView text(String s, float sp, int color, Typeface face) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextColor(color);
        Style.type(t, sp, face);
        return t;
    }

    private LinearLayout.LayoutParams weighted(int margin) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp.setMargins(margin, margin, margin, margin);
        return lp;
    }

    private LinearLayout.LayoutParams wrapped(int margin) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
        lp.setMargins(margin, 0, margin, 0);
        return lp;
    }

    /** Adds a left margin to a view that already carries its own size. */
    private View withLeft(View v, int left) {
        ((LinearLayout.LayoutParams) v.getLayoutParams()).leftMargin = left;
        return v;
    }

    private LinearLayout.LayoutParams spaced(int left) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
        lp.leftMargin = left;
        return lp;
    }

    /**
     * Grid cell: shares the row's width and takes the height of the tallest cell. Rows are completed
     * with {@link Space}, which measures to nothing, so a short last row keeps its height.
     */
    private LinearLayout.LayoutParams cell(int margin) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.MATCH_PARENT, 1f);
        lp.setMargins(margin, margin, margin, margin);
        return lp;
    }

    private LinearLayout.LayoutParams matchWrap(int left, int top, int right, int bottom) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(left, top, right, bottom);
        return lp;
    }

    private int dp(float v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }

    /** Glass rims are a hairline: one physical pixel, or a bit more on very dense screens. */
    private int hairline() {
        return Math.max(1, dp(0.6f));
    }
}
