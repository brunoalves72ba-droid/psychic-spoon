import dev.projetor.controle.InputInjector;
import dev.projetor.controle.IrCodes;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.KeyPair;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.interfaces.RSAPublicKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

/** Usage: java InputInjectorTest <adbkey PEM> <host> */
public class InputInjectorTest {
    public static void main(String[] args) throws Exception {
        String pem = new String(Files.readAllBytes(Paths.get(args[0])), "US-ASCII")
                .replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
        KeyFactory kf = KeyFactory.getInstance("RSA");
        RSAPrivateCrtKey priv = (RSAPrivateCrtKey) kf.generatePrivate(
                new PKCS8EncodedKeySpec(Base64.getDecoder().decode(pem)));
        RSAPublicKey pub = (RSAPublicKey) kf.generatePublic(
                new RSAPublicKeySpec(priv.getModulus(), priv.getPublicExponent()));

        int[] p = IrCodes.necPattern(0xff00, 0x14);
        long total = 0;
        for (int v : p) total += v;
        System.out.println("NEC pattern entries=" + p.length + " total_us=" + total
                + " first=" + p[0] + "," + p[1] + " codes=" + IrCodes.WAKE_CODES.length);

        InputInjector in = new InputInjector(new KeyPair(pub, priv), "teste@pc");
        long t0 = System.nanoTime();
        in.connect(args[1], 5555);
        System.out.println("connect ms=" + (System.nanoTime() - t0) / 1_000_000 + " screenH=" + in.screenHeight());

        t0 = System.nanoTime();
        in.centerCursor();
        for (int i = 0; i < 20; i++) in.move(10, 5);
        System.out.println("22 mouse writes ms=" + (System.nanoTime() - t0) / 1_000_000);

        t0 = System.nanoTime();
        in.key(22);
        in.key(21);
        System.out.println("2 keys ms=" + (System.nanoTime() - t0) / 1_000_000);
        in.close();
    }
}
