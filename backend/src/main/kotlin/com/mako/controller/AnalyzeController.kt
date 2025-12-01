package com.mako.controller

import com.mako.dto.*
import com.mako.security.UserPrincipal
import com.mako.service.AnalysisService
import io.swagger.v3.oas.annotations.Operation
import io.swagger.v3.oas.annotations.tags.Tag
import jakarta.validation.Valid
import org.springframework.http.ResponseEntity
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import java.util.UUID

/**
 * REST controller for GTO analysis endpoints.
 */
@RestController
@RequestMapping("/analyze")
@Tag(name = "Analysis", description = "GTO poker analysis")
class AnalyzeController(
    private val analysisService: AnalysisService
) {

    @PostMapping
    @Operation(summary = "Analyze a poker scenario")
    fun analyzeScenario(
        @AuthenticationPrincipal user: UserPrincipal,
        @Valid @RequestBody request: AnalyzeRequest
    ): ResponseEntity<AnalysisResponse> {
        val response = analysisService.analyze(user.id, request)
        return ResponseEntity.ok(response)
    }

    @PostMapping("/quick")
    @Operation(summary = "Quick analysis without authentication (cached/heuristic)")
    fun quickAnalyze(
        @Valid @RequestBody request: AnalyzeRequest
    ): ResponseEntity<AnalysisResponse> {
        val response = analysisService.quickAnalyze(request)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get analysis result by scenario ID")
    fun getAnalysis(
        @AuthenticationPrincipal user: UserPrincipal,
        @PathVariable id: UUID
    ): ResponseEntity<AnalysisResponse> {
        val response = analysisService.getAnalysis(id, user.id)
        return ResponseEntity.ok(response)
    }

    @GetMapping("/history")
    @Operation(summary = "Get analysis history for current user")
    fun getAnalysisHistory(
        @AuthenticationPrincipal user: UserPrincipal,
        @RequestParam(defaultValue = "0") page: Int,
        @RequestParam(defaultValue = "20") size: Int
    ): ResponseEntity<List<ScenarioResponse>> {
        val response = analysisService.getHistory(user.id, page, size)
        return ResponseEntity.ok(response)
    }
}

