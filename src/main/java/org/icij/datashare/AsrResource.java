package org.icij.datashare;

import net.codestory.http.annotations.Get;
import net.codestory.http.annotations.Prefix;
import net.codestory.http.payload.Payload;

import java.io.IOException;
import java.io.InputStream;

@Prefix("/api/asr")
public class AsrResource {
    public static final String AVAILABLE_MODELS_PATH = "/available-models.json";
    private final String availableModels;

    protected AsrResource() {
        this(AVAILABLE_MODELS_PATH);
    }

    protected AsrResource(String resourcePath) {
        this.availableModels = loadAvailableModels(resourcePath);
    }

    @Get("/models")
    public Payload getModels() {
        return new Payload("application/json", availableModels);
    }

    private static String loadAvailableModels(String resourcePath) {
        try (InputStream stream = AsrResource.class.getResourceAsStream(resourcePath)) {
            if (stream == null) {
                throw new IllegalStateException(resourcePath + " not found in classpath");
            }
            return new String(stream.readAllBytes());
        } catch (IOException e) {
            throw new IllegalStateException("failed to load " + resourcePath, e);
        }
    }
}
