package dev.projetor.receptor;

import java.io.BufferedOutputStream;
import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.net.InetSocketAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.security.SecureRandom;
import java.util.ArrayList;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Text protocol between the phone app and the projector, one command per line, one reply per
 * line ("OK ..." or "ERR ..."). Plain Java so it can be tested on a PC.
 *
 * <p>A phone first pairs: PAIR shows a 4-digit code on the projector, PAIR &lt;code&gt; returns a
 * token, and later connections start with AUTH &lt;token&gt;. Only HELLO, PAIR and AUTH work before.
 */
public final class ReceiverServer {

    public static final int PORT = 7790;
    public static final String MAGIC = "PROJETOR-RECEPTOR";
    public static final int VERSION = 1;
    private static final long PAIRING_MS = 120_000;
    private static final int PAIRING_TRIES = 5;

    /** What the projector does for each command; implemented by the accessibility service. */
    public interface Actions {
        String model();

        /** UP, DOWN, LEFT, RIGHT, CENTER, BACK, HOME, MENU, PLAY_PAUSE, ...; false when not possible here. */
        boolean key(String name);

        boolean text(String text);

        /** {component, label} of each launchable app. */
        List<String[]> apps();

        boolean launch(String component);

        /** {current, max}. */
        int[] volume();

        int[] setVolume(int volume);

        void move(int dx, int dy);

        void click();

        void scroll(int dx, int dy);

        void scrollEnd();

        /** PROJECTOR_SETTINGS, SETTINGS, WIFI or BLUETOOTH. */
        boolean open(String screen);

        void showPairingCode(String code);

        void hidePairingCode();
    }

    /** Tokens of the phones already paired. */
    public interface Tokens {
        boolean contains(String token);

        void add(String token);
    }

    private final String id;
    private final Actions actions;
    private final Tokens tokens;
    private final SecureRandom random = new SecureRandom();
    private final Set<Socket> clients = Collections.synchronizedSet(new HashSet<Socket>());
    private volatile ServerSocket server;
    private String pairingCode;
    private long pairingUntil;
    private int pairingTries;

    public ReceiverServer(String id, Actions actions, Tokens tokens) {
        this.id = id;
        this.actions = actions;
        this.tokens = tokens;
    }

    public synchronized void start(int port) throws IOException {
        ServerSocket s = new ServerSocket();
        s.setReuseAddress(true);
        s.bind(new InetSocketAddress(port));
        server = s;
        Thread t = new Thread(new Runnable() {
            @Override
            public void run() {
                acceptLoop();
            }
        }, "receptor");
        t.setDaemon(true);
        t.start();
    }

    public int port() {
        ServerSocket s = server;
        return s == null ? -1 : s.getLocalPort();
    }

    public void stop() {
        ServerSocket s = server;
        server = null;
        try {
            if (s != null) s.close();
        } catch (IOException ignored) {
            // closing anyway
        }
        List<Socket> open;
        synchronized (clients) {
            open = new ArrayList<>(clients);
        }
        for (Socket c : open) {
            try {
                c.close();
            } catch (IOException ignored) {
                // closing anyway
            }
        }
    }

    private void acceptLoop() {
        while (true) {
            ServerSocket s = server;
            if (s == null || s.isClosed()) return;
            try {
                final Socket client = s.accept();
                client.setTcpNoDelay(true);
                Thread t = new Thread(new Runnable() {
                    @Override
                    public void run() {
                        serve(client);
                    }
                }, "receptor-cliente");
                t.setDaemon(true);
                t.start();
            } catch (IOException e) {
                if (server == null) return;
            }
        }
    }

    private void serve(Socket socket) {
        clients.add(socket);
        try {
            BufferedReader in = new BufferedReader(new InputStreamReader(socket.getInputStream(), StandardCharsets.UTF_8));
            Writer out = new OutputStreamWriter(new BufferedOutputStream(socket.getOutputStream()), StandardCharsets.UTF_8);
            boolean[] authed = {false};
            String line;
            while ((line = in.readLine()) != null) {
                if (line.length() > 200_000) break;
                out.write(handle(line.trim(), authed));
                out.write('\n');
                out.flush();
            }
        } catch (IOException ignored) {
            // phone went away
        } finally {
            clients.remove(socket);
            try {
                socket.close();
            } catch (IOException ignored) {
                // closing anyway
            }
        }
    }

