package org.trostheide.generativeArt.app;

import org.trostheide.generativeArt.GenerativeRibbon;
import org.trostheide.generativeArt.FlowFieldGenerator;
import org.trostheide.generativeArt.core.GeneratorRegistry;

import java.io.IOException;

public class App {
    public static void main(String[] args) throws IOException {
        System.out.println("Starting Generative Art Control Center...");

        // Register Generators
        GeneratorRegistry.register(new GenerativeRibbon());
        GeneratorRegistry.register(new FlowFieldGenerator());
        GeneratorRegistry.register(new org.trostheide.generativeArt.LSystemGenerator());
        GeneratorRegistry.register(new org.trostheide.generativeArt.ReactionDiffusionGenerator());

        // Start Server
        WebServer server = new WebServer();
        server.start();

        System.out.println("Ready. Open http://localhost:8080");

        // Keep alive if not daemon (HttpServer default executor is background?
        // No, HttpServer.start() starts a background thread usually, but non-daemon by
        // default unless executor set?
        // Docs say 'start()' returns immediately. If created with null executor, it
        // uses a default one.
        // We need to prevent main from exiting if the server threads are daemon (they
        // shouldn't be).
        // Standard HttpServer threads are non-daemon, so this is fine.)
    }
}
