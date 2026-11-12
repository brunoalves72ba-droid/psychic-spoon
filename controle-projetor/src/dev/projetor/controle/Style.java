package dev.projetor.controle;

import android.content.res.ColorStateList;
import android.graphics.Canvas;
import android.graphics.ColorFilter;
import android.graphics.LinearGradient;
import android.graphics.Outline;
import android.graphics.Paint;
import android.graphics.Path;
import android.graphics.PixelFormat;
import android.graphics.RadialGradient;
import android.graphics.Rect;
import android.graphics.RectF;
import android.graphics.Shader;
import android.graphics.drawable.ClipDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.LayerDrawable;
import android.graphics.drawable.RippleDrawable;
import android.view.Gravity;

final class Style {

    static final int BG = 0xFF0A0E1A;
    static final int SURFACE = 0xFF151B2B;
    static final int SURFACE2 = 0xFF1F2638;
    static final int SURFACE3 = 0xFF283147;
    static final int STROKE = 0x24FFFFFF;
    static final int TEXT = 0xFFF1F4F8;
    static final int SOFT = 0xFFD3D9E4;
    static final int MUTED = 0xFF8C96A6;
    static final int ACCENT = 0xFF3D8BFF;
    static final int ACCENT2 = 0xFF6A5CFF;
    static final int VIOLET = 0xFF8B5CF6;
    static final int PINK = 0xFFEC4899;
    static final int ORANGE = 0xFFFF8A3D;
    static final int TEAL = 0xFF14B8A6;
    static final int TEAL2 = 0xFF0E8F83;
    static final int INDIGO = 0xFF6366F1;
    static final int SKY = 0xFF0EA5E9;
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

    /** Rounded fill tinted with {@code color}, with a stronger border in the same colour. */
    static GradientDrawable tinted(int color, float radiusPx, int strokePx) {
        GradientDrawable g = rounded(alpha(color, 0x24), radiusPx);
        g.setStroke(strokePx, alpha(color, 0x55));
        return g;
    }

    static GradientDrawable gradient(int from, int to, float radiusPx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[] {from, to});
        g.setCornerRadius(radiusPx);
        return g;
    }

    /** Card body: a slight vertical gradient with a thin light border. */
    static GradientDrawable card(float radiusPx, int strokePx) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0xFF182035, 0xFF121828});
        g.setCornerRadius(radiusPx);
        g.setStroke(strokePx, STROKE);
        return g;
    }

    static GradientDrawable oval(int color) {
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(color);
        return g;
    }

    static GradientDrawable ovalGradient(int from, int to) {
        GradientDrawable g = new GradientDrawable(GradientDrawable.Orientation.TL_BR, new int[] {from, to});
        g.setShape(GradientDrawable.OVAL);
        return g;
    }

    /** App badge: gradient square with a soft light on its upper half. */
    static Drawable badge(int color, float radiusPx) {
        GradientDrawable base = gradient(lighter(color), darker(color), radiusPx);
        GradientDrawable shine = new GradientDrawable(GradientDrawable.Orientation.TOP_BOTTOM,
                new int[] {0x40FFFFFF, 0x00FFFFFF});
        shine.setCornerRadius(radiusPx);
        LayerDrawable d = new LayerDrawable(new Drawable[] {base, shine});
        d.setLayerInsetBottom(1, 0);
        return d;
    }

    /** SeekBar track: dark rail with a blue-to-violet fill. */
    static Drawable track(int heightPx) {
        GradientDrawable rail = rounded(0xFF2A3348, heightPx / 2f);
        rail.setSize(0, heightPx);
        GradientDrawable fill = new GradientDrawable(GradientDrawable.Orientation.LEFT_RIGHT,
                new int[] {ACCENT, VIOLET, PINK});
        fill.setCornerRadius(heightPx / 2f);
        fill.setSize(0, heightPx);
        LayerDrawable d = new LayerDrawable(new Drawable[] {rail,
                new ClipDrawable(fill, Gravity.START, ClipDrawable.HORIZONTAL)});
        d.setId(0, android.R.id.background);
        d.setId(1, android.R.id.progress);
        return d;
    }

    static Drawable thumb(int sizePx, int strokePx) {
        GradientDrawable t = oval(0xFFFFFFFF);
        t.setSize(sizePx, sizePx);
        t.setStroke(strokePx, ACCENT);
        return t;
    }

    static Drawable ripple(Drawable content) {
        return new RippleDrawable(ColorStateList.valueOf(0x40FFFFFF), content, null);
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

    /** Screen background: deep navy with a blue glow at the top and a violet one at the bottom. */
    static final class Backdrop extends Drawable {
        private final Paint base = new Paint();
        private final Paint glowTop = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint glowBottom = new Paint(Paint.ANTI_ALIAS_FLAG);

        @Override
        protected void onBoundsChange(Rect b) {
            base.setShader(new LinearGradient(0, b.top, 0, b.bottom, 0xFF0D1324, 0xFF080B14, Shader.TileMode.CLAMP));
            float r = Math.max(b.width(), 1) * 0.9f;
            glowTop.setShader(new RadialGradient(b.left + b.width() * 0.15f, b.top, r,
                    0x553D8BFF, 0x003D8BFF, Shader.TileMode.CLAMP));
            glowBottom.setShader(new RadialGradient(b.right, b.bottom - b.height() * 0.1f, r,
                    0x408B5CF6, 0x008B5CF6, Shader.TileMode.CLAMP));
        }

        @Override
        public void draw(Canvas c) {
            Rect b = getBounds();
            c.drawRect(b, base);
            c.drawRect(b, glowTop);
            c.drawRect(b, glowBottom);
        }

        @Override
        public void setAlpha(int alpha) {
        }

        @Override
        public void setColorFilter(ColorFilter cf) {
        }

        @Override
        public int getOpacity() {
            return PixelFormat.OPAQUE;
        }
    }

    /** Header card: blue-to-violet gradient with light decorative circles, clipped to round corners. */
    static final class Hero extends Drawable {
        private final float radius;
        private final float unit;
        private final Paint fill = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint bubble = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Path clip = new Path();
        private final RectF rect = new RectF();

        Hero(float radiusPx, float dpPx) {
            radius = radiusPx;
            unit = dpPx;
            bubble.setColor(0x1AFFFFFF);
        }

        @Override
        protected void onBoundsChange(Rect b) {
            rect.set(b);
            clip.reset();
            clip.addRoundRect(rect, radius, radius, Path.Direction.CW);
            fill.setShader(new LinearGradient(b.left, b.top, b.right, b.bottom,
                    new int[] {0xFF2563EB, 0xFF6D28D9, 0xFFBE185D}, new float[] {0f, 0.6f, 1f},
                    Shader.TileMode.CLAMP));
        }

        @Override
        public void draw(Canvas c) {
            Rect b = getBounds();
            c.save();
            c.clipPath(clip);
            c.drawRect(b, fill);
            c.drawCircle(b.right - 30 * unit, b.top + 6 * unit, 70 * unit, bubble);
            c.drawCircle(b.right + 6 * unit, b.bottom - 4 * unit, 46 * unit, bubble);
            c.drawCircle(b.left + b.width() * 0.42f, b.bottom + 24 * unit, 40 * unit, bubble);
            c.restore();
        }

        @Override
        public void getOutline(Outline outline) {
            outline.setRoundRect(getBounds(), radius);
        }

        @Override
        public void setAlpha(int alpha) {
        }

        @Override
        public void setColorFilter(ColorFilter cf) {
        }

        @Override
        public int getOpacity() {
            return PixelFormat.TRANSLUCENT;
        }
    }
}
