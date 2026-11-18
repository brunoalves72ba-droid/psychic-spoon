package dev.projetor.controle;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.Shader;
import android.os.Handler;
import android.os.Looper;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewConfiguration;

/**
 * Round clickpad in the spirit of the Siri Remote. Tap the edge for an arrow (held, it repeats),
 * tap the centre for OK, or swipe anywhere: every step of the finger sends one arrow, so long
 * lists scroll with a single gesture. Highlights fade with an animator; nothing is allocated
 * while drawing.
 */
public class ClickpadView extends View {

    public interface Listener {
        void onKey(int keycode);
    }

    private static final int NONE = -1;
    private static final int CENTER = 0;
    private static final int UP = 1;
    private static final int RIGHT = 2;
    private static final int DOWN = 3;
    private static final int LEFT = 4;
    private static final int[] KEYCODES = {
            ProjectorCommands.KEY_CENTER, ProjectorCommands.KEY_UP, ProjectorCommands.KEY_RIGHT,
            ProjectorCommands.KEY_DOWN, ProjectorCommands.KEY_LEFT};

    private final Paint disc = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint rim = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint glow = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint centerFill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint marker = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint touchDot = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint hint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path chevron = new Path();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final float density;
    private final float touchSlop;
    private final float swipeStep;
    private Listener listener;
    private float cx;
    private float cy;
    private float radius;
    private float innerRadius;
    private float maxSizePx;

    // touch state
    private int zone = NONE;
    private boolean swiping;
    private boolean repeating;
    private float downX;
    private float downY;
    private float lastX;
    private float lastY;
    private float accX;
    private float accY;
    private float fingerX = -1;
    private float fingerY;

    // highlight animation: which zone glows and how much
    private int litZone = NONE;
    private float lit;
    private ValueAnimator litAnimator;

    private final Runnable startRepeat = new Runnable() {
        @Override
        public void run() {
            if (zone > CENTER && !swiping) {
                repeating = true;
                fire(zone);
                handler.postDelayed(repeat, 110);
            }
        }
    };

    private final Runnable repeat = new Runnable() {
        @Override
        public void run() {
            if (repeating && zone > CENTER) {
                fire(zone);
                handler.postDelayed(this, 110);
            }
        }
    };

