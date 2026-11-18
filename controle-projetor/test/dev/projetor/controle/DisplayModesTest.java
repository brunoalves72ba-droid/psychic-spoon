package dev.projetor.controle;

/** Which display mode the app asks for. Run with: ./build.sh test */
public class DisplayModesTest {

    static int failures;

    public static void main(String[] args) {
        float[][] phone = {
                {1080, 2400, 60}, {1080, 2400, 90}, {1080, 2400, 120}, {1080, 2400, 144}, {1440, 3200, 120}};
        check("escolhe 120 Hz na resolução atual, mesmo havendo 144 Hz", DisplayModes.pick(phone, 1080, 2400, 60) == 2);
        check("não troca a resolução (1440p a 120 Hz fica de fora)", DisplayModes.pick(phone, 1440, 3200, 60) == 4
                && DisplayModes.pick(new float[][] {{1440, 3200, 120}, {1080, 2400, 60}}, 1080, 2400, 60) == -1);
        float[][] only90 = {{1080, 2340, 60}, {1080, 2340, 90}};
        check("sem 120 Hz, pega o mais rápido (90 Hz)", DisplayModes.pick(only90, 1080, 2340, 60) == 1);
        check("já no mais rápido, não pede nada", DisplayModes.pick(only90, 1080, 2340, 90) == -1);
        check("tela de 60 Hz: não pede nada", DisplayModes.pick(new float[][] {{720, 1600, 60}}, 720, 1600, 60) == -1);
        check("aceita 119,88 Hz como 120", DisplayModes.pick(new float[][] {{1080, 2400, 60}, {1080, 2400, 119.88f}}, 1080, 2400, 60) == 1);
        if (failures > 0) System.exit(1);
    }

    static void check(String what, boolean ok) {
        if (!ok) failures++;
        System.out.println((ok ? "ok   " : "ERRO ") + what);
    }
}
