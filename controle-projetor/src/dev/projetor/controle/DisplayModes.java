package dev.projetor.controle;

/** Chooses the display mode for smooth animation. Plain Java, so the choice is tested on a PC. */
final class DisplayModes {

    static final float TARGET_HZ = 120f;

    private DisplayModes() {
    }

    /**
     * Index of the mode to ask for among {@code modes} ({width, height, refresh Hz} each): the one
     * nearest to 120 Hz at the current resolution, or the fastest there when none is near 120.
     * Returns -1 when nothing is faster than the current rate, so the system keeps its choice.
     */
    static int pick(float[][] modes, int width, int height, float currentHz) {
        int near = -1;
        int fastest = -1;
        for (int i = 0; i < modes.length; i++) {
            float[] m = modes[i];
            if (Math.round(m[0]) != width || Math.round(m[1]) != height) continue;
            if (Math.abs(m[2] - TARGET_HZ) <= 2f && (near < 0 || Math.abs(m[2] - TARGET_HZ) < Math.abs(modes[near][2] - TARGET_HZ))) {
                near = i;
            }
            if (fastest < 0 || m[2] > modes[fastest][2]) fastest = i;
        }
        int chosen = near >= 0 ? near : fastest;
        if (chosen < 0 || (near < 0 && modes[chosen][2] <= currentHz + 1f)) return -1;
        return chosen;
    }
}
