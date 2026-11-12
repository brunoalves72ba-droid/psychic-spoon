package dev.projetor.controle.ir;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.SharedPreferences;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.text.TextUtils;
import android.view.Gravity;
import android.view.HapticFeedbackConstants;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

/** Remote control for the HY300 projector that talks only through the phone's infrared emitter. */
public class MainActivity extends Activity implements IrRemote.Listener {

    private static final String[] TAB_NAMES = {"Controle", "Mouse", "Mais"};
    private static final int[] TAB_ICONS = {R.drawable.ic_dpad, R.drawable.ic_mouse, R.drawable.ic_more};
    private static final int REPEAT_DELAY_MS = 420;
    private static final int REPEAT_EVERY_MS = 160;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private final View[] pages = new View[3];
    private final LinearLayout[] tabs = new LinearLayout[3];

    private SharedPreferences prefs;
    private IrRemote remote;
    private View statusDot;
    private TextView statusText;
    private int idleColor;
    private boolean errorShown;
    private AlertDialog noInfraredDialog;

    private final Runnable endFlash = new Runnable() {
        @Override
        public void run() {
            statusDot.setBackground(Style.oval(idleColor));
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        prefs = getSharedPreferences("controle", MODE_PRIVATE);
        remote = new IrRemote(this, this);
        getWindow().setBackgroundDrawable(new ColorDrawable(Style.BG));
        getWindow().setStatusBarColor(Color.TRANSPARENT);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
        getWindow().getDecorView().setSystemUiVisibility(View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION);
        setContentView(buildUi());
        selectTab(prefs.getInt("tab", 0));
        showIdleStatus();
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
        remote.close();
    }

    // ---------------------------------------------------------------- infrared

    private void press(int command) {
        if (!remote.isAvailable()) {
            showNoInfrared();
            return;
        }
        remote.send(command);
    }

    private Runnable command(final int command) {
        return new Runnable() {
            @Override
            public void run() {
                press(command);
            }
        };
    }

    @Override
    public void onSent() {
        if (errorShown) showIdleStatus();
        statusDot.setBackground(Style.oval(Style.AMBER));
        handler.removeCallbacks(endFlash);
        handler.postDelayed(endFlash, 140);
    }

    @Override
    public void onError(String message) {
        setStatus("O infravermelho falhou: " + message, Style.RED);
        errorShown = true;
    }

    private void showIdleStatus() {
        errorShown = false;
        if (remote.isAvailable()) setStatus("Pronto · aponte o celular para o projetor", Style.GREEN);
        else setStatus("Este celular não tem infravermelho", Style.RED);
    }

    private void setStatus(String text, int color) {
        idleColor = color;
        statusText.setText(text);
        statusDot.setBackground(Style.oval(color));
    }

    private void showNoInfrared() {
        if (noInfraredDialog != null && noInfraredDialog.isShowing()) return;
        noInfraredDialog = new AlertDialog.Builder(this, android.R.style.Theme_Material_Dialog_Alert)
                .setTitle("Sem infravermelho")
                .setMessage("Não encontrei um emissor infravermelho neste celular, então o app não consegue "
                        + "mandar comandos. Use o controle original do projetor.")
                .setPositiveButton("OK", null)
                .show();
    }

    // ---------------------------------------------------------------- UI

    private View buildUi() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Style.BG);
        root.setOnApplyWindowInsetsListener(new View.OnApplyWindowInsetsListener() {
            @Override
            public WindowInsets onApplyWindowInsets(View v, WindowInsets insets) {
                v.setPadding(insets.getSystemWindowInsetLeft(), insets.getSystemWindowInsetTop(),
                        insets.getSystemWindowInsetRight(), insets.getSystemWindowInsetBottom());
                return insets;
            }
        });

        root.addView(buildHeader(), matchWrap(dp(16), dp(10), dp(16), 0));
        root.addView(buildPowerRow(), matchWrap(dp(12), dp(14), dp(12), 0));
        root.addView(buildTabs(), matchWrap(dp(16), dp(14), dp(16), dp(6)));

