package dev.projetor.controle.ir;

/** NEC infrared frames, the protocol of the HY300's original remote. Pure Java so it can be tested on a PC. */
final class Nec {

    static final int CARRIER_HZ = 38000;

    private static final int LEADER_MARK = 9000;
    private static final int LEADER_SPACE = 4500;
    private static final int BIT_MARK = 560;
    private static final int ZERO_SPACE = 560;
    private static final int ONE_SPACE = 1690;

    private Nec() {
    }

    /**
     * Mark/space durations in microseconds for one frame, starting with a mark, as
     * {@code ConsumerIrManager.transmit} expects. Bytes go out as address, ~address, command,
     * ~command, each least significant bit first.
     */
    static int[] pattern(int address, int command) {
        int[] bytes = {address & 0xff, ~address & 0xff, command & 0xff, ~command & 0xff};
        int[] p = new int[2 + 32 * 2 + 1];
        int i = 0;
        p[i++] = LEADER_MARK;
        p[i++] = LEADER_SPACE;
        for (int b : bytes) {
            for (int bit = 0; bit < 8; bit++) {
                p[i++] = BIT_MARK;
                p[i++] = ((b >> bit) & 1) == 1 ? ONE_SPACE : ZERO_SPACE;
            }
        }
        p[i] = BIT_MARK;
        return p;
    }

    /** Total length of a pattern in microseconds. */
    static int duration(int[] pattern) {
        int sum = 0;
        for (int d : pattern) sum += d;
        return sum;
    }
}
