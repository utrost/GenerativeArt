package org.trostheide.generativeArt.swing;

import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.GeneratorRegistry;

import javax.swing.*;
import java.awt.*;
import java.util.function.Consumer;

public class GeneratorListPanel extends JPanel {

    public GeneratorListPanel(Consumer<ArtGenerator> onSelect) {
        setLayout(new BorderLayout());
        setBorder(BorderFactory.createTitledBorder("Generators"));

        DefaultListModel<ArtGenerator> model = new DefaultListModel<>();
        for (ArtGenerator gen : GeneratorRegistry.getAll()) {
            model.addElement(gen);
        }

        JList<ArtGenerator> list = new JList<>(model);
        list.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
        list.setCellRenderer(new DefaultListCellRenderer() {
            @Override
            public Component getListCellRendererComponent(JList<?> list, Object value, int index, boolean isSelected,
                    boolean cellHasFocus) {
                super.getListCellRendererComponent(list, value, index, isSelected, cellHasFocus);
                if (value instanceof ArtGenerator) {
                    setText(((ArtGenerator) value).getDisplayName());
                }
                return this;
            }
        });

        list.addListSelectionListener(e -> {
            if (!e.getValueIsAdjusting() && list.getSelectedValue() != null) {
                onSelect.accept(list.getSelectedValue());
            }
        });

        add(new JScrollPane(list), BorderLayout.CENTER);
    }
}
