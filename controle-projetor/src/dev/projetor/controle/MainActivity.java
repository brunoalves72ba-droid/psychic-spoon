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
import android.hardware.ConsumerIrManager;
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
import android.widget.TextView;
import android.widget.Toast;
import java.io.IOException;
import java.net.ConnectException;
import java.net.NoRouteToHostException;
import java.net.SocketTimeoutException;
import java.security.KeyPair;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class MainActivity extends Activity {

    private static final int PORT = 5555;
    private static final String DEFAULT_HOST = "192.168.0.5";
    private static final String[] TAB_NAMES = {"Controle", "Touchpad", "Apps", "Mais"};
    private static final int[] TAB_ICONS = {R.drawable.ic_dpad, R.drawable.ic_mouse, R.drawable.ic_apps, R.drawable.ic_more};
    /** A touch that barely moves would register as a tap on the projector, so swipes start past this. */
    private static final int SWIPE_START_PX = 16;

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
    }

    @Override
    protected void onResume() {
        super.onResume();
        lastFailure = 0;
        worker.execute(() -> {
            if (ensureConnected() && loaded) loadVolume();
        });
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
        worker.execute(() -> {
            if (client != null) client.close();
        });
        inputWorker.execute(() -> {
            if (injector != null) injector.close();
        });
        worker.shutdown();
        inputWorker.shutdown();
    }

    // ---------------------------------------------------------------- connection (worker thread)

    private boolean ensureConnected() {
        if (client != null && client.isConnected()) return true;
        connected = false;
        if (SystemClock.elapsedRealtime() - lastFailure < 3000) return false;
        String target = host;
        if (TextUtils.isEmpty(target)) {
            setStatus("Digite o IP do projetor na aba Mais", Style.RED);
            return false;
        }
        try {
            if (client == null) {
                KeyPair keys = AdbClient.loadOrCreateKeyPair(getFilesDir());
                String name = "controle-celular@" + Build.MODEL.replace(' ', '_');
                client = new AdbClient(keys, name);
                injector = new InputInjector(keys, name);
            }
            if (!waking) setStatus("Conectando a " + target + "…", Style.MUTED);
            client.connect(target, PORT, () -> setStatus(
                    "Aceite o pedido na tela do projetor (marque \"Sempre permitir\")", Style.AMBER));
            connected = true;
            waking = false;
            setStatus("Conectado · " + target, Style.GREEN);
            inputWorker.execute(this::ensureInjector);
            if (!loaded) {
                loaded = true;
                loadVolume();
                loadApps();
            }
            return true;
        } catch (Exception e) {
            lastFailure = SystemClock.elapsedRealtime();
            if (waking) setStatus("Ligando o projetor… aguarde", Style.AMBER);
            else setStatus(describe(e), Style.RED);
            return false;
        }
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
            if (!ensureConnected()) return null;
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
        worker.execute(() -> {
            boolean on = false;
            AdbClient c = client;
            if (c != null && c.isConnected()) {
                try {
                    on = c.shell("echo ok").trim().equals("ok");
                } catch (IOException e) {
                    connected = false;
                }
            }
            boolean alreadyOn = on;
            runOnUiThread(() -> {
                if (alreadyOn) Toast.makeText(this, "O projetor já está ligado", Toast.LENGTH_SHORT).show();
                else sendWakeSignal();
            });
        });
    }

    private void sendWakeSignal() {
        ConsumerIrManager ir = (ConsumerIrManager) getSystemService(Context.CONSUMER_IR_SERVICE);
        if (ir == null || !ir.hasIrEmitter()) {
            new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                    .setTitle("Sem infravermelho")
                    .setMessage("Não encontrei um emissor infravermelho neste celular. "
                            + "Use o controle original para ligar o projetor.")
                    .setPositiveButton("OK", null)
                    .show();
            return;
        }
        setStatus("Enviando sinal infravermelho… aponte o celular para o projetor", Style.AMBER);
        new Thread(() -> {
            try {
                for (int[] code : IrCodes.WAKE_CODES) {
                    ir.transmit(IrCodes.CARRIER_HZ, IrCodes.necPattern(code[0], code[1]));
                    Thread.sleep(45);
                }
            } catch (Exception e) {
                setStatus("Falha ao enviar infravermelho: " + e.getMessage(), Style.RED);
                return;
            }
            waking = true;
            setStatus("Ligando o projetor… aguarde", Style.AMBER);
            runOnUiThread(() -> {
                wakeAttempts = 0;
                handler.removeCallbacks(wakePoll);
                handler.postDelayed(wakePoll, 6000);
            });
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
            worker.execute(() -> {
                lastFailure = 0;
                ensureConnected();
            });
            handler.postDelayed(this, 5000);
        }
    };

    private void confirmPowerOff() {
        new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle("Desligar o projetor?")
                .setMessage("Para ligar de novo, use o botão Ligar (infravermelho) ou o controle.")
                .setNegativeButton("Cancelar", null)
                .setPositiveButton("Desligar", (d, w) -> powerCommand(ProjectorCommands.SHUTDOWN,
                        "Projetor desligando…", "Projetor desligado"))
                .show();
    }

    private void confirmReboot() {
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
        int[] v = ProjectorCommands.parseVolume(runShell(ProjectorCommands.VOLUME_QUERY));
        if (v == null) return;
        volume = v[0];
        maxVolume = v[1];
        runOnUiThread(this::showVolume);
    }

    private void setVolume(int target) {
        int v = Math.max(0, Math.min(maxVolume, target));
        worker.execute(() -> {
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
        List<ProjectorCommands.App> apps = ProjectorCommands.parseApps(runShell(ProjectorCommands.APPS_QUERY));
        runOnUiThread(() -> showApps(apps));
    }

    // ---------------------------------------------------------------- UI

    private View buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Style.BG);
        root.setOnApplyWindowInsetsListener(this::applyInsets);

        root.addView(buildHeader(), matchWrap(dp(16), dp(10), dp(16), 0));
        root.addView(buildPowerRow(), matchWrap(dp(12), dp(14), dp(12), 0));
        root.addView(buildTabs(), matchWrap(dp(16), dp(14), dp(16), dp(6)));

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

    private View buildHeader() {
        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout titles = new LinearLayout(this);
        titles.setOrientation(LinearLayout.VERTICAL);
        TextView title = text("Projetor HY300", 23, Style.TEXT, true);
        titles.addView(title);
        LinearLayout statusRow = new LinearLayout(this);
        statusRow.setGravity(Gravity.CENTER_VERTICAL);
        statusDot = new View(this);
        statusDot.setBackground(Style.oval(Style.MUTED));
        statusRow.addView(statusDot, new LinearLayout.LayoutParams(dp(8), dp(8)));
        statusText = text("Desconectado", 13, Style.MUTED, false);
        statusText.setMaxLines(2);
        statusText.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams stp = new LinearLayout.LayoutParams(-2, -2);
        stp.leftMargin = dp(7);
        statusRow.addView(statusText, stp);
        LinearLayout.LayoutParams srp = new LinearLayout.LayoutParams(-2, -2);
        srp.topMargin = dp(3);
        titles.addView(statusRow, srp);
        header.addView(titles, new LinearLayout.LayoutParams(0, -2, 1f));

        header.addView(roundButton(R.drawable.ic_settings, 46, Style.ripple(Style.oval(Style.SURFACE2)),
                Style.TEXT, "Ajustes", () -> selectTab(3)));
        return header;
    }

    private View buildPowerRow() {
        LinearLayout row = new LinearLayout(this);
        row.addView(pill(R.drawable.ic_power, "Ligar", Style.gradient(Style.GREEN, Style.GREEN2, dp(18)),
                this::powerOn), weighted(dp(4)));
        row.addView(pill(R.drawable.ic_power, "Desligar", Style.gradient(Style.RED, Style.RED2, dp(18)),
                this::confirmPowerOff), weighted(dp(4)));
        return row;
    }

    private View buildTabs() {
        LinearLayout bar = new LinearLayout(this);
        bar.setBackground(Style.outlined(Style.SURFACE, dp(20), dp(1)));
        bar.setPadding(dp(4), dp(4), dp(4), dp(4));
        for (int i = 0; i < 4; i++) {
            final int index = i;
            LinearLayout tab = new LinearLayout(this);
            tab.setOrientation(LinearLayout.VERTICAL);
            tab.setGravity(Gravity.CENTER);
            tab.setPadding(0, dp(7), 0, dp(7));
            ImageView icon = new ImageView(this);
            icon.setImageResource(TAB_ICONS[i]);
            tab.addView(icon, new LinearLayout.LayoutParams(dp(21), dp(21)));
            TextView label = text(TAB_NAMES[i], 11.5f, Style.MUTED, true);
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
            tabs[i].setBackground(on ? Style.gradient(Style.ACCENT, Style.ACCENT2, dp(16)) : null);
            int color = on ? 0xFFFFFFFF : Style.MUTED;
            ((ImageView) tabs[i].getChildAt(0)).setImageTintList(ColorStateList.valueOf(color));
            ((TextView) tabs[i].getChildAt(1)).setTextColor(color);
        }
        prefs.edit().putInt("tab", index).apply();
    }

    private View buildControlPage() {
        LinearLayout page = page();

        LinearLayout nav = new LinearLayout(this);
        nav.setGravity(Gravity.CENTER);
        nav.addView(labeled(roundButton(R.drawable.ic_back, 58, Style.ripple(Style.oval(Style.SURFACE2)), Style.TEXT,
                "Voltar", () -> sendKey(ProjectorCommands.KEY_BACK)), "Voltar"), weighted(0));
        nav.addView(labeled(roundButton(R.drawable.ic_home, 72,
                Style.ripple(Style.gradient(Style.ACCENT, Style.ACCENT2, dp(36))), 0xFFFFFFFF,
                "Início", () -> sendKey(ProjectorCommands.KEY_HOME)), "Início"), weighted(0));
        nav.addView(labeled(roundButton(R.drawable.ic_menu, 58, Style.ripple(Style.oval(Style.SURFACE2)), Style.TEXT,
                "Menu", () -> sendKey(ProjectorCommands.KEY_MENU)), "Menu"), weighted(0));
        page.addView(nav, matchWrap(0, dp(4), 0, 0));

        DpadView dpad = new DpadView(this);
        dpad.setListener(this::sendKey);
        page.addView(dpad, matchWrap(dp(8), dp(14), dp(8), 0));

        LinearLayout media = new LinearLayout(this);
        media.setGravity(Gravity.CENTER);
        media.addView(roundButton(R.drawable.ic_rewind, 54, Style.ripple(Style.oval(Style.SURFACE2)), Style.TEXT,
                "Voltar vídeo", () -> sendKey(ProjectorCommands.KEY_REWIND)), weighted(0));
        media.addView(roundButton(R.drawable.ic_play_pause, 62, Style.ripple(Style.oval(Style.SURFACE2)), Style.TEXT,
                "Play ou pausa", () -> sendKey(ProjectorCommands.KEY_PLAY_PAUSE)), weighted(0));
        media.addView(roundButton(R.drawable.ic_fast_forward, 54, Style.ripple(Style.oval(Style.SURFACE2)), Style.TEXT,
                "Avançar vídeo", () -> sendKey(ProjectorCommands.KEY_FAST_FORWARD)), weighted(0));
        page.addView(media, matchWrap(0, dp(16), 0, 0));

        LinearLayout vol = card(page, "Volume");
        LinearLayout volHeader = (LinearLayout) vol.getChildAt(0);
        volumeLabel = text("–", 15, Style.TEXT, true);
        volHeader.addView(volumeLabel);
        volumeBar = new SeekBar(this);
        volumeBar.setMax(maxVolume);
        volumeBar.setProgressTintList(ColorStateList.valueOf(Style.ACCENT));
        volumeBar.setThumbTintList(ColorStateList.valueOf(0xFFFFFFFF));
        volumeBar.setProgressBackgroundTintList(ColorStateList.valueOf(0xFF3A4252));
        volumeBar.setPadding(dp(18), dp(14), dp(18), dp(14));
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
        volButtons.addView(roundButton(R.drawable.ic_volume_down, 52, Style.ripple(Style.oval(Style.SURFACE2)),
                Style.TEXT, "Diminuir volume",
                () -> stepVolume(ProjectorCommands.KEY_VOLUME_DOWN, -1)), new LinearLayout.LayoutParams(-2, -2));
        LinearLayout mute = pill(R.drawable.ic_volume_off, "Sem som",
                Style.ripple(Style.rounded(Style.SURFACE2, dp(26))), this::toggleMute);
        muteIcon = (ImageView) mute.getChildAt(0);
        muteText = (TextView) mute.getChildAt(1);
        muteText.setTextSize(14);
        LinearLayout.LayoutParams mp = new LinearLayout.LayoutParams(0, dp(52), 1f);
        mp.setMargins(dp(10), 0, dp(10), 0);
        volButtons.addView(mute, mp);
        volButtons.addView(roundButton(R.drawable.ic_volume_up, 52, Style.ripple(Style.oval(Style.SURFACE2)),
                Style.TEXT, "Aumentar volume",
                () -> stepVolume(ProjectorCommands.KEY_VOLUME_UP, 1)), new LinearLayout.LayoutParams(-2, -2));
        vol.addView(volButtons);
        return page;
    }

    private View buildTouchpadPage() {
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(14), dp(8), dp(14), dp(14));
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
        row.addView(pill(R.drawable.ic_click, "Clique", Style.ripple(Style.rounded(Style.SURFACE2, dp(18))),
                this::click), weighted(dp(4)));
        row.addView(pill(R.drawable.ic_back, "Voltar", Style.ripple(Style.rounded(Style.SURFACE2, dp(18))),
                () -> sendKey(ProjectorCommands.KEY_BACK)), weighted(dp(4)));
        row.addView(pill(R.drawable.ic_home, "Início", Style.ripple(Style.gradient(Style.ACCENT, Style.ACCENT2, dp(18))),
                () -> sendKey(ProjectorCommands.KEY_HOME)), weighted(dp(4)));
        page.addView(row, matchWrap(-dp(4), dp(10), -dp(4), 0));
        return page;
    }

    private View buildAppsPage() {
        LinearLayout page = page();
        LinearLayout card = card(page, "Apps do projetor");
        LinearLayout header = (LinearLayout) card.getChildAt(0);
        header.addView(roundButton(R.drawable.ic_refresh, 38, Style.ripple(Style.oval(Style.SURFACE2)), Style.MUTED,
                "Atualizar lista", () -> worker.execute(this::loadApps)));
        appsGrid = new LinearLayout(this);
        appsGrid.setOrientation(LinearLayout.VERTICAL);
        appsGrid.addView(text("Conecte ao projetor para ver os apps.", 14, Style.MUTED, false));
        card.addView(appsGrid);
        return page;
    }

    private void showApps(List<ProjectorCommands.App> apps) {
        appsGrid.removeAllViews();
        if (apps.isEmpty()) {
            appsGrid.addView(text("Nenhum app encontrado. Toque em atualizar.", 14, Style.MUTED, false));
            return;
        }
        LinearLayout row = null;
        for (int i = 0; i < apps.size(); i++) {
            if (i % 3 == 0) {
                row = new LinearLayout(this);
                appsGrid.addView(row);
            }
            ProjectorCommands.App app = apps.get(i);
            row.addView(appTile(app), weighted(dp(2)));
        }
        for (int i = apps.size() % 3; i != 0 && i < 3; i++) row.addView(new View(this), weighted(dp(2)));
    }

    private View appTile(ProjectorCommands.App app) {
        Object[] brand = BRANDS.get(app.packageName);
        int color = brand != null ? (Integer) brand[0] : 0xFF000000 | (app.packageName.hashCode() & 0x7F7F7F);
        String mark = brand != null ? (String) brand[1] : app.label.substring(0, 1).toUpperCase();

        LinearLayout tile = new LinearLayout(this);
        tile.setOrientation(LinearLayout.VERTICAL);
        tile.setGravity(Gravity.CENTER_HORIZONTAL);
        tile.setPadding(dp(4), dp(10), dp(4), dp(10));
        tile.setBackground(Style.ripple(Style.rounded(0x00000000, dp(16))));
        TextView badge = text(mark, 19, 0xFFFFFFFF, true);
        badge.setGravity(Gravity.CENTER);
        badge.setBackground(Style.gradient(color, darker(color), dp(18)));
        badge.setElevation(dp(2));
        tile.addView(badge, new LinearLayout.LayoutParams(dp(58), dp(58)));
        TextView label = text(app.label, 12.5f, Style.TEXT, false);
        label.setGravity(Gravity.CENTER);
        label.setMaxLines(2);
        label.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.topMargin = dp(7);
        tile.addView(label, lp);
        tile.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            send(ProjectorCommands.launch(app));
            Toast.makeText(this, "Abrindo " + app.label, Toast.LENGTH_SHORT).show();
        });
        return tile;
    }

    private View buildMorePage() {
        LinearLayout page = page();

        LinearLayout typing = card(page, "Digitar no projetor");
        LinearLayout inputRow = new LinearLayout(this);
        inputRow.setGravity(Gravity.CENTER_VERTICAL);
        textField = field("Ex.: nome de um filme", InputType.TYPE_CLASS_TEXT);
        textField.setImeOptions(EditorInfo.IME_ACTION_SEND);
        textField.setOnEditorActionListener((v, actionId, event) -> {
            sendTypedText();
            return true;
        });
        inputRow.addView(textField, new LinearLayout.LayoutParams(0, dp(52), 1f));
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-2, -2);
        sp.leftMargin = dp(8);
        inputRow.addView(roundButton(R.drawable.ic_send, 52,
                Style.ripple(Style.gradient(Style.ACCENT, Style.ACCENT2, dp(26))), 0xFFFFFFFF, "Enviar texto",
                this::sendTypedText), sp);
        typing.addView(inputRow);
        LinearLayout keys = new LinearLayout(this);
        keys.addView(pill(R.drawable.ic_backspace, "Apagar", Style.ripple(Style.rounded(Style.SURFACE2, dp(16))),
                () -> sendKey(ProjectorCommands.KEY_DEL)), weighted(dp(4)));
        keys.addView(pill(R.drawable.ic_enter, "Enter", Style.ripple(Style.rounded(Style.SURFACE2, dp(16))),
                () -> sendKey(ProjectorCommands.KEY_ENTER)), weighted(dp(4)));
        typing.addView(keys, matchWrap(-dp(4), dp(8), -dp(4), 0));
        TextView typingHint = text("Selecione antes um campo de busca no projetor. Acentos são enviados sem acento.",
                12, Style.MUTED, false);
        typingHint.setPadding(dp(2), dp(8), dp(2), 0);
        typing.addView(typingHint);

        LinearLayout proj = card(page, "Projetor");
        Object[][] items = {
                {R.drawable.ic_tune, "Ajustes do projetor", Style.ACCENT, (Runnable) () -> send(ProjectorCommands.OPEN_PROJECTOR_SETTINGS)},
                {R.drawable.ic_settings, "Configurações", Style.ACCENT, (Runnable) () -> send(ProjectorCommands.OPEN_SETTINGS)},
                {R.drawable.ic_wifi, "Wi-Fi", Style.ACCENT, (Runnable) () -> send(ProjectorCommands.OPEN_WIFI)},
                {R.drawable.ic_bluetooth, "Bluetooth", Style.ACCENT, (Runnable) () -> send(ProjectorCommands.OPEN_BLUETOOTH)},
                {R.drawable.ic_moon, "Dormir", Style.ACCENT2, (Runnable) () -> sendKey(ProjectorCommands.KEY_SLEEP)},
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
                    (Runnable) items[i][3]), weighted(dp(4)));
        }
        for (int i = items.length % 3; i != 0 && i < 3; i++) row.addView(new View(this), weighted(dp(4)));

        LinearLayout pad = card(page, "Touchpad");
        pad.addView(text("Velocidade do cursor", 14, Style.TEXT, false));
        SeekBar speed = new SeekBar(this);
        speed.setMax(8);
        speed.setProgress(prefs.getInt("speed", 3));
        speed.setProgressTintList(ColorStateList.valueOf(Style.ACCENT));
        speed.setThumbTintList(ColorStateList.valueOf(0xFFFFFFFF));
        speed.setProgressBackgroundTintList(ColorStateList.valueOf(0xFF3A4252));
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

        LinearLayout conn = card(page, "Conexão");
        LinearLayout connRow = new LinearLayout(this);
        connRow.setGravity(Gravity.CENTER_VERTICAL);
        hostField = field("IP do projetor", InputType.TYPE_CLASS_TEXT | InputType.TYPE_TEXT_VARIATION_URI);
        hostField.setText(host);
        hostField.setImeOptions(EditorInfo.IME_ACTION_GO);
        hostField.setOnEditorActionListener((v, actionId, event) -> {
            reconnect();
            return true;
        });
        connRow.addView(hostField, new LinearLayout.LayoutParams(0, dp(52), 1f));
        LinearLayout connect = pill(0, "Conectar", Style.ripple(Style.gradient(Style.ACCENT, Style.ACCENT2, dp(16))),
                this::reconnect);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-2, dp(52));
        cp.leftMargin = dp(8);
        connect.setPadding(dp(18), 0, dp(18), 0);
        connRow.addView(connect, cp);
        conn.addView(connRow);
        ConsumerIrManager ir = (ConsumerIrManager) getSystemService(Context.CONSUMER_IR_SERVICE);
        boolean hasIr = ir != null && ir.hasIrEmitter();
        TextView info = text("A depuração ADB precisa estar ligada no projetor. Na primeira conexão, aceite o "
                + "pedido que aparece na tela dele.\n\nInfravermelho deste celular: "
                + (hasIr ? "disponível. O botão Ligar funciona com o projetor desligado; aponte o celular para ele."
                : "não encontrado. Ligue o projetor pelo controle original."), 12.5f, Style.MUTED, false);
        info.setPadding(dp(2), dp(10), dp(2), 0);
        conn.addView(info);
        return page;
    }

    private float sensitivityFromPrefs() {
        return 0.8f + prefs.getInt("speed", 3) * 0.3f;
    }

    private void sendTypedText() {
        String command = ProjectorCommands.inputText(textField.getText().toString());
        if (command == null) return;
        send(command);
        textField.setText("");
    }

    // ---------------------------------------------------------------- view helpers

    private LinearLayout page() {
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(14), dp(8), dp(14), dp(24));
        return page;
    }

    private ScrollView scrolling(View content) {
        ScrollView s = new ScrollView(this);
        s.setFillViewport(true);
        s.setVerticalScrollBarEnabled(false);
        s.addView(content);
        return s;
    }

    /** Rounded card with a title row (index 0) that callers may add views to. */
    private LinearLayout card(LinearLayout parent, String title) {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setBackground(Style.outlined(Style.SURFACE, dp(22), dp(1)));
        c.setPadding(dp(14), dp(12), dp(14), dp(14));
        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView t = text(title.toUpperCase(), 12, Style.MUTED, true);
        t.setLetterSpacing(0.1f);
        header.addView(t, new LinearLayout.LayoutParams(0, -2, 1f));
        c.addView(header, matchWrap(dp(2), 0, dp(2), dp(8)));
        parent.addView(c, matchWrap(0, dp(16), 0, 0));
        return c;
    }

    private View roundButton(int icon, int sizeDp, Drawable background, int tint, String description, Runnable action) {
        FrameLayout b = new FrameLayout(this);
        b.setBackground(background);
        b.setContentDescription(description);
        b.setElevation(dp(3));
        ImageView i = new ImageView(this);
        i.setImageResource(icon);
        i.setImageTintList(ColorStateList.valueOf(tint));
        int iconSize = Math.round(sizeDp * 0.42f);
        b.addView(i, new FrameLayout.LayoutParams(dp(iconSize), dp(iconSize), Gravity.CENTER));
        b.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            action.run();
        });
        FrameLayout wrap = new FrameLayout(this);
        wrap.addView(b, new FrameLayout.LayoutParams(dp(sizeDp), dp(sizeDp), Gravity.CENTER));
        return wrap;
    }

    private View labeled(View button, String label) {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setGravity(Gravity.CENTER_HORIZONTAL);
        l.addView(button);
        TextView t = text(label, 12, Style.MUTED, false);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, dp(6), 0, 0);
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
            ImageView i = new ImageView(this);
            i.setImageResource(icon);
            i.setImageTintList(ColorStateList.valueOf(0xFFFFFFFF));
            LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(dp(22), dp(22));
            ip.rightMargin = dp(8);
            p.addView(i, ip);
        }
        p.addView(text(label, 16, 0xFFFFFFFF, true));
        p.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            action.run();
        });
        return p;
    }

    private View tile(int icon, String label, int color, Runnable action) {
        LinearLayout t = new LinearLayout(this);
        t.setOrientation(LinearLayout.VERTICAL);
        t.setGravity(Gravity.CENTER);
        t.setPadding(dp(6), dp(14), dp(6), dp(12));
        t.setBackground(Style.ripple(Style.rounded(Style.SURFACE2, dp(18))));
        FrameLayout bubble = new FrameLayout(this);
        bubble.setBackground(Style.oval((color & 0x00FFFFFF) | 0x33000000));
        ImageView i = new ImageView(this);
        i.setImageResource(icon);
        i.setImageTintList(ColorStateList.valueOf(color));
        bubble.addView(i, new FrameLayout.LayoutParams(dp(22), dp(22), Gravity.CENTER));
        t.addView(bubble, new LinearLayout.LayoutParams(dp(42), dp(42)));
        TextView l = text(label, 12, Style.TEXT, false);
        l.setGravity(Gravity.CENTER);
        l.setMaxLines(2);
        l.setPadding(0, dp(7), 0, 0);
        t.addView(l);
        t.setOnClickListener(v -> {
            v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            action.run();
        });
        return t;
    }

    private EditText field(String hint, int inputType) {
        EditText e = new EditText(this);
        e.setHint(hint);
        e.setInputType(inputType);
        e.setSingleLine(true);
        e.setTextColor(Style.TEXT);
        e.setHintTextColor(Style.MUTED);
        e.setTextSize(16);
        e.setBackground(Style.outlined(Style.SURFACE2, dp(16), dp(1)));
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

    private LinearLayout.LayoutParams matchWrap(int left, int top, int right, int bottom) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(left, top, right, bottom);
        return lp;
    }

    private static int darker(int color) {
        int r = (int) (((color >> 16) & 0xff) * 0.7f);
        int g = (int) (((color >> 8) & 0xff) * 0.7f);
        int b = (int) ((color & 0xff) * 0.7f);
        return 0xFF000000 | (r << 16) | (g << 8) | b;
    }

    private int dp(float v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
