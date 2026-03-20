package org.trostheide.generativeArt.swing;

import com.formdev.flatlaf.FlatDarkLaf;
import org.trostheide.generativeArt.core.GeneratorRegistry;
import org.trostheide.generativeArt.LSystemGenerator;
import org.trostheide.generativeArt.ReactionDiffusionGenerator;
import org.trostheide.generativeArt.PhyllotaxisGenerator;
import org.trostheide.generativeArt.GenerativeRibbon;
import org.trostheide.generativeArt.FlowFieldGenerator;
import org.trostheide.generativeArt.HarmonographGenerator;
import org.trostheide.generativeArt.StrangeAttractorsGenerator;
import org.trostheide.generativeArt.CirclePackingGenerator;
import org.trostheide.generativeArt.TruchetTilesGenerator;
import org.trostheide.generativeArt.TwistedMoireGenerator;
import org.trostheide.generativeArt.VoronoiRipplesGenerator;
import org.trostheide.generativeArt.PipeNetworkGenerator;
import org.trostheide.generativeArt.ParametricGridGenerator;
import org.trostheide.generativeArt.MagneticFieldGenerator;
import org.trostheide.generativeArt.FourierSeriesGenerator;
import org.trostheide.generativeArt.MazeGenerator;
import org.trostheide.generativeArt.SpirographGenerator;
import org.trostheide.generativeArt.PenroseTilingGenerator;
import org.trostheide.generativeArt.WaveInterferenceGenerator;
import org.trostheide.generativeArt.ChladniPatternGenerator;
import org.trostheide.generativeArt.CelticKnotGenerator;
import org.trostheide.generativeArt.ContourMapGenerator;

import javax.swing.*;
import java.awt.*;

public class SwingApp {
    public static void main(String[] args) {
        // Register Generators
        GeneratorRegistry.register(new GenerativeRibbon());
        GeneratorRegistry.register(new FlowFieldGenerator());
        GeneratorRegistry.register(new LSystemGenerator());
        GeneratorRegistry.register(new ReactionDiffusionGenerator());
        GeneratorRegistry.register(new HarmonographGenerator());
        GeneratorRegistry.register(new PhyllotaxisGenerator());
        GeneratorRegistry.register(new StrangeAttractorsGenerator());
        GeneratorRegistry.register(new CirclePackingGenerator());
        GeneratorRegistry.register(new TruchetTilesGenerator());
        GeneratorRegistry.register(new TwistedMoireGenerator());
        GeneratorRegistry.register(new VoronoiRipplesGenerator());
        GeneratorRegistry.register(new PipeNetworkGenerator());
        GeneratorRegistry.register(new ParametricGridGenerator());
        GeneratorRegistry.register(new MagneticFieldGenerator());
        GeneratorRegistry.register(new FourierSeriesGenerator());
        GeneratorRegistry.register(new MazeGenerator());
        GeneratorRegistry.register(new SpirographGenerator());
        GeneratorRegistry.register(new PenroseTilingGenerator());
        GeneratorRegistry.register(new WaveInterferenceGenerator());
        GeneratorRegistry.register(new ChladniPatternGenerator());
        GeneratorRegistry.register(new CelticKnotGenerator());
        GeneratorRegistry.register(new ContourMapGenerator());

        // Custom FlatLaf dark theme with accent colors matching web UI
        FlatDarkLaf.setup();

        // Customize theme properties for a modern, polished look
        UIManager.put("Component.arc", 8);
        UIManager.put("Button.arc", 8);
        UIManager.put("TextComponent.arc", 6);
        UIManager.put("Component.focusWidth", 1);
        UIManager.put("Component.innerFocusWidth", 0);

        // Accent color (sky blue matching web --accent-color: #38bdf8)
        Color accent = new Color(0x38, 0xBD, 0xF8);
        Color accentDark = new Color(0x0E, 0xA5, 0xE9);
        UIManager.put("Component.focusColor", accent);
        UIManager.put("Button.default.background", accent);
        UIManager.put("Button.default.foreground", new Color(0x0F, 0x17, 0x2A));
        UIManager.put("Button.default.hoverBackground", accentDark);
        UIManager.put("Button.default.pressedBackground", accentDark.darker());

        // Backgrounds matching web --bg-color and --sidebar-bg
        Color bgColor = new Color(0x0F, 0x17, 0x2A);
        Color sidebarBg = new Color(0x1E, 0x29, 0x3B);
        Color borderColor = new Color(0x33, 0x41, 0x55);
        UIManager.put("Panel.background", sidebarBg);
        UIManager.put("SplitPane.background", bgColor);
        UIManager.put("ToolBar.background", sidebarBg);
        UIManager.put("ScrollPane.background", sidebarBg);
        UIManager.put("List.background", sidebarBg);
        UIManager.put("TextField.background", bgColor);
        UIManager.put("ComboBox.background", bgColor);
        UIManager.put("Spinner.background", bgColor);
        UIManager.put("Slider.trackColor", borderColor);
        UIManager.put("Slider.thumbColor", accent);
        UIManager.put("Slider.trackValueColor", accent);
        UIManager.put("Slider.focusedColor", accent);
        UIManager.put("Component.borderColor", borderColor);

        // Progress bar
        UIManager.put("ProgressBar.foreground", accent);
        UIManager.put("ProgressBar.background", borderColor);

        // Selection colors
        UIManager.put("List.selectionBackground", accent);
        UIManager.put("List.selectionForeground", bgColor);

        // ScrollBar thin
        UIManager.put("ScrollBar.width", 10);
        UIManager.put("ScrollBar.thumbArc", 999);
        UIManager.put("ScrollBar.track", sidebarBg);
        UIManager.put("ScrollBar.thumb", borderColor);

        // Separator
        UIManager.put("Separator.foreground", borderColor);

        // TitledBorder
        UIManager.put("TitledBorder.titleColor", new Color(0x94, 0xA3, 0xB8));

        // Font
        UIManager.put("defaultFont", new Font("SansSerif", Font.PLAIN, 13));

        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}
