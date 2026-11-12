import dev.projetor.controle.AdbClient;
import dev.projetor.controle.ProjectorCommands;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

/** Usage: java ProjectorCommandsTest <adbkey PEM> <host> */
public class ProjectorCommandsTest {
    public static void main(String[] args) throws Exception {
        String pem = new String(Files.readAllBytes(Paths.get(args[0])), "US-ASCII")
                .replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
        KeyFactory kf = KeyFactory.getInstance("RSA");
        RSAPrivateCrtKey priv = (RSAPrivateCrtKey) kf.generatePrivate(
                new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pem)));
        RSAPublicKey pub = (RSAPublicKey) kf.generatePublic(
                new RSAPublicKeySpec(priv.getModulus(), priv.getPublicExponent()));
        AdbClient c = new AdbClient(new KeyPair(pub, priv), "teste@pc");
        c.connect(args[1], 5555, null);

        int[] v = ProjectorCommands.parseVolume(c.shell(ProjectorCommands.VOLUME_QUERY));
        System.out.println("volume: " + (v == null ? "PARSE FAILED" : v[0] + "/" + v[1]));

        for (ProjectorCommands.App a : ProjectorCommands.parseApps(c.shell(ProjectorCommands.APPS_QUERY))) {
            System.out.println("app: " + a.label + " -> " + ProjectorCommands.launch(a));
        }

        String[] actions = {"android.settings.SETTINGS", "android.settings.WIFI_SETTINGS",
                "android.settings.BLUETOOTH_SETTINGS"};
        for (String action : actions) {
            String r = c.shell("cmd package resolve-activity --brief -a " + action + " | tail -n 1");
            System.out.println("resolve " + action + ": " + r.trim());
        }
        String htc = c.shell("cmd package resolve-activity --brief -n com.htc.htcsettings/com.htc.activity.HomeActivity | tail -n 1");
        System.out.println("projector settings component: " + htc.trim());

        System.out.println("inputText: " + ProjectorCommands.inputText("Ação it's ok"));
        c.close();
    }
}
