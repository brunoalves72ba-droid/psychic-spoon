package dev.projetor.controle;

/** NEC infrared codes that wake the HY300 from standby (from its device tree, cir_param). */
public final class IrCodes {

    public static final int CARRIER_HZ = 38000;

    /** {16-bit address as the receiver reports it, power command}. Standard NEC 0x00/0x14 first. */
    public static final int[][] WAKE_CODES = {
            {0xff00, 0x14}, {0x00ff, 0x14}, {0x2992, 0xf2}, {0x9f00, 0x57}, {0x4cb3, 0xdc},
            {0xff11, 0x18}, {0xdd22, 0xdc}, {0xbc00, 0x0d}, {0x4040, 0x4d}, {0xfb04, 0x08},
            {0xfc03, 0x00}, {0xbf00, 0x00}, {0xfb04, 0xea}, {0xbf00, 0x42},
    };

    private IrCodes() {
    }

    /** On/off durations in microseconds for one NEC frame; the low address byte is sent first. */
    public static int[] necPattern(int address, int command) {
        int[] bytes = {address & 0xff, (address >> 8) & 0xff, command & 0xff, ~command & 0xff};
        int[] p = new int[2 + 32 * 2 + 1];
        int i = 0;
        p[i++] = 9000;
        p[i++] = 4500;
        for (int b : bytes) {
            for (int bit = 0; bit < 8; bit++) {
                p[i++] = 560;
                p[i++] = ((b >> bit) & 1) == 1 ? 1690 : 560;
            }
        }
        p[i] = 560;
        return p;
    }
}