    /** Reply to one line; {@code authed[0]} tracks whether this connection presented a valid token. */
    String handle(String line, boolean[] authed) {
        String cmd = line;
        String arg = "";
        int sp = line.indexOf(' ');
        if (sp >= 0) {
            cmd = line.substring(0, sp);
            arg = line.substring(sp + 1).trim();
        }
        switch (cmd) {
            case "HELLO":
                return "OK " + MAGIC + " " + VERSION + " " + id + " " + clean(actions.model());
            case "PAIR":
                return arg.isEmpty() ? startPairing() : finishPairing(arg, authed);
            case "AUTH":
                if (!arg.isEmpty() && tokens.contains(arg)) {
                    authed[0] = true;
                    return "OK";
                }
                return "ERR token";
            default:
                break;
        }
        if (!authed[0]) return "ERR auth";
        try {
            return command(cmd, arg);
        } catch (RuntimeException e) {
            return "ERR " + clean(e.getClass().getSimpleName());
        }
    }

    private String command(String cmd, String arg) {
        switch (cmd) {
            case "PING":
                return "OK";
            case "KEY":
                return actions.key(arg) ? "OK" : "ERR nofocus";
            case "TEXT":
                return actions.text(new String(Base64.getDecoder().decode(arg), StandardCharsets.UTF_8)) ? "OK" : "ERR nofield";
            case "APPS": {
                List<String[]> apps = actions.apps();
                StringBuilder b = new StringBuilder("OK ").append(apps.size());
                for (String[] a : apps) b.append('\n').append(clean(a[0])).append('\t').append(clean(a[1]));
                return b.toString();
            }
            case "LAUNCH":
                return actions.launch(arg) ? "OK" : "ERR launch";
            case "VOLUME": {
                int[] v = arg.isEmpty() ? actions.volume() : actions.setVolume(Integer.parseInt(arg));
                return "OK " + v[0] + " " + v[1];
            }
            case "MOVE": {
                int[] d = pair(arg);
                actions.move(d[0], d[1]);
                return "OK";
            }
            case "CLICK":
                actions.click();
                return "OK";
            case "SCROLL": {
                int[] d = pair(arg);
                actions.scroll(d[0], d[1]);
                return "OK";
            }
            case "SCROLL_END":
                actions.scrollEnd();
                return "OK";
            case "OPEN":
                return actions.open(arg) ? "OK" : "ERR open";
            default:
                return "ERR unknown";
        }
    }

    private synchronized String startPairing() {
        pairingCode = String.format(Locale.ROOT, "%04d", random.nextInt(10000));
        pairingUntil = System.currentTimeMillis() + PAIRING_MS;
        pairingTries = 0;
        actions.showPairingCode(pairingCode);
        return "OK";
    }

    private synchronized String finishPairing(String code, boolean[] authed) {
        if (pairingCode == null || System.currentTimeMillis() > pairingUntil) return "ERR expirado";
        if (!pairingCode.equals(code)) {
            if (++pairingTries >= PAIRING_TRIES) {
                pairingCode = null;
                actions.hidePairingCode();
                return "ERR expirado";
            }
            return "ERR codigo";
        }
        pairingCode = null;
        actions.hidePairingCode();
        byte[] b = new byte[16];
        random.nextBytes(b);
        StringBuilder token = new StringBuilder();
        for (byte x : b) token.append(String.format(Locale.ROOT, "%02x", x & 0xff));
        tokens.add(token.toString());
        authed[0] = true;
        return "OK " + token;
    }

    private static int[] pair(String arg) {
        String[] p = arg.split(" ");
        return new int[] {Integer.parseInt(p[0]), Integer.parseInt(p[1])};
    }

    private static String clean(String s) {
        return s == null ? "" : s.replace('\t', ' ').replace('\n', ' ').replace('\r', ' ');
    }
}
