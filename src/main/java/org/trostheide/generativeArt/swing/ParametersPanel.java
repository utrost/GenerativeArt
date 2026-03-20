package org.trostheide.generativeArt.swing;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.PaperSize;

import javax.swing.*;
import javax.swing.event.ChangeListener;
import java.awt.*;
import java.util.HashMap;
import java.util.Hashtable;
import java.util.Map;

public class ParametersPanel extends JPanel {

    private final Map<String, JComponent> inputs = new HashMap<>();
    private final Map<String, JLabel> valueLabels = new HashMap<>();
    private final JPanel formContainer;
    private final JComboBox<PaperSize> paperSizeSelector;
    private final Runnable onParameterTweaked;
    private ArtGenerator currentGenerator;

    public ParametersPanel(Runnable onGenerate, Runnable onHelp, Runnable onParameterTweaked) {
        this.onParameterTweaked = onParameterTweaked;
        setLayout(new BorderLayout(0, 0));
        setBackground(MainFrame.SIDEBAR_BG);
        setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 0));

        // Top: Paper Size selector
        JPanel topPanel = new JPanel(new BorderLayout(0, 4));
        topPanel.setBackground(MainFrame.SIDEBAR_BG);
        topPanel.setBorder(BorderFactory.createEmptyBorder(12, 16, 8, 16));

        JLabel sectionLabel = new JLabel("SETTINGS");
        sectionLabel.setFont(new Font("SansSerif", Font.BOLD, 10));
        sectionLabel.setForeground(MainFrame.TEXT_SECONDARY);

        JPanel sizePanel = new JPanel(new BorderLayout(8, 0));
        sizePanel.setBackground(MainFrame.SIDEBAR_BG);

        JLabel sizeLabel = new JLabel("Paper Size");
        sizeLabel.setForeground(MainFrame.TEXT_SECONDARY);
        sizeLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));

        paperSizeSelector = new JComboBox<>(PaperSize.values());
        paperSizeSelector.setSelectedItem(PaperSize.A4_LANDSCAPE);
        paperSizeSelector.setBackground(MainFrame.BG_COLOR);
        paperSizeSelector.setRenderer(new DefaultListCellRenderer() {
            @Override
            public Component getListCellRendererComponent(JList<?> list, Object value,
                                                          int index, boolean isSelected, boolean cellHasFocus) {
                super.getListCellRendererComponent(list, value, index, isSelected, cellHasFocus);
                if (value instanceof PaperSize) {
                    setText(((PaperSize) value).getDisplayName());
                }
                return this;
            }
        });
        paperSizeSelector.addActionListener(e -> {
            if (onParameterTweaked != null) onParameterTweaked.run();
        });

        sizePanel.add(sizeLabel, BorderLayout.WEST);
        sizePanel.add(paperSizeSelector, BorderLayout.CENTER);

        JPanel topContent = new JPanel();
        topContent.setLayout(new BoxLayout(topContent, BoxLayout.Y_AXIS));
        topContent.setBackground(MainFrame.SIDEBAR_BG);
        sectionLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
        sizePanel.setAlignmentX(Component.LEFT_ALIGNMENT);
        sizePanel.setMaximumSize(new Dimension(Integer.MAX_VALUE, 32));
        topContent.add(sectionLabel);
        topContent.add(Box.createVerticalStrut(8));
        topContent.add(sizePanel);

        topPanel.add(topContent, BorderLayout.CENTER);
        add(topPanel, BorderLayout.NORTH);

        // Center: scrollable parameter form
        formContainer = new JPanel();
        formContainer.setLayout(new BoxLayout(formContainer, BoxLayout.Y_AXIS));
        formContainer.setBackground(MainFrame.SIDEBAR_BG);

        JScrollPane scrollPane = new JScrollPane(formContainer);
        scrollPane.setBorder(BorderFactory.createEmptyBorder());
        scrollPane.setBackground(MainFrame.SIDEBAR_BG);
        scrollPane.getViewport().setBackground(MainFrame.SIDEBAR_BG);
        scrollPane.setHorizontalScrollBarPolicy(ScrollPaneConstants.HORIZONTAL_SCROLLBAR_NEVER);
        scrollPane.getVerticalScrollBar().setUnitIncrement(16);
        add(scrollPane, BorderLayout.CENTER);

        // Bottom: buttons
        JPanel buttonPanel = new JPanel(new GridLayout(1, 2, 8, 0));
        buttonPanel.setBackground(MainFrame.SIDEBAR_BG);
        buttonPanel.setBorder(BorderFactory.createEmptyBorder(8, 16, 12, 16));

        JButton btnHelp = new JButton("Help");
        btnHelp.setFocusPainted(false);
        btnHelp.addActionListener(e -> onHelp.run());

        JButton btnGenerate = new JButton("Generate Art");
        btnGenerate.setFocusPainted(false);
        btnGenerate.putClientProperty("JButton.buttonType", "default");
        btnGenerate.addActionListener(e -> onGenerate.run());

        buttonPanel.add(btnHelp);
        buttonPanel.add(btnGenerate);
        add(buttonPanel, BorderLayout.SOUTH);
    }

    public PaperSize getSelectedPaperSize() {
        return (PaperSize) paperSizeSelector.getSelectedItem();
    }

    private boolean isUpdatingUI = false;

    public void setGenerator(ArtGenerator generator) {
        this.currentGenerator = generator;
        formContainer.removeAll();
        inputs.clear();
        valueLabels.clear();

        // Parameters section header
        JLabel paramsLabel = new JLabel("PARAMETERS");
        paramsLabel.setFont(new Font("SansSerif", Font.BOLD, 10));
        paramsLabel.setForeground(MainFrame.TEXT_SECONDARY);
        paramsLabel.setBorder(BorderFactory.createEmptyBorder(8, 16, 4, 16));
        paramsLabel.setAlignmentX(Component.LEFT_ALIGNMENT);
        formContainer.add(paramsLabel);

        for (ParameterDefinition param : generator.getParameterDefinitions()) {
            JPanel row = createParameterRow(param, generator);
            formContainer.add(row);
        }

        formContainer.add(Box.createVerticalGlue());
        formContainer.revalidate();
        formContainer.repaint();
    }

    private JPanel createParameterRow(ParameterDefinition param, ArtGenerator generator) {
        JPanel row = new JPanel();
        row.setLayout(new BoxLayout(row, BoxLayout.Y_AXIS));
        row.setBackground(MainFrame.SIDEBAR_BG);
        row.setBorder(BorderFactory.createEmptyBorder(6, 16, 2, 16));
        row.setAlignmentX(Component.LEFT_ALIGNMENT);

        // Label row with name + value display
        JPanel labelRow = new JPanel(new BorderLayout(4, 0));
        labelRow.setBackground(MainFrame.SIDEBAR_BG);
        labelRow.setAlignmentX(Component.LEFT_ALIGNMENT);
        labelRow.setMaximumSize(new Dimension(Integer.MAX_VALUE, 20));

        JLabel nameLabel = new JLabel(param.name());
        nameLabel.setFont(new Font("SansSerif", Font.PLAIN, 12));
        nameLabel.setForeground(new Color(0xCB, 0xD5, 0xE1));
        if (param.description() != null && !param.description().isEmpty()) {
            nameLabel.setToolTipText(param.description());
            nameLabel.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        }

        JLabel valLabel = new JLabel();
        valLabel.setFont(new Font("Monospaced", Font.PLAIN, 11));
        valLabel.setForeground(MainFrame.ACCENT);
        valueLabels.put(param.name(), valLabel);

        labelRow.add(nameLabel, BorderLayout.WEST);
        labelRow.add(valLabel, BorderLayout.EAST);
        row.add(labelRow);
        row.add(Box.createVerticalStrut(2));

        // Input component
        JComponent input = createInput(param);
        input.setName(param.name());
        input.setAlignmentX(Component.LEFT_ALIGNMENT);
        inputs.put(param.name(), input);

        // For sliders, wrap with value display
        if (input instanceof JSlider) {
            JSlider slider = (JSlider) input;
            updateValueLabel(param, getSliderValue(slider, param));
            row.add(input);
        } else {
            updateValueLabel(param, param.defaultValue());
            row.add(input);
        }

        row.setMaximumSize(new Dimension(Integer.MAX_VALUE, input instanceof JSlider ? 55 : 52));

        attachChangeListener(input, param.name(), generator, param);
        return row;
    }

    private JComponent createInput(ParameterDefinition param) {
        switch (param.type()) {
            case INTEGER: {
                int min = param.min() != null ? ((Number) param.min()).intValue() : 0;
                int max = param.max() != null ? ((Number) param.max()).intValue() : 100;
                int val = ((Number) param.defaultValue()).intValue();
                JSlider slider = new JSlider(min, max, val);
                slider.setBackground(MainFrame.SIDEBAR_BG);
                slider.setFocusable(false);
                return slider;
            }
            case DOUBLE: {
                // Use slider with 100x scaling for double precision
                double minD = param.min() != null ? ((Number) param.min()).doubleValue() : 0;
                double maxD = param.max() != null ? ((Number) param.max()).doubleValue() : 1;
                double valD = ((Number) param.defaultValue()).doubleValue();
                int sliderMin = (int) (minD * 100);
                int sliderMax = (int) (maxD * 100);
                int sliderVal = (int) (valD * 100);
                JSlider slider = new JSlider(sliderMin, sliderMax, sliderVal);
                slider.setBackground(MainFrame.SIDEBAR_BG);
                slider.setFocusable(false);
                return slider;
            }
            case BOOLEAN: {
                JCheckBox check = new JCheckBox();
                check.setSelected((boolean) param.defaultValue());
                check.setBackground(MainFrame.SIDEBAR_BG);
                check.setFocusPainted(false);
                return check;
            }
            case STRING: {
                if (param.options() != null && !param.options().isEmpty()) {
                    JComboBox<String> combo = new JComboBox<>(param.options().toArray(new String[0]));
                    combo.setSelectedItem(param.defaultValue());
                    combo.setBackground(MainFrame.BG_COLOR);
                    return combo;
                }
                JTextField text = new JTextField((String) param.defaultValue());
                text.setBackground(MainFrame.BG_COLOR);
                text.setForeground(Color.WHITE);
                text.setCaretColor(MainFrame.ACCENT);
                return text;
            }
            default:
                return new JLabel("Unsupported");
        }
    }

    private void attachChangeListener(JComponent input, String paramName,
                                      ArtGenerator generator, ParameterDefinition param) {
        if (input instanceof JSlider slider) {
            slider.addChangeListener(e -> {
                Object val = getSliderValue(slider, param);
                updateValueLabel(param, val);
                handleParameterChange(paramName, val, generator);
            });
        } else if (input instanceof JCheckBox cb) {
            cb.addActionListener(e -> {
                updateValueLabel(param, cb.isSelected());
                handleParameterChange(paramName, cb.isSelected(), generator);
            });
        } else if (input instanceof JComboBox<?> combo) {
            combo.addActionListener(e -> {
                updateValueLabel(param, combo.getSelectedItem());
                handleParameterChange(paramName, combo.getSelectedItem(), generator);
            });
        } else if (input instanceof JTextField tf) {
            tf.getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
                public void changedUpdate(javax.swing.event.DocumentEvent e) { update(); }
                public void removeUpdate(javax.swing.event.DocumentEvent e) { update(); }
                public void insertUpdate(javax.swing.event.DocumentEvent e) { update(); }
                private void update() {
                    updateValueLabel(param, tf.getText());
                    handleParameterChange(paramName, tf.getText(), generator);
                }
            });
        }
    }

    private Object getSliderValue(JSlider slider, ParameterDefinition param) {
        if (param.type() == org.trostheide.generativeArt.core.ParameterType.DOUBLE) {
            return slider.getValue() / 100.0;
        }
        return slider.getValue();
    }

    private void updateValueLabel(ParameterDefinition param, Object value) {
        JLabel label = valueLabels.get(param.name());
        if (label == null) return;

        if (value instanceof Double) {
            label.setText(String.format("%.2f", (Double) value));
        } else if (value instanceof Integer) {
            label.setText(String.valueOf(value));
        } else if (value instanceof Boolean) {
            label.setText((Boolean) value ? "on" : "off");
        } else if (value instanceof String) {
            String s = (String) value;
            label.setText(s.length() > 15 ? s.substring(0, 12) + "..." : s);
        }
    }

    private void handleParameterChange(String paramName, Object newValue, ArtGenerator generator) {
        if (isUpdatingUI) return;

        Map<String, Object> currentValues = getValues();
        boolean needsRefresh = generator.onParameterChanged(paramName, newValue, currentValues);

        if (needsRefresh) {
            SwingUtilities.invokeLater(() -> updateUIFromValues(currentValues));
        }

        // Notify for auto-generate
        if (onParameterTweaked != null) {
            onParameterTweaked.run();
        }
    }

    private void updateUIFromValues(Map<String, Object> newValues) {
        isUpdatingUI = true;
        try {
            for (Map.Entry<String, JComponent> entry : inputs.entrySet()) {
                String key = entry.getKey();
                if (!newValues.containsKey(key)) continue;
                Object val = newValues.get(key);
                JComponent input = entry.getValue();

                if (input instanceof JSlider slider) {
                    if (val instanceof Number num) {
                        // Check if it's a double slider (scaled by 100)
                        ParameterDefinition paramDef = findParamDef(key);
                        if (paramDef != null && paramDef.type() == org.trostheide.generativeArt.core.ParameterType.DOUBLE) {
                            slider.setValue((int) (num.doubleValue() * 100));
                        } else {
                            slider.setValue(num.intValue());
                        }
                        updateValueLabel(paramDef, val);
                    }
                } else if (input instanceof JCheckBox cb && val instanceof Boolean) {
                    cb.setSelected((Boolean) val);
                } else if (input instanceof JTextField tf && val instanceof String) {
                    if (!tf.getText().equals(val)) {
                        tf.setText((String) val);
                    }
                } else if (input instanceof JComboBox<?> combo) {
                    combo.setSelectedItem(val);
                }
            }
        } finally {
            isUpdatingUI = false;
        }
    }

    private ParameterDefinition findParamDef(String name) {
        if (currentGenerator == null) return null;
        for (ParameterDefinition pd : currentGenerator.getParameterDefinitions()) {
            if (pd.name().equals(name)) return pd;
        }
        return null;
    }

    public Map<String, Object> getValues() {
        Map<String, Object> values = new HashMap<>();

        PaperSize size = (PaperSize) paperSizeSelector.getSelectedItem();
        values.put("width", size.getWidthPx());
        values.put("height", size.getHeightPx());
        values.put("paperSize", size.name());

        for (Map.Entry<String, JComponent> entry : inputs.entrySet()) {
            JComponent input = entry.getValue();
            String key = entry.getKey();

            if (input instanceof JSlider slider) {
                ParameterDefinition paramDef = findParamDef(key);
                if (paramDef != null && paramDef.type() == org.trostheide.generativeArt.core.ParameterType.DOUBLE) {
                    values.put(key, slider.getValue() / 100.0);
                } else {
                    values.put(key, slider.getValue());
                }
            } else if (input instanceof JCheckBox cb) {
                values.put(key, cb.isSelected());
            } else if (input instanceof JTextField tf) {
                values.put(key, tf.getText());
            } else if (input instanceof JComboBox<?> combo) {
                values.put(key, combo.getSelectedItem());
            }
        }
        return values;
    }
}
