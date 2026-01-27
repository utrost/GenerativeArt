package org.trostheide.generativeArt.swing;

import org.trostheide.generativeArt.core.ArtGenerator;

import javax.swing.*;
import java.awt.*;

public class MainFrame extends JFrame {

    private final GeneratorListPanel listPanel;
    private final ParametersPanel paramsPanel;
    private final PreviewPanel previewPanel;
    private ArtGenerator currentGenerator;

    public MainFrame() {
        setTitle("Generative Art Control Center");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1200, 800);
        setLocationRelativeTo(null);

        // Layout
        setLayout(new BorderLayout());

        // Components
        previewPanel = new PreviewPanel();
        paramsPanel = new ParametersPanel(this::onGenerate, this::onShowHelp);
        listPanel = new GeneratorListPanel(this::onGeneratorSelected);

        // Sidebar (List + Params)
        JPanel sidebar = new JPanel(new BorderLayout());
        sidebar.add(listPanel, BorderLayout.NORTH);
        sidebar.add(paramsPanel, BorderLayout.CENTER);
        sidebar.setPreferredSize(new Dimension(350, 800));

        // Split Pane
        JSplitPane splitPane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, sidebar, previewPanel);
        splitPane.setDividerLocation(350);
        add(splitPane, BorderLayout.CENTER);
    }

    private void onGeneratorSelected(ArtGenerator generator) {
        this.currentGenerator = generator;
        paramsPanel.setGenerator(generator);
        previewPanel.clear();
    }

    private void onGenerate() {
        if (currentGenerator != null) {
            // Run in background to avoid freezing UI
            new SwingWorker<String, Void>() {
                @Override
                protected String doInBackground() throws Exception {
                    return currentGenerator.generate(paramsPanel.getValues());
                }

                @Override
                protected void done() {
                    try {
                        String svg = get();
                        previewPanel.renderSVG(svg, paramsPanel.getSelectedPaperSize());
                    } catch (Exception e) {
                        e.printStackTrace();
                        JOptionPane.showMessageDialog(MainFrame.this, "Error generating art: " + e.getMessage(),
                                "Error", JOptionPane.ERROR_MESSAGE);
                    }
                }
            }.execute();
        }
    }

    private void onShowHelp() {
        if (currentGenerator != null) {
            new HelpDialog(this, currentGenerator).setVisible(true);
        }
    }
}
