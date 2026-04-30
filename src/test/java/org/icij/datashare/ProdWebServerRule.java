package org.icij.datashare;

import net.codestory.http.Configuration;
import net.codestory.http.WebServer;
import net.codestory.http.misc.Env;
import org.junit.rules.ExternalResource;

import java.util.function.Supplier;

import static net.codestory.http.Configuration.NO_ROUTE;
import static net.codestory.http.misc.MemoizingSupplier.memoize;

public class ProdWebServerRule extends ExternalResource {
    private final Supplier<WebServer> server = memoize(() -> new WebServer() {
        @Override
        protected Env createEnv() {
            return Env.prod();
        }
    }.startOnRandomPort());

    @Override
    protected void after() {
        server.get().configure(NO_ROUTE);
    }

    public void configure(Configuration configuration) {
        server.get().configure(configuration);
    }

    public int port() {
        return server.get().port();
    }
}
