package dev.projetor.controle;

import android.animation.ArgbEvaluator;
import android.animation.ValueAnimator;
import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Paint;
import android.graphics.RectF;
import android.view.HapticFeedbackConstants;
import android.view.View;

/** The iOS switch: green capsule, white knob that slides with a spring. */
public class IosSwitch extends View {

    public interface Listener {
        void onChanged(boolean on);
    }

    private final Paint track = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint knob = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final RectF rect = new RectF();
    private final float density;
    private final ArgbEvaluator argb = new ArgbEvaluator();
    private boolean checked;
    private float t;
    private Listener listener;
    private ValueAnimator animator;

    public IosSwitch(Context context) {
        super(context);
        density = context.getResources().getDisplayMetrics().density;
        knob.setColor(0xFFFFFFFF);
        knob.setShadowLayer(3 * density, 0, 1.5f * density, 0x40000000);
        setLayerType(LAYER_TYPE_SOFTWARE, null);
        setClickable(true);
        setOnClickListener(v -> {
            setChecked(!checked, true);
            performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
            if (listener != null) listener.onChanged(checked);
        });
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    public boolean isChecked() {
        return checked;
    }

    public void setChecked(boolean on, boolean animate) {
        checked = on;
        setContentDescription(on ? "Ligado" : "Desligado");
        if (animator != null) animator.cancel();
        if (!animate) {
            t = on ? 1 : 0;
            invalidate();
            return;
        }
        animator = ValueAnimator.ofFloat(t, on ? 1 : 0);
        animator.setDuration(360);
        animator.setInterpolator(Style.SPRING);
        animator.addUpdateListener(a -> {
            t = (Float) a.getAnimatedValue();
            invalidate();
        });
        animator.start();
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        setMeasuredDimension(Math.round(55 * density), Math.round(35 * density));
    }

    @Override
    protected void onDraw(Canvas canvas) {
        float pad = 2 * density;
        rect.set(pad, pad, getWidth() - pad, getHeight() - pad);
        float r = rect.height() / 2f;
        float clamped = Math.max(0f, Math.min(1f, t));
        track.setColor((Integer) argb.evaluate(clamped, 0xFF39393D, Style.GREEN));
        canvas.drawRoundRect(rect, r, r, track);
        float k = r - 2 * density;
        float x = rect.left + r + (rect.width() - 2 * r) * t;
        canvas.drawCircle(x, rect.centerY(), k, knob);
    }
}
