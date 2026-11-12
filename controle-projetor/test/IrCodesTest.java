import dev.projetor.controle.IrCodes;

/**
 * Checks the NEC encoder against the HY300 remote as captured with an IR receiver
 * (irplus-codes issue 666): each 32-bit value is a frame read least significant bit first.
 * Run with: ./build.sh test
 */
public class IrCodesTest {

    /** {command, captured frame}; power (0x14) is the one the app sends, the rest check the encoder. */
    private static final int[][] CAPTURED = {
            {0x14, 0xEB14FF00}, {0x01, 0xFE01FF00}, {0x98, 0x6798FF00}, {0x93, 0x6C93FF00},
            {0x82, 0x7D82FF00}, {0x03, 0xFC03FF00}, {0x0E, 0xF10EFF00}, {0x07, 0xF807FF00},
            {0x1A, 0xE51AFF00}, {0x02, 0xFD02FF00}, {0x5C, 0xA35CFF00}, {0x13, 0xEC13FF00},
            {0x48, 0xB748FF00}, {0x58, 0xA758FF00}, {0x0B, 0xF40BFF00},
    };

    public static void main(String[] args) {
        int failures = 0;
        for (int[] c : CAPTURED) {
            int decoded = decode(IrCodes.necPattern(IrCodes.ADDRESS, c[0]));
            if (decoded != c[1]) {
                failures++;
                System.out.printf("ERRO comando 0x%02X -> %08X (capturado %08X)%n", c[0], decoded, c[1]);
            }
        }
        System.out.println((failures == 0 ? "ok   " : "ERRO ") + "codificador NEC confere com os "
                + CAPTURED.length + " botões capturados do controle");

        int[] power = IrCodes.power();
        StringBuilder bits = new StringBuilder();
        for (int i = 0; i < 32; i++) bits.append(power[3 + 2 * i] > 1000 ? '1' : '0');
        boolean rawOk = bits.toString().equals("00000000111111110010100011010111")
                && decode(power) == 0xEB14FF00;
        if (!rawOk) failures++;
        System.out.println((rawOk ? "ok   " : "ERRO ") + "botão de ligar, bits na ordem de envio: " + bits);

        int us = 0;
        for (int d : power) us += d;
        boolean shapeOk = power.length == 67 && power[0] == 9000 && power[1] == 4500 && us > 60000 && us < 80000;
        if (!shapeOk) failures++;
        System.out.println((shapeOk ? "ok   " : "ERRO ") + "formato: " + power.length + " pulsos, " + us + " us");

        if (failures > 0) System.exit(1);
    }

    private static int decode(int[] p) {
        int value = 0;
        for (int i = 0; i < 32; i++) if (p[3 + 2 * i] > 1000) value |= 1 << i;
        return value;
    }
}
