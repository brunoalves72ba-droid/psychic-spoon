package dev.projetor.controle;

import android.animation.TimeInterpolator;
import android.content.Context;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.StateListDrawable;
import android.view.MotionEvent;
import android.view.View;
import android.widget.TextView;

/**
 * Design system inspired by iOS in dark mode: system colours, Inter (close to SF Pro), capsules,
 * grouped cells, springy press feedback. Animations only touch transform and alpha, which the
 * render thread draws without re-layout, so they stay at 60 fps.
 */
final class Style {

    // iOS dark-mode system colours
    static final int BG = 0xFF000000;
    static final int CELL = 0xFF1C1C1E;
    static final int CELL2 = 0xFF2C2C2E;
    static final int CELL3 = 0xFF3A3A3C;
    static final int FILL = 0x5C787880;
    static final int FILL2 = 0x52787880;
    static final int FILL3 = 0x3D767680;
    static final int FILL4 = 0x2E767680;
    static final int SEPARATOR = 0xFF38383A;
    static final int STROKE = 0x1FFFFFFF;
    static final int TEXT = 0xFFFFFFFF;
    static final int TEXT2 = 0x99EBEBF5;
    static final int TEXT3 = 0x4DEBEBF5;
    static final int MUTED = 0xFF8E8E93;
    static final int GRAY2 = 0xFF636366;
    static final int BLUE = 0xFF0A84FF;
    static final int GREEN = 0xFF30D158;
    static final int RED = 0xFFFF453A;
    static final int ORANGE = 0xFFFF9F0A;
    static final int AMBER = ORANGE;
    static final int YELLOW = 0xFFFFD60A;
    static final int PINK = 0xFFFF375F;
    static final int PURPLE = 0xFFBF5AF2;
    static final int INDIGO = 0xFF5E5CE6;
    static final int TEAL = 0xFF40C8E0;
    static final int CYAN = 0xFF64D2FF;
    static final int MINT = 0xFF63E6E2;
    static final int BROWN = 0xFFAC8E68;

    static Typeface regular = Typeface.DEFAULT;
    static Typeface medium = Typeface.DEFAULT;
    static Typeface semibold = Typeface.DEFAULT_BOLD;
    static Typeface bold = Typeface.DEFAULT_BOLD;

    private Style() {
    }

    /** Loads Inter once from the APK assets; keeps the system font if that fails. */
    static void init(Context c) {
        if (regular != Typeface.DEFAULT) return;
        try {
            regular = Typeface.createFromAsset(c.getAssets(), "fonts/Inter-400Regular.ttf");
            medium = Typeface.createFromAsset(c.getAssets(), "fonts/Inter-500Medium.ttf");
            semibold = Typeface.createFromAsset(c.getAssets(), "fonts/Inter-600SemiBold.ttf");
            bold = Typeface.createFromAsset(c.getAssets(), "fonts/Inter-700Bold.ttf");
        } catch (RuntimeException e) {
            regular = Typeface.DEFAULT;
            medium = Typeface.create("sans-serif-medium", Typeface.NORMAL);
            semibold = medium;
            bold = Typeface.DEFAULT_BOLD;
        }
    }

    /** Text sizes and tracking of the iOS type ramp (Large Title, Title 2, Headline, Body, ...). */
    static void type(TextView t, float sp, Typeface face) {
        t.setTextSize(sp);
        t.setTypeface(face);
        // SF tightens large text and loosens small text; Inter needs about the same
        t.setLetterSpacing(sp >= 28 ? -0.022f : sp >= 20 ? -0.017f : sp >= 15 ? -0.01f : 0f);
        t.setIncludeFontPadding(false);
    }

