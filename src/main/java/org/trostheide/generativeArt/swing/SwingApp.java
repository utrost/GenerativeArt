package org.trostheide.generativeArt.swing;

import com.formdev.flatlaf.FlatDarkLaf;
import org.trostheide.generativeArt.core.GeneratorRegistry;
import org.trostheide.generativeArt.LSystemGenerator;
import org.trostheide.generativeArt.ReactionDiffusionGenerator;
import org.trostheide.generativeArt.GenerativeRibbon;
import org.trostheide.generativeArt.FlowFieldGenerator;
import org.trostheide.generativeArt.HarmonographGenerator;

import javax.swing.*;

public class SwingApp {
    public static void main(String[] args) {
        // Register Generators
        GeneratorRegistry.register(new GenerativeRibbon());
        GeneratorRegistry.register(new FlowFieldGenerator());
        GeneratorRegistry.register(new LSystemGenerator());
        GeneratorRegistry.register(new ReactionDiffusionGenerator());
        GeneratorRegistry.register(new HarmonographGenerator());

        // Setup UI
        FlatDarkLaf.setup();

        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}
