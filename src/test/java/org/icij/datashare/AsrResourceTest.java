package org.icij.datashare;

import net.codestory.rest.FluentRestTest;
import org.junit.Before;
import org.junit.ClassRule;
import org.junit.Test;

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
        get("/api/asr/models").should().respond(200);
    }
}
