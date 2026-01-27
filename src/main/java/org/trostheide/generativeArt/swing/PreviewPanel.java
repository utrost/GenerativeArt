package org.trostheide.generativeArt.swing;

import com.github.weisj.jsvg.SVGDocument;
import com.github.weisj.jsvg.parser.SVGLoader;
import org.trostheide.generativeArt.core.PaperSize;

import javax.swing.*;
import java.awt.*;
import java.awt.geom.Rectangle2D;
import java.io.ByteArrayInputStream;
import java.io.File;
import java.io.FileWriter;
import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class PreviewPanel extends JPanel {

    private SVGDocument document;
    private String lastSvgContent;
    private final SVGLoader loader = new SVGLoader();
    private PaperSize currentPaperSize = PaperSize.A4_PORTRAIT;

    public PreviewPanel() {
        setLayout(new BorderLayout());
        setBackground(new Color(220, 220, 220)); // Worktable grey
        setBorder(BorderFactory.createTitledBorder("Preview"));

        JToolBar toolBar = new JToolBar();
        toolBar.setFloatable(false);
        JButton btnSave = new JButton("Save SVG");
        btnSave.addActionListener(e -> saveSVG());
        toolBar.add(Box.createHorizontalGlue());
        toolBar.add(btnSave);
        add(toolBar, BorderLayout.NORTH);

        JPanel canvas = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                drawCanvas(g);
            }
        };
        canvas.setOpaque(false); // Let panel bg show
        add(canvas, BorderLayout.CENTER);
    }

    public void setPaperSize(PaperSize size) {
        this.currentPaperSize = size;
        repaint();
    }

    public void renderSVG(String svgContent, PaperSize size) {
        this.lastSvgContent = svgContent;
        this.currentPaperSize = size;

        // Parse SVG
        ByteArrayInputStream is = new ByteArrayInputStream(svgContent.getBytes(StandardCharsets.UTF_8));
        this.document = loader.load(is);
        repaint();
    }

    public void clear() {
        this.document = null;
        this.lastSvgContent = null;
        repaint();
    }

    private void drawCanvas(Graphics g) {
        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);

        int w = getWidth();
        int h = getHeight();

        // Paper Dimensions in Pixels (at 96 DPI screen res approx)
        double paperW = currentPaperSize.getWidthPx();
        double paperH = currentPaperSize.getHeightPx();

        // Calculate Scale to fit paper in view
        double scale = Math.min((w - 40) / paperW, (h - 40) / paperH);
        if (scale > 2.0)
            scale = 2.0; // Limit zoom

        double dispW = paperW * scale;
        double dispH = paperH * scale;
        double x = (w - dispW) / 2;
        double y = (h - dispH) / 2;

        // Draw Drop Shadow
        g2.setColor(new Color(0, 0, 0, 50));
        g2.fill(new Rectangle2D.Double(x + 5, y + 5, dispW, dispH));

        // Draw Paper
        g2.setColor(Color.WHITE);
        g2.fill(new Rectangle2D.Double(x, y, dispW, dispH));
        g2.setColor(Color.BLACK);
        g2.draw(new Rectangle2D.Double(x, y, dispW, dispH));

        // Render SVG if exists
        if (document != null) {
            g2.translate(x, y);
            g2.scale(scale, scale);
            // JSVG renders to the current viewport.
            // We assume the SVG defines its own viewBox that matches the paper size if
            // generated correctly.
            // But if we pass specific viewBox to render(), let's match paper.

            document.render(this, g2,
                    new com.github.weisj.jsvg.attributes.ViewBox(0, 0, (float) paperW, (float) paperH));

            // Untransform
            g2.scale(1 / scale, 1 / scale);
            g2.translate(-x, -y);
        } else {
            g2.setColor(Color.GRAY);
            String msg = "Select a generator and click Generate";
            FontMetrics fm = g2.getFontMetrics();
            g2.drawString(msg, (int) (x + (dispW - fm.stringWidth(msg)) / 2), (int) (y + dispH / 2));
        }
    }

    private void saveSVG() {
        if (lastSvgContent == null) {
            JOptionPane.showMessageDialog(this, "Nothing to save. Generate art first.", "Warning",
                    JOptionPane.WARNING_MESSAGE);
            return;
        }

        JFileChooser fileChooser = new JFileChooser();
        fileChooser.setDialogTitle("Save SVG");
        fileChooser.setSelectedFile(new File("art.svg"));

        if (fileChooser.showSaveDialog(this) == JFileChooser.APPROVE_OPTION) {
            File file = fileChooser.getSelectedFile();
            if (!file.getName().toLowerCase().endsWith(".svg")) {
                file = new File(file.getParentFile(), file.getName() + ".svg");
            }

            try (FileWriter fw = new FileWriter(file)) {
                fw.write(lastSvgContent);
                JOptionPane.showMessageDialog(this, "Saved to " + file.getAbsolutePath());
            } catch (IOException e) {
                e.printStackTrace();
                JOptionPane.showMessageDialog(this, "Error saving file: " + e.getMessage(), "Error",
                        JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}
