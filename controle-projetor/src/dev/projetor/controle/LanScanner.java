package dev.projetor.controle;

import java.io.BufferedReader;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

/**
 * Finds the projector on the phone's Wi-Fi: ADB over the network (port 5555) and/or the receiver
 * app (port 7790), which works with debugging off. Plain Java.
 */
public final class LanScanner {

    /** Hosts answering each way, in address order. */
    public static final class Result {
        public final List<String> adb = new ArrayList<>();
        public final List<String> receivers = new ArrayList<>();

        public boolean isEmpty() {
            return adb.isEmpty() && receivers.isEmpty();
        }
    }

    private static final int CNXN = 0x4e584e43;
    private static final int AUTH = 0x48545541;
    private static final int STLS = 0x534c5453;

    private LanScanner() {
    }

    /**
     * Addresses to try on the phone's subnet, without the network, broadcast and phone addresses.
     * Subnets larger than /24 are narrowed to the /24 around the phone, which is where home routers
     * put everything.
     */
    public static List<String> hosts(int phoneIp, int prefixLength) {
        int prefix = prefixLength < 24 || prefixLength > 30 ? 24 : prefixLength;
        int mask = prefix == 0 ? 0 : -1 << (32 - prefix);
        int network = phoneIp & mask;
        int count = 1 << (32 - prefix);
        List<String> out = new ArrayList<>();
        for (int i = 1; i < count - 1; i++) {
            int ip = network + i;
            if (ip != phoneIp) out.add(format(ip));
        }
        return out;
    }

    public static String format(int ip) {
        return ((ip >>> 24) & 0xff) + "." + ((ip >>> 16) & 0xff) + "." + ((ip >>> 8) & 0xff) + "." + (ip & 0xff);
    }

    /** Hosts that answer the ADB handshake on {@code port}, in the order given. */
    public static List<String> findAdb(List<String> hosts, final int port, final int connectTimeoutMs, int threads) {
        ExecutorService pool = Executors.newFixedThreadPool(Math.max(1, Math.min(threads, hosts.size())));
        List<Future<Boolean>> results = new ArrayList<>();
        for (final String host : hosts) {
            results.add(pool.submit(() -> isAdb(host, port, connectTimeoutMs)));
        }
        List<String> found = new ArrayList<>();
        for (int i = 0; i < hosts.size(); i++) {
            try {
                if (results.get(i).get()) found.add(hosts.get(i));
            } catch (Exception ignored) {
                // treated as not found
            }
        }
        pool.shutdownNow();
        try {
            pool.awaitTermination(1, TimeUnit.SECONDS);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        return found;
    }

    /** Probes every host for ADB and for the receiver at the same time. */
    public static Result scan(List<String> hosts, final int adbPort, final int receiverPort,
                              final int connectTimeoutMs, int threads) {
        ExecutorService pool = Executors.newFixedThreadPool(Math.max(1, Math.min(threads, hosts.size() * 2)));
        List<Future<Boolean>> adb = new ArrayList<>();
        List<Future<Boolean>> rec = new ArrayList<>();
        for (final String host : hosts) {
            adb.add(pool.submit(() -> isAdb(host, adbPort, connectTimeoutMs)));
            rec.add(pool.submit(() -> isReceiver(host, receiverPort, connectTimeoutMs)));
        }
        Result r = new Result();
        for (int i = 0; i < hosts.size(); i++) {
            if (done(adb.get(i))) r.adb.add(hosts.get(i));
            if (done(rec.get(i))) r.receivers.add(hosts.get(i));
        }
        pool.shutdownNow();
        return r;
    }

    private static boolean done(Future<Boolean> f) {
        try {
            return f.get();
        } catch (Exception e) {
            return false;
        }
    }

    /** True when the receiver app answers HELLO on {@code port}. */
    public static boolean isReceiver(String host, int port, int connectTimeoutMs) {
        try (Socket s = new Socket()) {
            s.connect(new InetSocketAddress(host, port), connectTimeoutMs);
            s.setSoTimeout(2000);
            OutputStream out = s.getOutputStream();
            out.write("HELLO\n".getBytes(StandardCharsets.UTF_8));
            out.flush();
            String line = new BufferedReader(new InputStreamReader(s.getInputStream(), StandardCharsets.UTF_8)).readLine();
            return line != null && line.startsWith("OK " + ReceiverClient.MAGIC + " ");
        } catch (IOException e) {
            return false;
        }
    }

    /**
     * Opens a connection and sends the first ADB packet. An adbd answers with CNXN, or with AUTH
     * when it does not know this phone yet; we stop there, so no approval prompt shows up.
     */
    public static boolean isAdb(String host, int port, int connectTimeoutMs) {
        try (Socket s = new Socket()) {
            s.connect(new InetSocketAddress(host, port), connectTimeoutMs);
            s.setSoTimeout(2000);
            OutputStream out = s.getOutputStream();
            out.write(connectPacket());
            out.flush();
            byte[] header = new byte[24];
            readFully(s.getInputStream(), header);
            ByteBuffer b = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN);
            int command = b.getInt(0);
            int magic = b.getInt(20);
            return (command == CNXN || command == AUTH || command == STLS) && magic == ~command;
        } catch (IOException e) {
            return false;
        }
    }

    static byte[] connectPacket() {
        byte[] data = "host::\0".getBytes(StandardCharsets.UTF_8);
        int sum = 0;
        for (byte d : data) sum += d & 0xff;
        ByteBuffer b = ByteBuffer.allocate(24 + data.length).order(ByteOrder.LITTLE_ENDIAN);
        b.putInt(CNXN).putInt(0x01000000).putInt(4096).putInt(data.length).putInt(sum).putInt(~CNXN);
        b.put(data);
        return b.array();
    }

    private static void readFully(InputStream in, byte[] buf) throws IOException {
        int off = 0;
        while (off < buf.length) {
            int n = in.read(buf, off, buf.length - off);
            if (n < 0) throw new EOFException();
            off += n;
        }
    }
}
