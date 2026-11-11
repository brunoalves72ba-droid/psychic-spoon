import dev.projetor.controle.AdbClient;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

/** Usage: java AdbClientTest <adbkey PEM> <adbkey.pub> <host> */
public class AdbClientTest {
    public static void main(String[] args) throws Exception {
        String pem = new String(Files.readAllBytes(Paths.get(args[0])), "US-ASCII")
                .replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
        KeyFactory kf = KeyFactory.getInstance("RSA");
        RSAPrivateCrtKey priv = (RSAPrivateCrtKey) kf.generatePrivate(
                new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pem)));
        RSAPublicKey pub = (RSAPublicKey) kf.generatePublic(
                new RSAPublicKeySpec(priv.getModulus(), priv.getPublicExponent()));

        String expected = new String(Files.readAllBytes(Paths.get(args[1])), "US-ASCII").trim().split(" ")[0];
        String mine = AdbClient.encodePublicKey(pub);
        System.out.println("pubkey encoding matches adb: " + expected.equals(mine));

        AdbClient c = new AdbClient(new KeyPair(pub, priv), "teste@pc");
        c.connect(args[2], 5555, () -> System.out.println("WAITING FOR APPROVAL (unexpected)"));
        System.out.println("connected: " + c.isConnected());
        System.out.println("model: " + c.shell("getprop ro.product.model").trim());
        String audio = c.shell("dumpsys audio | grep -A 9 '^- STREAM_MUSIC' | grep -E 'Max|streamVolume'");
        System.out.println("audio: " + audio.trim().replace('\n', '|'));
        String apps = c.shell("cmd package query-activities --brief -a android.intent.action.MAIN -c android.intent.category.LEANBACK_LAUNCHER");
        System.out.println("apps output bytes: " + apps.length());
        c.close();
    }
}
