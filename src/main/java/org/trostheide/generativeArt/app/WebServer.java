package org.trostheide.generativeArt.app;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import org.trostheide.generativeArt.core.ArtGenerator;
import org.trostheide.generativeArt.core.GeneratorRegistry;
import org.trostheide.generativeArt.core.SimpleJson;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.Optional;

public class WebServer {
    private static final int PORT = 8080;

    public void start() throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(PORT), 0);
        server.createContext("/", new StaticHandler());
        server.createContext("/api/generators", new GeneratorsHandler());
        server.createContext("/api/generate", new GenerateHandler());
        server.createContext("/api/help", new HelpHandler());
        server.setExecutor(null); // creates a default executor
        server.start();
        System.out.println("Server started on http://localhost:" + PORT);
    }

    static class StaticHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String path = t.getRequestURI().getPath();
            if (path.equals("/"))
                path = "/index.html";

            // In development, strict path checking is safer.
            // We expect the file to be in src/main/resources/web/index.html during dev
            // OR in the classpath. For simplicity in this dev environment, we'll try to
            // read from src first.

            Path file = Paths.get("src/main/resources/web" + path);
            if (!Files.exists(file)) {
                String response = "404 (Not Found)\n";
                t.sendResponseHeaders(404, response.length());
                OutputStream os = t.getResponseBody();
                os.write(response.getBytes());
                os.close();
                return;
            }

            byte[] bytes = Files.readAllBytes(file);

            if (path.endsWith(".html"))
                t.getResponseHeaders().set("Content-Type", "text/html");
            else if (path.endsWith(".js"))
                t.getResponseHeaders().set("Content-Type", "application/javascript");
            else if (path.endsWith(".css"))
                t.getResponseHeaders().set("Content-Type", "text/css");

            t.sendResponseHeaders(200, bytes.length);
            OutputStream os = t.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }

    static class GeneratorsHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String response = SimpleJson.toJson(GeneratorRegistry.getAll());
            t.getResponseHeaders().set("Content-Type", "application/json");
            t.sendResponseHeaders(200, response.length());
            OutputStream os = t.getResponseBody();
            os.write(response.getBytes(StandardCharsets.UTF_8));
            os.close();
        }
    }

    static class GenerateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            if (!"POST".equalsIgnoreCase(t.getRequestMethod())) {
                t.sendResponseHeaders(405, -1);
                return;
            }

            InputStream is = t.getRequestBody();
            String body = new String(is.readAllBytes(), StandardCharsets.UTF_8);
            Map<String, Object> req = SimpleJson.parseFlatMap(body);

            String id = (String) req.get("id");
            if (id == null) {
                String err = "Missing 'id'";
                t.sendResponseHeaders(400, err.length());
                t.getResponseBody().write(err.getBytes());
                t.close();
                return;
            }

            Optional<ArtGenerator> genOpt = GeneratorRegistry.getById(id);
            if (genOpt.isEmpty()) {
                String err = "Generator not found: " + id;
                t.sendResponseHeaders(404, err.length());
                t.getResponseBody().write(err.getBytes());
                t.close();
                return;
            }

            try {
                String svg = genOpt.get().generate(req);
                t.getResponseHeaders().set("Content-Type", "image/svg+xml");
                byte[] bytes = svg.getBytes(StandardCharsets.UTF_8);
                t.sendResponseHeaders(200, bytes.length);
                OutputStream os = t.getResponseBody();
                os.write(bytes);
                os.close();
            } catch (Exception e) {
                e.printStackTrace();
                String err = "Error generating: " + e.getMessage();
                t.sendResponseHeaders(500, err.length());
                t.getResponseBody().write(err.getBytes());
                t.close();
            }
        }
    }

    static class HelpHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            if (!"GET".equalsIgnoreCase(t.getRequestMethod())) {
                t.sendResponseHeaders(405, -1);
                return;
            }

            String query = t.getRequestURI().getQuery();
            String id = null;
            if (query != null && query.startsWith("id=")) {
                id = query.split("=")[1];
            }

            if (id == null) {
                String err = "Missing 'id' parameter";
                t.sendResponseHeaders(400, err.length());
                t.getResponseBody().write(err.getBytes());
                t.close();
                return;
            }

            Optional<ArtGenerator> genOpt = GeneratorRegistry.getById(id);
            if (genOpt.isEmpty()) {
                String err = "Generator not found";
                t.sendResponseHeaders(404, err.length());
                t.getResponseBody().write(err.getBytes());
                t.close();
                return;
            }

            // Map class name to readme file
            // E.g. LSystemGenerator -> Readme_LSystemGenerator.md
            String className = genOpt.get().getClass().getSimpleName();
            String filename = "Readme_" + className + ".md";
            Path file = Paths.get(filename);

            if (!Files.exists(file)) {
                String msg = "# No Help Available\nSorry, no help file found for this generator (" + filename + ").";
                // Return 200 with message so UI shows it, or 404?
                // Let's return the message as content.
                t.getResponseHeaders().set("Content-Type", "text/markdown");
                t.sendResponseHeaders(200, msg.length());
                t.getResponseBody().write(msg.getBytes());
                t.close();
                return;
            }

            byte[] bytes = Files.readAllBytes(file);
            t.getResponseHeaders().set("Content-Type", "text/markdown");
            t.sendResponseHeaders(200, bytes.length);
            OutputStream os = t.getResponseBody();
            os.write(bytes);
            os.close();
        }
    }
}
