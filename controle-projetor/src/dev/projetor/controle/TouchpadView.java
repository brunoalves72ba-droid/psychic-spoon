package dev.projetor.controle;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RectF;
import android.graphics.Shader;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;

/**
 * Laptop-style touchpad. One finger moves the cursor, a quick tap clicks, two fingers (or one
 * finger on the right-hand strip) scroll the projector screen like a finger swipe.
 */
public class TouchpadView extends View {

    public interface Listener {
        void onMove(int dx, int dy);

        void onClick();

        void onScroll(int dx, int dy);

        void onScrollEnd();
    }

    private static final int IDLE = 0;
    private static final int MOVE = 1;
    private static final int SCROLL = 2;
    /** After a two-finger scroll, ignore the last finger until it lifts. */
    private static final int DONE = 3;

    private final float density;
    private final Paint pad = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint border = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint dot = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint strip = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint arrow = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint hint = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint hintSmall = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint touchGlow = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF rect = new RectF();
    private final RectF stripRect = new RectF();
    private final Path path = new Path();
    private Listener listener;
    private float sensitivity = 1.6f;

    private int mode = IDLE;
    private float lastX;
    private float lastY;
    private float travel;
    private long downTime;
    private float accX;
    private float accY;
    private float touchX = -1;
    private float touchY = -1;

    public TouchpadView(Context context) {
        super(context);
        density = context.getResources().getDisplayMetrics().density;
        border.setStyle(Paint.Style.STROKE);
        border.setStrokeWidth(1.5f * density);
        border.setColor(0x553D8BFF);
        dot.setColor(0x283D8BFF);
        strip.setColor(0xFF1B2440);
        arrow.setStyle(Paint.Style.STROKE);
        arrow.setStrokeWidth(3f * density);
        arrow.setStrokeCap(Paint.Cap.ROUND);
        arrow.setStrokeJoin(Paint.Join.ROUND);
        arrow.setColor(Style.MUTED);
        hint.setColor(0x99F1F4F8);
        hint.setTextAlign(Paint.Align.CENTER);
        hint.setTextSize(15 * density);
        hintSmall.setColor(0x668C96A6);
        hintSmall.setTextAlign(Paint.Align.CENTER);
        hintSmall.setTextSize(12.5f * density);
        touchGlow.setColor(0x333D8BFF);
        setContentDescription("Touchpad");
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    public void setSensitivity(float sensitivity) {
        this.sensitivity = sensitivity;
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        float inset = density;
        rect.set(inset, inset, w - inset, h - inset);
        float stripW = 52 * density;
        stripRect.set(rect.right - stripW, rect.top, rect.right, rect.bottom);
        pad.setShader(new LinearGradient(0, 0, 0, h, 0xFF1B2236, 0xFF101522, Shader.TileMode.CLAMP));
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float r = 24 * density;
        canvas.drawRoundRect(rect, r, r, pad);

        canvas.save();
        canvas.clipRect(rect.left, rect.top, stripRect.left, rect.bottom);
        float step = 22 * density;
        for (float y = rect.top + step; y < rect.bottom; y += step) {
            for (float x = rect.left + step; x < stripRect.left; x += step) {
                canvas.drawCircle(x, y, 1.3f * density, dot);
            }
        }
        canvas.restore();

        canvas.save();
        canvas.clipRect(stripRect);
        canvas.drawRoundRect(rect, r, r, strip);
        canvas.restore();
        canvas.drawLine(stripRect.left, rect.top + r, stripRect.left, rect.bottom - r, border);

        float sx = stripRect.centerX();
        float s = 9 * density;
        path.reset();
        path.moveTo(sx - s, rect.top + 40 * density);
        path.lineTo(sx, rect.top + 40 * density - s);
        path.lineTo(sx + s, rect.top + 40 * density);
        path.moveTo(sx - s, rect.bottom - 40 * density);
        path.lineTo(sx, rect.bottom - 40 * density + s);
        path.lineTo(sx + s, rect.bottom - 40 * density);
        canvas.drawPath(path, arrow);
        canvas.save();
        canvas.rotate(-90, sx, stripRect.centerY());
        canvas.drawText("ROLAR", sx, stripRect.centerY() + 4 * density, hintSmall);
        canvas.restore();

        canvas.drawRoundRect(rect, r, r, border);

        if (mode == IDLE) {
            float hx = (rect.left + stripRect.left) / 2f;
            float hy = rect.centerY();
            canvas.drawText("Deslize para mover o cursor", hx, hy - 10 * density, hint);
            canvas.drawText("Toque para clicar · 2 dedos para rolar", hx, hy + 14 * density, hintSmall);
        } else if (touchX >= 0) {
            canvas.drawCircle(touchX, touchY, 34 * density, touchGlow);
        }
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                lastX = e.getX();
                lastY = e.getY();
                travel = 0;
                accX = 0;
                accY = 0;
                downTime = e.getEventTime();
                mode = stripRect.contains(lastX, lastY) ? SCROLL : MOVE;
                setTouch(lastX, lastY);
                return true;
            case MotionEvent.ACTION_POINTER_DOWN:
                if (mode == MOVE && e.getPointerCount() == 2) {
                    mode = SCROLL;
                    lastX = avgX(e);
                    lastY = avgY(e);
                    accX = 0;
                    accY = 0;
                }
                return true;
            case MotionEvent.ACTION_MOVE:
                handleMove(e);
                return true;
            case MotionEvent.ACTION_POINTER_UP:
                if (mode == SCROLL && e.getPointerCount() - 1 < 2) {
                    if (listener != null) listener.onScrollEnd();
                    mode = DONE;
                }
                return true;
            case MotionEvent.ACTION_UP:
                if (mode == MOVE && travel < 10 * density && e.getEventTime() - downTime < 250) {
                    performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                    if (listener != null) listener.onClick();
                }
                if (mode == SCROLL && listener != null) listener.onScrollEnd();
                mode = IDLE;
                setTouch(-1, -1);
                return true;
            case MotionEvent.ACTION_CANCEL:
                if (mode == SCROLL && listener != null) listener.onScrollEnd();
                mode = IDLE;
                setTouch(-1, -1);
                return true;
            default:
                return true;
        }
    }

