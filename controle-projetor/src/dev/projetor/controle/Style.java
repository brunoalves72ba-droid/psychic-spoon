package dev.projetor.controle;

import android.content.res.ColorStateList;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.RippleDrawable;

final class Style {

    static final int BG = 0xFF0D1015;
    static final int SURFACE = 0xFF161A21;
    static final int SURFACE2 = 0xFF212732;
    static final int STROKE = 0x1FFFFFFF;
    static final int TEXT = 0xFFF1F4F8;
    static final int MUTED = 0xFF8C96A6;
    static final int ACCENT = 0xFF3D8BFF;
    static final int ACCENT2 = 0xFF6A5CFF;
    static final int GREEN = 0xFF22C55E;
    static final int GREEN2 = 0xFF15803D;
    static final int RED = 0xFFF43F5E;
    static final int RED2 = 0xFFB91C3C;
    static final int AMBER = 0xFFF5A524;

    private Style() {
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

    static GradientDrawable gradient(int from, int to, float radiusPx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[] {from, to});
        g.setCornerRadius(radiusPx);
        return g;
    }

    static GradientDrawable oval(int color) {
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(color);
        return g;
    }

    static Drawable ripple(Drawable content) {
        return new RippleDrawable(ColorStateList.valueOf(0x40FFFFFF), content, null);
    }
}
