package dev.projetor.controle.ir;

/**
 * Checks the NEC encoder against the HY300 remote as captured with an IR receiver
 * (irplus-codes issue 666): each 32-bit value is the frame read least significant bit first.
 * Run with: ./build.sh test
 */
public class NecTest {

    private static final int[][] CAPTURED = {
            {IrRemote.POWER, 0xEB14FF00}, {IrRemote.MUTE, 0xFE01FF00}, {IrRemote.MIRACAST, 0x6798FF00},
            {IrRemote.AIRPLAY, 0x6C93FF00}, {IrRemote.MOUSE, 0x7D82FF00}, {IrRemote.UP, 0xFC03FF00},
            {IrRemote.LEFT, 0xF10EFF00}, {IrRemote.OK, 0xF807FF00}, {IrRemote.RIGHT, 0xE51AFF00},
            {IrRemote.DOWN, 0xFD02FF00}, {IrRemote.BACK, 0xA35CFF00}, {IrRemote.OPTIONS, 0xEC13FF00},
            {IrRemote.HOME, 0xB748FF00}, {IrRemote.VOLUME_DOWN, 0xA758FF00}, {IrRemote.VOLUME_UP, 0xF40BFF00},
    };

    public static void main(String[] args) {
        int failures = 0;
        for (int[] c : CAPTURED) {
            int[] p = Nec.pattern(IrRemote.ADDRESS, c[0]);
            int decoded = decode(p);
            boolean ok = decoded == c[1];
            if (!ok) failures++;
            System.out.printf("%-4s comando 0x%02X -> %08X (capturado %08X)%n", ok ? "ok" : "ERRO", c[0], decoded, c[1]);
        }

        int[] power = Nec.pattern(IrRemote.ADDRESS, IrRemote.POWER);
        StringBuilder bits = new StringBuilder();
        for (int i = 0; i < 32; i++) bits.append(power[3 + 2 * i] > 1000 ? '1' : '0');
        String raw = "00000000111111110010100011010111";
        boolean rawOk = bits.toString().equals(raw);
        if (!rawOk) failures++;
        System.out.println((rawOk ? "ok   " : "ERRO ") + "bits do POWER na ordem de envio: " + bits);

        boolean shapeOk = power.length == 67 && power[0] == 9000 && power[1] == 4500 && power[66] == 560;
        if (!shapeOk) failures++;
        int us = Nec.duration(power);
        boolean lengthOk = us > 60000 && us < 80000;
        if (!lengthOk) failures++;
        System.out.println((shapeOk && lengthOk ? "ok   " : "ERRO ") + "formato: " + power.length
                + " pulsos, " + us + " us");

        if (failures > 0) {
            System.out.println(failures + " falha(s)");
            System.exit(1);
        }
        System.out.println("Todos os códigos batem com o controle original.");
    }

    /** Reads the 32 data bits back, least significant bit first, from mark/space durations. */
    private static int decode(int[] p) {
        int value = 0;
        for (int i = 0; i < 32; i++) {
            int space = p[3 + 2 * i];
            if (space > 1000) value |= 1 << i;
        }
        return value;
    }
}
