package dev.projetor.controle;

import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.security.KeyPair;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Writes raw Linux input events into the projector's own input devices, so keys, the mouse
 * and finger swipes arrive in milliseconds (the `input` shell command takes ~1 s per call
 * on this projector) and behave exactly like the physical remote.
 */
public class InputInjector {

    /** IR remote device: keys plus a relative mouse pointer. */
    public static final String REMOTE_DEVICE = "sunxi-ir-uinput";
    /** Virtual multitouch screen (protocol A, 0..3000 on both axes). */
    public static final String TOUCH_DEVICE = "HYSD-VATOUCH368";

    /**
     * Android keycodes that sunxi-ir-uinput.kl maps from the same Linux scancode number.
     * Other keys (e.g. POWER, SLEEP) are mapped differently and must go through `input keyevent`.
     */
    private static final Set<Integer> SAME_CODE_KEYS = new HashSet<>(Arrays.asList(
            3, 4, 19, 20, 21, 22, 23, 24, 25, 66, 67, 82, 85, 89, 90, 92, 93, 164, 176));

    private static final int EV_SYN = 0;
    private static final int EV_KEY = 1;
    private static final int EV_REL = 2;
    private static final int EV_ABS = 3;
    private static final int SYN_REPORT = 0;
    private static final int SYN_MT_REPORT = 2;
    private static final int REL_X = 0;
    private static final int REL_Y = 1;
    private static final int BTN_MOUSE = 0x110;
    private static final int BTN_TOUCH = 0x14a;
    private static final int ABS_MT_TOUCH_MAJOR = 0x30;
    private static final int ABS_MT_POSITION_X = 0x35;
    private static final int ABS_MT_POSITION_Y = 0x36;
    private static final int ABS_MT_TRACKING_ID = 0x39;
    private static final int TOUCH_MAX = 3000;
    private static final int EVENT_SIZE = 16; // 32-bit kernel struct input_event

    private static final Pattern DEVICE = Pattern.compile("add device \\d+: (\\S+)\\s+name:\\s+\"([^\"]*)\"");
    private static final Pattern SIZE = Pattern.compile("(\\d+)x(\\d+)");

    private final AdbClient adb;
    private AdbClient.Stream remote;
    private AdbClient.Stream touch;
    private int screenWidth = 1280;
    private int screenHeight = 720;
    private int trackingId;

    public InputInjector(KeyPair keyPair, String keyName) {
        adb = new AdbClient(keyPair, keyName);
    }

    public static boolean supportsKey(int androidKeycode) {
        return SAME_CODE_KEYS.contains(androidKeycode);
    }

    public static String findDevicePath(String geteventOutput, String name) {
        if (geteventOutput == null) return null;
        Matcher m = DEVICE.matcher(geteventOutput);
        while (m.find()) {
            if (m.group(2).equals(name)) return m.group(1);
        }
        return null;
    }

    public synchronized boolean isReady() {
        return remote != null && adb.isConnected();
    }

    public synchronized boolean canSwipe() {
        return touch != null && adb.isConnected();
    }

    public synchronized void connect(String host, int port) throws IOException {
        remote = null;
        touch = null;
        adb.connect(host, port, null);
        String devices = adb.shell("getevent -pl 2>/dev/null");
        String remotePath = findDevicePath(devices, REMOTE_DEVICE);
        if (remotePath == null) {
            adb.close();
            throw new IOException("Dispositivo do controle remoto não encontrado no projetor");
        }
        Matcher size = SIZE.matcher(adb.shell("wm size"));
        while (size.find()) {
            screenWidth = Integer.parseInt(size.group(1));
            screenHeight = Integer.parseInt(size.group(2));
        }
        remote = adb.openStream("shell:cat > " + remotePath);
        String touchPath = findDevicePath(devices, TOUCH_DEVICE);
        if (touchPath != null) touch = adb.openStream("shell:cat > " + touchPath);
    }

    public synchronized void close() {
        remote = null;
        touch = null;
        adb.close();
    }

    public synchronized void key(int androidKeycode) throws IOException {
        ByteBuffer b = events(4);
        put(b, EV_KEY, androidKeycode, 1);
        put(b, EV_SYN, SYN_REPORT, 0);
        put(b, EV_KEY, androidKeycode, 0);
        put(b, EV_SYN, SYN_REPORT, 0);
        write(remote, b);
    }

    public synchronized void move(int dx, int dy) throws IOException {
        if (dx == 0 && dy == 0) return;
        ByteBuffer b = events(3);
        if (dx != 0) put(b, EV_REL, REL_X, dx);
        if (dy != 0) put(b, EV_REL, REL_Y, dy);
        put(b, EV_SYN, SYN_REPORT, 0);
        write(remote, b);
    }

    public synchronized void click() throws IOException {
        ByteBuffer b = events(4);
        put(b, EV_KEY, BTN_MOUSE, 1);
        put(b, EV_SYN, SYN_REPORT, 0);
        put(b, EV_KEY, BTN_MOUSE, 0);
        put(b, EV_SYN, SYN_REPORT, 0);
        write(remote, b);
    }

    public synchronized int screenWidth() {
        return screenWidth;
    }

    public synchronized int screenHeight() {
        return screenHeight;
    }

    /** Finger down at a screen position (pixels). */
    public synchronized void touchDown(int x, int y) throws IOException {
        trackingId = (trackingId + 1) & 0xff;
        touchAt(x, y, true);
    }

    /** Finger moved to a screen position (pixels). */
    public synchronized void touchMove(int x, int y) throws IOException {
        touchAt(x, y, false);
    }

    public synchronized void touchUp() throws IOException {
        ByteBuffer b = events(3);
        put(b, EV_SYN, SYN_MT_REPORT, 0);
        put(b, EV_KEY, BTN_TOUCH, 0);
        put(b, EV_SYN, SYN_REPORT, 0);
        write(touch, b);
    }

    private void touchAt(int x, int y, boolean down) throws IOException {
        ByteBuffer b = events(7);
        put(b, EV_ABS, ABS_MT_TRACKING_ID, trackingId);
        put(b, EV_ABS, ABS_MT_POSITION_X, toTouch(x, screenWidth));
        put(b, EV_ABS, ABS_MT_POSITION_Y, toTouch(y, screenHeight));
        put(b, EV_ABS, ABS_MT_TOUCH_MAJOR, 8);
        put(b, EV_SYN, SYN_MT_REPORT, 0);
        if (down) put(b, EV_KEY, BTN_TOUCH, 1);
        put(b, EV_SYN, SYN_REPORT, 0);
        write(touch, b);
    }

    private static int toTouch(int pixel, int size) {
        int clamped = Math.max(0, Math.min(size - 1, pixel));
        return (int) ((long) clamped * TOUCH_MAX / (size - 1));
    }

    private static ByteBuffer events(int count) {
        return ByteBuffer.allocate(count * EVENT_SIZE).order(ByteOrder.LITTLE_ENDIAN);
    }

    private static void put(ByteBuffer b, int type, int code, int value) {
        b.putInt(0).putInt(0).putShort((short) type).putShort((short) code).putInt(value);
    }

    private void write(AdbClient.Stream target, ByteBuffer b) throws IOException {
        if (target == null) throw new IOException("Canal de controle não conectado");
        byte[] data = Arrays.copyOf(b.array(), b.position());
        try {
            target.write(data);
        } catch (IOException e) {
            remote = null;
            touch = null;
            throw e;
        }
    }
}