    public ClickpadView(Context context) {
        super(context);
        density = context.getResources().getDisplayMetrics().density;
        touchSlop = ViewConfiguration.get(context).getScaledTouchSlop() * 1.4f;
        swipeStep = 44 * density;
        maxSizePx = 330 * density;
        rim.setStyle(Paint.Style.STROKE);
        rim.setStrokeWidth(1f * density);
        rim.setColor(0x40FFFFFF);
        ring.setStyle(Paint.Style.STROKE);
        ring.setStrokeWidth(1.2f * density);
        ring.setColor(0x2EFFFFFF);
        centerFill.setColor(0x14FFFFFF);
        centerFill.setStyle(Paint.Style.FILL);
        marker.setStyle(Paint.Style.STROKE);
        marker.setStrokeWidth(2.6f * density);
        marker.setStrokeCap(Paint.Cap.ROUND);
        marker.setStrokeJoin(Paint.Join.ROUND);
        marker.setColor(0xB3FFE6EA);
        touchDot.setColor(0x38FFFFFF);
        hint.setColor(0x99FFE6EA);
        hint.setTextAlign(Paint.Align.CENTER);
        hint.setTextSize(13 * density);
        hint.setTypeface(Style.semibold);
        setHapticFeedbackEnabled(true);
        setContentDescription("Direcional: toque nas bordas, deslize ou toque no centro para OK");
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    public void setMaxSize(float px) {
        maxSizePx = px;
        requestLayout();
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int width = MeasureSpec.getSize(widthMeasureSpec);
        int size = Math.round(Math.min(width, maxSizePx));
        setMeasuredDimension(width, size);
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        cx = w / 2f;
        cy = h / 2f;
        radius = Math.min(w, h) / 2f - 2 * density;
        innerRadius = radius * 0.34f;
        // glass: the wallpaper shows through, a little brighter toward the top edge
        disc.setShader(new RadialGradient(cx, cy - radius * 0.9f, radius * 1.9f,
                new int[] {0x30FFFFFF, 0x12FFFFFF, 0x08FFFFFF}, new float[] {0f, 0.5f, 1f}, Shader.TileMode.CLAMP));
        glow.setShader(new RadialGradient(0, 0, radius * 0.62f,
                new int[] {0x5CFFD9E0, 0x1FFFD9E0, 0x00FFD9E0}, new float[] {0f, 0.55f, 1f}, Shader.TileMode.CLAMP));
    }

    @Override
    protected void onDraw(Canvas canvas) {
        canvas.drawCircle(cx, cy, radius, disc);
        canvas.drawCircle(cx, cy, radius - 0.5f * density, rim);

        if (lit > 0.01f && litZone > CENTER) {
            double a = Math.toRadians(-90 + (litZone - 1) * 90);
            float gx = cx + (float) Math.cos(a) * radius * 0.66f;
            float gy = cy + (float) Math.sin(a) * radius * 0.66f;
            glow.setAlpha(Math.round(255 * lit));
            canvas.save();
            canvas.translate(gx, gy);
            canvas.drawCircle(0, 0, radius * 0.62f, glow);
            canvas.restore();
        }

        canvas.drawCircle(cx, cy, innerRadius, centerFill);
        if (lit > 0.01f && litZone == CENTER) {
            touchDot.setAlpha(Math.round(0x55 * lit));
            canvas.drawCircle(cx, cy, innerRadius, touchDot);
            touchDot.setAlpha(0x33);
        }
        canvas.drawCircle(cx, cy, innerRadius, ring);

        float d = radius * 0.75f;
        float s = radius * 0.06f;
        for (int i = 0; i < 4; i++) {
            canvas.save();
            canvas.rotate(i * 90, cx, cy);
            chevron.reset();
            chevron.moveTo(cx - s, cy - d + s * 0.5f);
            chevron.lineTo(cx, cy - d - s * 0.5f);
            chevron.lineTo(cx + s, cy - d + s * 0.5f);
            marker.setAlpha(litZone == i + 1 ? Math.round(0x8C + (0xFF - 0x8C) * lit) : 0x8C);
            canvas.drawPath(chevron, marker);
            canvas.restore();
        }
        canvas.drawText("OK", cx, cy - (hint.descent() + hint.ascent()) / 2f, hint);

        if (swiping && fingerX >= 0) canvas.drawCircle(fingerX, fingerY, 22 * density, touchDot);
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        float x = e.getX();
        float y = e.getY();
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN: {
                if (Math.hypot(x - cx, y - cy) > radius + 12 * density) return false;
                zone = zoneAt(x, y);
                swiping = false;
                repeating = false;
                downX = lastX = x;
                downY = lastY = y;
                accX = accY = 0;
                light(zone, true);
                if (zone > CENTER) handler.postDelayed(startRepeat, 380);
                getParent().requestDisallowInterceptTouchEvent(true);
                return true;
            }
            case MotionEvent.ACTION_MOVE: {
                if (!swiping && Math.hypot(x - downX, y - downY) > touchSlop) {
                    swiping = true;
                    repeating = false;
                    handler.removeCallbacks(startRepeat);
                    handler.removeCallbacks(repeat);
                    light(NONE, false);
                }
                if (swiping) {
                    accX += x - lastX;
                    accY += y - lastY;
                    fingerX = x;
                    fingerY = y;
                    while (Math.abs(accX) >= swipeStep || Math.abs(accY) >= swipeStep) {
                        int dir;
                        if (Math.abs(accX) > Math.abs(accY)) {
                            dir = accX > 0 ? RIGHT : LEFT;
                            accX -= Math.signum(accX) * swipeStep;
                            accY *= 0.5f;
                        } else {
                            dir = accY > 0 ? DOWN : UP;
                            accY -= Math.signum(accY) * swipeStep;
                            accX *= 0.5f;
                        }
                        fire(dir);
                        performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                        flash(dir);
                    }
                    invalidate();
                }
                lastX = x;
                lastY = y;
                return true;
            }
            case MotionEvent.ACTION_UP: {
                handler.removeCallbacks(startRepeat);
                handler.removeCallbacks(repeat);
                if (!swiping && !repeating && zone != NONE) {
                    performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                    fire(zone);
                }
                endTouch();
                return true;
            }
            case MotionEvent.ACTION_CANCEL:
                handler.removeCallbacks(startRepeat);
                handler.removeCallbacks(repeat);
                endTouch();
                return true;
            default:
                return true;
        }
    }

    private void endTouch() {
        swiping = false;
        repeating = false;
        fingerX = -1;
        light(NONE, false);
        zone = NONE;
        invalidate();
    }

    private int zoneAt(float x, float y) {
        float dx = x - cx;
        float dy = y - cy;
        if (Math.hypot(dx, dy) < innerRadius * 1.05f) return CENTER;
        double angle = Math.toDegrees(Math.atan2(dy, dx));
        if (angle >= -135 && angle < -45) return UP;
        if (angle >= -45 && angle < 45) return RIGHT;
        if (angle >= 45 && angle < 135) return DOWN;
        return LEFT;
    }

    private void fire(int z) {
        if (listener != null && z >= 0) listener.onKey(KEYCODES[z]);
    }

    /** Fades the highlight of a zone in (on touch) or out (on release). */
    private void light(int z, boolean on) {
        if (litAnimator != null) litAnimator.cancel();
        if (on) litZone = z;
        litAnimator = ValueAnimator.ofFloat(lit, on ? 1f : 0f);
        litAnimator.setDuration(on ? 120 : 360);
        litAnimator.addUpdateListener(new ValueAnimator.AnimatorUpdateListener() {
            @Override
            public void onAnimationUpdate(ValueAnimator a) {
                lit = (Float) a.getAnimatedValue();
                invalidate();
            }
        });
        litAnimator.start();
    }

    /** Brief glow toward the direction a swipe step went. */
    private void flash(int z) {
        litZone = z;
        lit = 1f;
        light(z, false);
    }

    @Override
    protected void onDetachedFromWindow() {
        super.onDetachedFromWindow();
        handler.removeCallbacksAndMessages(null);
        if (litAnimator != null) litAnimator.cancel();
    }
}
