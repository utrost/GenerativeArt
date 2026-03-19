package org.trostheide.generativeArt.swing;

import org.trostheide.generativeArt.core.ArtGenerator;

import javax.swing.*;
import java.awt.*;
import java.awt.event.ActionEvent;
import java.awt.event.KeyEvent;

public class MainFrame extends JFrame {

    private final GeneratorListPanel listPanel;
    private final ParametersPanel paramsPanel;
    private final PreviewPanel previewPanel;
    private final JLabel statusLabel;
    private final JProgressBar progressBar;
    private ArtGenerator currentGenerator;
    private Timer autoGenerateTimer;

    // Theme colors (matching web UI)
    static final Color BG_COLOR = new Color(0x0F, 0x17, 0x2A);
    static final Color SIDEBAR_BG = new Color(0x1E, 0x29, 0x3B);
    static final Color ACCENT = new Color(0x38, 0xBD, 0xF8);
    static final Color TEXT_SECONDARY = new Color(0x94, 0xA3, 0xB8);
    static final Color BORDER_COLOR = new Color(0x33, 0x41, 0x55);

    public MainFrame() {
        setTitle("Generative Art Studio");
        setDefaultCloseOperation(JFrame.EXIT_ON_CLOSE);
        setSize(1400, 900);
        setMinimumSize(new Dimension(900, 600));
        setLocationRelativeTo(null);
        getContentPane().setBackground(BG_COLOR);

        setLayout(new BorderLayout());

        // Components
        previewPanel = new PreviewPanel();
        paramsPanel = new ParametersPanel(this::onGenerate, this::onShowHelp, this::onParameterTweaked);
        listPanel = new GeneratorListPanel(this::onGeneratorSelected);

        // Sidebar (List + Params) with refined styling
        JPanel sidebar = new JPanel(new BorderLayout(0, 0));
        sidebar.setBackground(SIDEBAR_BG);
        sidebar.setBorder(BorderFactory.createMatteBorder(0, 0, 0, 1, BORDER_COLOR));

        // Header
        JPanel headerPanel = createHeaderPanel();
        sidebar.add(headerPanel, BorderLayout.NORTH);

        // Tabbed content: generators list + params
        JPanel sidebarContent = new JPanel(new BorderLayout(0, 0));
        sidebarContent.setBackground(SIDEBAR_BG);
        sidebarContent.add(listPanel, BorderLayout.NORTH);

        // Separator between list and params
        JSeparator sep = new JSeparator();
        sep.setForeground(BORDER_COLOR);

        JPanel centerWrapper = new JPanel(new BorderLayout(0, 0));
        centerWrapper.setBackground(SIDEBAR_BG);
        centerWrapper.add(sep, BorderLayout.NORTH);
        centerWrapper.add(paramsPanel, BorderLayout.CENTER);
        sidebarContent.add(centerWrapper, BorderLayout.CENTER);

        sidebar.add(sidebarContent, BorderLayout.CENTER);
        sidebar.setPreferredSize(new Dimension(340, 900));

        // Split Pane with minimal divider
        JSplitPane splitPane = new JSplitPane(JSplitPane.HORIZONTAL_SPLIT, sidebar, previewPanel);
        splitPane.setDividerLocation(340);
        splitPane.setDividerSize(4);
        splitPane.setBorder(null);
        splitPane.setBackground(BG_COLOR);
        add(splitPane, BorderLayout.CENTER);

        // Status Bar
        JPanel statusBar = createStatusBar();
        add(statusBar, BorderLayout.SOUTH);

        // Keyboard shortcuts
        setupKeyBindings();

        // Auto-generate debounce timer (400ms)
        autoGenerateTimer = new Timer(400, e -> {
            autoGenerateTimer.stop();
            onGenerate();
        });
        autoGenerateTimer.setRepeats(false);
    }

    private JPanel createHeaderPanel() {
        JPanel header = new JPanel(new BorderLayout());
        header.setBackground(SIDEBAR_BG);
        header.setBorder(BorderFactory.createEmptyBorder(16, 16, 12, 16));

        JLabel title = new JLabel("Generative Art");
        title.setFont(new Font("SansSerif", Font.BOLD, 20));
        title.setForeground(ACCENT);

        JLabel subtitle = new JLabel("Studio");
        subtitle.setFont(new Font("SansSerif", Font.PLAIN, 12));
        subtitle.setForeground(TEXT_SECONDARY);

        JPanel titleGroup = new JPanel();
        titleGroup.setLayout(new BoxLayout(titleGroup, BoxLayout.Y_AXIS));
        titleGroup.setBackground(SIDEBAR_BG);
        titleGroup.add(title);
        titleGroup.add(Box.createVerticalStrut(2));
        titleGroup.add(subtitle);

        header.add(titleGroup, BorderLayout.WEST);
        return header;
    }