        FrameLayout content = new FrameLayout(this);
        pages[0] = scrolling(buildControlPage());
        pages[1] = scrolling(buildMousePage());
        pages[2] = scrolling(buildMorePage());
        for (View p : pages) content.addView(p, new FrameLayout.LayoutParams(-1, -1));
        root.addView(content, new LinearLayout.LayoutParams(-1, 0, 1f));
        return root;
    }

    private View buildHeader() {
        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);

        LinearLayout titles = new LinearLayout(this);
        titles.setOrientation(LinearLayout.VERTICAL);
        titles.addView(text("Projetor HY300", 23, Style.TEXT, true));
        LinearLayout statusRow = new LinearLayout(this);
        statusRow.setGravity(Gravity.CENTER_VERTICAL);
        statusDot = new View(this);
        statusRow.addView(statusDot, new LinearLayout.LayoutParams(dp(8), dp(8)));
        statusText = text("", 13, Style.MUTED, false);
        statusText.setMaxLines(2);
        statusText.setEllipsize(TextUtils.TruncateAt.END);
        LinearLayout.LayoutParams stp = new LinearLayout.LayoutParams(-2, -2);
        stp.leftMargin = dp(7);
        statusRow.addView(statusText, stp);
        LinearLayout.LayoutParams srp = new LinearLayout.LayoutParams(-2, -2);
        srp.topMargin = dp(3);
        titles.addView(statusRow, srp);
        header.addView(titles, new LinearLayout.LayoutParams(0, -2, 1f));

        header.addView(roundButton(R.drawable.ic_ir, 46, Style.ripple(Style.oval(Style.SURFACE2)),
                Style.TEXT, "Como usar", new Runnable() {
                    @Override
                    public void run() {
                        selectTab(2);
                    }
                }, false));
        return header;
    }

    private View buildPowerRow() {
        LinearLayout column = new LinearLayout(this);
        column.setOrientation(LinearLayout.VERTICAL);
        LinearLayout power = pill(R.drawable.ic_power, "Ligar / Desligar",
                Style.ripple(Style.gradient(Style.RED, Style.RED2, dp(18))), command(IrRemote.POWER));
        column.addView(power, matchWrap(dp(4), 0, dp(4), 0));
        TextView hint = text("Ao desligar, o projetor mostra um menu na tela: escolha com as setas e OK.",
                12, Style.MUTED, false);
        hint.setGravity(Gravity.CENTER);
        column.addView(hint, matchWrap(dp(8), dp(6), dp(8), 0));
        return column;
    }

    private View buildTabs() {
        LinearLayout bar = new LinearLayout(this);
        bar.setBackground(Style.outlined(Style.SURFACE, dp(20), dp(1)));
        bar.setPadding(dp(4), dp(4), dp(4), dp(4));
        for (int i = 0; i < tabs.length; i++) {
            final int index = i;
            LinearLayout tab = new LinearLayout(this);
            tab.setOrientation(LinearLayout.VERTICAL);
            tab.setGravity(Gravity.CENTER);
            tab.setPadding(0, dp(7), 0, dp(7));
            ImageView icon = new ImageView(this);
            icon.setImageResource(TAB_ICONS[i]);
            tab.addView(icon, new LinearLayout.LayoutParams(dp(21), dp(21)));
            TextView label = text(TAB_NAMES[i], 11.5f, Style.MUTED, true);
            label.setGravity(Gravity.CENTER);
            label.setPadding(0, dp(3), 0, 0);
            tab.addView(label);
            tab.setOnClickListener(new View.OnClickListener() {
                @Override
                public void onClick(View v) {
                    v.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                    selectTab(index);
                }
            });
            tabs[i] = tab;
            bar.addView(tab, new LinearLayout.LayoutParams(0, -2, 1f));
        }
        return bar;
    }

    private void selectTab(int index) {
        if (index < 0 || index >= pages.length) index = 0;
        for (int i = 0; i < pages.length; i++) {
            boolean on = i == index;
            pages[i].setVisibility(on ? View.VISIBLE : View.GONE);
            tabs[i].setBackground(on ? Style.gradient(Style.ACCENT, Style.ACCENT2, dp(16)) : null);
            int color = on ? 0xFFFFFFFF : Style.MUTED;
            ((ImageView) tabs[i].getChildAt(0)).setImageTintList(ColorStateList.valueOf(color));
            ((TextView) tabs[i].getChildAt(1)).setTextColor(color);
        }
        prefs.edit().putInt("tab", index).apply();
    }

    private View buildControlPage() {
        LinearLayout page = page();
        page.addView(navRow(), matchWrap(0, dp(4), 0, 0));

        DpadView dpad = new DpadView(this);
        dpad.setListener(new DpadView.Listener() {
            @Override
            public void onKey(int command) {
                press(command);
            }
        });
        page.addView(dpad, matchWrap(dp(8), dp(14), dp(8), 0));

        LinearLayout vol = card(page, "Volume");
        LinearLayout volButtons = new LinearLayout(this);
        volButtons.setGravity(Gravity.CENTER_VERTICAL);
        volButtons.addView(roundButton(R.drawable.ic_volume_down, 56, Style.ripple(Style.oval(Style.SURFACE2)),
                Style.TEXT, "Diminuir volume", command(IrRemote.VOLUME_DOWN), true),
                new LinearLayout.LayoutParams(-2, -2));
        LinearLayout mute = pill(R.drawable.ic_volume_off, "Sem som",
                Style.ripple(Style.rounded(Style.SURFACE2, dp(28))), command(IrRemote.MUTE));
        ((TextView) mute.getChildAt(1)).setTextSize(14);
        LinearLayout.LayoutParams mp = new LinearLayout.LayoutParams(0, dp(56), 1f);
        mp.setMargins(dp(10), 0, dp(10), 0);
        volButtons.addView(mute, mp);
        volButtons.addView(roundButton(R.drawable.ic_volume_up, 56, Style.ripple(Style.oval(Style.SURFACE2)),
                Style.TEXT, "Aumentar volume", command(IrRemote.VOLUME_UP), true),
                new LinearLayout.LayoutParams(-2, -2));
        vol.addView(volButtons);
        TextView volHint = text("Segure − ou + para mudar o volume rápido.", 12, Style.MUTED, false);
        volHint.setPadding(dp(2), dp(10), dp(2), 0);
        vol.addView(volHint);
        return page;
    }

    private View navRow() {
        LinearLayout nav = new LinearLayout(this);
        nav.setGravity(Gravity.CENTER);
        nav.addView(labeled(roundButton(R.drawable.ic_back, 58, Style.ripple(Style.oval(Style.SURFACE2)), Style.TEXT,
                "Voltar", command(IrRemote.BACK), false), "Voltar"), weighted(0));
        nav.addView(labeled(roundButton(R.drawable.ic_home, 72,
                Style.ripple(Style.gradient(Style.ACCENT, Style.ACCENT2, dp(36))), 0xFFFFFFFF,
                "Início", command(IrRemote.HOME), false), "Início"), weighted(0));
        nav.addView(labeled(roundButton(R.drawable.ic_menu, 58, Style.ripple(Style.oval(Style.SURFACE2)), Style.TEXT,
                "Opções", command(IrRemote.OPTIONS), false), "Opções"), weighted(0));
        return nav;
    }

    private View buildMousePage() {
        LinearLayout page = page();

        LinearLayout mode = card(page, "Modo mouse");
        LinearLayout toggle = pill(R.drawable.ic_mouse, "Ligar / desligar a seta",
                Style.ripple(Style.gradient(Style.ACCENT, Style.ACCENT2, dp(18))), command(IrRemote.MOUSE));
        mode.addView(toggle, matchWrap(0, 0, 0, 0));
        TextView hint = text("Toque uma vez e aparece uma seta na tela do projetor. As setas abaixo movem a seta "
                + "(segure para andar mais) e o botão do meio clica. Toque de novo para voltar ao normal.",
                12.5f, Style.MUTED, false);
        hint.setPadding(dp(2), dp(10), dp(2), 0);
        mode.addView(hint);

        DpadView dpad = new DpadView(this);
        dpad.setCenterLabel("Clique");
        dpad.setListener(new DpadView.Listener() {
            @Override
            public void onKey(int command) {
                press(command);
            }
        });
        page.addView(dpad, matchWrap(dp(8), dp(16), dp(8), 0));

        LinearLayout row = new LinearLayout(this);
        row.addView(pill(R.drawable.ic_back, "Voltar", Style.ripple(Style.rounded(Style.SURFACE2, dp(18))),
                command(IrRemote.BACK)), weighted(dp(4)));
        row.addView(pill(R.drawable.ic_home, "Início", Style.ripple(Style.gradient(Style.ACCENT, Style.ACCENT2, dp(18))),
                command(IrRemote.HOME)), weighted(dp(4)));
        page.addView(row, matchWrap(-dp(4), dp(12), -dp(4), 0));
        return page;
    }

    private View buildMorePage() {
        LinearLayout page = page();

        LinearLayout mirror = card(page, "Espelhar a tela");
        LinearLayout row = new LinearLayout(this);
        row.addView(tile(R.drawable.ic_cast, "Espelhar\n(Android)", Style.ACCENT, command(IrRemote.MIRACAST)),
                weighted(dp(4)));
        row.addView(tile(R.drawable.ic_airplay, "AirPlay\n(iPhone)", Style.ACCENT2, command(IrRemote.AIRPLAY)),
                weighted(dp(4)));
        mirror.addView(row, matchWrap(-dp(4), 0, -dp(4), 0));
        TextView mirrorHint = text("Abrem as telas de espelhamento do projetor, como os botões do controle original.",
                12, Style.MUTED, false);
        mirrorHint.setPadding(dp(2), dp(8), dp(2), 0);
        mirror.addView(mirrorHint);

        LinearLayout how = card(page, "Como usar");
        String irState = remote.isAvailable()
                ? "Infravermelho deste celular: disponível."
                : "Infravermelho deste celular: não encontrado. Use o controle original.";
        TextView info = text("Este app funciona como o controle original: manda os comandos pelo infravermelho "
                + "do celular. Não precisa de Wi-Fi nem da depuração USB (ADB). Se quiser, pode desligar a "
                + "depuração no projetor.\n\n"
                + "Aponte a ponta de cima do celular, onde fica o emissor, para a frente do projetor, a até uns "
                + "5 metros e sem nada no caminho.\n\n"
                + irState, 13, Style.TEXT, false);
        info.setLineSpacing(dp(2), 1f);
        how.addView(info);
        TextView codes = text("Códigos: protocolo NEC, endereço 0x00, os mesmos do controle do HY300.",
                11.5f, Style.MUTED, false);
        codes.setPadding(0, dp(10), 0, 0);
        how.addView(codes);
        return page;
    }

    // ---------------------------------------------------------------- view helpers

    private LinearLayout page() {
        LinearLayout page = new LinearLayout(this);
        page.setOrientation(LinearLayout.VERTICAL);
        page.setPadding(dp(14), dp(8), dp(14), dp(24));
        return page;
    }

    private ScrollView scrolling(View content) {
        ScrollView s = new ScrollView(this);
        s.setFillViewport(true);
        s.setVerticalScrollBarEnabled(false);
        s.addView(content);
        return s;
    }

    /** Rounded card with a title row (index 0). */
    private LinearLayout card(LinearLayout parent, String title) {
        LinearLayout c = new LinearLayout(this);
        c.setOrientation(LinearLayout.VERTICAL);
        c.setBackground(Style.outlined(Style.SURFACE, dp(22), dp(1)));
        c.setPadding(dp(14), dp(12), dp(14), dp(14));
        LinearLayout header = new LinearLayout(this);
        header.setGravity(Gravity.CENTER_VERTICAL);
        TextView t = text(title.toUpperCase(), 12, Style.MUTED, true);
        t.setLetterSpacing(0.1f);
        header.addView(t, new LinearLayout.LayoutParams(0, -2, 1f));
        c.addView(header, matchWrap(dp(2), 0, dp(2), dp(8)));
        parent.addView(c, matchWrap(0, dp(16), 0, 0));
        return c;
    }

    /** Round icon button; with {@code repeat} the action runs again while the finger stays down. */
    private View roundButton(int icon, int sizeDp, Drawable background, int tint, String description,
                             Runnable action, boolean repeat) {
        FrameLayout b = new FrameLayout(this);
        b.setBackground(background);
        b.setContentDescription(description);
        b.setElevation(dp(3));
        ImageView i = new ImageView(this);
        i.setImageResource(icon);
        i.setImageTintList(ColorStateList.valueOf(tint));
        int iconSize = Math.round(sizeDp * 0.42f);
        b.addView(i, new FrameLayout.LayoutParams(dp(iconSize), dp(iconSize), Gravity.CENTER));
        if (repeat) onPressRepeating(b, action);
        else onTap(b, action);
        FrameLayout wrap = new FrameLayout(this);
        wrap.addView(b, new FrameLayout.LayoutParams(dp(sizeDp), dp(sizeDp), Gravity.CENTER));
        return wrap;
    }

    private View labeled(View button, String label) {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setGravity(Gravity.CENTER_HORIZONTAL);
        l.addView(button);
        TextView t = text(label, 12, Style.MUTED, false);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, dp(6), 0, 0);
        l.addView(t);
        return l;
    }

    private LinearLayout pill(int icon, String label, Drawable background, Runnable action) {
        LinearLayout p = new LinearLayout(this);
        p.setGravity(Gravity.CENTER);
        p.setBackground(background);
        p.setMinimumHeight(dp(56));
        p.setPadding(dp(12), dp(14), dp(12), dp(14));
        ImageView i = new ImageView(this);
        i.setImageResource(icon);
        i.setImageTintList(ColorStateList.valueOf(0xFFFFFFFF));
        LinearLayout.LayoutParams ip = new LinearLayout.LayoutParams(dp(22), dp(22));
        ip.rightMargin = dp(8);
        p.addView(i, ip);
        p.addView(text(label, 16, 0xFFFFFFFF, true));
        onTap(p, action);
        return p;
    }

    private View tile(int icon, String label, int color, Runnable action) {
        LinearLayout t = new LinearLayout(this);
        t.setOrientation(LinearLayout.VERTICAL);
        t.setGravity(Gravity.CENTER);
        t.setPadding(dp(6), dp(14), dp(6), dp(12));
        t.setBackground(Style.ripple(Style.rounded(Style.SURFACE2, dp(18))));
        FrameLayout bubble = new FrameLayout(this);
        bubble.setBackground(Style.oval((color & 0x00FFFFFF) | 0x33000000));
        ImageView i = new ImageView(this);
        i.setImageResource(icon);
        i.setImageTintList(ColorStateList.valueOf(color));
        bubble.addView(i, new FrameLayout.LayoutParams(dp(22), dp(22), Gravity.CENTER));
        t.addView(bubble, new LinearLayout.LayoutParams(dp(42), dp(42)));
        TextView l = text(label, 12.5f, Style.TEXT, false);
        l.setGravity(Gravity.CENTER);
        l.setMaxLines(2);
        l.setPadding(0, dp(7), 0, 0);
        t.addView(l);
        onTap(t, action);
        return t;
    }

    private void onTap(View v, final Runnable action) {
        v.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                action.run();
            }
        });
    }

    private void onPressRepeating(View v, final Runnable action) {
        final Runnable again = new Runnable() {
            @Override
            public void run() {
                action.run();
                handler.postDelayed(this, REPEAT_EVERY_MS);
            }
        };
        v.setClickable(true);
        v.setOnTouchListener(new View.OnTouchListener() {
            @Override
            public boolean onTouch(View view, MotionEvent e) {
                switch (e.getActionMasked()) {
                    case MotionEvent.ACTION_DOWN:
                        view.setPressed(true);
                        view.performHapticFeedback(HapticFeedbackConstants.VIRTUAL_KEY);
                        action.run();
                        handler.postDelayed(again, REPEAT_DELAY_MS);
                        return true;
                    case MotionEvent.ACTION_UP:
                    case MotionEvent.ACTION_CANCEL:
                        view.setPressed(false);
                        handler.removeCallbacks(again);
                        return true;
                    default:
                        return true;
                }
            }
        });
    }

    private TextView text(String s, float sp, int color, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        if (bold) t.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        return t;
    }

    private LinearLayout.LayoutParams weighted(int margin) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp.setMargins(margin, margin, margin, margin);
        return lp;
    }

    private LinearLayout.LayoutParams matchWrap(int left, int top, int right, int bottom) {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(-1, -2);
        lp.setMargins(left, top, right, bottom);
        return lp;
    }

    private int dp(float v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
