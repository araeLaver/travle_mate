package com.travelmate.service;

import com.travelmate.dto.SearchDto;
import com.travelmate.entity.TravelGroup;
import com.travelmate.entity.User;
import com.travelmate.repository.TravelGroupRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SearchService {

    private static final Set<String> ALLOWED_SORT_FIELDS = Set.of(
            "createdAt", "startDate", "endDate", "currentMembers", "maxMembers", "destination"
    );

    private final TravelGroupRepository travelGroupRepository;

    public SearchDto.Result search(SearchDto.Request request) {
        long startedAt = System.currentTimeMillis();
        int page = request.getPage() != null && request.getPage() >= 0 ? request.getPage() : 0;
        int size = request.getSize() != null && request.getSize() > 0 ? Math.min(request.getSize(), 100) : 20;

        Page<TravelGroup> resultPage = travelGroupRepository.searchGroups(
                blankToNull(request.getKeyword()),
                blankToNull(request.getDestination()),
                parseTravelStyle(request.getTravelStyle()),
                request.getMinMembers(),
                request.getMaxMembers(),
                request.getStartDate(),
                request.getEndDate(),
                PageRequest.of(page, size, buildSort(request.getSortBy(), request.getSortOrder()))
        );

        List<SearchDto.GroupResult> results = resultPage.getContent().stream()
                .map(group -> toGroupResult(group, request.getKeyword()))
                .toList();

        return SearchDto.Result.builder()
                .results(results)
                .totalResults(resultPage.getTotalElements())
                .page(resultPage.getNumber())
                .size(resultPage.getSize())
                .took(System.currentTimeMillis() - startedAt)
                .build();
    }

    public List<String> autocomplete(String prefix) {
        String normalizedPrefix = blankToNull(prefix);
        if (normalizedPrefix == null) {
            return List.of();
        }

        SearchDto.Request request = SearchDto.Request.builder()
                .keyword(normalizedPrefix)
                .size(10)
                .build();

        Set<String> suggestions = new LinkedHashSet<>();
        for (SearchDto.GroupResult result : search(request).getResults()) {
            addIfStartsWith(suggestions, result.getName(), normalizedPrefix);
            addIfStartsWith(suggestions, result.getDestination(), normalizedPrefix);
            if (suggestions.size() >= 10) {
                break;
            }
        }
        return new ArrayList<>(suggestions);
    }

    public List<String> popularTags() {
        Pageable firstPage = PageRequest.of(0, 50, Sort.by(Sort.Direction.DESC, "createdAt"));
        Page<TravelGroup> groups = travelGroupRepository.searchGroups(
                null, null, null, null, null, null, null, firstPage
        );

        Set<String> tags = new LinkedHashSet<>();
        for (TravelGroup group : groups.getContent()) {
            if (group.getDestination() != null) {
                tags.add(group.getDestination());
            }
            if (group.getTravelStyle() != null) {
                tags.add(group.getTravelStyle().name());
            }
            if (group.getPurpose() != null) {
                tags.add(group.getPurpose().name());
            }
            if (tags.size() >= 20) {
                break;
            }
        }
        return new ArrayList<>(tags);
    }

    private SearchDto.GroupResult toGroupResult(TravelGroup group, String keyword) {
        return SearchDto.GroupResult.builder()
                .id(group.getId())
                .name(group.getTitle())
                .description(group.getDescription())
                .destination(group.getDestination())
                .travelStyle(group.getTravelStyle() != null ? group.getTravelStyle().name() : null)
                .tags(buildTags(group))
                .currentMembers(group.getCurrentMembers())
                .maxMembers(group.getMaxMembers())
                .startDate(group.getStartDate())
                .endDate(group.getEndDate())
                .createdAt(group.getCreatedAt())
                .score(calculateScore(group, keyword))
                .build();
    }

    private List<String> buildTags(TravelGroup group) {
        List<String> tags = new ArrayList<>();
        if (group.getDestination() != null) {
            tags.add(group.getDestination());
        }
        if (group.getTravelStyle() != null) {
            tags.add(group.getTravelStyle().name());
        }
        if (group.getPurpose() != null) {
            tags.add(group.getPurpose().name());
        }
        return tags;
    }

    private double calculateScore(TravelGroup group, String keyword) {
        String normalizedKeyword = blankToNull(keyword);
        if (normalizedKeyword == null) {
            return 1.0;
        }

        String lowerKeyword = normalizedKeyword.toLowerCase(Locale.ROOT);
        if (contains(group.getTitle(), lowerKeyword)) {
            return 1.0;
        }
        if (contains(group.getDestination(), lowerKeyword)) {
            return 0.8;
        }
        if (contains(group.getDescription(), lowerKeyword)) {
            return 0.6;
        }
        return 0.4;
    }

    private boolean contains(String value, String lowerKeyword) {
        return value != null && value.toLowerCase(Locale.ROOT).contains(lowerKeyword);
    }

    private Sort buildSort(String sortBy, String sortOrder) {
        String field = sortBy != null && ALLOWED_SORT_FIELDS.contains(sortBy) ? sortBy : "createdAt";
        Sort.Direction direction = "asc".equalsIgnoreCase(sortOrder) ? Sort.Direction.ASC : Sort.Direction.DESC;
        return Sort.by(direction, field);
    }

    private User.TravelStyle parseTravelStyle(String travelStyle) {
        String normalized = blankToNull(travelStyle);
        if (normalized == null) {
            return null;
        }

        try {
            return User.TravelStyle.valueOf(normalized.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ignored) {
            return switch (normalized) {
                case "모험", "액티비티" -> User.TravelStyle.ADVENTURE;
                case "문화", "문화탐방" -> User.TravelStyle.CULTURE;
                case "맛집", "맛집탐방", "음식" -> User.TravelStyle.FOOD;
                case "휴식", "힐링" -> User.TravelStyle.RELAXATION;
                case "자연" -> User.TravelStyle.NATURE;
                case "쇼핑" -> User.TravelStyle.SHOPPING;
                default -> null;
            };
        }
    }

    private void addIfStartsWith(Set<String> suggestions, String value, String prefix) {
        if (value != null && value.toLowerCase(Locale.ROOT).startsWith(prefix.toLowerCase(Locale.ROOT))) {
            suggestions.add(value);
        }
    }

    private String blankToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
