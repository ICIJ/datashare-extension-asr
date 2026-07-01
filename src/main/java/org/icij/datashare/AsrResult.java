package org.icij.datashare;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.annotation.JsonTypeName;

import java.io.Serializable;

@JsonTypeName("LinkedHashMap")
public record AsrResult(@JsonProperty("n_transcribed") int nTranscribed) implements Serializable {}
