package dev.projetor.receptor;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.graphics.drawable.ColorDrawable;
import android.graphics.drawable.Drawable;
import android.graphics.drawable.GradientDrawable;
import android.graphics.drawable.StateListDrawable;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.os.Bundle;
import android.provider.Settings;
import android.view.Gravity;
import android.view.View;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;
import java.net.Inet4Address;
import java.util.HashSet;

/** Screen on the projector: tells whether the receiver is on and opens the accessibility settings. */
public class MainActivity extends Activity {

    private static final int BG = 0xFF0A0E1A;
    private static final int GREEN = 0xFF22C55E;
    private static final int RED = 0xFFF43F5E;

    private TextView status;
    private View dot;
    private TextView details;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setBackgroundDrawable(new ColorDrawable(BG));
        setContentView(build());
    }

    @Override
    protected void onResume() {
        super.onResume();
        boolean on = enabled();
        status.setText(on ? "Receptor ligado" : "Receptor desligado");
        dot.setBackground(oval(on ? GREEN : RED));
        int phones = getSharedPreferences("receptor", MODE_PRIVATE).getStringSet("tokens", new HashSet<String>()).size();
        String ip = ip();
        details.setText((on
                ? "O celular encontra este projetor sozinho pelo Wi-Fi" + (ip != null ? " (" + ip + ")" : "") + ". "
                + (phones == 0 ? "Nenhum celular pareado ainda." : phones == 1 ? "1 celular pareado." : phones + " celulares pareados.")
                : "Ative o \"Receptor do Controle\" na Acessibilidade para o celular controlar o projetor sem a depuração."));
    }

    private boolean enabled() {
        String list = Settings.Secure.getString(getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        return list != null && list.contains(getPackageName() + "/");
    }

    private View build() {
        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setGravity(Gravity.CENTER);
        root.setPadding(dp(48), dp(32), dp(48), dp(32));

        LinearLayout card = new LinearLayout(this);
        card.setOrientation(LinearLayout.VERTICAL);
        GradientDrawable bg = new GradientDrawable(GradientDrawable.Orientation.TL_BR,
                new int[] {0xFF2563EB, 0xFF6D28D9, 0xFFBE185D});
        bg.setCornerRadius(dp(28));
        card.setBackground(bg);
        card.setPadding(dp(32), dp(26), dp(32), dp(28));

        LinearLayout top = new LinearLayout(this);
        top.setGravity(Gravity.CENTER_VERTICAL);
        FrameLayout bubble = new FrameLayout(this);
        bubble.setBackground(oval(0x33FFFFFF));
        ImageView icon = new ImageView(this);
        icon.setImageResource(R.drawable.ic_projector);
        icon.setImageTintList(ColorStateList.valueOf(0xFFFFFFFF));
        bubble.addView(icon, new FrameLayout.LayoutParams(dp(36), dp(36), Gravity.CENTER));
        top.addView(bubble, new LinearLayout.LayoutParams(dp(64), dp(64)));
        LinearLayout titles = new LinearLayout(this);
        titles.setOrientation(LinearLayout.VERTICAL);
        titles.addView(text("Receptor do Controle", 28, true));
        LinearLayout chip = new LinearLayout(this);
        chip.setGravity(Gravity.CENTER_VERTICAL);
        chip.setBackground(rounded(0x47000000, dp(14)));
        chip.setPadding(dp(12), dp(6), dp(14), dp(6));
        dot = new View(this);
        chip.addView(dot, new LinearLayout.LayoutParams(dp(10), dp(10)));
        status = text("", 15, true);
        status.setPadding(dp(8), 0, 0, 0);
        chip.addView(status);
        LinearLayout.LayoutParams cp = new LinearLayout.LayoutParams(-2, -2);
        cp.topMargin = dp(8);
        titles.addView(chip, cp);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(0, -2, 1f);
        tp.leftMargin = dp(18);
        top.addView(titles, tp);
        card.addView(top);

        details = text("", 16, false);
        details.setTextColor(0xE6FFFFFF);
        details.setLineSpacing(dp(3), 1f);
        LinearLayout.LayoutParams dp = new LinearLayout.LayoutParams(-1, -2);
        dp.topMargin = dp(18);
        card.addView(details, dp);

        TextView steps = text("No celular, abra o Controle Projetor. Ele encontra o projetor no mesmo Wi-Fi e mostra "
                + "aqui um código para parear na primeira vez.", 14, false);
        steps.setTextColor(0xCCFFFFFF);
        LinearLayout.LayoutParams sp = new LinearLayout.LayoutParams(-1, -2);
        sp.topMargin = dp(10);
        card.addView(steps, sp);

        TextView button = text("Abrir Acessibilidade", 18, true);
        button.setGravity(Gravity.CENTER);
        button.setFocusable(true);
        button.setClickable(true);
        button.setPadding(dp(28), dp(14), dp(28), dp(14));
        StateListDrawable states = new StateListDrawable();
        GradientDrawable focused = rounded(0xFFFFFFFF, dp(26));
        states.addState(new int[] {android.R.attr.state_focused}, focused);
        states.addState(new int[] {}, rounded(0x40FFFFFF, dp(26)));
        button.setBackground(states);
        button.setOnFocusChangeListener(new View.OnFocusChangeListener() {
            @Override
            public void onFocusChange(View v, boolean hasFocus) {
                ((TextView) v).setTextColor(hasFocus ? 0xFF4C1D95 : 0xFFFFFFFF);
            }
        });
        button.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                try {
                    startActivity(new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS));
                } catch (ActivityNotFoundException e) {
                    Toast.makeText(MainActivity.this, "Abra Configurações > Acessibilidade", Toast.LENGTH_LONG).show();
                }
            }
        });
        LinearLayout.LayoutParams bp = new LinearLayout.LayoutParams(-2, -2);
        bp.topMargin = dp(22);
        bp.gravity = Gravity.START;
        card.addView(button, bp);

        root.addView(card, new LinearLayout.LayoutParams(dp(720), -2));
        button.requestFocus();
        return root;
    }

    private String ip() {
        ConnectivityManager cm = (ConnectivityManager) getSystemService(CONNECTIVITY_SERVICE);
        Network n = cm == null ? null : cm.getActiveNetwork();
        LinkProperties lp = n == null ? null : cm.getLinkProperties(n);
        if (lp == null) return null;
        for (LinkAddress la : lp.getLinkAddresses()) {
            if (la.getAddress() instanceof Inet4Address) return la.getAddress().getHostAddress();
        }
        return null;
    }

    private TextView text(String s, float sp, boolean bold) {
        TextView t = new TextView(this);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(0xFFFFFFFF);
        if (bold) t.setTypeface(Typeface.create("sans-serif-medium", Typeface.NORMAL));
        return t;
    }

    private static GradientDrawable rounded(int color, float r) {
        GradientDrawable g = new GradientDrawable();
        g.setColor(color);
        g.setCornerRadius(r);
        return g;
    }

    private static Drawable oval(int color) {
        GradientDrawable g = new GradientDrawable();
        g.setShape(GradientDrawable.OVAL);
        g.setColor(color);
        return g;
    }

    private int dp(float v) {
        return Math.round(v * getResources().getDisplayMetrics().density);
    }
}