    private void handleMove(MotionEvent e) {
        if (listener == null || mode == DONE || mode == IDLE) return;
        boolean twoFingers = e.getPointerCount() >= 2;
        float x = twoFingers ? avgX(e) : e.getX();
        float y = twoFingers ? avgY(e) : e.getY();
        float dx = x - lastX;
        float dy = y - lastY;
        lastX = x;
        lastY = y;
        travel += Math.abs(dx) + Math.abs(dy);
        setTouch(e.getX(), e.getY());
        if (mode == MOVE) {
            float gain = sensitivity / density;
            accX += dx * gain;
            accY += dy * gain;
        } else {
            float gain = 1.8f / density;
            accX += (stripRect.contains(e.getX(), e.getY()) && !twoFingers ? 0 : dx) * gain;
            accY += dy * gain;
        }
        int ix = (int) accX;
        int iy = (int) accY;
        if (ix == 0 && iy == 0) return;
        accX -= ix;
        accY -= iy;
        if (mode == MOVE) listener.onMove(ix, iy);
        else listener.onScroll(ix, iy);
    }

    private void setTouch(float x, float y) {
        touchX = x;
        touchY = y;
        invalidate();
    }

    private static float avgX(MotionEvent e) {
        float sum = 0;
        for (int i = 0; i < e.getPointerCount(); i++) sum += e.getX(i);
        return sum / e.getPointerCount();
    }

    private static float avgY(MotionEvent e) {
        float sum = 0;
        for (int i = 0; i < e.getPointerCount(); i++) sum += e.getY(i);
        return sum / e.getPointerCount();
    }
}