    private JPanel createStatusBar() {
        JPanel bar = new JPanel(new BorderLayout(8, 0));
        bar.setBackground(SIDEBAR_BG);
        bar.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(1, 0, 0, 0, BORDER_COLOR),
                BorderFactory.createEmptyBorder(6, 12, 6, 12)));

        statusLabel = new JLabel("Select a generator to begin");
        statusLabel.setForeground(TEXT_SECONDARY);
        statusLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        bar.add(statusLabel, BorderLayout.WEST);

        progressBar = new JProgressBar();
        progressBar.setIndeterminate(false);
        progressBar.setPreferredSize(new Dimension(120, 6));
        progressBar.setMaximumSize(new Dimension(120, 6));
        progressBar.setVisible(false);
        progressBar.setBorderPainted(false);
        bar.add(progressBar, BorderLayout.EAST);

        JLabel shortcutHint = new JLabel("Ctrl+G: Generate  |  Ctrl+S: Save");
        shortcutHint.setForeground(new Color(0x64, 0x74, 0x8B));
        shortcutHint.setFont(new Font("SansSerif", Font.PLAIN, 11));
        bar.add(shortcutHint, BorderLayout.CENTER);

        return bar;
    }

    private void setupKeyBindings() {
        JRootPane rootPane = getRootPane();

        // Ctrl+G - Generate
        rootPane.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(
                KeyStroke.getKeyStroke(KeyEvent.VK_G, Toolkit.getDefaultToolkit().getMenuShortcutKeyMaskEx()),
                "generate");
        rootPane.getActionMap().put("generate", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                onGenerate();
            }
        });

        // Ctrl+S - Save
        rootPane.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(
                KeyStroke.getKeyStroke(KeyEvent.VK_S, Toolkit.getDefaultToolkit().getMenuShortcutKeyMaskEx()),
                "save");
        rootPane.getActionMap().put("save", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                previewPanel.saveSVG();
            }
        });

        // Ctrl+H - Help
        rootPane.getInputMap(JComponent.WHEN_IN_FOCUSED_WINDOW).put(
                KeyStroke.getKeyStroke(KeyEvent.VK_H, Toolkit.getDefaultToolkit().getMenuShortcutKeyMaskEx()),
                "help");
        rootPane.getActionMap().put("help", new AbstractAction() {
            @Override
            public void actionPerformed(ActionEvent e) {
                onShowHelp();
            }
        });
    }

    private void onGeneratorSelected(ArtGenerator generator) {
        this.currentGenerator = generator;
        paramsPanel.setGenerator(generator);
        previewPanel.clear();
        statusLabel.setText(generator.getDisplayName() + " — ready");

        // Auto-generate on selection
        onGenerate();
    }

    void onParameterTweaked() {
        // Debounced auto-generate when parameters change
        if (autoGenerateTimer.isRunning()) {
            autoGenerateTimer.restart();
        } else {
            autoGenerateTimer.start();
        }
    }

    private void onGenerate() {
        if (currentGenerator != null) {
            statusLabel.setText(currentGenerator.getDisplayName() + " — generating...");
            progressBar.setIndeterminate(true);
            progressBar.setVisible(true);

            long startTime = System.currentTimeMillis();

            new SwingWorker<String, Void>() {
                @Override
                protected String doInBackground() throws Exception {
                    return currentGenerator.generate(paramsPanel.getValues());
                }

                @Override
                protected void done() {
                    progressBar.setIndeterminate(false);
                    progressBar.setVisible(false);
                    try {
                        String svg = get();
                        previewPanel.renderSVG(svg, paramsPanel.getSelectedPaperSize());
                        long elapsed = System.currentTimeMillis() - startTime;
                        statusLabel.setText(String.format("%s — rendered in %dms",
                                currentGenerator.getDisplayName(), elapsed));
                    } catch (Exception e) {
                        e.printStackTrace();
                        statusLabel.setText("Error: " + e.getMessage());
                        JOptionPane.showMessageDialog(MainFrame.this,
                                "Error generating art: " + e.getMessage(),
                                "Generation Error", JOptionPane.ERROR_MESSAGE);
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
