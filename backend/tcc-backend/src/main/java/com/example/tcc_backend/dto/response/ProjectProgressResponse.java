package com.example.tcc_backend.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class ProjectProgressResponse {
    private Integer projectId;
    private Integer overallPercent;
    private List<ProgressStepResponse> steps;
    private List<ProjectProgressUpdateResponse> updates;
}
