package dev.projetor.receptor;

import android.accessibilityservice.AccessibilityService;
import android.accessibilityservice.GestureDescription;
import android.content.ActivityNotFoundException;
import android.content.ComponentName;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Color;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.Rect;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.media.AudioManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.provider.Settings;
import android.util.DisplayMetrics;
import android.util.Log;
import android.view.Gravity;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowManager;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

/**
 * Runs on the projector. While enabled in the accessibility settings it listens on the Wi-Fi for
 * the phone app and carries out its commands, so the projector can be controlled without USB/ADB
 * debugging. Android 11 has no way for an app to inject arrow keys, so arrows move the focus the
 * same way the system does (focusSearch), and OK clicks the focused item.
 */
public class ReceptorService extends AccessibilityService implements ReceiverServer.Actions {

    private static final String TAG = "Receptor";
    private static final int CURSOR_HIDE_MS = 8000;
    private static final float CURSOR_SPEED = 1.6f;
    private static final float SCROLL_SPEED = 1.6f;
    private static final long PAIRING_SHOW_MS = 120_000;

    private final Handler main = new Handler(Looper.getMainLooper());
    private ReceiverServer server;
    private WindowManager wm;
    private AudioManager audio;

    // main thread only
    private ImageView cursor;
    private WindowManager.LayoutParams cursorParams;
    private float cursorX = -1;
    private float cursorY = -1;
    private int scrollX;
    private int scrollY;
    private boolean scrollScheduled;
    private View pairingView;

    private final Runnable hideCursor = new Runnable() {
        @Override
        public void run() {
            if (cursor != null) cursor.setVisibility(View.GONE);
        }
    };

    private final Runnable flushScroll = new Runnable() {
        @Override
        public void run() {
            scrollScheduled = false;
            if (scrollX == 0 && scrollY == 0) return;
            Rect s = screen();
            float x = cursorVisible() ? cursorX : s.width() / 2f;
            float y = cursorVisible() ? cursorY : s.height() / 2f;
            float ex = clamp(x + scrollX * SCROLL_SPEED, 1, s.width() - 2);
            float ey = clamp(y + scrollY * SCROLL_SPEED, 1, s.height() - 2);
            scrollX = scrollY = 0;
            Path p = new Path();
            p.moveTo(x, y);
            p.lineTo(ex, ey);
            gesture(p, 120);
        }
    };

    private final Runnable hidePairing = new Runnable() {
        @Override
        public void run() {
            removePairingView();
        }
    };

