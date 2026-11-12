package dev.projetor.controle;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Context;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
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
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import android.text.InputType;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.inputmethod.EditorInfo;
import android.widget.EditText;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.SeekBar;
import android.widget.Switch;
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
    private static final String[] TAB_NAMES = {"Controle", "Touchpad", "Apps", "Mais"};
    private static final int[] TAB_ICONS = {R.drawable.ic_dpad, R.drawable.ic_mouse, R.drawable.ic_apps, R.drawable.ic_more};
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
    private final View[] pages = new View[4];
    private final LinearLayout[] tabs = new LinearLayout[4];
    private SeekBar volumeBar;
    private TextView volumeLabel;
    private ImageView muteIcon;
    private TextView muteText;
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
        selectTab(prefs.getInt("tab", 0));
        watchWifi();
    }

    @Override
    protected void onResume() {
        super.onResume();
        lastFailure = 0;
        lastScan = 0;
        worker.execute(() -> {
            if (ensureConnected() && loaded) loadVolume();
        });
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
        volumeBar.setMax(maxVolume);
        volumeBar.setProgress(Math.max(volume, 0));
        volumeLabel.setText(volume < 0 ? "–" : volume + " / " + maxVolume);
        boolean muted = volume == 0;
        muteIcon.setImageResource(muted ? R.drawable.ic_volume_up : R.drawable.ic_volume_off);
        muteText.setText(muted ? "Ativar som" : "Sem som");
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

    // ---------------------------------------------------------------- UI

    private static final int[] TAB_COLORS = {Style.ACCENT, Style.TEAL, Style.ORANGE, Style.VIOLET};

    private View buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackground(new Style.Backdrop());
        root.setOnApplyWindowInsetsListener(this::applyInsets);

        root.addView(buildHeader(), matchWrap(dp(14), dp(8), dp(14), 0));
        root.addView(buildPowerRow(), matchWrap(dp(10), dp(10), dp(10), 0));
        root.addView(buildTabs(), matchWrap(dp(14), dp(10), dp(14), dp(4)));

        FrameLayout content = new FrameLayout(this);
        pages[0] = scrolling(buildControlPage());
        pages[1] = buildTouchpadPage();
        pages[2] = scrolling(buildAppsPage());
        pages[3] = scrolling(buildMorePage());
        for (View p : pages) content.addView(p, new FrameLayout.LayoutParams(-1, -1));
        root.addView(content, new LinearLayout.LayoutParams(-1, 0, 1f));
        return root;
    }

    private WindowInsets applyInsets(View v, WindowInsets insets) {
        int left;
        int top;
        int right;
        int bottom;
        if (Build.VERSION.SDK_INT >= 30) {
            Insets bars = insets.getInsets(WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout());
            Insets ime = insets.getInsets(WindowInsets.Type.ime());
            left = bars.left;
            top = bars.top;
            right = bars.right;
            bottom = Math.max(bars.bottom, ime.bottom);
        } else {
            left = insets.getSystemWindowInsetLeft();
            top = insets.getSystemWindowInsetTop();
            right = insets.getSystemWindowInsetRight();
            bottom = insets.getSystemWindowInsetBottom();
        }
        v.setPadding(left, top, right, bottom);
        return insets;
    }

    /** Gradient card with the projector, its connection status and a shortcut to the settings tab. */
    private View buildHeader() {
        LinearLayout hero = new LinearLayout(this);
        hero.setGravity(Gravity.CENTER_VERTICAL);
        hero.setBackground(new Style.Hero(dp(26), dp(1)));
        hero.setElevation(dp(8));
        hero.setPadding(dp(14), dp(14), dp(12), dp(14));

        FrameLayout bubble = new FrameLayout(this);
        bubble.setBackground(Style.oval(0x33FFFFFF));
        bubble.addView(icon(R.drawable.ic_projector, 0xFFFFFFFF), new FrameLayout.LayoutParams(dp(32), dp(32), Gravity.CENTER));
        hero.addView(bubble, new LinearLayout.LayoutParams(dp(58), dp(58)));

        LinearLayout titles = vertical();
        titles.addView(text("Projetor HY300", 22, 0xFFFFFFFF, true));
        titles.addView(text("Wi-Fi + infravermelho", 12.5f, 0xD9FFFFFF, false));
        LinearLayout chip = new LinearLayout(this);
        chip.setGravity(Gravity.CENTER_VERTICAL);
        chip.setBackground(Style.rounded(0x47000000, dp(14)));
        chip.setPadding(dp(10), dp(5), dp(12), dp(5));
        statusDot = new View(this);
        statusDot.setBackground(Style.oval(Style.MUTED));
        chip.addView(statusDot, new LinearLayout.LayoutParams(dp(9), dp(9)));
        statusText = text("Desconectado", 12.5f, 0xFFFFFFFF, true);
        statusText.setMaxLines(2);
        statusText.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams stp = new LinearLayout.LayoutParams(-2, -2);
        stp.leftMargin = dp(7);
        chip.addView(statusText, stp);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-2, -2);
        cp.topMargin = dp(8);
        titles.addView(chip, cp);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, -2, 1f);
        tp.leftMargin = dp(12);
        tp.rightMargin = dp(6);
        hero.addView(titles, tp);

        hero.addView(roundButton(R.drawable.ic_settings, 44, Style.ripple(Style.oval(0x33FFFFFF)),
                0xFFFFFFFF, "Ajustes", () -> selectTab(3)));
        return hero;
    }

    private View buildPowerRow() {
        LinearLayout row = new LinearLayout(this);
        row.addView(powerButton("Ligar", Style.GREEN, Style.GREEN2, this::powerOn), weighted(dp(4)));
        row.addView(powerButton("Desligar", Style.RED, Style.RED2, this::powerOff), weighted(dp(4)));
        return row;
    }

    private View powerButton(String title, int from, int to, Runnable action) {
        LinearLayout p = new LinearLayout(this);
        p.setGravity(Gravity.CENTER_VERTICAL);
        p.setBackground(Style.ripple(Style.gradient(from, to, dp(22))));
        p.setElevation(dp(6));
        p.setPadding(dp(12), dp(12), dp(10), dp(12));
        p.setContentDescription(title + " o projetor por infravermelho");
        FrameLayout bubble = new FrameLayout(this);
        bubble.setBackground(Style.oval(0x38FFFFFF));
        bubble.addView(icon(R.drawable.ic_power, 0xFFFFFFFF), new FrameLayout.LayoutParams(dp(24), dp(24), Gravity.CENTER));
        p.addView(bubble, new LinearLayout.LayoutParams(dp(44), dp(44)));
        LinearLayout t = vertical();
        t.addView(text(title, 18, 0xFFFFFFFF, true));
        LinearLayout ir = new LinearLayout(this);
        ir.setGravity(Gravity.CENTER_VERTICAL);
        ir.addView(icon(R.drawable.ic_ir, 0xD9FFFFFF), new LinearLayout.LayoutParams(dp(13), dp(13)));
        TextView sub = text("infravermelho", 11.5f, 0xD9FFFFFF, false);
        sub.setPadding(dp(3), 0, 0, 0);
        ir.addView(sub);
        t.addView(ir);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-2, -2);
        lp.leftMargin = dp(10);
        p.addView(t, lp);
        onTap(p, action);
        return p;
    }

    private View buildTabs() {
        LinearLayout bar = new LinearLayout(this);
        bar.setBackground(Style.outlined(0xE6121828, dp(22), dp(1)));
        bar.setElevation(dp(4));
        bar.setPadding(dp(5), dp(5), dp(5), dp(5));
        for (int i = 0; i < 4; i++) {
            final int index = i;
            LinearLayout tab = new LinearLayout(this);
            tab.setOrientation(LinearLayout.VERTICAL);
            tab.setGravity(Gravity.CENTER);
            tab.setPadding(0, dp(8), 0, dp(8));
            tab.addView(icon(TAB_ICONS[i], TAB_COLORS[i]), new LinearLayout.LayoutParams(dp(23), dp(23)));
            TextView label = text(TAB_NAMES[i], 12, Style.SOFT, true);
            label.setGravity(Gravity.CENTER);
            label.setPadding(0, dp(3), 0, 0);
            tab.addView(label);
            tab.setOnClickListener(v -> {
                v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                selectTab(index);
            });
            tabs[i] = tab;
            bar.addView(tab, new LinearLayout.LayoutParams(0, -2, 1f));
        }
        return bar;
    }

    private void selectTab(int index) {
        if (index < 0 || index > 3) index = 0;
        for (int i = 0; i < 4; i++) {
            boolean on = i == index;
            pages[i].setVisibility(on ? View.VISIBLE : View.GONE);
            tabs[i].setBackground(on ? Style.gradient(TAB_COLORS[i], Style.mix(TAB_COLORS[i], Style.VIOLET, 0.55f), dp(17)) : null);
            tabs[i].setElevation(on ? dp(3) : 0);
            ((ImageView) tabs[i].getChildAt(0)).setImageTintList(ColorStateList.valueOf(on ? 0xFFFFFFFF : TAB_COLORS[i]));
            ((TextView) tabs[i].getChildAt(1)).setTextColor(on ? 0xFFFFFFFF : Style.SOFT);
        }
        prefs.edit().putInt("tab", index).apply();
    }

    private View buildControlPage() {
        LinearLayout page = page();

        LinearLayout nav = new LinearLayout(this);
        nav.setGravity(Gravity.CENTER);
        nav.addView(labeled(roundButton(R.drawable.ic_back, 62, Style.ripple(Style.ovalGradient(Style.TEAL, Style.TEAL2)),
                0xFFFFFFFF, "Voltar", () -> sendKey(ProjectorCommands.KEY_BACK)), "Voltar", 88), weighted(0));
        nav.addView(labeled(roundButton(R.drawable.ic_home, 80, Style.ripple(Style.ovalGradient(Style.ACCENT, Style.VIOLET)),
                0xFFFFFFFF, "Início", () -> sendKey(ProjectorCommands.KEY_HOME)), "Início", 88), weighted(0));
        nav.addView(labeled(roundButton(R.drawable.ic_menu, 62, Style.ripple(Style.ovalGradient(Style.ORANGE, Style.PINK)),
                0xFFFFFFFF, "Menu", () -> sendKey(ProjectorCommands.KEY_MENU)), "Menu", 88), weighted(0));
        page.addView(nav, matchWrap(0, dp(6), 0, 0));

        DpadView dpad = new DpadView(this);
        dpad.setListener(this::sendKey);
        page.addView(dpad, matchWrap(0, dp(6), 0, 0));

        LinearLayout media = card(page, "Mídia", R.drawable.ic_play_pause, Style.PINK);
        LinearLayout mediaRow = new LinearLayout(this);
        mediaRow.setGravity(Gravity.CENTER);
        mediaRow.addView(labeled(roundButton(R.drawable.ic_rewind, 56, Style.ripple(Style.tinted(Style.VIOLET, dp(28), dp(1))),
                0xFFC4B5FD, "Voltar vídeo", () -> sendKey(ProjectorCommands.KEY_REWIND)), "Voltar", 76), weighted(0));
        mediaRow.addView(labeled(roundButton(R.drawable.ic_play_pause, 68, Style.ripple(Style.ovalGradient(Style.PINK, Style.ORANGE)),
                0xFFFFFFFF, "Play ou pausa", () -> sendKey(ProjectorCommands.KEY_PLAY_PAUSE)), "Play / Pausa", 76), weighted(0));
        mediaRow.addView(labeled(roundButton(R.drawable.ic_fast_forward, 56, Style.ripple(Style.tinted(Style.VIOLET, dp(28), dp(1))),
                0xFFC4B5FD, "Avançar vídeo", () -> sendKey(ProjectorCommands.KEY_FAST_FORWARD)), "Avançar", 76), weighted(0));
        media.addView(mediaRow);

        LinearLayout vol = card(page, "Volume", R.drawable.ic_volume_up, Style.ACCENT);
        LinearLayout volHeader = (LinearLayout) vol.getChildAt(0);
        volumeLabel = text("–", 14, 0xFFFFFFFF, true);
        volumeLabel.setBackground(Style.gradient(Style.ACCENT, Style.VIOLET, dp(12)));
        volumeLabel.setPadding(dp(12), dp(4), dp(12), dp(4));
        volHeader.addView(volumeLabel);
        volumeBar = new SeekBar(this);
        volumeBar.setMax(maxVolume);
        volumeBar.setProgressDrawable(Style.track(dp(10)));
        volumeBar.setThumb(Style.thumb(dp(26), dp(4)));
        volumeBar.setSplitTrack(false);
        volumeBar.setPadding(dp(18), dp(16), dp(18), dp(16));
        volumeBar.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar bar, int progress, boolean fromUser) {
                if (fromUser) volumeLabel.setText(progress + " / " + maxVolume);
            }

            @Override
            public void onStartTrackingTouch(SeekBar bar) {
            }

            @Override
            public void onStopTrackingTouch(SeekBar bar) {
                setVolume(bar.getProgress());
            }
        });
        vol.addView(volumeBar);
        LinearLayout volButtons = new LinearLayout(this);
        volButtons.setGravity(Gravity.CENTER_VERTICAL);
        volButtons.addView(roundButton(R.drawable.ic_volume_down, 56, Style.ripple(Style.ovalGradient(Style.SKY, Style.ACCENT)),
                0xFFFFFFFF, "Diminuir volume",
                () -> stepVolume(ProjectorCommands.KEY_VOLUME_DOWN, -1)), new LinearLayout.LayoutParams(-2, -2));
        LinearLayout mute = pill(R.drawable.ic_volume_off, "Sem som",
                Style.ripple(Style.tinted(Style.RED, dp(28), dp(1))), this::toggleMute);
        muteIcon = (ImageView) mute.getChildAt(0);
        muteIcon.setImageTintList(ColorStateList.valueOf(0xFFFDA4AF));
        muteText = (TextView) mute.getChildAt(1);
        muteText.setTextSize(15);
        LinearLayout.LayoutParams mp = new LinearLayout.LayoutParams(0, dp(56), 1f);
        mp.setMargins(dp(10), 0, dp(10), 0);
        volButtons.addView(mute, mp);
        volButtons.addView(roundButton(R.drawable.ic_volume_up, 56, Style.ripple(Style.ovalGradient(Style.ACCENT, Style.VIOLET)),
                0xFFFFFFFF, "Aumentar volume",
                () -> stepVolume(ProjectorCommands.KEY_VOLUME_UP, 1)), new LinearLayout.LayoutParams(-2, -2));
        vol.addView(volButtons);

        shortcutsCard = card(page, "Atalhos", R.drawable.ic_apps, Style.ORANGE);
        shortcutsRow = new LinearLayout(this);
        shortcutsCard.addView(shortcutsRow, matchWrap(-dp(2), 0, -dp(2), 0));
        shortcutsCard.setVisibility(View.GONE);
        return page;
    }

    private View buildTouchpadPage() {
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(14), dp(8), dp(14), dp(14));

        LinearLayout tips = new LinearLayout(this);
        tips.addView(chip(R.drawable.ic_mouse, "1 dedo move", Style.ACCENT), weighted(dp(3)));
        tips.addView(chip(R.drawable.ic_click, "Toque clica", Style.TEAL), weighted(dp(3)));
        tips.addView(chip(R.drawable.ic_dpad, "2 dedos rolam", Style.ORANGE), weighted(dp(3)));
        page.addView(tips, matchWrap(-dp(3), 0, -dp(3), dp(8)));

        touchpad = new TouchpadView(this);
        touchpad.setSensitivity(sensitivityFromPrefs());
        touchpad.setElevation(dp(4));
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
        row.addView(pill(R.drawable.ic_click, "Clique", Style.ripple(Style.gradient(Style.ACCENT, Style.VIOLET, dp(18))),
                this::click), weighted(dp(4)));
        row.addView(pill(R.drawable.ic_back, "Voltar", Style.ripple(Style.gradient(Style.TEAL, Style.TEAL2, dp(18))),
                () -> sendKey(ProjectorCommands.KEY_BACK)), weighted(dp(4)));
        row.addView(pill(R.drawable.ic_home, "Início", Style.ripple(Style.gradient(Style.VIOLET, Style.PINK, dp(18))),
                () -> sendKey(ProjectorCommands.KEY_HOME)), weighted(dp(4)));
        page.addView(row, matchWrap(-dp(4), dp(10), -dp(4), 0));
        return page;
    }

    private View buildAppsPage() {
        LinearLayout page = page();
        LinearLayout card = card(page, "Apps do projetor", R.drawable.ic_apps, Style.ORANGE);
        LinearLayout header = (LinearLayout) card.getChildAt(0);
        appsCount = text("", 12.5f, 0xFFFFD7B5, true);
        appsCount.setBackground(Style.tinted(Style.ORANGE, dp(12), dp(1)));
        appsCount.setPadding(dp(10), dp(3), dp(10), dp(3));
        appsCount.setVisibility(View.GONE);
        LinearLayout.LayoutParams ap = new LinearLayout.LayoutParams(-2, -2);
        ap.rightMargin = dp(8);
        header.addView(appsCount, ap);
        header.addView(roundButton(R.drawable.ic_refresh, 40, Style.ripple(Style.tinted(Style.ORANGE, dp(20), dp(1))),
                0xFFFFB27A, "Atualizar lista", () -> worker.execute(this::loadApps)));
        appsGrid = new LinearLayout(this);
        appsGrid.setOrientation(LinearLayout.VERTICAL);
        appsGrid.addView(text("Conecte ao projetor para ver os apps.", 14, Style.MUTED, false));
        card.addView(appsGrid);
        return page;
    }

    private void showApps(List<ProjectorCommands.App> apps) {
        appsGrid.removeAllViews();
        shortcutsRow.removeAllViews();
        if (apps.isEmpty()) {
            appsGrid.addView(text("Nenhum app encontrado. Toque em atualizar.", 14, Style.MUTED, false));
            appsCount.setVisibility(View.GONE);
            shortcutsCard.setVisibility(View.GONE);
            return;
        }
        appsCount.setText(apps.size() == 1 ? "1 app" : apps.size() + " apps");
        appsCount.setVisibility(View.VISIBLE);
        LinearLayout row = null;
        for (int i = 0; i < apps.size(); i++) {
            if (i % 3 == 0) {
                row = new LinearLayout(this);
                appsGrid.addView(row);
            }
            row.addView(appTile(apps.get(i), 60), cell(dp(4)));
        }
        for (int i = apps.size() % 3; i != 0 && i < 3; i++) row.addView(new Space(this), cell(dp(4)));

        int shortcuts = Math.min(4, apps.size());
        for (int i = 0; i < shortcuts; i++) shortcutsRow.addView(appTile(apps.get(i), 48), cell(dp(3)));
        for (int i = shortcuts; i < 4; i++) shortcutsRow.addView(new Space(this), cell(dp(3)));
        shortcutsCard.setVisibility(View.VISIBLE);
    }

    private View appTile(ProjectorCommands.App app, int badgeDp) {
        Object[] brand = BRANDS.get(app.packageName);
        int color = brand != null ? (Integer) brand[0] : 0xFF000000 | (app.packageName.hashCode() & 0x7F7F7F) | 0x303030;
        String mark = brand != null ? (String) brand[1] : app.label.substring(0, 1).toUpperCase();

        LinearLayout tile = new LinearLayout(this);
        tile.setOrientation(LinearLayout.VERTICAL);
        tile.setGravity(Gravity.CENTER_HORIZONTAL);
        tile.setPadding(dp(4), dp(10), dp(4), dp(10));
        tile.setBackground(Style.ripple(Style.tinted(color, dp(18), dp(1))));
        TextView badge = text(mark, badgeDp * 0.32f, 0xFFFFFFFF, true);
        badge.setGravity(Gravity.CENTER);
        badge.setBackground(Style.badge(color, dp(badgeDp * 0.3f)));
        badge.setElevation(dp(3));
        tile.addView(badge, new LinearLayout.LayoutParams(dp(badgeDp), dp(badgeDp)));
        TextView label = text(app.label, badgeDp < 56 ? 11.5f : 12.5f, Style.TEXT, false);
        label.setGravity(Gravity.CENTER);
        label.setMaxLines(2);
        label.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = dp(7);
        tile.addView(label, lp);
        tile.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            launchApp(app);
            Toast.makeText(this, "Abrindo " + app.label, Toast.LENGTH_SHORT).show();
        });
        return tile;
    }

    private View buildMorePage() {
        LinearLayout page = page();

        LinearLayout typing = card(page, "Digitar no projetor", R.drawable.ic_send, Style.ACCENT);
        LinearLayout inputRow = new LinearLayout(this);
        inputRow.setGravity(Gravity.CENTER_VERTICAL);
        textField = field("Ex.: nome de um filme", InputType.TYPE_CLASS_TEXT);
        textField.setImeOptions(EditorInfo.IME_ACTION_SEND);
        textField.setOnEditorActionListener((v, actionId, event) -> {
            sendTypedText();
            return true;
        });
        inputRow.addView(textField, new LinearLayout.LayoutParams(0, dp(54), 1f));
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-2, -2);
        sp.leftMargin = dp(8);
        inputRow.addView(roundButton(R.drawable.ic_send, 54,
                Style.ripple(Style.ovalGradient(Style.ACCENT, Style.VIOLET)), 0xFFFFFFFF, "Enviar texto",
                this::sendTypedText), sp);
        typing.addView(inputRow);
        LinearLayout keys = new LinearLayout(this);
        keys.addView(pill(R.drawable.ic_backspace, "Apagar", Style.ripple(Style.tinted(Style.RED, dp(16), dp(1))),
                () -> sendKey(ProjectorCommands.KEY_DEL)), weighted(dp(4)));
        keys.addView(pill(R.drawable.ic_enter, "Enter", Style.ripple(Style.tinted(Style.GREEN, dp(16), dp(1))),
                () -> sendKey(ProjectorCommands.KEY_ENTER)), weighted(dp(4)));
        typing.addView(keys, matchWrap(-dp(4), dp(8), -dp(4), 0));
        TextView typingHint = text("Selecione antes um campo de busca no projetor. Acentos são enviados sem acento.",
                12, Style.MUTED, false);
        typingHint.setPadding(dp(2), dp(8), dp(2), 0);
        typing.addView(typingHint);

        LinearLayout proj = card(page, "Projetor", R.drawable.ic_tune, Style.VIOLET);
        Object[][] items = {
                {R.drawable.ic_tune, "Ajustes do projetor", Style.ACCENT, (Runnable) () -> openScreen("PROJECTOR_SETTINGS", ProjectorCommands.OPEN_PROJECTOR_SETTINGS)},
                {R.drawable.ic_settings, "Configurações", Style.VIOLET, (Runnable) () -> openScreen("SETTINGS", ProjectorCommands.OPEN_SETTINGS)},
                {R.drawable.ic_wifi, "Wi-Fi", Style.TEAL, (Runnable) () -> openScreen("WIFI", ProjectorCommands.OPEN_WIFI)},
                {R.drawable.ic_bluetooth, "Bluetooth", Style.SKY, (Runnable) () -> openScreen("BLUETOOTH", ProjectorCommands.OPEN_BLUETOOTH)},
                {R.drawable.ic_moon, "Dormir", Style.INDIGO, (Runnable) () -> sendKey(ProjectorCommands.KEY_SLEEP)},
                {R.drawable.ic_sun, "Acordar", Style.AMBER, (Runnable) () -> sendKey(ProjectorCommands.KEY_WAKEUP)},
                {R.drawable.ic_restart, "Reiniciar", Style.RED, (Runnable) this::confirmReboot},
        };
        LinearLayout row = null;
        for (int i = 0; i < items.length; i++) {
            if (i % 3 == 0) {
                row = new LinearLayout(this);
                proj.addView(row);
            }
            row.addView(tile((Integer) items[i][0], (String) items[i][1], (Integer) items[i][2],
                    (Runnable) items[i][3]), cell(dp(4)));
        }
        for (int i = items.length % 3; i != 0 && i < 3; i++) row.addView(new Space(this), cell(dp(4)));

        LinearLayout pad = card(page, "Touchpad", R.drawable.ic_mouse, Style.TEAL);
        pad.addView(text("Velocidade do cursor", 14, Style.SOFT, false));
        SeekBar speed = new SeekBar(this);
        speed.setMax(8);
        speed.setProgress(prefs.getInt("speed", 3));
        speed.setProgressDrawable(Style.track(dp(8)));
        speed.setThumb(Style.thumb(dp(22), dp(4)));
        speed.setSplitTrack(false);
        speed.setPadding(dp(18), dp(14), dp(18), dp(6));
        speed.setOnSeekBarChangeListener(new SeekBar.OnSeekBarChangeListener() {
            @Override
            public void onProgressChanged(SeekBar bar, int progress, boolean fromUser) {
                prefs.edit().putInt("speed", progress).apply();
                touchpad.setSensitivity(sensitivityFromPrefs());
            }

            @Override
            public void onStartTrackingTouch(SeekBar bar) {
            }

            @Override
            public void onStopTrackingTouch(SeekBar bar) {
            }
        });
        pad.addView(speed);

        LinearLayout free = card(page, "Funcionar sem a depuração", R.drawable.ic_projector, Style.GREEN);
        free.addView(infoRow(R.drawable.ic_projector, Style.GREEN, "Receptor no projetor",
                "Instale uma vez o Receptor do Controle no projetor. Depois disso o app funciona igual, mesmo com "
                        + "a depuração desligada: ele acha o projetor no Wi-Fi e usa o receptor."),
                matchWrap(0, 0, 0, dp(12)));
        free.addView(pill(R.drawable.ic_download, "Instalar o receptor no projetor",
                Style.ripple(Style.gradient(Style.GREEN, Style.TEAL, dp(16))), this::installReceiver), matchWrap(0, 0, 0, 0));
        free.addView(pill(R.drawable.ic_enter, "Parear com o receptor",
                Style.ripple(Style.tinted(Style.GREEN, dp(16), dp(1))), this::pairManually), matchWrap(0, dp(10), 0, 0));
        Switch arrowsByIr = new Switch(this);
        arrowsByIr.setText("Setas e OK pelo infravermelho");
        arrowsByIr.setTextColor(Style.TEXT);
        arrowsByIr.setTextSize(14.5f);
        arrowsByIr.setChecked(prefs.getBoolean("setas_ir", false));
        int[][] states = {{android.R.attr.state_checked}, {}};
        arrowsByIr.setThumbTintList(new ColorStateList(states, new int[] {Style.GREEN, 0xFFB4BCCB}));
        arrowsByIr.setTrackTintList(new ColorStateList(states, new int[] {Style.alpha(Style.GREEN, 0x80), 0x40FFFFFF}));
        arrowsByIr.setOnCheckedChangeListener((b, on) -> prefs.edit().putBoolean("setas_ir", on).apply());
        free.addView(arrowsByIr, matchWrap(dp(2), dp(14), dp(2), 0));
        TextView freeHint = text("Sem a depuração, as setas andam pelos itens da tela. Se em algum app elas não "
                + "responderem, ligue a opção acima para mandar as setas pelo infravermelho. Menu e Acordar vão "
                + "pelo infravermelho, e Reiniciar abre o menu de energia do projetor.", 12, Style.MUTED, false);
        freeHint.setLineSpacing(dp(1.5f), 1f);
        freeHint.setPadding(dp(2), dp(6), dp(2), 0);
        free.addView(freeHint);

        LinearLayout conn = card(page, "Conexão", R.drawable.ic_wifi, Style.TEAL);
        LinearLayout connRow = new LinearLayout(this);
        connRow.setGravity(Gravity.CENTER_VERTICAL);
        hostField = field("IP do projetor", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        hostField.setText(host);
        hostField.setImeOptions(EditorInfo.IME_ACTION_GO);
        hostField.setOnEditorActionListener((v, actionId, event) -> {
            reconnect();
            return true;
        });
        connRow.addView(hostField, new LinearLayout.LayoutParams(0, dp(54), 1f));
        LinearLayout connect = pill(R.drawable.ic_enter, "Conectar", Style.ripple(Style.gradient(Style.ACCENT, Style.VIOLET, dp(16))),
                this::reconnect);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-2, dp(54));
        cp.leftMargin = dp(8);
        connect.setPadding(dp(14), 0, dp(16), 0);
        connRow.addView(connect, cp);
        conn.addView(connRow);
        LinearLayout search = pill(R.drawable.ic_wifi, "Procurar o projetor no Wi-Fi",
                Style.ripple(Style.gradient(Style.TEAL, Style.ACCENT, dp(16))), this::searchNetwork);
        conn.addView(search, matchWrap(0, dp(10), 0, 0));
        boolean hasIr = infrared() != null;
        conn.addView(infoRow(R.drawable.ic_wifi, Style.TEAL, "Wi-Fi",
                "O app encontra o projetor sozinho quando o celular está no mesmo Wi-Fi. A depuração por rede (ADB) "
                        + "precisa ficar ligada no projetor. Na primeira conexão, aceite o pedido que aparece na tela dele."),
                matchWrap(0, dp(14), 0, 0));
        conn.addView(infoRow(R.drawable.ic_ir, hasIr ? Style.GREEN : Style.RED,
                hasIr ? "Infravermelho disponível" : "Sem infravermelho",
                hasIr ? "Ligar e Desligar usam o infravermelho do celular: aponte o celular para o projetor."
                        : "Este celular não tem emissor infravermelho. Use o controle original para ligar e desligar."),
                matchWrap(0, dp(12), 0, 0));
        return page;
    }

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

    // ---------------------------------------------------------------- view helpers

    private LinearLayout page() {
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(14), dp(8), dp(14), dp(28));
        return page;
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
        s.addView(content);
        return s;
    }

    /** Card with a coloured icon and a title in its first row (index 0), which callers may add views to. */
    private LinearLayout card(LinearLayout parent, String title, int iconRes, int color) {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setBackground(Style.card(dp(24), dp(1)));
        c.setElevation(dp(4));
        c.setPadding(dp(14), dp(12), dp(14), dp(16));
        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        FrameLayout bubble = new FrameLayout(this);
        bubble.setBackground(Style.ovalGradient(color, Style.darker(color)));
        bubble.addView(icon(iconRes, 0xFFFFFFFF), new FrameLayout.LayoutParams(dp(18), dp(18), Gravity.CENTER));
        header.addView(bubble, new LinearLayout.LayoutParams(dp(34), dp(34)));
        TextView t = text(title, 16, Style.TEXT, true);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, -2, 1f);
        tp.leftMargin = dp(10);
        header.addView(t, tp);
        c.addView(header, matchWrap(0, 0, 0, dp(12)));
        parent.addView(c, matchWrap(0, dp(16), 0, 0));
        return c;
    }

    private View roundButton(int icon, int sizeDp, Drawable background, int tint, String description, Runnable action) {
        FrameLayout b = new FrameLayout(this);
        b.setBackground(background);
        b.setContentDescription(description);
        b.setElevation(dp(4));
        int iconSize = Math.round(sizeDp * 0.42f);
        b.addView(icon(icon, tint), new FrameLayout.LayoutParams(dp(iconSize), dp(iconSize), Gravity.CENTER));
        onTap(b, action);
        FrameLayout wrap = new FrameLayout(this);
        wrap.addView(b, new FrameLayout.LayoutParams(dp(sizeDp), dp(sizeDp), Gravity.CENTER));
        return wrap;
    }

    /** Button over its name; the button sits in a box {@code boxDp} tall so names in a row line up. */
    private View labeled(View button, String label, int boxDp) {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setGravity(Gravity.CENTER_HORIZONTAL);
        l.addView(button, new LinearLayout.LayoutParams(-2, dp(boxDp)));
        TextView t = text(label, 12.5f, Style.SOFT, true);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, dp(4), 0, 0);
        l.addView(t);
        return l;
    }

    private LinearLayout pill(int icon, String label, Drawable background, Runnable action) {
        LinearLayout p = new LinearLayout(this);
        p.setGravity(Gravity.CENTER);
        p.setBackground(background);
        p.setMinimumHeight(dp(56));
        p.setPadding(dp(12), dp(14), dp(12), dp(14));
        if (icon != 0) {
            LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(dp(22), dp(22));
            ip.rightMargin = dp(8);
            p.addView(icon(icon, 0xFFFFFFFF), ip);
        }
        p.addView(text(label, 15.5f, 0xFFFFFFFF, true));
        onTap(p, action);
        return p;
    }

    /** Coloured shortcut tile: tinted body, solid icon bubble and a label. */
    private View tile(int icon, String label, int color, Runnable action) {
        LinearLayout t = new LinearLayout(this);
        t.setOrientation(LinearLayout.VERTICAL);
        t.setGravity(Gravity.CENTER);
        t.setPadding(dp(6), dp(14), dp(6), dp(12));
        t.setBackground(Style.ripple(Style.tinted(color, dp(18), dp(1))));
        FrameLayout bubble = new FrameLayout(this);
        bubble.setBackground(Style.ovalGradient(Style.lighter(color), Style.darker(color)));
        bubble.setElevation(dp(2));
        bubble.addView(icon(icon, 0xFFFFFFFF), new FrameLayout.LayoutParams(dp(22), dp(22), Gravity.CENTER));
        t.addView(bubble, new LinearLayout.LayoutParams(dp(44), dp(44)));
        TextView l = text(label, 12.5f, Style.TEXT, true);
        l.setGravity(Gravity.CENTER);
        l.setMaxLines(2);
        l.setPadding(0, dp(8), 0, 0);
        t.addView(l);
        onTap(t, action);
        return t;
    }

    /** Small coloured label with an icon, used for the touchpad tips. */
    private View chip(int icon, String label, int color) {
        LinearLayout c = new LinearLayout(this);
        c.setGravity(Gravity.CENTER);
        c.setBackground(Style.tinted(color, dp(14), dp(1)));
        c.setPadding(dp(6), dp(8), dp(6), dp(8));
        LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(dp(16), dp(16));
        ip.rightMargin = dp(5);
        c.addView(icon(icon, Style.lighter(color)), ip);
        TextView t = text(label, 12, Style.TEXT, true);
        t.setMaxLines(1);
        c.addView(t);
        return c;
    }

    /** Icon bubble, bold title and explanation, for the information in the Conexão card. */
    private View infoRow(int icon, int color, String title, String body) {
        LinearLayout r = new LinearLayout(this);
        FrameLayout bubble = new FrameLayout(this);
        bubble.setBackground(Style.tinted(color, dp(18), dp(1)));
        bubble.addView(icon(icon, Style.lighter(color)), new FrameLayout.LayoutParams(dp(18), dp(18), Gravity.CENTER));
        r.addView(bubble, new LinearLayout.LayoutParams(dp(36), dp(36)));
        LinearLayout t = vertical();
        t.addView(text(title, 14, Style.TEXT, true));
        TextView b = text(body, 12.5f, Style.MUTED, false);
        b.setLineSpacing(dp(1.5f), 1f);
        t.addView(b);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, -2, 1f);
        lp.leftMargin = dp(10);
        r.addView(t, lp);
        return r;
    }

    private void onTap(View v, Runnable action) {
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
        e.setHintTextColor(Style.MUTED);
        e.setTextSize(16);
        GradientDrawable bg = Style.rounded(0xFF0E1322, dp(16));
        bg.setStroke(dp(1.5f), 0x553D8BFF);
        e.setBackground(bg);
        e.setPadding(dp(16), 0, dp(16), 0);
        return e;
    }

    private TextView text(String s, float sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        return t;
    }

    private LinearLayout.LayoutParams weighted(int margin) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp.setMargins(margin, margin, margin, margin);
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
}
