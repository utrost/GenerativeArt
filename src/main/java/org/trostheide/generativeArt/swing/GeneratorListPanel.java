package org.trostheide.generativeArt.swing;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.GeneratorRegistry;

import javax.swing.*;
import javax.swing.border.EmptyBorder;
import javax.swing.event.DocumentEvent;
import javax.swing.event.DocumentListener;
import java.awt.*;
import java.util.ArrayList;
import java.util.List;
import java.util.function.Consumer;

public class GeneratorListPanel extends JPanel {

    private final DefaultListModel<ArtGenerator> model;
    private final JList<ArtGenerator> list;
    private final List<ArtGenerator> allGenerators;

    public GeneratorListPanel(Consumer<ArtGenerator> onSelect) {
        setLayout(new BorderLayout(0, 0));
        setBackground(MainFrame.SIDEBAR_BG);
        setBorder(BorderFactory.createEmptyBorder(0, 0, 0, 0));

        allGenerators = new ArrayList<>(GeneratorRegistry.getAll());

        // Section label
        JLabel sectionLabel = new JLabel("GENERATORS");
        sectionLabel.setFont(new Font("SansSerif", Font.BOLD, 10));
        sectionLabel.setForeground(MainFrame.TEXT_SECONDARY);
        sectionLabel.setBorder(BorderFactory.createEmptyBorder(8, 16, 4, 16));

        // Search field
        JTextField searchField = new JTextField();
        searchField.putClientProperty("JTextField.placeholderText", "Search generators...");
        searchField.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createEmptyBorder(4, 12, 8, 12),
                searchField.getBorder()));
        searchField.setBackground(MainFrame.BG_COLOR);
        searchField.setForeground(Color.WHITE);
        searchField.setCaretColor(MainFrame.ACCENT);

        JPanel topPanel = new JPanel(new BorderLayout(0, 0));
        topPanel.setBackground(MainFrame.SIDEBAR_BG);
        topPanel.add(sectionLabel, BorderLayout.NORTH);
        topPanel.add(searchField, BorderLayout.SOUTH);
        add(topPanel, BorderLayout.NORTH);

        // Generator list
        model = new DefaultListModel<>();
        for (ArtGenerator gen : allGenerators) {
            model.addElement(gen);
        }

        list = new JList<>(model);
        list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        list.setBackground(MainFrame.SIDEBAR_BG);
        list.setForeground(Color.WHITE);
        list.setFixedCellHeight(36);
        list.setCellRenderer(new GeneratorCellRenderer());

        list.addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting() && list.getSelectedValue() != null) {
                onSelect.accept(list.getSelectedValue());
            }
        });

        // Filter on search
        searchField.getDocument().addDocumentListener(new DocumentListener() {
            @Override
            public void insertUpdate(DocumentEvent e) { filter(); }
            @Override
            public void removeUpdate(DocumentEvent e) { filter(); }
            @Override
            public void changedUpdate(DocumentEvent e) { filter(); }

            private void filter() {
                String query = searchField.getText().toLowerCase().trim();
                ArtGenerator selected = list.getSelectedValue();
                model.clear();
                for (ArtGenerator gen : allGenerators) {
                    if (query.isEmpty() || gen.getDisplayName().toLowerCase().contains(query)
                            || gen.getId().toLowerCase().contains(query)) {
                        model.addElement(gen);
                    }
                }
                // Restore selection if still visible
                if (selected != null && model.contains(selected)) {
                    list.setSelectedValue(selected, true);
                }
            }
        });

        JScrollPane scrollPane = new JScrollPane(list);
        scrollPane.setBorder(BorderFactory.createEmptyBorder());
        scrollPane.setBackground(MainFrame.SIDEBAR_BG);
        scrollPane.getViewport().setBackground(MainFrame.SIDEBAR_BG);
        scrollPane.setPreferredSize(new Dimension(340, 260));
        add(scrollPane, BorderLayout.CENTER);
    }

    /**
     * Custom cell renderer with better spacing, hover-style highlights, and an accent bar.
     */
    private static class GeneratorCellRenderer extends JPanel implements ListCellRenderer<ArtGenerator> {

        private final JLabel nameLabel;
        private final JLabel idLabel;
        private boolean isSelected;

        GeneratorCellRenderer() {
            setLayout(new BorderLayout(8, 0));
            setBorder(new EmptyBorder(6, 16, 6, 12));
            setOpaque(true);

            nameLabel = new JLabel();
            nameLabel.setFont(new Font("SansSerif", Font.PLAIN, 13));

            idLabel = new JLabel();
            idLabel.setFont(new Font("SansSerif", Font.PLAIN, 10));
            idLabel.setForeground(MainFrame.TEXT_SECONDARY);

            JPanel textPanel = new JPanel(new BorderLayout(0, 1));
            textPanel.setOpaque(false);
            textPanel.add(nameLabel, BorderLayout.CENTER);
            textPanel.add(idLabel, BorderLayout.SOUTH);

            add(textPanel, BorderLayout.CENTER);
        }

        @Override
        public Component getListCellRendererComponent(JList<? extends ArtGenerator> list,
                                                      ArtGenerator value, int index,
                                                      boolean isSelected, boolean cellHasFocus) {
            this.isSelected = isSelected;

            nameLabel.setText(value.getDisplayName());
            idLabel.setText(value.getId());

            if (isSelected) {
                setBackground(new Color(MainFrame.ACCENT.getRed(), MainFrame.ACCENT.getGreen(),
                        MainFrame.ACCENT.getBlue(), 30));
                nameLabel.setForeground(MainFrame.ACCENT);
                idLabel.setForeground(new Color(MainFrame.ACCENT.getRed(), MainFrame.ACCENT.getGreen(),
                        MainFrame.ACCENT.getBlue(), 150));
            } else {
                setBackground(MainFrame.SIDEBAR_BG);
                nameLabel.setForeground(new Color(0xF8, 0xFA, 0xFC));
                idLabel.setForeground(MainFrame.TEXT_SECONDARY);
            }

            return this;
        }

        @Override
        protected void paintComponent(Graphics g) {
            super.paintComponent(g);
            // Draw accent bar on left for selected item
            if (isSelected) {
                Graphics2D g2 = (Graphics2D) g;
                g2.setColor(MainFrame.ACCENT);
                g2.fillRoundRect(4, 6, 3, getHeight() - 12, 3, 3);
            }
        }
    }
}
