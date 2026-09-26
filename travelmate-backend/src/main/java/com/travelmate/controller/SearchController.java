package com.travelmate.controller;

import com.travelmate.dto.SearchDto;
import com.travelmate.service.SearchService;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/search")
@RequiredArgsConstructor
public class SearchController {

    private final SearchService searchService;

    @PostMapping
    public ResponseEntity<SearchDto.Result> advancedSearch(@RequestBody SearchDto.Request request) {
        return ResponseEntity.ok(searchService.search(request));
    }

    @GetMapping
    public ResponseEntity<SearchDto.Result> quickSearch(
            @RequestParam(name = "q", required = false) String keyword,
            @RequestParam(required = false) String travelStyle,
            @RequestParam(required = false) String destination,
            @RequestParam(required = false) Integer minMembers,
            @RequestParam(required = false) Integer maxMembers,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) String sortOrder,
            @RequestParam(defaultValue = "0") Integer page,
            @RequestParam(defaultValue = "20") Integer size) {
        SearchDto.Request request = SearchDto.Request.builder()
                .keyword(keyword)
                .travelStyle(travelStyle)
                .destination(destination)
                .minMembers(minMembers)
                .maxMembers(maxMembers)
                .startDate(startDate)
                .endDate(endDate)
                .sortBy(sortBy)
                .sortOrder(sortOrder)
                .page(page)
                .size(size)
                .build();
        return ResponseEntity.ok(searchService.search(request));
    }

    @GetMapping("/autocomplete")
    public ResponseEntity<List<String>> autocomplete(@RequestParam String prefix) {
        return ResponseEntity.ok(searchService.autocomplete(prefix));
    }

    @GetMapping("/popular-tags")
    public ResponseEntity<List<String>> popularTags() {
        return ResponseEntity.ok(searchService.popularTags());
    }
}
