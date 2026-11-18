package dev.projetor.controle;

import android.animation.ValueAnimator;
import android.content.Context;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;

/**
 * Floating capsule tab bar, as in iOS 26: a frosted pill with the selected tab marked by a lighter
 * pill that slides over with a spring. The slide only changes translationX, so it never relayouts.
 */
public class PillTabBar extends FrameLayout {

    public interface Listener {
        void onSelect(int index);
    }

    private final View indicator;
    private final LinearLayout row;
    private final ImageView[] icons;
    private final TextView[] labels;
    private final float density;
    private Listener listener;
    private int selected = -1;
    private ValueAnimator slide;

    public PillTabBar(Context context, String[] names, int[] iconRes, int heightDp) {
        super(context);
        density = context.getResources().getDisplayMetrics().density;
        int pad = dp(5);
        setPadding(pad, pad, pad, pad);
        setBackground(Style.glass(999f, Math.max(1, dp(0.6f))));
        setElevation(dp(14));

        indicator = new View(context);
        indicator.setBackground(Style.capsule(0x33FFFFFF));
        addView(indicator, new LayoutParams(0, dp(heightDp - 10)));

        row = new LinearLayout(context);
        addView(row, new LayoutParams(LayoutParams.MATCH_PARENT, dp(heightDp - 10)));
        icons = new ImageView[names.length];
        labels = new TextView[names.length];
        for (int i = 0; i < names.length; i++) {
            final int index = i;
            LinearLayout tab = new LinearLayout(context);
            tab.setOrientation(LinearLayout.VERTICAL);
            tab.setGravity(Gravity.CENTER);
            tab.setContentDescription(names[i]);
            ImageView icon = new ImageView(context);
            icon.setImageResource(iconRes[i]);
            tab.addView(icon, new LinearLayout.LayoutParams(dp(22), dp(22)));
            TextView label = new TextView(context);
            label.setText(names[i]);
            Style.type(label, 10.5f, Style.semibold);
            label.setPadding(0, dp(3), 0, 0);
            label.setMaxLines(1);
            label.setGravity(Gravity.CENTER);
            tab.addView(label, new LinearLayout.LayoutParams(LinearLayout.LayoutParams.WRAP_CONTENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT));
            tab.setOnClickListener(v -> {
                if (index != selected) v.performHapticFeedback(HapticFeedbackConstants.CLOCK_TICK);
                select(index, true);
                if (listener != null) listener.onSelect(index);
            });
            Style.press(tab, 0.9f);
            icons[i] = icon;
            labels[i] = label;
            row.addView(tab, new LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.MATCH_PARENT, 1f));
        }
    }

    public void setListener(Listener listener) {
        this.listener = listener;
    }

    public void select(int index, boolean animate) {
        if (index < 0 || index >= icons.length) return;
        selected = index;
        for (int i = 0; i < icons.length; i++) {
            int color = i == index ? Style.BLUE : 0xFFEBEBF5;
            icons[i].setImageTintList(Style.tint(color));
            labels[i].setTextColor(i == index ? Style.BLUE : 0xCCEBEBF5);
        }
        float target = targetX();
        if (target < 0) return;
        if (slide != null) slide.cancel();
        if (!animate || !isLaidOut()) {
            indicator.setTranslationX(target);
            return;
        }
        slide = ValueAnimator.ofFloat(indicator.getTranslationX(), target);
        slide.setDuration(520);
        slide.setInterpolator(Style.SPRING);
        slide.addUpdateListener(a -> indicator.setTranslationX((Float) a.getAnimatedValue()));
        slide.start();
        // a little squash on the way, like the iOS 26 tab bar
        indicator.animate().scaleY(0.88f).setDuration(120).withEndAction(() ->
                indicator.animate().scaleY(1f).setDuration(380).setInterpolator(Style.SPRING).start()).start();
    }

    private float targetX() {
        if (selected < 0 || row.getChildCount() == 0 || row.getWidth() == 0) return -1;
        return row.getChildAt(selected).getLeft();
    }

    @Override
    protected void onLayout(boolean changed, int left, int top, int right, int bottom) {
        super.onLayout(changed, left, top, right, bottom);
        if (row.getChildCount() == 0) return;
        int w = row.getChildAt(0).getWidth();
        indicator.layout(getPaddingLeft(), getPaddingTop(), getPaddingLeft() + w, getPaddingTop() + row.getHeight());
        if (slide == null || !slide.isRunning()) {
            float target = targetX();
            if (target >= 0) indicator.setTranslationX(target);
        }
    }

    private int dp(float v) {
        return Math.round(v * density);
    }
}
