import dev.projetor.controle.LanScanner;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetAddress;
import java.net.ServerSocket;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.util.Arrays;
import java.util.List;

/**
 * Checks the Wi-Fi scan: which addresses it tries, and that only a real ADB answer counts.
 * Fake devices listen on loopback addresses (127.0.0.x), one port each kind.
 * Run with: ./build.sh test
 */
public class LanScannerTest {

    private static int failures;

    public static void main(String[] args) throws Exception {
        // 192.168.0.37/24: 254 addresses minus the phone itself
        List<String> h = LanScanner.hosts(ip(192, 168, 0, 37), 24);
        check("rede /24 tem 253 endereços sem o celular", h.size() == 253 && !h.contains("192.168.0.37")
                && h.get(0).equals("192.168.0.1") && h.get(252).equals("192.168.0.254"));
        // a /16 is narrowed to the phone's /24
        List<String> wide = LanScanner.hosts(ip(10, 1, 7, 20), 16);
        check("rede /16 fica só no /24 do celular", wide.size() == 253 && wide.get(0).equals("10.1.7.1"));
        List<String> small = LanScanner.hosts(ip(192, 168, 1, 66), 28);
        check("rede /28 tem 13 endereços", small.size() == 13 && small.get(0).equals("192.168.1.65"));

        // fake adbd that asks for authorization (projector that does not know the phone yet)
        ServerSocket adbAuth = fake("127.0.0.2", 0x48545541);
        int port = adbAuth.getLocalPort();
        // fake adbd that accepts right away, on the same port at another address
        ServerSocket adbOpen = fakeAt("127.0.0.5", port, 0x4e584e43);
        // something else listening on that port that is not ADB
        ServerSocket other = fakeAt("127.0.0.7", port, 0x12345678);

        List<String> candidates = Arrays.asList("127.0.0.1", "127.0.0.2", "127.0.0.3", "127.0.0.5", "127.0.0.7");
        long t0 = System.currentTimeMillis();
        List<String> found = LanScanner.findAdb(candidates, port, 400, 8);
        long ms = System.currentTimeMillis() - t0;
        check("acha os dois projetores falsos e ignora o resto " + found + " em " + ms + " ms",
                found.equals(Arrays.asList("127.0.0.2", "127.0.0.5")));

        adbAuth.close();
        adbOpen.close();
        other.close();
        if (failures > 0) System.exit(1);
    }

    private static void check(String what, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "ok   " : "ERRO ") + what);
    }

    private static int ip(int a, int b, int c, int d) {
        return (a << 24) | (b << 16) | (c << 8) | d;
    }

    private static ServerSocket fake(String addr, int reply) throws Exception {
        return serve(new ServerSocket(0, 10, InetAddress.getByName(addr)), reply);
    }

    private static ServerSocket fakeAt(String addr, int port, int reply) throws Exception {
        return serve(new ServerSocket(port, 10, InetAddress.getByName(addr)), reply);
    }

    /** Reads one 24-byte packet header plus its data, answers with a header carrying {@code reply}. */
    private static ServerSocket serve(ServerSocket server, int reply) {
        Thread t = new Thread(() -> {
            while (!server.isClosed()) {
                try (Socket s = server.accept()) {
                    InputStream in = s.getInputStream();
                    byte[] header = new byte[24];
                    int off = 0;
                    while (off < 24) off += in.read(header, off, 24 - off);
                    int len = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN).getInt(12);
                    in.readNBytes(len);
                    ByteBuffer b = ByteBuffer.allocate(24).order(ByteOrder.LITTLE_ENDIAN);
                    b.putInt(reply).putInt(1).putInt(0).putInt(0).putInt(0).putInt(~reply);
                    OutputStream out = s.getOutputStream();
                    out.write(b.array());
                    out.flush();
                } catch (Exception ignored) {
                    // closed
                }
            }
        });
        t.setDaemon(true);
        t.start();
        return server;
    }
}
