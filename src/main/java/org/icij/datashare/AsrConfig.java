package org.icij.datashare;

import com.fasterxml.jackson.annotation.JsonTypeInfo;

@JsonTypeInfo(use = JsonTypeInfo.Id.NONE)
record AsrConfig(
        ModelConfig preprocessing,
        ModelConfig inference,
        ModelConfig postprocessing
) {
    record ModelConfig(String model) {}

    static AsrConfig fromModel(String model) {
        ModelConfig mc = new ModelConfig(model);
        return new AsrConfig(mc, mc, mc);
    }
}
