package org.icij.datashare.utils;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import net.codestory.http.payload.Payload;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.util.Map;

public class JsonPayload extends Payload {
    private static final Logger LOGGER = LoggerFactory.getLogger(JsonPayload.class);
    private static final ObjectMapper mapper = new ObjectMapper();

    public JsonPayload(int code, Record content) {
        this(code, toJson(content));
    }

    public JsonPayload(int code, Map<String, Object> content) {
        this(code, toJson(content));
    }

    public JsonPayload(Record content) {
        this(200, content);
    }

    public JsonPayload(int code) {
        this(code, "{}");
    }

    private JsonPayload(int code, String content) {
        super("application/json", content, code);
    }

    private static String toJson(Object content) {
        try {
            if (content == null)
                return "{}";
            return mapper.writeValueAsString(content);
        } catch (JsonProcessingException e) {
            LOGGER.error("error serializing {}, returning empty object", content, e);
            return "{}";
        }
    }
}
