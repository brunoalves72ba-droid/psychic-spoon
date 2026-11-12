package dev.projetor.controle;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.LinearGradient;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.RadialGradient;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.SweepGradient;
import android.graphics.Typeface;
import android.os.Handler;
import android.os.Looper;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;

/** Round directional pad with a glowing rim and an OK button in the middle; arrows repeat while held. */
public class DpadView extends View {

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

    private final Paint halo = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint ring = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint ringStroke = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint groove = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint stud = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint pressedFill = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint chevron = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint center = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint centerRim = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint shine = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint centerPressed = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Paint label = new Paint(Paint.ANTI_ALIAS_FLAG);
    private final Path path = new Path();
    private final RectF outer = new RectF();
    private final RectF inner = new RectF();
    private final RectF shineOval = new RectF();
    private final Handler handler = new Handler(Looper.getMainLooper());
    private final float density;
    private Listener listener;
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
        ringStroke.setStrokeWidth(3f * density);
        groove.setStyle(Paint.Style.STROKE);
        groove.setStrokeWidth(7f * density);
        groove.setColor(0xFF0B0F1C);
        stud.setColor(0x553D8BFF);
        chevron.setStyle(Paint.Style.STROKE);
        chevron.setStrokeWidth(4f * density);
        chevron.setStrokeCap(Paint.Cap.ROUND);
        chevron.setStrokeJoin(Paint.Join.ROUND);
        chevron.setColor(Style.TEXT);
        centerRim.setStyle(Paint.Style.STROKE);
        centerRim.setStrokeWidth(2f * density);
        centerRim.setColor(0x66FFFFFF);
        centerPressed.setColor(0x40000000);
        label.setColor(0xFFFFFFFF);
        label.setTextAlign(Paint.Align.CENTER);
        label.setTypeface(Typeface.DEFAULT_BOLD);
        setHapticFeedbackEnabled(true);
        setContentDescription("Direcional");
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    @Override
    protected void onMeasure(int widthMeasureSpec, int heightMeasureSpec) {
        int width = MeasureSpec.getSize(widthMeasureSpec);
        int size = Math.min(width, Math.round(320 * density));
        setMeasuredDimension(width, size);
    }

    @Override
    protected void onSizeChanged(int w, int h, int oldw, int oldh) {
        cx = w / 2f;
        cy = h / 2f;
        radius = Math.min(w, h) / 2f - 18 * density;
        innerRadius = radius * 0.36f;
        outer.set(cx - radius, cy - radius, cx + radius, cy + radius);
        inner.set(cx - innerRadius, cy - innerRadius, cx + innerRadius, cy + innerRadius);
        float haloR = radius + 18 * density;
        halo.setShader(new RadialGradient(cx, cy, haloR,
                new int[] {0x003D8BFF, 0x003D8BFF, 0x663D8BFF, 0x008B5CF6},
                new float[] {0f, (radius - 6 * density) / haloR, radius / haloR, 1f}, Shader.TileMode.CLAMP));
        ring.setShader(new RadialGradient(cx, cy - radius * 0.45f, radius * 1.6f,
                0xFF34405E, 0xFF10141F, Shader.TileMode.CLAMP));
        ringStroke.setShader(new SweepGradient(cx, cy,
                new int[] {Style.ACCENT, Style.VIOLET, Style.PINK, Style.TEAL, Style.ACCENT}, null));
        pressedFill.setShader(new RadialGradient(cx, cy, radius,
                new int[] {0x003D8BFF, 0x553D8BFF, 0x998B5CF6}, new float[] {0f, 0.45f, 1f}, Shader.TileMode.CLAMP));
        center.setShader(new LinearGradient(cx - innerRadius, cy - innerRadius, cx + innerRadius,
                cy + innerRadius, new int[] {0xFF4C9BFF, Style.ACCENT2, 0xFF9B4DFF}, null, Shader.TileMode.CLAMP));
        shineOval.set(cx - innerRadius * 0.72f, cy - innerRadius * 0.9f, cx + innerRadius * 0.72f, cy - innerRadius * 0.05f);
        shine.setShader(new LinearGradient(0, shineOval.top, 0, shineOval.bottom, 0x55FFFFFF, 0x00FFFFFF,
                Shader.TileMode.CLAMP));
        label.setTextSize(innerRadius * 0.46f);
    }

    @Override
    protected void onDraw(Canvas canvas) {
        canvas.drawCircle(cx, cy, radius + 18 * density, halo);
        canvas.drawCircle(cx, cy, radius, ring);

        if (pressed > CENTER) {
            float mid = -90 + (pressed - 1) * 90;
            path.reset();
            path.arcTo(outer, mid - 45, 90);
            path.arcTo(inner, mid + 45, -90);
            path.close();
            canvas.drawPath(path, pressedFill);
        }
        canvas.drawCircle(cx, cy, radius - 1.5f * density, ringStroke);
        canvas.drawCircle(cx, cy, innerRadius + 5 * density, groove);

        for (int i = 0; i < 4; i++) {
            double a = Math.toRadians(45 + i * 90);
            float d = (radius + innerRadius) / 2f + radius * 0.06f;
            canvas.drawCircle(cx + (float) Math.cos(a) * d, cy + (float) Math.sin(a) * d, 3.2f * density, stud);
        }

        float d = (radius + innerRadius) / 2f + radius * 0.02f;
        float s = radius * 0.09f;
        for (int i = 0; i < 4; i++) {
            canvas.save();
            canvas.rotate(i * 90, cx, cy);
            path.reset();
            path.moveTo(cx - s, cy - d + s * 0.55f);
            path.lineTo(cx, cy - d - s * 0.55f);
            path.lineTo(cx + s, cy - d + s * 0.55f);
            chevron.setColor(pressed == i + 1 ? 0xFFFFFFFF : 0xFFC9D3E6);
            canvas.drawPath(path, chevron);
            canvas.restore();
        }

        canvas.drawCircle(cx, cy, innerRadius, center);
        canvas.drawOval(shineOval, shine);
        canvas.drawCircle(cx, cy, innerRadius - 1f * density, centerRim);
        if (pressed == CENTER) canvas.drawCircle(cx, cy, innerRadius, centerPressed);
        canvas.drawText("OK", cx, cy - (label.descent() + label.ascent()) / 2f, label);
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
        if (listener != null) listener.onKey(KEYCODES[zone]);
    }
}
