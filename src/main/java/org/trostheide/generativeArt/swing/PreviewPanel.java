package org.trostheide.generativeArt.swing;

import com.github.weisj.jsvg.SVGDocument;
import com.github.weisj.jsvg.parser.SVGLoader;
import org.trostheide.generativeArt.core.PaperSize;

import javax.swing.*;
import java.awt.*;
import java.awt.event.MouseAdapter;
import java.awt.event.MouseEvent;
import java.awt.event.MouseWheelEvent;
import java.awt.geom.Rectangle2D;
import java.awt.geom.RoundRectangle2D;
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
    private final JPanel canvas;
    private double zoomLevel = 1.0;
    private final JLabel zoomLabel;

    // Colors
    private static final Color CANVAS_BG = MainFrame.BG_COLOR;
    private static final Color SHADOW_COLOR = new Color(0, 0, 0, 80);
    private static final Color PAPER_BORDER = new Color(0x33, 0x41, 0x55, 120);

    public PreviewPanel() {
        setLayout(new BorderLayout());
        setBackground(CANVAS_BG);
        setBorder(BorderFactory.createEmptyBorder());

        // Toolbar
        JToolBar toolBar = new JToolBar();
        toolBar.setFloatable(false);
        toolBar.setBackground(MainFrame.SIDEBAR_BG);
        toolBar.setBorder(BorderFactory.createCompoundBorder(
                BorderFactory.createMatteBorder(0, 0, 1, 0, MainFrame.BORDER_COLOR),
                BorderFactory.createEmptyBorder(4, 8, 4, 8)));

        JLabel previewLabel = new JLabel("PREVIEW");
        previewLabel.setFont(new Font("SansSerif", Font.BOLD, 10));
        previewLabel.setForeground(MainFrame.TEXT_SECONDARY);
        toolBar.add(previewLabel);

        toolBar.add(Box.createHorizontalGlue());

        // Zoom controls
        JButton zoomOutBtn = createToolButton("-");
        zoomOutBtn.addActionListener(e -> adjustZoom(-0.1));
        toolBar.add(zoomOutBtn);

        zoomLabel = new JLabel("100%");
        zoomLabel.setForeground(MainFrame.TEXT_SECONDARY);
        zoomLabel.setFont(new Font("Monospaced", Font.PLAIN, 11));
        zoomLabel.setBorder(BorderFactory.createEmptyBorder(0, 6, 0, 6));
        toolBar.add(zoomLabel);

        JButton zoomInBtn = createToolButton("+");
        zoomInBtn.addActionListener(e -> adjustZoom(0.1));
        toolBar.add(zoomInBtn);

        JButton zoomResetBtn = createToolButton("Fit");
        zoomResetBtn.addActionListener(e -> {
            zoomLevel = 1.0;
            updateZoomLabel();
            canvas.repaint();
        });
        toolBar.add(zoomResetBtn);

        toolBar.addSeparator(new Dimension(12, 0));

        JButton btnSave = createToolButton("Save SVG");
        btnSave.addActionListener(e -> saveSVG());
        toolBar.add(btnSave);

        add(toolBar, BorderLayout.NORTH);

        // Canvas
        canvas = new JPanel() {
            @Override
            protected void paintComponent(Graphics g) {
                super.paintComponent(g);
                drawCanvas(g);
            }
        };
        canvas.setBackground(CANVAS_BG);
        canvas.setOpaque(true);

        // Mouse wheel zoom
        canvas.addMouseWheelListener(e -> {
            if (e.isControlDown()) {
                adjustZoom(e.getWheelRotation() < 0 ? 0.1 : -0.1);
            }
        });

        add(canvas, BorderLayout.CENTER);
    }

    private JButton createToolButton(String text) {
        JButton btn = new JButton(text);
        btn.setFocusPainted(false);
        btn.setFont(new Font("SansSerif", Font.PLAIN, 12));
        btn.setCursor(Cursor.getPredefinedCursor(Cursor.HAND_CURSOR));
        return btn;
    }

    private void adjustZoom(double delta) {
        zoomLevel = Math.max(0.2, Math.min(5.0, zoomLevel + delta));
        updateZoomLabel();
        canvas.repaint();
    }

    private void updateZoomLabel() {
        zoomLabel.setText(String.format("%d%%", (int) (zoomLevel * 100)));
    }

    public void setPaperSize(PaperSize size) {
        this.currentPaperSize = size;
        canvas.repaint();
    }

    public void renderSVG(String svgContent, PaperSize size) {
        this.lastSvgContent = svgContent;
        this.currentPaperSize = size;

        ByteArrayInputStream is = new ByteArrayInputStream(svgContent.getBytes(StandardCharsets.UTF_8));
        this.document = loader.load(is);
        canvas.repaint();
    }

    public void clear() {
        this.document = null;
        this.lastSvgContent = null;
        canvas.repaint();
    }

    private void drawCanvas(Graphics g) {
        Graphics2D g2 = (Graphics2D) g;
        g2.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_TEXT_ANTIALIASING, RenderingHints.VALUE_TEXT_ANTIALIAS_ON);
        g2.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);

        int w = canvas.getWidth();
        int h = canvas.getHeight();

        double paperW = currentPaperSize.getWidthPx();
        double paperH = currentPaperSize.getHeightPx();

        // Calculate scale to fit paper in view, then apply zoom
        int padding = 60;
        double baseScale = Math.min((w - padding * 2.0) / paperW, (h - padding * 2.0) / paperH);
        if (baseScale > 3.0) baseScale = 3.0;
        double scale = baseScale * zoomLevel;

        double dispW = paperW * scale;
        double dispH = paperH * scale;
        double x = (w - dispW) / 2;
        double y = (h - dispH) / 2;

        // Subtle checkerboard background pattern to indicate canvas area
        drawCheckerboard(g2, w, h);

        // Drop shadow (multi-layered for depth)
        for (int i = 3; i >= 0; i--) {
            int offset = 2 + i * 2;
            int alpha = 15 + i * 8;
            g2.setColor(new Color(0, 0, 0, alpha));
            g2.fill(new RoundRectangle2D.Double(x + offset, y + offset, dispW, dispH, 4, 4));
        }

        // Paper background
        g2.setColor(Color.WHITE);
        g2.fill(new RoundRectangle2D.Double(x, y, dispW, dispH, 2, 2));

        // Render SVG
        if (document != null) {
            // Clip to paper area
            Shape oldClip = g2.getClip();
            g2.setClip(new Rectangle2D.Double(x, y, dispW, dispH));

            g2.translate(x, y);
            g2.scale(scale, scale);
            document.render(canvas, g2,
                    new com.github.weisj.jsvg.attributes.ViewBox(0, 0, (float) paperW, (float) paperH));
            g2.scale(1 / scale, 1 / scale);
            g2.translate(-x, -y);

            g2.setClip(oldClip);
        } else {
            // Empty state
            drawEmptyState(g2, x, y, dispW, dispH);
        }

        // Paper border
        g2.setColor(PAPER_BORDER);
        g2.setStroke(new BasicStroke(1.0f));
        g2.draw(new RoundRectangle2D.Double(x, y, dispW, dispH, 2, 2));
    }

    private void drawCheckerboard(Graphics2D g2, int w, int h) {
        int size = 16;
        Color c1 = CANVAS_BG;
        Color c2 = new Color(
                Math.min(255, CANVAS_BG.getRed() + 6),
                Math.min(255, CANVAS_BG.getGreen() + 8),
                Math.min(255, CANVAS_BG.getBlue() + 14));

        for (int cy = 0; cy < h; cy += size) {
            for (int cx = 0; cx < w; cx += size) {
                boolean even = ((cx / size) + (cy / size)) % 2 == 0;
                g2.setColor(even ? c1 : c2);
                g2.fillRect(cx, cy, size, size);
            }
        }
    }

    private void drawEmptyState(Graphics2D g2, double x, double y, double dispW, double dispH) {
        // Centered placeholder text
        g2.setColor(new Color(0xBD, 0xBD, 0xBD));
        Font titleFont = new Font("SansSerif", Font.BOLD, 16);
        Font subtitleFont = new Font("SansSerif", Font.PLAIN, 12);

        String title = "Select a generator";
        String subtitle = "Choose from the list and click Generate";

        FontMetrics fmTitle = g2.getFontMetrics(titleFont);
        FontMetrics fmSub = g2.getFontMetrics(subtitleFont);

        int centerX = (int) (x + dispW / 2);
        int centerY = (int) (y + dispH / 2);

        g2.setFont(titleFont);
        g2.setColor(new Color(0x99, 0x99, 0x99));
        g2.drawString(title, centerX - fmTitle.stringWidth(title) / 2, centerY - 10);

        g2.setFont(subtitleFont);
        g2.setColor(new Color(0xBB, 0xBB, 0xBB));
        g2.drawString(subtitle, centerX - fmSub.stringWidth(subtitle) / 2, centerY + 14);
    }

    void saveSVG() {
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
                JOptionPane.showMessageDialog(this, "Saved to " + file.getAbsolutePath(),
                        "Saved", JOptionPane.INFORMATION_MESSAGE);
            } catch (IOException e) {
                e.printStackTrace();
                JOptionPane.showMessageDialog(this, "Error saving file: " + e.getMessage(),
                        "Error", JOptionPane.ERROR_MESSAGE);
            }
        }
    }
}
