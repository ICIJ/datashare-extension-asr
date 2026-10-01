package org.icij.datashare;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.inject.Inject;
import com.google.inject.Singleton;
import net.codestory.http.Context;
import net.codestory.http.annotations.Get;
import net.codestory.http.annotations.Post;
import net.codestory.http.annotations.Prefix;
import net.codestory.http.payload.Payload;
import org.icij.datashare.asynctasks.Group;
import org.icij.datashare.asynctasks.Task;
import org.icij.datashare.asynctasks.TaskManager;
import org.icij.datashare.user.User;
import org.icij.datashare.utils.JsonPayload;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;

@Singleton
@Prefix("/api/asr")
public class AsrResource {
    public static final String AVAILABLE_MODELS_PATH = "/available-models.json";
    static final String ASR_WORKFLOW = "asr.transcription";
    static final String ASR_GROUP = "Python";
    static final String TRANSCRIPTION_FILENAME = "transcription.json";
    private static final ObjectMapper mapper = new ObjectMapper();
    private final String availableModels;
    private final TaskManager taskManager;
    private final PropertiesProvider propertiesProvider;

    record TaskResponse(String taskId) {}

    record ErrorResponse(String error) {}

    @Inject
    public AsrResource(TaskManager taskManager, PropertiesProvider propertiesProvider) {
        this(AVAILABLE_MODELS_PATH, taskManager, propertiesProvider);
    }

    AsrResource(String resourcePath, TaskManager taskManager, PropertiesProvider propertiesProvider) {
        this.availableModels = loadAvailableModels(resourcePath);
        this.taskManager = taskManager;
        this.propertiesProvider = propertiesProvider;
    }

    @Get("/models")
    public Payload getModels() {
        return availableModels.isEmpty() ? new Payload(503) : new Payload("application/json", availableModels);
    }

    @Post("/transcribe")
    public Payload transcribe(Context context) throws IOException {
        if (!taskManager.getHealth()) {
            return new JsonPayload(503, new ErrorResponse("task manager is unavailable"));
        }

        Map<String, Object> body = mapper.readValue(context.request().contentAsBytes(), new TypeReference<>() {});

        String project = (String) body.get("project");
        if (project == null || project.isBlank()) {
            return new JsonPayload(400, new ErrorResponse("missing project"));
        }

        User user = (User) context.currentUser();
        if (!user.isGranted(project)) {
            throw new net.codestory.http.errors.UnauthorizedException();
        }

        Object docs = body.get("docs");
        if (docs == null) {
            return new JsonPayload(400, new ErrorResponse("missing docs"));
        }

        String language = (String) body.get("language");
        if (language == null || language.isBlank()) {
            return new JsonPayload(400, new ErrorResponse("missing language"));
        }

        Map<String, Object> taskArgs = new HashMap<>();
        taskArgs.put("project", project);
        taskArgs.put("docs", docs);
        taskArgs.put("language", toDatashareLanguage(language));
        if (body.containsKey("model")) {
            taskArgs.put("config", AsrConfig.fromModel((String) body.get("model")));
        }
        taskArgs.put("batch_size", body.getOrDefault("batch_size", 2));

        Task<String> task = new Task<>(ASR_WORKFLOW, user, taskArgs);
        String taskId = taskManager.startTask(task, new Group(ASR_GROUP));

        return new JsonPayload(201, new TaskResponse(taskId));
    }

    @Get("/transcription/:project/:docId")
    public Payload getTranscription(String project, String docId, Context context) {
        User user = (User) context.currentUser();
        if (!user.isGranted(project)) {
            throw new net.codestory.http.errors.UnauthorizedException();
        }

        String artifactDir = propertiesProvider.get("artifactDir").orElse(null);
        if (artifactDir == null) {
            return new JsonPayload(503, new ErrorResponse("artifact directory is not configured"));
        }

        if (!docId.matches("[A-Za-z0-9]{4,}")) {
            return new JsonPayload(400, new ErrorResponse("invalid document id"));
        }
        Path transcriptionPath = Path.of(artifactDir, project, docId.substring(0, 2), docId.substring(2, 4), docId,
                                         TRANSCRIPTION_FILENAME);

        if (!Files.exists(transcriptionPath)) {
            return new Payload(404);
        }

        try {
            String content = Files.readString(transcriptionPath);
            return new Payload("application/json", content);
        } catch (IOException e) {
            return new JsonPayload(500, new ErrorResponse("failed to read transcription"));
        }
    }

    static String toDatashareLanguage(String isoCode) {
        return Locale.forLanguageTag(isoCode).getDisplayLanguage(Locale.ENGLISH).toUpperCase();
    }

    private static String loadAvailableModels(String resourcePath) {
        try (InputStream stream = AsrResource.class.getResourceAsStream(resourcePath)) {
            if (stream == null) {
                return "";
            }
            return new String(stream.readAllBytes()).replaceAll("\\s+", "");
        } catch (IOException e) {
            return "";
        }
    }

}
