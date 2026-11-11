package dev.projetor.controle;

import java.io.ByteArrayOutputStream;
import java.io.EOFException;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.math.BigInteger;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.KeyPairGenerator;
import java.security.PrivateKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.X509EncodedKeySpec;
import java.util.Base64;
import javax.crypto.Cipher;

/** Minimal ADB-over-TCP client: connect with RSA auth, run shell commands. Not thread-safe. */
public class AdbClient {

    public interface AuthListener {
        void onWaitingForApproval();
    }

    private static final int CNXN = 0x4e584e43;
    private static final int AUTH = 0x48545541;
    private static final int OPEN = 0x4e45504f;
    private static final int OKAY = 0x59414b4f;
    private static final int CLSE = 0x45534c43;
    private static final int WRTE = 0x45545257;

    private static final int AUTH_TOKEN = 1;
    private static final int AUTH_SIGNATURE = 2;
    private static final int AUTH_RSAPUBLICKEY = 3;

    // Old protocol version: every packet carries a byte-sum checksum, accepted by all adbd versions.
    private static final int VERSION = 0x01000000;
    private static final int MAX_DATA = 4096;

    private static final byte[] SHA1_DIGEST_INFO = {
            0x30, 0x21, 0x30, 0x09, 0x06, 0x05, 0x2b, 0x0e, 0x03, 0x02, 0x1a, 0x05, 0x00, 0x04, 0x14
    };

    private final KeyPair keyPair;
    private final String keyName;
    private Socket socket;
    private InputStream in;
    private OutputStream out;
    private int nextLocalId = 1;

    public AdbClient(KeyPair keyPair, String keyName) {
        this.keyPair = keyPair;
        this.keyName = keyName;
    }

    public static KeyPair loadOrCreateKeyPair(File dir) throws IOException, GeneralSecurityException {
        File priv = new File(dir, "adbkey");
        File pub = new File(dir, "adbkey.x509");
        KeyFactory kf = KeyFactory.getInstance("RSA");
        if (priv.exists() && pub.exists()) {
            PrivateKey p = kf.generatePrivate(new PKCS8EncodedKeySpec(readAll(priv)));
            RSAPublicKey u = (RSAPublicKey) kf.generatePublic(new X509EncodedKeySpec(readAll(pub)));
            return new KeyPair(u, p);
        }
        KeyPairGenerator gen = KeyPairGenerator.getInstance("RSA");
        gen.initialize(2048);
        KeyPair kp = gen.generateKeyPair();
        writeAll(priv, kp.getPrivate().getEncoded());
        writeAll(pub, kp.getPublic().getEncoded());
        return kp;
    }

    public synchronized boolean isConnected() {
        return socket != null && !socket.isClosed();
    }

    public synchronized void connect(String host, int port, AuthListener listener) throws IOException {
        close();
        Socket s = new Socket();
        s.connect(new InetSocketAddress(host, port), 4000);
        s.setTcpNoDelay(true);
        socket = s;
        in = s.getInputStream();
        out = s.getOutputStream();
        try {
            handshake(listener);
        } catch (IOException | RuntimeException e) {
            close();
            throw e;
        }
    }

    private void handshake(AuthListener listener) throws IOException {
        socket.setSoTimeout(10000);
        send(CNXN, VERSION, MAX_DATA, "host::\0".getBytes(StandardCharsets.UTF_8));
        boolean sentSignature = false;
        while (true) {
            Message m = read();
            if (m.command == CNXN) {
                socket.setSoTimeout(15000);
                return;
            }
            if (m.command != AUTH || m.arg0 != AUTH_TOKEN) {
                throw new IOException("Resposta inesperada do projetor durante a conexão");
            }
            if (!sentSignature) {
                send(AUTH, AUTH_SIGNATURE, 0, sign(m.data));
                sentSignature = true;
            } else {
                send(AUTH, AUTH_RSAPUBLICKEY, 0, publicKeyPayload());
                if (listener != null) listener.onWaitingForApproval();
                socket.setSoTimeout(60000);
            }
        }
    }

    /** Runs a shell command and returns its combined output. */
    public synchronized String shell(String command) throws IOException {
        return openService("shell:" + command);
    }

    /** Opens an adbd service (e.g. "shell:ls", "reboot:") and reads it until the device closes it. */
    public synchronized String openService(String destination) throws IOException {
        if (!isConnected()) throw new IOException("Não conectado");
        int localId = nextLocalId++;
        try {
            send(OPEN, localId, 0, (destination + "\0").getBytes(StandardCharsets.UTF_8));
            ByteArrayOutputStream result = new ByteArrayOutputStream();
            int remoteId = 0;
            while (true) {
                Message m = read();
                if (m.arg1 != localId) continue; // leftovers from an earlier stream
                if (m.command == OKAY) {
                    remoteId = m.arg0;
                } else if (m.command == WRTE) {
                    remoteId = m.arg0;
                    result.write(m.data);
                    send(OKAY, localId, remoteId, null);
                } else if (m.command == CLSE) {
                    if (remoteId != 0) send(CLSE, localId, remoteId, null);
                    return result.toString("UTF-8");
                }
            }
        } catch (IOException | RuntimeException e) {
            close();
            throw e;
        }
    }

    /** Opens a long-lived stream (e.g. "shell:cat > file") that data can be written to. */
    public synchronized Stream openStream(String destination) throws IOException {
        if (!isConnected()) throw new IOException("Não conectado");
        int localId = nextLocalId++;
        try {
            send(OPEN, localId, 0, (destination + "\0").getBytes(StandardCharsets.UTF_8));
            while (true) {
                Message m = read();
                if (m.arg1 != localId) continue;
                if (m.command == OKAY) return new Stream(localId, m.arg0);
                if (m.command == WRTE) send(OKAY, localId, m.arg0, null);
                if (m.command == CLSE) throw new IOException("O projetor recusou " + destination);
            }
        } catch (IOException | RuntimeException e) {
            close();
            throw e;
        }
    }

