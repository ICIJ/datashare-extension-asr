package org.icij.datashare;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.codestory.http.Context;
import net.codestory.http.annotations.Get;
import net.codestory.http.annotations.Post;
import net.codestory.http.annotations.Prefix;
import net.codestory.http.payload.Payload;
import org.icij.datashare.utils.JsonPayload;
import org.icij.datashare.asynctasks.Group;
import org.icij.datashare.asynctasks.Task;
import org.icij.datashare.asynctasks.TaskManager;
import org.icij.datashare.user.User;

import com.google.inject.Inject;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Prefix("/api/asr")
public class AsrResource {
    public static final String AVAILABLE_MODELS_PATH = "/available-models.json";
    static final String ASR_WORKFLOW = "asr.transcription";
    static final String ASR_GROUP = "Python";

    private static final ObjectMapper mapper = new ObjectMapper();

    private final String availableModels;
    private final Map<String, List<String>> modelsMap;
    private final TaskManager taskManager;

    record TaskResponse(String taskId) {}
    record ErrorResponse(String error) {}

    @Inject
    public AsrResource(TaskManager taskManager) {
        this(AVAILABLE_MODELS_PATH, taskManager);
    }

    AsrResource(String resourcePath, TaskManager taskManager) {
        this.availableModels = loadAvailableModels(resourcePath);
        this.modelsMap = parseModels(this.availableModels);
        this.taskManager = taskManager;
    }

    @Get("/models")
    public Payload getModels() {
        return availableModels.isEmpty()
                ? new Payload(503)
                : new Payload("application/json", availableModels);
    }

    @Post("/transcribe")
    public Payload transcribe(Context context) throws IOException {
        if (!taskManager.getHealth()) {
            return new JsonPayload(503, new ErrorResponse("task manager is unavailable"));
        }

        Map<String, Object> body = mapper.readValue(
                context.request().contentAsBytes(), new TypeReference<>() {});

        String project = (String) body.get("project");
        if (project == null || project.isBlank()) {
            return new JsonPayload(400, new ErrorResponse("missing project"));
        }

        Object docs = body.get("docs");
        if (docs == null) {
            return new JsonPayload(400, new ErrorResponse("missing docs"));
        }

        Map<String, Object> taskArgs = new HashMap<>();
        taskArgs.put("project", project);
        taskArgs.put("docs", docs);
        if (body.containsKey("config")) {
            taskArgs.put("config", body.get("config"));
        }
        taskArgs.put("batch_size", body.getOrDefault("batch_size", 2));

        User user = context.currentUser() != null
                ? (User) context.currentUser()
                : User.local();
        Task<String> task = new Task<>(ASR_WORKFLOW, user, taskArgs);
        String taskId = taskManager.startTask(task, new Group(ASR_GROUP));

        return new JsonPayload(201, new TaskResponse(taskId));
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

    private static Map<String, List<String>> parseModels(String json) {
        if (json.isEmpty()) return Map.of();
        try {
            return mapper.readValue(json, new TypeReference<>() {});
        } catch (IOException e) {
            return Map.of();
        }
    }
}
