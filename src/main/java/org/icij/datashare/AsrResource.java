package org.icij.datashare;

import net.codestory.http.annotations.Get;
import net.codestory.http.annotations.Prefix;
import net.codestory.http.payload.Payload;

@Prefix("/api/asr")
public class AsrResource {

    public AsrResource() {}

    @Get("/models")
    public Payload getModels() {
        return Payload.ok();
    }
}
