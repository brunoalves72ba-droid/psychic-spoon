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

    // Palette taken from the wallpaper (res/drawable-nodpi/fundo.jpg): deep wine, and the rose of its
    // glowing lines as the accent. Surfaces are translucent "glass" so the wallpaper shows through.
    static final int BG = 0xFF1F0B0D;
    static final int WINE = 0xFF2E1519;
    static final int CELL = 0x1AFFFFFF;
    static final int CELL2 = 0x24FFFFFF;
    static final int CELL3 = 0x30FFFFFF;
    static final int FILL = 0x33FFFFFF;
    static final int FILL2 = 0x2BFFFFFF;
    static final int FILL3 = 0x24FFFFFF;
    static final int FILL4 = 0x1AFFFFFF;
    static final int SEPARATOR = 0x21FFFFFF;
    static final int STROKE = 0x29FFFFFF;
    static final int TEXT = 0xFFFFFFFF;
    static final int TEXT2 = 0xA8FFE6EA;
    static final int TEXT3 = 0x66FFE6EA;
    static final int MUTED = 0xFFB89CA2;
    static final int GRAY2 = 0xFF8C7076;
    /** Rose of the wallpaper's lines, lifted for contrast: selection, links, tints. */
    static final int ACCENT = 0xFFF4A9B8;
    /** Deeper rose for filled buttons with white text. */
    static final int ACCENT_FILL = 0xFFC8627B;
    // the rest of the family, for icons and status
    static final int ROSE = 0xFFE3889C;
    static final int BERRY = 0xFFC4506E;
    static final int PLUM = 0xFFA45C90;
    static final int MAUVE = 0xFFB585A8;
    static final int COPPER = 0xFFD98B6C;
    static final int GOLD = 0xFFE2B274;
    static final int GREEN = 0xFF3CCB7F;
    static final int RED = 0xFFFF5A5F;
    static final int ORANGE = 0xFFFFA24C;
    static final int AMBER = ORANGE;
    static final int YELLOW = 0xFFFFD36B;
    static final int PINK = 0xFFFF6E8E;
    static final int PURPLE = 0xFFB86BD9;
    static final int INDIGO = 0xFF8F6EDB;
    static final int TEAL = 0xFF71C7C1;

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

    /** Tab bar material: smoky wine glass with a light rim, the wallpaper faintly visible through it. */
    static Drawable glass(float radiusPx, int hairlinePx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0xB83A1E24, 0xCC1F0B0D});
        g.setCornerRadius(radiusPx);
        g.setStroke(hairlinePx, 0x38FFFFFF);
        return g;
    }

    /**
     * "Liquid glass" key: mostly transparent, a little brighter at the top, with a hairline rim,
     * so the wallpaper reads through it.
     */
    static Drawable glassKey(float radiusPx, int hairlinePx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0x2BFFFFFF, 0x0FFFFFFF});
        g.setCornerRadius(radiusPx);
        g.setStroke(hairlinePx, 0x38FFFFFF);
        return g;
    }

    static Drawable glassOval(int hairlinePx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0x2BFFFFFF, 0x0FFFFFFF});
        g.setShape(GradientDrawable.OVAL);
        g.setStroke(hairlinePx, 0x38FFFFFF);
        return g;
    }

    /** Cards and grouped cells: fainter glass than the keys, so the keys stand out. */
    static Drawable glassCard(float radiusPx, int hairlinePx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0x1FFFFFFF, 0x0DFFFFFF});
        g.setCornerRadius(radiusPx);
        g.setStroke(hairlinePx, 0x24FFFFFF);
        return g;
    }

    /** Tinted glass capsule for command pills (Ligar in green, Desligar in red...). */
    static Drawable tintedGlass(int color, int hairlinePx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {alpha(color, 0x40), alpha(color, 0x24)});
        g.setCornerRadius(999f);
        g.setStroke(hairlinePx, alpha(color, 0x66));
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
