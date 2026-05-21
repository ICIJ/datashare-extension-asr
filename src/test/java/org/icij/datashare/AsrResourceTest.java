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

public class AsrResourceTest implements FluentRestTest {
    @ClassRule
    public static ProdWebServerRule server = new ProdWebServerRule();

    @Override
    public int port() {
        return server.port();
    }

    @Before
    public void setUp() {
        server.configure(routes -> routes.add(new AsrResource()));
    }

    @Test
    public void test_get_models_returns_200() {
        get("/api/asr/models").should().respond(200).haveType("application/json");
    }

    @Test
    public void test_get_models_returns_languages_and_models() throws Exception {
        // GIVEN/WHEN
        String body = get("/api/asr/models").response().content();
        Map<String, List<String>> models = new ObjectMapper().readValue(body, new TypeReference<>() {});

        // THEN
        assertThat(models.get("en")).contains("foo");
        assertThat(models.get("fr")).contains("bar");
    }

    @Test
    public void test_get_unknown_route_returns_404() {
        get("/api/asr/unknown").should().respond(404);
    }
}
