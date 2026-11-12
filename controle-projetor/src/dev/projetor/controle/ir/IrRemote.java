package dev.projetor.controle.ir;

import android.content.Context;
import android.hardware.ConsumerIrManager;
import android.os.Handler;
import android.os.Looper;
import android.os.SystemClock;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.RejectedExecutionException;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Sends the HY300 remote's buttons through the phone's infrared emitter.
 *
 * <p>Codes of the original remote (NEC, address 0x00), as captured from it and published in
 * github.com/irplus-remote/irplus-codes.github.io issue 666. The projector itself lists address
 * 0x00 with power 0x14 first among its wake-up codes (device tree, cir_param).
 */
final class IrRemote {

    interface Listener {
        /** Called on the main thread after a frame left the emitter. */
        void onSent();

        /** Called on the main thread when the emitter refused a frame. */
        void onError(String message);
    }

    static final int ADDRESS = 0x00;

    static final int POWER = 0x14;
    static final int MUTE = 0x01;
    static final int MOUSE = 0x82;
    static final int UP = 0x03;
    static final int DOWN = 0x02;
    static final int LEFT = 0x0E;
    static final int RIGHT = 0x1A;
    static final int OK = 0x07;
    static final int BACK = 0x5C;
    static final int OPTIONS = 0x13;
    static final int HOME = 0x48;
    static final int VOLUME_DOWN = 0x58;
    static final int VOLUME_UP = 0x0B;
    /** Unlabelled in the capture; by position on the remote, the screen-mirroring (Miracast) button. */
    static final int MIRACAST = 0x98;
    /** Unlabelled in the capture; by position on the remote, the AirPlay button. */
    static final int AIRPLAY = 0x93;

    /** NEC frames repeat every 108 ms; a 67.5 ms frame plus this gap keeps that spacing. */
    private static final int FRAME_GAP_MS = 41;
    /** Frames waiting to go out; more are dropped so a held arrow never lags behind the finger. */
    private static final int MAX_QUEUED = 2;

    private final ConsumerIrManager ir;
    private final Listener listener;
    private final ExecutorService worker = Executors.newSingleThreadExecutor();
    private final Handler main = new Handler(Looper.getMainLooper());
    private final AtomicInteger queued = new AtomicInteger();

    IrRemote(Context context, Listener listener) {
        ConsumerIrManager m = null;
        try {
            m = (ConsumerIrManager) context.getSystemService(Context.CONSUMER_IR_SERVICE);
        } catch (RuntimeException ignored) {
            // no infrared service on this phone
        }
        this.ir = m;
        this.listener = listener;
    }

    boolean isAvailable() {
        try {
            return ir != null && ir.hasIrEmitter();
        } catch (RuntimeException e) {
            return false;
        }
    }

    void send(int command) {
        if (!isAvailable() || queued.get() >= MAX_QUEUED) return;
        final int[] pattern = Nec.pattern(ADDRESS, command);
        queued.incrementAndGet();
        try {
            worker.execute(new Runnable() {
                @Override
                public void run() {
                    try {
                        ir.transmit(Nec.CARRIER_HZ, pattern);
                        post(null);
                        SystemClock.sleep(FRAME_GAP_MS);
                    } catch (RuntimeException e) {
                        String m = e.getMessage();
                        post(m == null ? e.getClass().getSimpleName() : m);
                    } finally {
                        queued.decrementAndGet();
                    }
                }
            });
        } catch (RejectedExecutionException e) {
            queued.decrementAndGet();
        }
    }

    void close() {
        worker.shutdownNow();
        main.removeCallbacksAndMessages(null);
    }

    private void post(final String error) {
        main.post(new Runnable() {
            @Override
            public void run() {
                if (error == null) listener.onSent();
                else listener.onError(error);
            }
        });
    }
}
