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

import javax.swing.*;

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

        // Setup UI
        FlatDarkLaf.setup();

        SwingUtilities.invokeLater(() -> {
            MainFrame frame = new MainFrame();
            frame.setVisible(true);
        });
    }
}
