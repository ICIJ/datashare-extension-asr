package org.icij.datashare;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.codestory.rest.FluentRestTest;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

import java.util.List;
import java.util.Map;

import static org.fest.assertions.Assertions.assertThat;
import static org.fest.assertions.MapAssert.entry;

public class AsrResourceTest implements FluentRestTest {
    private static final String AVAILABLE_MODELS_PATH = "/available-models.json";

    @ClassRule
    public static ProdWebServerRule server = new ProdWebServerRule();
    private MockTaskManager taskManager;

    @Override
    public int port() {
        return server.port();
    }

    @Before
    public void setUp() {
        taskManager = new MockTaskManager();
        server.configure(routes -> routes.add(new AsrResource(AVAILABLE_MODELS_PATH, taskManager)));
    }

    @Test
    public void test_get_models_returns_200() {
        // WHEN
        var response = get("/api/asr/models");

        // THEN
        response.should().respond(200).haveType("application/json");
    }

    @Test
    public void test_get_models_returns_languages_and_models() throws Exception {
        // WHEN
        String body = get("/api/asr/models").response().content();
        Map<String, List<String>> models = new ObjectMapper().readValue(body, new TypeReference<>() {});

        // THEN
        assertThat(models.get("en")).contains("foo");
        assertThat(models.get("fr")).contains("bar");
    }

    @Test
    public void test_get_unknown_route_returns_404() {
        // WHEN
        var response = get("/api/asr/unknown");

        // THEN
        response.should().respond(404);
    }

    @Test
    public void test_transcribe_creates_task_and_returns_201() throws Exception {
        // WHEN
        String body = post("/api/asr/transcribe",
                "{\"project\":\"my-project\",\"docs\":[\"doc1\"]}")
                .response().content();
        Map<String, Object> response = new ObjectMapper().readValue(body, new TypeReference<>() {});

        // THEN
        assertThat(response.get("taskId")).isNotNull();
        assertThat(taskManager.startedTasks).hasSize(1);
        assertThat(taskManager.startedTasks.getFirst().name).isEqualTo("asr.transcription");
    }

    @Test
    public void test_transcribe_passes_args_to_task() throws Exception {
        // WHEN
        post("/api/asr/transcribe",
                "{\"project\":\"p\",\"docs\":[\"doc1\",\"doc2\"],\"batch_size\":5}")
                .should().respond(201);

        // THEN
        Map<String, Object> args = taskManager.startedTasks.getFirst().args;
        assertThat(args).includes(
                entry("project", "p"),
                entry("batch_size", 5)
        );
        assertThat((List<?>) args.get("docs")).containsOnly("doc1", "doc2");
    }

    @Test
    public void test_transcribe_default_batch_size() throws Exception {
        // WHEN
        post("/api/asr/transcribe",
                "{\"project\":\"p\",\"docs\":[\"doc1\"]}")
                .should().respond(201);

        // THEN
        assertThat(taskManager.startedTasks.getFirst().args.get("batch_size")).isEqualTo(2);
    }

    @Test
    public void test_transcribe_missing_project_returns_400() {
        // GIVEN
        String bodyWithoutProject = "{\"docs\":[\"doc1\"]}";

        // WHEN/THEN
        post("/api/asr/transcribe", bodyWithoutProject)
                .should().respond(400).contain("missing project");
    }

    @Test
    public void test_transcribe_missing_docs_returns_400() {
        // GIVEN
        String bodyWithoutDocs = "{\"project\":\"p\"}";

        // WHEN/THEN
        post("/api/asr/transcribe", bodyWithoutDocs)
                .should().respond(400).contain("missing docs");
    }

    @Test
    public void test_transcribe_returns_503_when_task_manager_is_down() {
        // GIVEN
        taskManager.setUp(false);

        // WHEN/THEN
        post("/api/asr/transcribe", "{\"project\":\"p\",\"docs\":[\"doc1\"]}")
                .should().respond(503).contain("task manager is unavailable");
    }
}
