package dev.projetor.controle;

import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.graphics.drawable.Drawable;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;

/**
 * Capsule slider in the style of the iOS Control Center: the fill grows from the start, the icon
 * sits inside, the finger moves the value relative to where it touched (no jump), each step gives
 * a light tick, and the track swells slightly while held. Horizontal or vertical.
 */
public class PillSlider extends View {

    public interface Listener {
        void onChange(int value, boolean done);
    }

    private final Paint track = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF rect = new RectF();
    private final float density;
    private final boolean vertical;
    private Drawable icon;
    private Drawable iconEnd;
    private Listener listener;
    private int max = 20;
    private int value = -1;
    private float position;
    private float startPosition;
    private float startTouch;
    private boolean dragging;
    private float swell;
    private ValueAnimator swellAnimator;
    private ValueAnimator positionAnimator;

    public PillSlider(Context context, boolean vertical) {
        super(context);
        this.vertical = vertical;
        density = context.getResources().getDisplayMetrics().density;
        track.setColor(0x26FFFFFF);
        fill.setColor(0xF0FFFFFF);
        setHapticFeedbackEnabled(true);
    }

    public void setIcons(int start, int end) {
        icon = start == 0 ? null : getContext().getDrawable(start).mutate();
        iconEnd = end == 0 ? null : getContext().getDrawable(end).mutate();
        invalidate();
    }

    public void setFillColor(int color) {
        fill.setColor(color);
        invalidate();
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    public void setMax(int max) {
        this.max = Math.max(1, max);
        invalidate();
    }

    public int getValue() {
        return value;
    }

    public boolean isDragging() {
        return dragging;
    }

    /** Shows a value read from the projector; glides there unless the finger is on the slider. */
    public void setValue(int v, boolean animate) {
        if (dragging) return;
        value = v;
        float target = v < 0 ? 0 : Math.min(1f, v / (float) max);
        if (positionAnimator != null) positionAnimator.cancel();
        if (!animate || !isLaidOut()) {
            position = target;
            invalidate();
            return;
        }
        positionAnimator = ValueAnimator.ofFloat(position, target);
        positionAnimator.setDuration(380);
        positionAnimator.setInterpolator(Style.SPRING_SOFT);
        positionAnimator.addUpdateListener(a -> {
            position = (Float) a.getAnimatedValue();
            invalidate();
        });
        positionAnimator.start();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float w = getWidth();
        float h = getHeight();
        float thickness = vertical ? w : h;
        float r = Math.min(thickness / 2f, 18 * density + thickness * 0.12f);
        // swell: grow across the track while touched
        float pad = (1 - swell) * 3 * density;
        if (vertical) rect.set(pad, 0, w - pad, h);
        else rect.set(0, pad, w, h - pad);
        canvas.drawRoundRect(rect, r, r, track);

        canvas.save();
        if (vertical) canvas.clipRect(rect.left, rect.bottom - rect.height() * position, rect.right, rect.bottom);
        else canvas.clipRect(rect.left, rect.top, rect.left + rect.width() * position, rect.bottom);
        canvas.drawRoundRect(rect, r, r, fill);
        canvas.restore();

        int iconSize = Math.round((vertical ? rect.width() : rect.height()) * 0.42f);
        if (icon != null) drawIcon(canvas, icon, iconSize, true);
        if (iconEnd != null) drawIcon(canvas, iconEnd, iconSize, false);
    }

    /** Icon tinted dark where the white fill is under it, light over the empty track. */
    private void drawIcon(Canvas canvas, Drawable d, int size, boolean start) {
        float inset = (vertical ? rect.width() : rect.height()) / 2f;
        float x = vertical ? rect.centerX() : (start ? rect.left + inset : rect.right - inset);
        float y = vertical ? (start ? rect.bottom - inset : rect.top + inset) : rect.centerY();
        float along = vertical ? (rect.bottom - y) / rect.height() : (x - rect.left) / rect.width();
        d.setTint(along < position ? Style.WINE : 0xD9FFFFFF);
        int half = size / 2;
        d.setBounds(Math.round(x) - half, Math.round(y) - half, Math.round(x) + half, Math.round(y) + half);
        d.draw(canvas);
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                dragging = true;
                if (positionAnimator != null) positionAnimator.cancel();
                startPosition = position;
                startTouch = vertical ? e.getY() : e.getX();
                animateSwell(1f);
                getParent().requestDisallowInterceptTouchEvent(true);
                return true;
            case MotionEvent.ACTION_MOVE: {
                float length = vertical ? getHeight() : getWidth();
                float delta = ((vertical ? startTouch - e.getY() : e.getX() - startTouch)) / length;
                position = Math.max(0f, Math.min(1f, startPosition + delta));
                int v = Math.round(position * max);
                if (v != value) {
                    value = v;
                    performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                    if (listener != null) listener.onChange(v, false);
                }
                invalidate();
                return true;
            }
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                dragging = false;
                animateSwell(0f);
                if (value < 0) value = Math.round(position * max);
                setValue(value, true);
                if (listener != null) listener.onChange(value, true);
                return true;
            default:
                return true;
        }
    }

    private void animateSwell(float to) {
        if (swellAnimator != null) swellAnimator.cancel();
        swellAnimator = ValueAnimator.ofFloat(swell, to);
        swellAnimator.setDuration(to > 0 ? 160 : 420);
        swellAnimator.setInterpolator(Style.SPRING);
        swellAnimator.addUpdateListener(a -> {
            swell = (Float) a.getAnimatedValue();
            invalidate();
        });
        swellAnimator.start();
    }
}
