package org.trostheide.generativeArt.swing;

import org.trostheide.generativeArt.core.ArtGenerator;

import javax.swing.*;
import java.awt.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

public class HelpDialog extends JDialog {

    public HelpDialog(Frame owner, ArtGenerator generator) {
        super(owner, "Help: " + generator.getDisplayName(), true);
        setSize(600, 500);
        setLocationRelativeTo(owner);
        setLayout(new BorderLayout());

        JEditorPane editorPane = new JEditorPane();
        editorPane.setEditable(false);
        editorPane.setContentType("text/html");

        String content = loadHelpContent(generator);
        editorPane.setText(content);
        editorPane.setCaretPosition(0);

        add(new JScrollPane(editorPane), BorderLayout.CENTER);

        JButton closeBtn = new JButton("Close");
        closeBtn.addActionListener(e -> setVisible(false));
        JPanel bottom = new JPanel();
        bottom.add(closeBtn);
        add(bottom, BorderLayout.SOUTH);
    }

    private String loadHelpContent(ArtGenerator generator) {
        try {
            String className = generator.getClass().getSimpleName();
            String filename = "Readme_" + className + ".md";
            Path file = Paths.get(filename);

            if (Files.exists(file)) {
                String md = Files.readString(file);
                return parseMarkdown(md);
            } else {
                return "<html><body><h1>No Help Found</h1><p>Expected file: " + filename + "</p></body></html>";
            }
        } catch (Exception e) {
            return "<html><body><h1>Error</h1><p>" + e.getMessage() + "</p></body></html>";
        }
    }

    private String parseMarkdown(String md) {
        // Simple Parser similar to the JS one
        StringBuilder html = new StringBuilder("<html><body style='font-family: sans-serif; padding: 10px;'>");

        String[] lines = md.split("\n");
        boolean inTable = false;

        for (String line : lines) {
            line = line.trim();
            if (line.isEmpty())
                continue;

            if (line.startsWith("# ")) {
                html.append("<h1>").append(line.substring(2)).append("</h1>");
            } else if (line.startsWith("## ")) {
                html.append("<h2>").append(line.substring(3)).append("</h2>");
            } else if (line.startsWith("### ")) {
                html.append("<h3>").append(line.substring(4)).append("</h3>");
            } else if (line.startsWith("|")) {
                if (!inTable) {
                    html.append("<table border='1' style='border-collapse: collapse; width: 100%;'>");
                    inTable = true;
                }
                if (line.contains("---"))
                    continue;
                html.append("<tr>");
                for (String cell : line.split("\\|")) {
                    if (!cell.trim().isEmpty()) {
                        html.append("<td style='padding: 5px;'>").append(processInline(cell.trim())).append("</td>");
                    }
                }
                html.append("</tr>");
            } else {
                if (inTable) {
                    html.append("</table>");
                    inTable = false;
                }
                html.append("<p>").append(processInline(line)).append("</p>");
            }
        }

        if (inTable)
            html.append("</table>");
        html.append("</body></html>");
        return html.toString();
    }

    private String processInline(String text) {
        text = text.replaceAll("\\*\\*(.*?)\\*\\*", "<b>$1</b>");
        text = text.replaceAll("`(.*?)`", "<code style='background-color: #333; color: #eee;'>$1</code>");
        return text;
    }
}
