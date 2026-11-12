package dev.projetor.controle;

/**
 * Infrared power button of the HY300's original remote: NEC protocol, address 0x00, command 0x14.
 * The projector lists this pair first among the codes that wake it from standby (device tree,
 * cir_param), and its customer_ir_ff00.kl maps code 20 (0x14) to POWER. Published captures of the
 * remote: github.com/irplus-remote/irplus-codes.github.io issue 666.
 */
public final class IrCodes {

    public static final int CARRIER_HZ = 38000;
    public static final int ADDRESS = 0x00;
    public static final int POWER = 0x14;

    private IrCodes() {
    }

    /**
     * Mark/space durations in microseconds for one NEC frame, starting with a mark, as
     * {@code ConsumerIrManager.transmit} expects. Bytes go out as address, ~address, command,
     * ~command, each least significant bit first.
     */
    public static int[] necPattern(int address, int command) {
        int[] bytes = {address & 0xff, ~address & 0xff, command & 0xff, ~command & 0xff};
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

    /** The power button frame. */
    public static int[] power() {
        return necPattern(ADDRESS, POWER);
    }
}
