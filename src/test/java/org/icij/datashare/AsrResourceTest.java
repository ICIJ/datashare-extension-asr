package org.icij.datashare;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.codestory.http.filters.basic.BasicAuthFilter;
import net.codestory.rest.FluentRestTest;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.TemporaryFolder;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Properties;

import static org.fest.assertions.Assertions.assertThat;
import static org.fest.assertions.MapAssert.entry;

public class AsrResourceTest implements FluentRestTest {
    private static final String AVAILABLE_MODELS_PATH = "/available-models.json";
    private static final String USER_ID = "foo";
    private static final String PROJECT = USER_ID + "-datashare";

    @ClassRule
    public static ProdWebServerRule server = new ProdWebServerRule();
    @Rule
    public TemporaryFolder tmpFolder = new TemporaryFolder();
    private MockTaskManager taskManager;
    private PropertiesProvider propertiesProvider;

    @Override
    public int port() {
        return server.port();
    }

    @Before
    public void setUp() {
        taskManager = new MockTaskManager();
        Properties props = new Properties();
        props.setProperty("artifactDir", tmpFolder.getRoot().getAbsolutePath());
        propertiesProvider = new PropertiesProvider(props);
        server.configure(routes -> routes
                .add(new AsrResource(AVAILABLE_MODELS_PATH, taskManager, propertiesProvider))
                .filter(new BasicAuthFilter("/api", "ds", DatashareUser.singleUser(USER_ID))));
    }

    @Test
    public void test_get_models_returns_200() {
        // WHEN
        var response = get("/api/asr/models").withPreemptiveAuthentication(USER_ID, "null");

        // THEN
        response.should().respond(200).haveType("application/json");
    }

    @Test
    public void test_get_models_returns_languages_and_models() throws Exception {
        // WHEN
        String body = get("/api/asr/models")
                .withPreemptiveAuthentication(USER_ID, "null")
                .response().content();
        Map<String, List<String>> models = new ObjectMapper().readValue(body, new TypeReference<>() {});

        // THEN
        assertThat(models.get("en")).contains("foo");
        assertThat(models.get("fr")).contains("bar");
    }

    @Test
    public void test_get_unknown_route_returns_404() {
        // WHEN
        var response = get("/api/asr/unknown").withPreemptiveAuthentication(USER_ID, "null");

        // THEN
        response.should().respond(404);
    }

    @Test
    public void test_transcribe_creates_task_and_returns_201() throws Exception {
        // WHEN
        String body = post("/api/asr/transcribe",
                "{\"project\":\"" + PROJECT + "\",\"docs\":[\"doc1\"],\"language\":\"en\"}")
                .withPreemptiveAuthentication(USER_ID, "null")
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
                "{\"project\":\"" + PROJECT + "\",\"docs\":[\"doc1\",\"doc2\"],\"language\":\"en\",\"batch_size\":5}")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(201);

