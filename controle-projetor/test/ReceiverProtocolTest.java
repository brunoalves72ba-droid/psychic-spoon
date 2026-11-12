import dev.projetor.controle.LanScanner;
import dev.projetor.controle.ReceiverClient;
import dev.projetor.receptor.ReceiverServer;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Base64;
import java.util.Collections;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * The phone's ReceiverClient against the projector's ReceiverServer over a real socket, with the
 * projector's actions faked: pairing, tokens, and each command.
 * Run with: ./build.sh test
 */
public class ReceiverProtocolTest {

    static int failures;

    static final class Fake implements ReceiverServer.Actions {
        final List<String> log = Collections.synchronizedList(new ArrayList<String>());
        volatile String code;
        int volume = 8;

        public String model() { return "HY300 Pro"; }
        public boolean key(String name) { log.add("key " + name); return !name.equals("MENU"); }
        public boolean text(String t) { log.add("text " + t); return true; }
        public List<String[]> apps() {
            return Arrays.asList(new String[] {"org.smarttube.stable/com.liskovsoft.smartyoutubetv2.tv.ui.main.SplashActivity", "SmartTube"},
                    new String[] {"com.example.tv/com.example.tv.Main", "Meu\tApp"});
        }
        public boolean launch(String c) { log.add("launch " + c); return true; }
        public int[] volume() { return new int[] {volume, 20}; }
        public int[] setVolume(int v) { volume = v; return volume(); }
        public void move(int dx, int dy) { log.add("move " + dx + " " + dy); }
        public void click() { log.add("click"); }
        public void scroll(int dx, int dy) { log.add("scroll " + dx + " " + dy); }
        public void scrollEnd() { log.add("scrollEnd"); }
        public boolean open(String s) { log.add("open " + s); return s.equals("WIFI"); }
        public void showPairingCode(String c) { code = c; }
        public void hidePairingCode() { code = null; }
    }

    public static void main(String[] args) throws Exception {
        Fake fake = new Fake();
        Set<String> tokens = Collections.synchronizedSet(new HashSet<String>());
        ReceiverServer server = new ReceiverServer("abc123", fake, new ReceiverServer.Tokens() {
            public boolean contains(String t) { return tokens.contains(t); }
            public void add(String t) { tokens.add(t); }
        });
        server.start(0);
        int port = server.port();

        check("a busca reconhece o receptor", LanScanner.isReceiver("127.0.0.1", port, 500));
        check("e não confunde com uma porta fechada", !LanScanner.isReceiver("127.0.0.1", 1, 300));

        ReceiverClient c = new ReceiverClient();
        c.connect("127.0.0.1", port, 1000);
        check("HELLO traz id e modelo", c.id().equals("abc123") && c.model().equals("HY300 Pro"));
        check("sem parear, comandos são recusados", c.request("KEY UP").equals("ERR auth"));
        check("token inventado é recusado", !c.auth("123"));

        c.startPairing();
        String code = fake.code;
        check("PAIR mostra um código de 4 números no projetor", code != null && code.matches("\\d{4}"));
        String wrong = code.equals("0000") ? "1111" : "0000";
        check("código errado não pareia", c.finishPairing(wrong) == null);
        String token = c.finishPairing(code);
        check("código certo devolve um token", token != null && token.length() == 32 && fake.code == null);
        c.close();

        ReceiverClient d = new ReceiverClient();
        d.connect("127.0.0.1", port, 1000);
        check("numa conexão nova, o token salvo basta", d.auth(token));
        check("KEY UP", d.request("KEY UP").equals("OK") && fake.log.contains("key UP"));
        check("KEY MENU sem jeito no receptor responde ERR (o celular usa o infravermelho)",
                d.request("KEY MENU").startsWith("ERR"));
        String typed = "ação é ótima";
        check("TEXT leva acentos", d.request("TEXT " + Base64.getEncoder().encodeToString(typed.getBytes(StandardCharsets.UTF_8))).equals("OK")
                && fake.log.contains("text " + typed));
        List<String> apps = d.requestLines("APPS");
        check("APPS lista componente e nome, sem tabulação no nome", apps.size() == 2
                && apps.get(0).equals("org.smarttube.stable/com.liskovsoft.smartyoutubetv2.tv.ui.main.SplashActivity\tSmartTube")
                && apps.get(1).equals("com.example.tv/com.example.tv.Main\tMeu App"));
        check("a conexão segue boa depois de várias linhas", d.request("PING").equals("OK"));
        check("VOLUME lê", d.request("VOLUME").equals("OK 8 20"));
        check("VOLUME 12 ajusta", d.request("VOLUME 12").equals("OK 12 20"));
        check("LAUNCH", d.request("LAUNCH com.example.tv/com.example.tv.Main").equals("OK")
                && fake.log.contains("launch com.example.tv/com.example.tv.Main"));
        check("MOVE, CLICK, SCROLL", d.request("MOVE 5 -3").equals("OK") && d.request("CLICK").equals("OK")
                && d.request("SCROLL 0 40").equals("OK") && d.request("SCROLL_END").equals("OK")
                && fake.log.containsAll(Arrays.asList("move 5 -3", "click", "scroll 0 40", "scrollEnd")));
        check("OPEN", d.request("OPEN WIFI").equals("OK") && d.request("OPEN NADA").equals("ERR open"));
        check("comando estranho não derruba o receptor", d.request("VOLUME abc").startsWith("ERR")
                && d.request("XYZ").equals("ERR unknown") && d.request("PING").equals("OK"));
        d.close();
        server.stop();
        if (failures > 0) System.exit(1);
    }

    static void check(String what, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "ok   " : "ERRO ") + what);
    }
}