    @Override
    protected void onServiceConnected() {
        super.onServiceConnected();
        wm = (WindowManager) getSystemService(WINDOW_SERVICE);
        audio = (AudioManager) getSystemService(AUDIO_SERVICE);
        final SharedPreferences prefs = getSharedPreferences("receptor", MODE_PRIVATE);
        String id = prefs.getString("id", null);
        if (id == null) {
            id = UUID.randomUUID().toString().substring(0, 8);
            prefs.edit().putString("id", id).apply();
        }
        server = new ReceiverServer(id, this, new ReceiverServer.Tokens() {
            @Override
            public boolean contains(String token) {
                return prefs.getStringSet("tokens", new HashSet<String>()).contains(token);
            }

            @Override
            public void add(String token) {
                Set<String> all = new HashSet<>(prefs.getStringSet("tokens", new HashSet<String>()));
                all.add(token);
                prefs.edit().putStringSet("tokens", all).apply();
            }
        });
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    server.start(ReceiverServer.PORT);
                } catch (IOException e) {
                    Log.e(TAG, "porta " + ReceiverServer.PORT + " indisponível", e);
                }
            }
        }, "receptor-inicio").start();
    }

    @Override
    public void onDestroy() {
        if (server != null) server.stop();
        main.removeCallbacksAndMessages(null);
        removeView(cursor);
        cursor = null;
        removePairingView();
        super.onDestroy();
    }

    @Override
    public void onAccessibilityEvent(AccessibilityEvent event) {
        // commands come from the network, events are not needed
    }

    @Override
    public void onInterrupt() {
    }

    // ---------------------------------------------------------------- ReceiverServer.Actions

    @Override
    public String model() {
        return Build.MODEL;
    }

    @Override
    public boolean key(String name) {
        switch (name) {
            case "UP":
                return moveFocus(View.FOCUS_UP);
            case "DOWN":
                return moveFocus(View.FOCUS_DOWN);
            case "LEFT":
                return moveFocus(View.FOCUS_LEFT);
            case "RIGHT":
                return moveFocus(View.FOCUS_RIGHT);
            case "CENTER":
                return clickFocused();
            case "BACK":
                return performGlobalAction(GLOBAL_ACTION_BACK);
            case "HOME":
                return performGlobalAction(GLOBAL_ACTION_HOME);
            case "PLAY_PAUSE":
                return media(KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE);
            case "REWIND":
                return media(KeyEvent.KEYCODE_MEDIA_REWIND);
            case "FAST_FORWARD":
                return media(KeyEvent.KEYCODE_MEDIA_FAST_FORWARD);
            case "VOLUME_UP":
                audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_RAISE, AudioManager.FLAG_SHOW_UI);
                return true;
            case "VOLUME_DOWN":
                audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_LOWER, AudioManager.FLAG_SHOW_UI);
                return true;
            case "MUTE":
                audio.adjustStreamVolume(AudioManager.STREAM_MUSIC, AudioManager.ADJUST_TOGGLE_MUTE, AudioManager.FLAG_SHOW_UI);
                return true;
            case "DEL":
                return backspace();
            case "ENTER":
                return imeEnter();
            case "SLEEP":
                return Build.VERSION.SDK_INT >= 28 && performGlobalAction(GLOBAL_ACTION_LOCK_SCREEN);
            default:
                // MENU and WAKEUP have no equivalent here; the phone sends them by infrared
                return false;
        }
    }

    @Override
    public boolean text(String text) {
        AccessibilityNodeInfo field = editable();
        if (field == null) return false;
        return setText(field, currentText(field) + text);
    }

    @Override
    public List<String[]> apps() {
        PackageManager pm = getPackageManager();
        Map<String, String[]> byPackage = new LinkedHashMap<>();
        for (String category : new String[] {Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER}) {
            Intent i = new Intent(Intent.ACTION_MAIN).addCategory(category);
            for (ResolveInfo r : pm.queryIntentActivities(i, 0)) {
                String pkg = r.activityInfo.packageName;
                if (pkg.equals(getPackageName()) || byPackage.containsKey(pkg)) continue;
                byPackage.put(pkg, new String[] {pkg + "/" + r.activityInfo.name, String.valueOf(r.loadLabel(pm))});
            }
        }
        return new ArrayList<>(byPackage.values());
    }

    @Override
    public boolean launch(String component) {
        ComponentName cn = ComponentName.unflattenFromString(component);
        if (cn == null) return false;
        Intent i = new Intent(Intent.ACTION_MAIN).setComponent(cn)
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_RESET_TASK_IF_NEEDED);
        try {
            startActivity(i);
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            PackageManager pm = getPackageManager();
            Intent fallback = pm.getLeanbackLaunchIntentForPackage(cn.getPackageName());
            if (fallback == null) fallback = pm.getLaunchIntentForPackage(cn.getPackageName());
            if (fallback == null) return false;
            startActivity(fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return true;
        }
    }

    @Override
    public int[] volume() {
        return new int[] {audio.getStreamVolume(AudioManager.STREAM_MUSIC), audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC)};
    }

    @Override
    public int[] setVolume(int volume) {
        int max = audio.getStreamMaxVolume(AudioManager.STREAM_MUSIC);
        audio.setStreamVolume(AudioManager.STREAM_MUSIC, Math.max(0, Math.min(max, volume)), AudioManager.FLAG_SHOW_UI);
        return volume();
    }

    @Override
    public void move(final int dx, final int dy) {
        main.post(new Runnable() {
            @Override
            public void run() {
                Rect s = screen();
                if (!cursorVisible()) {
                    if (cursorX < 0) {
                        cursorX = s.width() / 2f;
                        cursorY = s.height() / 2f;
                    }
                }
                cursorX = clamp(cursorX + dx * CURSOR_SPEED, 0, s.width() - 1);
                cursorY = clamp(cursorY + dy * CURSOR_SPEED, 0, s.height() - 1);
                showCursor();
            }
        });
    }

    @Override
    public void click() {
        main.post(new Runnable() {
            @Override
            public void run() {
                if (cursorX < 0) {
                    Rect s = screen();
                    cursorX = s.width() / 2f;
                    cursorY = s.height() / 2f;
                }
                showCursor();
                Path p = new Path();
                p.moveTo(cursorX, cursorY);
                gesture(p, 40);
            }
        });
    }

    @Override
    public void scroll(final int dx, final int dy) {
        main.post(new Runnable() {
            @Override
            public void run() {
                scrollX += dx;
                scrollY += dy;
                if (!scrollScheduled) {
                    scrollScheduled = true;
                    main.postDelayed(flushScroll, 60);
                }
            }
        });
    }

    @Override
    public void scrollEnd() {
        main.post(new Runnable() {
            @Override
            public void run() {
                main.removeCallbacks(flushScroll);
                flushScroll.run();
            }
        });
    }

    @Override
    public boolean open(String screen) {
        Intent i;
        switch (screen) {
            case "PROJECTOR_SETTINGS":
                i = new Intent().setComponent(new ComponentName("com.htc.htcsettings", "com.htc.activity.HomeActivity"));
                break;
            case "SETTINGS":
                i = new Intent(Settings.ACTION_SETTINGS);
                break;
            case "WIFI":
                i = new Intent(Settings.ACTION_WIFI_SETTINGS);
                break;
            case "BLUETOOTH":
                i = new Intent("com.google.android.intent.action.CONNECT_INPUT");
                break;
            default:
                return false;
        }
        try {
            startActivity(i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return true;
        } catch (ActivityNotFoundException | SecurityException e) {
            return false;
        }
    }

    @Override
    public void showPairingCode(final String code) {
        writeCodeFile(code);
        main.post(new Runnable() {
            @Override
            public void run() {
                removePairingView();
                pairingView = pairingBanner(code);
                addOverlay(pairingView, Gravity.TOP | Gravity.CENTER_HORIZONTAL, dp(36), false);
                main.removeCallbacks(hidePairing);
                main.postDelayed(hidePairing, PAIRING_SHOW_MS);
            }
        });
    }

    @Override
    public void hidePairingCode() {
        writeCodeFile(null);
        main.post(hidePairing);
    }

    // ---------------------------------------------------------------- focus and text

    private boolean moveFocus(int direction) {
        AccessibilityNodeInfo focus = findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (focus == null) {
            AccessibilityNodeInfo root = getRootInActiveWindow();
            AccessibilityNodeInfo first = root == null ? null : firstMatch(root, false, 0);
            return first != null && first.performAction(AccessibilityNodeInfo.ACTION_FOCUS);
        }
        AccessibilityNodeInfo next = focus.focusSearch(direction);
        if (next == null || next.equals(focus)) return false;
        return next.performAction(AccessibilityNodeInfo.ACTION_FOCUS);
    }

    private boolean clickFocused() {
        AccessibilityNodeInfo focus = findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        for (AccessibilityNodeInfo n = focus; n != null; n = n.getParent()) {
            if (n.isClickable()) return n.performAction(AccessibilityNodeInfo.ACTION_CLICK);
        }
        return focus != null && focus.performAction(AccessibilityNodeInfo.ACTION_CLICK);
    }

    /** The focused text field, or the first one on screen. */
    private AccessibilityNodeInfo editable() {
        AccessibilityNodeInfo focus = findFocus(AccessibilityNodeInfo.FOCUS_INPUT);
        if (focus != null && focus.isEditable()) return focus;
        AccessibilityNodeInfo root = getRootInActiveWindow();
        return root == null ? null : firstMatch(root, true, 0);
    }

    /** Depth-first search for the first visible focusable node, or editable one when {@code editable}. */
    private static AccessibilityNodeInfo firstMatch(AccessibilityNodeInfo node, boolean editable, int depth) {
        if (node == null || depth > 40) return null;
        boolean ok = editable ? node.isEditable() : node.isFocusable();
        if (ok && node.isVisibleToUser()) return node;
        for (int i = 0; i < node.getChildCount(); i++) {
            AccessibilityNodeInfo found = firstMatch(node.getChild(i), editable, depth + 1);
            if (found != null) return found;
        }
        return null;
    }

    private static String currentText(AccessibilityNodeInfo field) {
        if (Build.VERSION.SDK_INT >= 26 && field.isShowingHintText()) return "";
        CharSequence t = field.getText();
        return t == null ? "" : t.toString();
    }

    private static boolean setText(AccessibilityNodeInfo field, String text) {
        Bundle args = new Bundle();
        args.putCharSequence(AccessibilityNodeInfo.ACTION_ARGUMENT_SET_TEXT_CHARSEQUENCE, text);
        return field.performAction(AccessibilityNodeInfo.ACTION_SET_TEXT, args);
    }

    private boolean backspace() {
        AccessibilityNodeInfo field = editable();
        if (field == null) return false;
        String t = currentText(field);
        if (t.isEmpty()) return true;
        return setText(field, t.substring(0, t.offsetByCodePoints(t.length(), -1)));
    }

    private boolean imeEnter() {
        AccessibilityNodeInfo field = editable();
        if (field != null && Build.VERSION.SDK_INT >= 30) {
            return field.performAction(AccessibilityNodeInfo.AccessibilityAction.ACTION_IME_ENTER.getId());
        }
        return clickFocused();
    }

    private boolean media(int keycode) {
        audio.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, keycode));
        audio.dispatchMediaKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, keycode));
        return true;
    }

    // ---------------------------------------------------------------- cursor, gestures, overlays

    private boolean cursorVisible() {
        return cursor != null && cursor.getVisibility() == View.VISIBLE;
    }

    private void showCursor() {
        if (cursor == null) {
            cursor = new ImageView(this);
            cursor.setImageResource(R.drawable.ic_cursor);
            cursorParams = addOverlay(cursor, Gravity.TOP | Gravity.START, 0, true);
        }
        if (cursorParams != null) {
            cursorParams.x = Math.round(cursorX);
            cursorParams.y = Math.round(cursorY);
            try {
                wm.updateViewLayout(cursor, cursorParams);
            } catch (RuntimeException ignored) {
                // overlay not attached
            }
        }
        cursor.setVisibility(View.VISIBLE);
        main.removeCallbacks(hideCursor);
        main.postDelayed(hideCursor, CURSOR_HIDE_MS);
    }

    private void gesture(Path path, long durationMs) {
        try {
            GestureDescription g = new GestureDescription.Builder()
                    .addStroke(new GestureDescription.StrokeDescription(path, 0, durationMs)).build();
            dispatchGesture(g, null, null);
        } catch (RuntimeException e) {
            Log.w(TAG, "gesto recusado", e);
        }
    }

    private WindowManager.LayoutParams addOverlay(View view, int gravity, int y, boolean sized) {
        WindowManager.LayoutParams p = new WindowManager.LayoutParams(
                sized ? dp(30) : WindowManager.LayoutParams.WRAP_CONTENT,
                sized ? dp(30) : WindowManager.LayoutParams.WRAP_CONTENT,
                WindowManager.LayoutParams.TYPE_ACCESSIBILITY_OVERLAY,
                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN | WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS,
                PixelFormat.TRANSLUCENT);
        p.gravity = gravity;
        p.y = y;
        try {
            wm.addView(view, p);
            return p;
        } catch (RuntimeException e) {
            Log.w(TAG, "sobreposição recusada", e);
            return null;
        }
    }

    private View pairingBanner(String code) {
        LinearLayout box = new LinearLayout(this);
        box.setOrientation(LinearLayout.VERTICAL);
        box.setGravity(Gravity.CENTER_HORIZONTAL);
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                new int[] {0xF22563EB, 0xF26D28D9, 0xF2BE185D});
        bg.setCornerRadius(dp(22));
        box.setBackground(bg);
        box.setPadding(dp(32), dp(16), dp(32), dp(18));
        TextView title = new TextView(this);
        title.setText("Código para o Controle Projetor");
        title.setTextColor(0xE6FFFFFF);
        title.setTextSize(16);
        box.addView(title);
        TextView digits = new TextView(this);
        digits.setText(code.replace("", " ").trim());
        digits.setTextColor(Color.WHITE);
        digits.setTextSize(44);
        digits.setTypeface(Typeface.DEFAULT_BOLD);
        digits.setLetterSpacing(0.1f);
        box.addView(digits);
        TextView hint = new TextView(this);
        hint.setText("Digite este código no celular");
        hint.setTextColor(0xCCFFFFFF);
        hint.setTextSize(13);
        box.addView(hint);
        return box;
    }

    private void removePairingView() {
        removeView(pairingView);
        pairingView = null;
    }

    private void removeView(View v) {
        if (v == null) return;
        try {
            wm.removeView(v);
        } catch (RuntimeException ignored) {
            // already gone
        }
    }

    /** The phone app reads this file through ADB when it installs the receiver, to pair by itself. */
    private void writeCodeFile(String code) {
        File dir = getExternalFilesDir(null);
        if (dir == null) return;
        File f = new File(dir, "codigo.txt");
        if (code == null) {
            //noinspection ResultOfMethodCallIgnored
            f.delete();
            return;
        }
        try (FileOutputStream out = new FileOutputStream(f)) {
            out.write(code.getBytes(StandardCharsets.UTF_8));
        } catch (IOException e) {
            Log.w(TAG, "não gravou o código", e);
        }
    }

    @SuppressWarnings("deprecation")
    private Rect screen() {
        if (Build.VERSION.SDK_INT >= 30) return wm.getCurrentWindowMetrics().getBounds();
        DisplayMetrics m = new DisplayMetrics();
        wm.getDefaultDisplay().getRealMetrics(m);
        return new Rect(0, 0, m.widthPixels, m.heightPixels);
    }

    private static float clamp(float v, float min, float max) {
        return Math.max(min, Math.min(max, v));
    }

    private int dp(float v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
