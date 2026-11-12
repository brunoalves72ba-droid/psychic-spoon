package dev.projetor.controle;

import java.io.BufferedReader;
import java.io.EOFException;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Writer;
import java.net.InetSocketAddress;
import java.net.Socket;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;

/**
 * Talks to the "Receptor do Controle" app on the projector, which works with USB/ADB debugging
 * off. One command per line, one reply per line ("OK ..." or "ERR ..."). Thread-safe.
 */
public class ReceiverClient {

    public static final int PORT = 7790;
    public static final String MAGIC = "PROJETOR-RECEPTOR";

    private Socket socket;
    private BufferedReader in;
    private Writer out;
    private String id = "";
    private String model = "";
    private String host = "";

    /** Connects and checks that the other side is the receiver. */
    public synchronized void connect(String host, int port, int timeoutMs) throws IOException {
        close();
        Socket s = new Socket();
        try {
            s.connect(new InetSocketAddress(host, port), timeoutMs);
            s.setTcpNoDelay(true);
            s.setSoTimeout(8000);
        } catch (IOException e) {
            s.close();
            throw e;
        }
        socket = s;
        in = new BufferedReader(new InputStreamReader(s.getInputStream(), StandardCharsets.UTF_8));
        out = new OutputStreamWriter(s.getOutputStream(), StandardCharsets.UTF_8);
        String[] p = request("HELLO").split(" ", 5);
        if (p.length < 4 || !p[0].equals("OK") || !p[1].equals(MAGIC)) {
            close();
            throw new IOException("Não é o receptor do projetor");
        }
        id = p[3];
        model = p.length > 4 ? p[4] : "";
        this.host = host;
    }

    /** Identifies this projector's receiver; tokens are saved per id, so a new IP keeps the pairing. */
    public synchronized String id() {
        return id;
    }

    public synchronized String model() {
        return model;
    }

    public synchronized String host() {
        return host;
    }

    public synchronized boolean auth(String token) throws IOException {
        return request("AUTH " + token).equals("OK");
    }

    /** Makes the projector show a 4-digit code. */
    public synchronized void startPairing() throws IOException {
        String r = request("PAIR");
        if (!r.equals("OK")) throw new IOException("O projetor recusou o pareamento: " + r);
    }

    /** Returns the token for this phone, or null when the code is wrong ("ERR codigo") or expired. */
    public synchronized String finishPairing(String code) throws IOException {
        String r = request("PAIR " + code.trim());
        return r.startsWith("OK ") ? r.substring(3).trim() : null;
    }

    public synchronized String request(String line) throws IOException {
        if (!isConnected()) throw new IOException("Não conectado");
        try {
            out.write(line);
            out.write('\n');
            out.flush();
            String reply = in.readLine();
            if (reply == null) throw new EOFException("O projetor fechou a conexão");
            return reply;
        } catch (IOException e) {
            close();
            throw e;
        }
    }

    /** For replies of the form "OK n" followed by n lines. */
    public synchronized List<String> requestLines(String line) throws IOException {
        String head = request(line);
        if (!head.startsWith("OK ")) throw new IOException(head);
        int n = Integer.parseInt(head.substring(3).trim());
        List<String> lines = new ArrayList<>(n);
        try {
            for (int i = 0; i < n; i++) {
                String l = in.readLine();
                if (l == null) throw new EOFException();
                lines.add(l);
            }
        } catch (IOException e) {
            close();
            throw e;
        }
        return lines;
    }

    public synchronized boolean isConnected() {
        return socket != null && !socket.isClosed();
    }

    public synchronized void close() {
        if (socket != null) {
            try {
                socket.close();
            } catch (IOException ignored) {
                // closing anyway
            }
        }
        socket = null;
        in = null;
        out = null;
    }
}
