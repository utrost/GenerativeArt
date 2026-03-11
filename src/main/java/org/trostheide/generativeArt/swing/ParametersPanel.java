package org.trostheide.generativeArt.swing;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.ParameterDefinition;
import org.trostheide.generativeArt.core.PaperSize;

import javax.swing.*;
import java.awt.*;
import java.util.HashMap;
import java.util.Map;

public class ParametersPanel extends JPanel {

    private final Map<String, JComponent> inputs = new HashMap<>();
    private final JPanel formContainer;
    private final JComboBox<PaperSize> paperSizeSelector;

    public ParametersPanel(Runnable onGenerate, Runnable onHelp) {
        setLayout(new BorderLayout());
        setBorder(BorderFactory.createTitledBorder("Parameters"));

        // Top Panel for Global Settings (Paper Size)
        JPanel topPanel = new JPanel(new BorderLayout());
        topPanel.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));

        JPanel sizePanel = new JPanel(new BorderLayout(5, 0));
        sizePanel.add(new JLabel("Page Size:"), BorderLayout.WEST);
        paperSizeSelector = new JComboBox<>(PaperSize.values());
        paperSizeSelector.setSelectedItem(PaperSize.A4_LANDSCAPE);
        sizePanel.add(paperSizeSelector, BorderLayout.CENTER);

        topPanel.add(sizePanel, BorderLayout.NORTH);
        topPanel.add(new JSeparator(), BorderLayout.SOUTH);

        add(topPanel, BorderLayout.NORTH);

        formContainer = new JPanel();
        formContainer.setLayout(new BoxLayout(formContainer, BoxLayout.Y_AXIS));

        // Scrollable form
        add(new JScrollPane(formContainer), BorderLayout.CENTER);

        // Buttons
        JPanel buttonPanel = new JPanel(new GridLayout(1, 2, 5, 0));
        JButton btnGenerate = new JButton("Generate Art");
        btnGenerate.addActionListener(e -> onGenerate.run());
        // Default button for enter key
        // SwingUtilities.getRootPane(this).setDefaultButton(btnGenerate); // Can't do
        // this easily here without reference

        JButton btnHelp = new JButton("Help");
        btnHelp.addActionListener(e -> onHelp.run());

        buttonPanel.add(btnHelp);
        buttonPanel.add(btnGenerate);
        buttonPanel.setBorder(BorderFactory.createEmptyBorder(10, 10, 10, 10));
        add(buttonPanel, BorderLayout.SOUTH);
    }

    public PaperSize getSelectedPaperSize() {
        return (PaperSize) paperSizeSelector.getSelectedItem();
    }

    private boolean isUpdatingUI = false;

    public void setGenerator(ArtGenerator generator) {
        formContainer.removeAll();
        inputs.clear();

        for (ParameterDefinition param : generator.getParameterDefinitions()) {
            JPanel row = new JPanel(new BorderLayout(5, 5));
            row.setBorder(BorderFactory.createEmptyBorder(5, 5, 5, 5));
            row.setMaximumSize(new Dimension(Integer.MAX_VALUE, 40));
            row.setAlignmentX(Component.LEFT_ALIGNMENT);

            JLabel label = new JLabel(param.name());
            label.setToolTipText(param.description());
            label.setPreferredSize(new Dimension(100, 20));
            row.add(label, BorderLayout.WEST);

            JComponent input = createInput(param);
            input.setName(param.name());
            inputs.put(param.name(), input);
            row.add(input, BorderLayout.CENTER);

            // Add change listeners to trigger onParameterChanged
            attachChangeListener(input, param.name(), generator);

            formContainer.add(row);
        }

        formContainer.add(Box.createVerticalGlue());
        formContainer.revalidate();
        formContainer.repaint();
    }

    private void attachChangeListener(JComponent input, String paramName, ArtGenerator generator) {
        if (input instanceof JSpinner) {
            ((JSpinner) input).addChangeListener(e -> handleParameterChange(paramName, ((JSpinner) input).getValue(), generator));
        } else if (input instanceof JCheckBox) {
            ((JCheckBox) input).addActionListener(e -> handleParameterChange(paramName, ((JCheckBox) input).isSelected(), generator));
        } else if (input instanceof JComboBox) {
            ((JComboBox<?>) input).addActionListener(e -> handleParameterChange(paramName, ((JComboBox<?>) input).getSelectedItem(), generator));
        } else if (input instanceof JTextField) {
            ((JTextField) input).getDocument().addDocumentListener(new javax.swing.event.DocumentListener() {
                public void changedUpdate(javax.swing.event.DocumentEvent e) { update(); }
                public void removeUpdate(javax.swing.event.DocumentEvent e) { update(); }
                public void insertUpdate(javax.swing.event.DocumentEvent e) { update(); }
                private void update() {
                    handleParameterChange(paramName, ((JTextField) input).getText(), generator);
                }
            });
        }
    }

    private void handleParameterChange(String paramName, Object newValue, ArtGenerator generator) {
        if (isUpdatingUI) return;
        
        Map<String, Object> currentValues = getValues();
        boolean needsRefresh = generator.onParameterChanged(paramName, newValue, currentValues);
        
        if (needsRefresh) {
            SwingUtilities.invokeLater(() -> updateUIFromValues(currentValues));
        }
    }

    private void updateUIFromValues(Map<String, Object> newValues) {
        isUpdatingUI = true;
        try {
            for (Map.Entry<String, JComponent> entry : inputs.entrySet()) {
                String key = entry.getKey();
                if (newValues.containsKey(key)) {
                    Object val = newValues.get(key);
                    JComponent input = entry.getValue();
                    if (input instanceof JSpinner && val instanceof Number) {
                        ((JSpinner) input).setValue(val);
                    } else if (input instanceof JCheckBox && val instanceof Boolean) {
                        ((JCheckBox) input).setSelected((Boolean) val);
                    } else if (input instanceof JTextField && val instanceof String) {
                        JTextField tf = (JTextField) input;
                        if (!tf.getText().equals(val)) {
                            tf.setText((String) val);
                        }
                    } else if (input instanceof JComboBox) {
                        ((JComboBox<?>) input).setSelectedItem(val);
                    }
                }
            }
        } finally {
            isUpdatingUI = false;
        }
    }

    private JComponent createInput(ParameterDefinition param) {
        switch (param.type()) {
            case INTEGER:
                int minI = param.min() != null ? ((Number) param.min()).intValue() : Integer.MIN_VALUE;
                int maxI = param.max() != null ? ((Number) param.max()).intValue() : Integer.MAX_VALUE;
                int valI = ((Number) param.defaultValue()).intValue();
                JSpinner spinI = new JSpinner(new SpinnerNumberModel(valI, minI, maxI, 1));
                return spinI;

            case DOUBLE:
                double minD = param.min() != null ? ((Number) param.min()).doubleValue() : -Double.MAX_VALUE;
                double maxD = param.max() != null ? ((Number) param.max()).doubleValue() : Double.MAX_VALUE;
                double valD = ((Number) param.defaultValue()).doubleValue();
                JSpinner spinD = new JSpinner(new SpinnerNumberModel(valD, minD, maxD, 0.1));
                return spinD;

            case BOOLEAN:
                JCheckBox check = new JCheckBox();
                check.setSelected((boolean) param.defaultValue());
                return check;

            case STRING:
                if (param.options() != null && !param.options().isEmpty()) {
                    JComboBox<String> combo = new JComboBox<>(param.options().toArray(new String[0]));
                    combo.setSelectedItem(param.defaultValue());
                    return combo;
                }
                JTextField text = new JTextField((String) param.defaultValue());
                return text;

            default:
                return new JLabel("Unsupported Type");
        }
    }

    public Map<String, Object> getValues() {
        Map<String, Object> values = new HashMap<>();

        // Inject Dimensions
        PaperSize size = (PaperSize) paperSizeSelector.getSelectedItem();
        values.put("width", size.getWidthPx());
        values.put("height", size.getHeightPx());
        values.put("paperSize", size.name()); // might be useful

        for (Map.Entry<String, JComponent> entry : inputs.entrySet()) {
            JComponent input = entry.getValue();
            if (input instanceof JSpinner) {
                values.put(entry.getKey(), ((JSpinner) input).getValue());
            } else if (input instanceof JCheckBox) {
                values.put(entry.getKey(), ((JCheckBox) input).isSelected());
            } else if (input instanceof JTextField) {
                values.put(entry.getKey(), ((JTextField) input).getText());
            } else if (input instanceof JComboBox) {
                values.put(entry.getKey(), ((JComboBox<?>) input).getSelectedItem());
            }
        }
        return values;
    }
}
