import java.nio.file.Files;
import java.nio.file.Paths;
import java.security.KeyFactory;
import java.security.interfaces.RSAPrivateCrtKey;
import java.security.spec.PKCS8EncodedKeySpec;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;

/** Converts the PC's adbkey (PEM) into the app's key files: adbkey (PKCS#8) and adbkey.x509. */
public class ExportKey {
    public static void main(String[] args) throws Exception {
        String pem = new String(Files.readAllBytes(Paths.get(args[0])), "US-ASCII")
                .replaceAll("-----[A-Z ]+-----", "").replaceAll("\\s", "");
        byte[] pkcs8 = Base64.getDecoder().decode(pem);
        KeyFactory kf = KeyFactory.getInstance("RSA");
        RSAPrivateCrtKey priv = (RSAPrivateCrtKey) kf.generatePrivate(new PKCS8EncodedKeySpec(pkcs8));
        byte[] x509 = kf.generatePublic(new RSAPublicKeySpec(priv.getModulus(), priv.getPublicExponent())).getEncoded();
        Files.write(Paths.get(args[1], "adbkey"), pkcs8);
        Files.write(Paths.get(args[1], "adbkey.x509"), x509);
    }
}
