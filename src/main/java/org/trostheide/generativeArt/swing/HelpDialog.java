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
        setSize(680, 560);
        setLocationRelativeTo(owner);
        setLayout(new BorderLayout());

        // Match the app's dark theme
        getContentPane().setBackground(MainFrame.SIDEBAR_BG);

        JEditorPane editorPane = new JEditorPane();
        editorPane.setEditable(false);
        editorPane.setContentType("text/html");
        editorPane.setBackground(MainFrame.BG_COLOR);
        editorPane.setForeground(Color.WHITE);

        String content = loadHelpContent(generator);
        editorPane.setText(content);
        editorPane.setCaretPosition(0);

        JScrollPane scrollPane = new JScrollPane(editorPane);
        scrollPane.setBorder(BorderFactory.createEmptyBorder(12, 12, 0, 12));
        scrollPane.setBackground(MainFrame.SIDEBAR_BG);
        scrollPane.getViewport().setBackground(MainFrame.BG_COLOR);
        add(scrollPane, BorderLayout.CENTER);

        JPanel bottom = new JPanel(new FlowLayout(FlowLayout.RIGHT, 12, 8));
        bottom.setBackground(MainFrame.SIDEBAR_BG);
        bottom.setBorder(BorderFactory.createMatteBorder(1, 0, 0, 0, MainFrame.BORDER_COLOR));

        JButton closeBtn = new JButton("Close");
        closeBtn.setFocusPainted(false);
        closeBtn.addActionListener(e -> dispose());
        bottom.add(closeBtn);
        add(bottom, BorderLayout.SOUTH);

        // ESC key to close
        getRootPane().registerKeyboardAction(e -> dispose(),
                KeyStroke.getKeyStroke("ESCAPE"),
                JComponent.WHEN_IN_FOCUSED_WINDOW);
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
                return wrapHtml("<h1 style='color: #38bdf8;'>No Help Found</h1>"
                        + "<p>Expected file: <code>" + filename + "</code></p>");
            }
        } catch (Exception e) {
            return wrapHtml("<h1 style='color: #ef4444;'>Error</h1>"
                    + "<p>" + e.getMessage() + "</p>");
        }
    }

    private String wrapHtml(String body) {
        return "<html><body style='"
                + "font-family: -apple-system, \"Segoe UI\", sans-serif; "
                + "padding: 16px; "
                + "color: #e2e8f0; "
                + "background-color: #0f172a; "
                + "line-height: 1.6;"
                + "'>"
                + body
                + "</body></html>";
    }

    private String parseMarkdown(String md) {
        StringBuilder html = new StringBuilder();
        html.append("<html><head><style>");
        html.append("body { font-family: -apple-system, 'Segoe UI', sans-serif; ");
        html.append("padding: 16px; color: #e2e8f0; background-color: #0f172a; line-height: 1.6; }");
        html.append("h1 { color: #38bdf8; font-size: 20px; margin-top: 0; margin-bottom: 12px; }");
        html.append("h2 { color: #94a3b8; font-size: 16px; margin-top: 20px; margin-bottom: 8px; ");
        html.append("border-bottom: 1px solid #334155; padding-bottom: 4px; }");
        html.append("h3 { color: #cbd5e1; font-size: 14px; margin-top: 16px; margin-bottom: 6px; }");
        html.append("p { margin: 6px 0; }");
        html.append("code { background-color: #1e293b; color: #38bdf8; padding: 2px 6px; ");
        html.append("border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 12px; }");
        html.append("table { border-collapse: collapse; width: 100%; margin: 8px 0; }");
        html.append("td, th { padding: 8px 10px; border: 1px solid #334155; }");
        html.append("tr:nth-child(even) { background-color: #1e293b; }");
        html.append("ul { padding-left: 20px; }");
        html.append("li { margin: 4px 0; }");
        html.append("</style></head><body>");

        String[] lines = md.split("\n");
        boolean inTable = false;
        boolean inList = false;

        for (String line : lines) {
            String trimmed = line.trim();

            if (trimmed.isEmpty()) {
                if (inList) {
                    html.append("</ul>");
                    inList = false;
                }
                continue;
            }

            // Headers
            if (trimmed.startsWith("### ")) {
                closeList(html, inList); inList = false;
                html.append("<h3>").append(processInline(trimmed.substring(4))).append("</h3>");
            } else if (trimmed.startsWith("## ")) {
                closeList(html, inList); inList = false;
                html.append("<h2>").append(processInline(trimmed.substring(3))).append("</h2>");
            } else if (trimmed.startsWith("# ")) {
                closeList(html, inList); inList = false;
                html.append("<h1>").append(processInline(trimmed.substring(2))).append("</h1>");
            }
            // Tables
            else if (trimmed.startsWith("|")) {
                if (!inTable) {
                    html.append("<table>");
                    inTable = true;
                }
                if (trimmed.contains("---")) continue;
                html.append("<tr>");
                for (String cell : trimmed.split("\\|")) {
                    if (!cell.trim().isEmpty()) {
                        html.append("<td>").append(processInline(cell.trim())).append("</td>");
                    }
                }
                html.append("</tr>");
            }
            // List items
            else if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
                if (inTable) { html.append("</table>"); inTable = false; }
                if (!inList) { html.append("<ul>"); inList = true; }
                html.append("<li>").append(processInline(trimmed.substring(2).trim())).append("</li>");
            }
            else if (trimmed.startsWith("    * ") || trimmed.startsWith("    - ")) {
                // Nested list item — render as indented
                if (!inList) { html.append("<ul>"); inList = true; }
                html.append("<li style='margin-left: 16px;'>").append(processInline(trimmed.trim().substring(2).trim())).append("</li>");
            }
            // Paragraph
            else {
                if (inTable) { html.append("</table>"); inTable = false; }
                closeList(html, inList); inList = false;
                html.append("<p>").append(processInline(trimmed)).append("</p>");
            }
        }

        if (inTable) html.append("</table>");
        closeList(html, inList);
        html.append("</body></html>");
        return html.toString();
    }

    private void closeList(StringBuilder html, boolean inList) {
        if (inList) html.append("</ul>");
    }

    private String processInline(String text) {
        // Bold
        text = text.replaceAll("\\*\\*(.*?)\\*\\*", "<b>$1</b>");
        // Inline code
        text = text.replaceAll("`(.*?)`", "<code>$1</code>");
        return text;
    }
}