    public final class Stream {
        private final int localId;
        private final int remoteId;

        Stream(int localId, int remoteId) {
            this.localId = localId;
            this.remoteId = remoteId;
        }

        /** Sends data and waits for the device to acknowledge it. */
        public void write(byte[] data) throws IOException {
            synchronized (AdbClient.this) {
                if (!isConnected()) throw new IOException("Não conectado");
                try {
                    send(WRTE, localId, remoteId, data);
                    while (true) {
                        Message m = read();
                        if (m.arg1 != localId) continue;
                        if (m.command == OKAY) return;
                        if (m.command == WRTE) send(OKAY, localId, remoteId, null);
                        if (m.command == CLSE) throw new IOException("O projetor fechou o canal");
                    }
                } catch (IOException | RuntimeException e) {
                    close();
                    throw e;
                }
            }
        }
    }

    public synchronized void close() {
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException ignored) {
            }
        }
        socket = null;
        in = null;
        out = null;
    }

    private byte[] sign(byte[] token) throws IOException {
        try {
            RSAPublicKey pub = (RSAPublicKey) keyPair.getPublic();
            int len = (pub.getModulus().bitLength() + 7) / 8;
            byte[] em = new byte[len];
            int tLen = SHA1_DIGEST_INFO.length + token.length;
            em[1] = 0x01;
            for (int i = 2; i < len - tLen - 1; i++) em[i] = (byte) 0xff;
            System.arraycopy(SHA1_DIGEST_INFO, 0, em, len - tLen, SHA1_DIGEST_INFO.length);
            System.arraycopy(token, 0, em, len - token.length, token.length);
            Cipher c = Cipher.getInstance("RSA/ECB/NoPadding");
            c.init(Cipher.ENCRYPT_MODE, keyPair.getPrivate());
            return c.doFinal(em);
        } catch (GeneralSecurityException e) {
            throw new IOException("Falha ao assinar o desafio do projetor", e);
        }
    }

    private byte[] publicKeyPayload() {
        String line = encodePublicKey((RSAPublicKey) keyPair.getPublic()) + " " + keyName + "\0";
        return line.getBytes(StandardCharsets.UTF_8);
    }

    /** Android's adbkey.pub body: base64 of the mincrypt RSAPublicKey struct. */
    public static String encodePublicKey(RSAPublicKey key) {
        BigInteger n = key.getModulus();
        int words = n.bitLength() / 32;
        BigInteger r32 = BigInteger.ONE.shiftLeft(32);
        BigInteger n0inv = r32.subtract(n.mod(r32).modInverse(r32));
        BigInteger rr = BigInteger.ONE.shiftLeft(words * 32 * 2).mod(n);
        ByteBuffer b = ByteBuffer.allocate(4 + 4 + words * 4 * 2 + 4).order(ByteOrder.LITTLE_ENDIAN);
        b.putInt(words);
        b.putInt(n0inv.intValue());
        b.put(littleEndian(n, words * 4));
        b.put(littleEndian(rr, words * 4));
        b.putInt(key.getPublicExponent().intValue());
        return Base64.getEncoder().encodeToString(b.array());
    }

    private static byte[] littleEndian(BigInteger v, int size) {
        byte[] be = v.toByteArray();
        byte[] le = new byte[size];
        for (int i = 0; i < size && i < be.length; i++) le[i] = be[be.length - 1 - i];
        return le;
    }

    private void send(int command, int arg0, int arg1, byte[] data) throws IOException {
        int len = data == null ? 0 : data.length;
        int sum = 0;
        for (int i = 0; i < len; i++) sum += data[i] & 0xff;
        ByteBuffer h = ByteBuffer.allocate(24).order(ByteOrder.LITTLE_ENDIAN);
        h.putInt(command).putInt(arg0).putInt(arg1).putInt(len).putInt(sum).putInt(~command);
        out.write(h.array());
        if (len > 0) out.write(data);
        out.flush();
    }

    private Message read() throws IOException {
        byte[] header = readFully(24);
        ByteBuffer h = ByteBuffer.wrap(header).order(ByteOrder.LITTLE_ENDIAN);
        Message m = new Message();
        m.command = h.getInt();
        m.arg0 = h.getInt();
        m.arg1 = h.getInt();
        int len = h.getInt();
        h.getInt();
        int magic = h.getInt();
        if (magic != ~m.command) throw new IOException("Pacote ADB inválido");
        if (len < 0 || len > 1024 * 1024) throw new IOException("Pacote ADB grande demais");
        m.data = readFully(len);
        return m;
    }

    private byte[] readFully(int len) throws IOException {
        byte[] buf = new byte[len];
        int off = 0;
        while (off < len) {
            int r = in.read(buf, off, len - off);
            if (r < 0) throw new EOFException("O projetor encerrou a conexão");
            off += r;
        }
        return buf;
    }

    private static byte[] readAll(File f) throws IOException {
        try (FileInputStream fis = new FileInputStream(f)) {
            ByteArrayOutputStream bos = new ByteArrayOutputStream();
            byte[] buf = new byte[4096];
            int r;
            while ((r = fis.read(buf)) > 0) bos.write(buf, 0, r);
            return bos.toByteArray();
        }
    }

    private static void writeAll(File f, byte[] data) throws IOException {
        try (FileOutputStream fos = new FileOutputStream(f)) {
            fos.write(data);
        }
    }

    private static final class Message {
        int command;
        int arg0;
        int arg1;
        byte[] data;
    }
}
