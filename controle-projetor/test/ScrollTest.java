import dev.projetor.controle.InputInjector;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

/** Usage: java ScrollTest <adbkey PEM> <host> ; slow finger swipe up from the screen centre. */
public class ScrollTest {
    public static void main(String[] args) throws Exception {
        String pem = new String(Files.readAllBytes(Paths.get(args[0])), "US-ASCII")
                .replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
        KeyFactory kf = KeyFactory.getInstance("RSA");
        RSAPrivateCrtKey priv = (RSAPrivateCrtKey) kf.generatePrivate(
                new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pem)));
        RSAPublicKey pub = (RSAPublicKey) kf.generatePublic(
                new RSAPublicKeySpec(priv.getModulus(), priv.getPublicExponent()));
        InputInjector in = new InputInjector(new KeyPair(pub, priv), "teste@pc");
        in.connect(args[1], 5555);
        System.out.println("canSwipe=" + in.canSwipe());
        int x = in.screenWidth() / 2;
        int y = in.screenHeight() / 2 + 150;
        in.touchDown(x, y);
        for (int i = 0; i < 20; i++) {
            y -= 15;
            Thread.sleep(25);
            in.touchMove(x, y);
        }
        Thread.sleep(150);
        in.touchUp();
        Thread.sleep(500);
        in.close();
    }
}
