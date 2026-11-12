package dev.projetor.controle.ir;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.Typeface;
import android.os.Handler;
import android.os.Looper;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;

/** Round directional pad with an OK button in the middle; arrows repeat while held. */
public class DpadView extends View {

    public interface Listener {
        /** Receives one of the {@link IrRemote} commands. */
        void onKey(int command);
    }

    private static final int NONE = -1;
    private static final int CENTER = 0;
    private static final int UP = 1;
    private static final int RIGHT = 2;
    private static final int DOWN = 3;
    private static final int LEFT = 4;
    private static final int[] COMMANDS = {
            IrRemote.OK, IrRemote.UP, IrRemote.RIGHT, IrRemote.DOWN, IrRemote.LEFT};

    private final Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint ringStroke = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint divider = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pressedFill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint chevron = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint center = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint centerPressed = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint label = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path path = new Path();
    private final RectF outer = new RectF();
    private final RectF inner = new RectF();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final float density;
    private Listener listener;
    private String centerLabel = "OK";
    private int pressed = NONE;
    private float cx;
    private float cy;
    private float radius;
    private float innerRadius;

    private final Runnable repeat = new Runnable() {
        @Override
        public void run() {
            if (pressed > CENTER) {
                fire(pressed);
                handler.postDelayed(this, 110);
            }
        }
    };

    public DpadView(Context context) {
        super(context);
        density = context.getResources().getDisplayMetrics().density;
        ringStroke.setStyle(Paint.Style.STROKE);
        ringStroke.setStrokeWidth(1.5f * density);
        ringStroke.setColor(0x22FFFFFF);
        divider.setStrokeWidth(1.5f * density);
        divider.setColor(0x14FFFFFF);
        pressedFill.setColor(0x553D8BFF);
        chevron.setStyle(Paint.Style.STROKE);
        chevron.setStrokeWidth(3.5f * density);
        chevron.setStrokeCap(Paint.Cap.ROUND);
        chevron.setStrokeJoin(Paint.Join.ROUND);
        chevron.setColor(Style.TEXT);
        centerPressed.setColor(0x33000000);
        label.setColor(0xFFFFFFFF);
        label.setTextAlign(Paint.Align.CENTER);
        label.setTypeface(Typeface.DEFAULT_BOLD);
        setHapticFeedbackEnabled(true);
        setContentDescription("Direcional");
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    public void setCenterLabel(String text) {
        centerLabel = text;
        updateLabelSize();
        invalidate();
    }

    private void updateLabelSize() {
        label.setTextSize(innerRadius * (centerLabel.length() > 2 ? 0.32f : 0.48f));
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int width = MeasureSpec.getSize(widthMeasureSpec);
        int size = Math.min(width, Math.round(300 * density));
        setMeasuredDimension(width, size);
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        cx = w / 2f;
        cy = h / 2f;
        radius = Math.min(w, h) / 2f - 4 * density;
        innerRadius = radius * 0.36f;
        outer.set(cx - radius, cy - radius, cx + radius, cy + radius);
        inner.set(cx - innerRadius, cy - innerRadius, cx + innerRadius, cy + innerRadius);
        ring.setShader(new RadialGradient(cx, cy - radius * 0.35f, radius * 1.5f,
                0xFF2B3342, 0xFF141820, Shader.TileMode.CLAMP));
        center.setShader(new LinearGradient(cx - innerRadius, cy - innerRadius, cx + innerRadius,
                cy + innerRadius, Style.ACCENT, Style.ACCENT2, Shader.TileMode.CLAMP));
        updateLabelSize();
    }

    @Override
    protected void onDraw(Canvas canvas) {
        canvas.drawCircle(cx, cy, radius, ring);
        canvas.drawCircle(cx, cy, radius, ringStroke);

        if (pressed > CENTER) {
            float mid = -90 + (pressed - 1) * 90;
            path.reset();
            path.arcTo(outer, mid - 45, 90);
            path.arcTo(inner, mid + 45, -90);
            path.close();
            canvas.drawPath(path, pressedFill);
        }

        for (int i = 0; i < 4; i++) {
            double a = Math.toRadians(45 + i * 90);
            float cos = (float) Math.cos(a);
            float sin = (float) Math.sin(a);
            float from = innerRadius + 8 * density;
            float to = radius - 10 * density;
            canvas.drawLine(cx + cos * from, cy + sin * from, cx + cos * to, cy + sin * to, divider);
        }

        float d = (radius + innerRadius) / 2f;
        float s = radius * 0.085f;
        for (int i = 0; i < 4; i++) {
            canvas.save();
            canvas.rotate(i * 90, cx, cy);
            path.reset();
            path.moveTo(cx - s, cy - d + s * 0.55f);
            path.lineTo(cx, cy - d - s * 0.55f);
            path.lineTo(cx + s, cy - d + s * 0.55f);
            chevron.setAlpha(pressed == i + 1 ? 255 : 200);
            canvas.drawPath(path, chevron);
            canvas.restore();
        }

        canvas.drawCircle(cx, cy, innerRadius, center);
        if (pressed == CENTER) canvas.drawCircle(cx, cy, innerRadius, centerPressed);
        canvas.drawText(centerLabel, cx, cy - (label.descent() + label.ascent()) / 2f, label);
    }

    @Override
    public boolean onTouchEvent(MotionEvent e) {
        switch (e.getActionMasked()) {
            case MotionEvent.ACTION_DOWN:
                int zone = zoneAt(e.getX(), e.getY());
                if (zone == NONE) return false;
                pressed = zone;
                performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                fire(zone);
                if (zone != CENTER) handler.postDelayed(repeat, 420);
                invalidate();
                return true;
            case MotionEvent.ACTION_UP:
            case MotionEvent.ACTION_CANCEL:
                handler.removeCallbacks(repeat);
                pressed = NONE;
                invalidate();
                return true;
            default:
                return true;
        }
    }

    private int zoneAt(float x, float y) {
        float dx = x - cx;
        float dy = y - cy;
        double dist = Math.hypot(dx, dy);
        if (dist > radius) return NONE;
        if (dist < innerRadius) return CENTER;
        double angle = Math.toDegrees(Math.atan2(dy, dx));
        if (angle >= -135 && angle < -45) return UP;
        if (angle >= -45 && angle < 45) return RIGHT;
        if (angle >= 45 && angle < 135) return DOWN;
        return LEFT;
    }

    private void fire(int zone) {
        if (listener != null) listener.onKey(COMMANDS[zone]);
    }
}