    static GradientDrawable rounded(int color, float radiusPx) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(radiusPx);
        return g;
    }

    static GradientDrawable outlined(int color, float radiusPx, int strokePx) {
        GradientDrawable g = rounded(color, radiusPx);
        g.setStroke(strokePx, STROKE);
        return g;
    }

    static GradientDrawable capsule(int color) {
        return rounded(color, 999f);
    }

    static GradientDrawable oval(int color) {
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(color);
        return g;
    }

    static GradientDrawable gradient(int from, int to, float radiusPx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[] {from, to});
        g.setCornerRadius(radiusPx);
        return g;
    }

    static GradientDrawable vertical(int top, int bottom, float radiusPx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM, new int[] {top, bottom});
        g.setCornerRadius(radiusPx);
        return g;
    }

    /** Frosted "material" like the iOS tab bar: dark translucent fill with a hairline highlight. */
    static Drawable glass(float radiusPx, int hairlinePx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0xF22A2A2E, 0xF21C1C1E});
        g.setCornerRadius(radiusPx);
        g.setStroke(hairlinePx, 0x29FFFFFF);
        return g;
    }

    /** App icon "squircle": iOS uses a continuous curve; a 22.5% corner radius reads the same at this size. */
    static Drawable appIcon(int color, float sizePx) {
        GradientDrawable base = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {mix(color, 0xFFFFFFFF, 0.12f), mix(color, 0xFF000000, 0.18f)});
        base.setCornerRadius(sizePx * 0.225f);
        GradientDrawable shine = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0x2EFFFFFF, 0x00FFFFFF});
        shine.setCornerRadius(sizePx * 0.225f);
        LayerDrawable d = new LayerDrawable(new Drawable[] {base, shine});
        d.setLayerInset(1, 0, 0, 0, Math.round(sizePx * 0.45f));
        return d;
    }

    /** Settings-row background: no ripple, the row darkens while pressed, as on iOS. */
    static Drawable rowBackground() {
        StateListDrawable s = new StateListDrawable();
        s.addState(new int[] {android.R.attr.state_pressed}, new ColorDrawable(CELL3));
        s.addState(new int[] {}, new ColorDrawable(0x00000000));
        s.setExitFadeDuration(220);
        return s;
    }

    static ColorStateList tint(int color) {
        return ColorStateList.valueOf(color);
    }

    static int alpha(int color, int alpha) {
        return (color & 0x00FFFFFF) | (alpha << 24);
    }

    static int darker(int color) {
        return mix(color, 0xFF000000, 0.3f);
    }

    static int lighter(int color) {
        return mix(color, 0xFFFFFFFF, 0.15f);
    }

    static int mix(int a, int b, float t) {
        int r = Math.round(((a >> 16) & 0xff) * (1 - t) + ((b >> 16) & 0xff) * t);
        int g = Math.round(((a >> 8) & 0xff) * (1 - t) + ((b >> 8) & 0xff) * t);
        int bl = Math.round((a & 0xff) * (1 - t) + (b & 0xff) * t);
        return 0xFF000000 | (r << 16) | (g << 8) | bl;
    }

    /**
     * Damped spring, like UIKit's default (damping ratio 0.8): settles with a hint of overshoot.
     * Normalised so the curve reaches 1 at t = 1.
     */
    static final class Spring implements TimeInterpolator {
        private final float zeta;
        private final float omega;

        Spring(float dampingRatio, float stiffness) {
            zeta = dampingRatio;
            omega = stiffness;
        }

        @Override
        public float getInterpolation(float t) {
            if (t >= 1f) return 1f;
            double wd = omega * Math.sqrt(1 - zeta * zeta);
            double e = Math.exp(-zeta * omega * t);
            return (float) (1 - e * (Math.cos(wd * t) + (zeta * omega / wd) * Math.sin(wd * t)));
        }
    }

    static final TimeInterpolator SPRING = new Spring(0.78f, 13f);
    static final TimeInterpolator SPRING_SOFT = new Spring(0.9f, 10f);

    /**
     * iOS press feedback: the control shrinks a little while touched and springs back. Observes the
     * touch only, so clicks still go through the normal click listener.
     */
    static void press(View v, final float scale) {
        v.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View view, MotionEvent e) {
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        view.animate().scaleX(scale).scaleY(scale).alpha(0.85f).setDuration(110)
                                .setInterpolator(SPRING_SOFT).start();
                        break;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        view.animate().scaleX(1f).scaleY(1f).alpha(1f).setDuration(420).setInterpolator(SPRING).start();
                        break;
                    default:
                        break;
                }
                return false;
            }
        });
    }
}