        // THEN
        Map<String, Object> args = taskManager.startedTasks.getFirst().args;
        assertThat(args).includes(
                entry("project", PROJECT),
                entry("batch_size", 5)
        );
        assertThat((List<?>) args.get("docs")).containsOnly("doc1", "doc2");
    }

    @Test
    public void test_transcribe_default_batch_size() throws Exception {
        // WHEN
        post("/api/asr/transcribe",
                "{\"project\":\"" + PROJECT + "\",\"docs\":[\"doc1\"],\"language\":\"en\"}")
                .withPreemptiveAuthentication(USER_ID, "null")
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
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(400).contain("missing project");
    }

    @Test
    public void test_transcribe_missing_docs_returns_400() {
        // GIVEN
        String bodyWithoutDocs = "{\"project\":\"" + PROJECT + "\",\"language\":\"en\"}";

        // WHEN/THEN
        post("/api/asr/transcribe", bodyWithoutDocs)
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(400).contain("missing docs");
    }

    @Test
    public void test_transcribe_missing_language_returns_400() {
        // WHEN/THEN
        post("/api/asr/transcribe",
                "{\"project\":\"" + PROJECT + "\",\"docs\":[\"doc1\"]}")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(400).contain("missing language");
    }

    @Test
    public void test_transcribe_converts_language_to_datashare_format() throws Exception {
        // WHEN
        post("/api/asr/transcribe",
                "{\"project\":\"" + PROJECT + "\",\"docs\":[\"doc1\"],\"language\":\"fr\"}")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(201);

        // THEN
        assertThat(taskManager.startedTasks.getFirst().args.get("language")).isEqualTo("FRENCH");
    }

    @Test
    public void test_toDatashareLanguage() {
        assertThat(AsrResource.toDatashareLanguage("en")).isEqualTo("ENGLISH");
        assertThat(AsrResource.toDatashareLanguage("fr")).isEqualTo("FRENCH");
        assertThat(AsrResource.toDatashareLanguage("zh")).isEqualTo("CHINESE");
        assertThat(AsrResource.toDatashareLanguage("de")).isEqualTo("GERMAN");
    }

    @Test
    public void test_transcribe_unauthorized_project_returns_401() {
        // WHEN/THEN
        post("/api/asr/transcribe",
                "{\"project\":\"other-project\",\"docs\":[\"doc1\"]}")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(401);
    }

    @Test
    public void test_transcribe_passes_model_inside_config() throws Exception {
        // WHEN
        post("/api/asr/transcribe",
                "{\"project\":\"" + PROJECT + "\",\"docs\":[\"doc1\"],\"language\":\"en\",\"model\":\"parakeet\"}")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(201);

        // THEN
        Map<String, Object> args = taskManager.startedTasks.getFirst().args;
        assertThat(args.containsKey("model")).isFalse();
        AsrConfig config = (AsrConfig) args.get("config");
        assertThat(config).isEqualTo(AsrConfig.fromModel("parakeet"));
    }

    @Test
    public void test_transcribe_without_model_has_no_config() throws Exception {
        // WHEN
        post("/api/asr/transcribe",
                "{\"project\":\"" + PROJECT + "\",\"docs\":[\"doc1\"],\"language\":\"en\"}")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(201);

        // THEN
        Map<String, Object> args = taskManager.startedTasks.getFirst().args;
        assertThat(args.containsKey("config")).isFalse();
    }

    @Test
    public void test_transcribe_returns_503_when_task_manager_is_down() {
        // GIVEN
        taskManager.setUp(false);

        // WHEN/THEN
        post("/api/asr/transcribe",
                "{\"project\":\"" + PROJECT + "\",\"docs\":[\"doc1\"]}")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(503).contain("task manager is unavailable");
    }

    @Test
    public void test_get_transcription_returns_200() throws IOException {
        // GIVEN
        String docId = "abcdef1234567890abcdef1234567890";
        String transcription = "{\"transcripts\":[{\"text\":\"hello\"}],\"confidence\":0.95}";
        Path transcriptionDir = Path.of(tmpFolder.getRoot().getAbsolutePath(),
                PROJECT, docId.substring(0, 2), docId.substring(2, 4), docId);
        Files.createDirectories(transcriptionDir);
        Files.writeString(transcriptionDir.resolve("transcription.json"), transcription);

        // WHEN/THEN
        get("/api/asr/transcription/" + PROJECT + "/" + docId)
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(200).haveType("application/json").contain("hello");
    }

    @Test
    public void test_get_transcription_returns_404_when_not_found() {
        // WHEN/THEN
        get("/api/asr/transcription/" + PROJECT + "/abcdef1234567890abcdef1234567890")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(404);
    }

    @Test
    public void test_get_transcription_returns_400_for_invalid_doc_id() {
        // WHEN/THEN
        get("/api/asr/transcription/" + PROJECT + "/ab")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(400);
    }

    @Test
    public void test_get_transcription_returns_401_for_unauthorized_project() {
        // WHEN/THEN
        get("/api/asr/transcription/other-project/abcdef1234567890abcdef1234567890")
                .withPreemptiveAuthentication(USER_ID, "null")
                .should().respond(401);
    }
}
