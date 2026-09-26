package com.travelmate.service;

import com.travelmate.dto.SearchDto;
import com.travelmate.entity.TravelGroup;
import com.travelmate.entity.User;
import com.travelmate.repository.TravelGroupRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("SearchService 테스트")
class SearchServiceTest {

    @Mock
    private TravelGroupRepository travelGroupRepository;

    private SearchService searchService;
    private TravelGroup group;

    @BeforeEach
    void setUp() {
        searchService = new SearchService(travelGroupRepository);

        group = new TravelGroup();
        group.setId(1L);
        group.setTitle("서울 맛집 여행");
        group.setDescription("성수와 을지로를 같이 돌아봅니다");
        group.setDestination("서울");
        group.setTravelStyle(User.TravelStyle.FOOD);
        group.setPurpose(TravelGroup.Purpose.LEISURE);
        group.setCurrentMembers(2);
        group.setMaxMembers(5);
        group.setStartDate(LocalDate.of(2026, 8, 1));
        group.setEndDate(LocalDate.of(2026, 8, 3));
        group.setCreatedAt(LocalDateTime.of(2026, 7, 26, 10, 0));
    }

    @Test
    @DisplayName("성공 - 고급 검색 결과를 프론트 계약으로 매핑")
    void search_MapsGroupResults() {
        // Given
        when(travelGroupRepository.searchGroups(
                eq("서울"),
                eq("서울"),
                eq(User.TravelStyle.FOOD),
                eq(1),
                eq(5),
                eq(LocalDate.of(2026, 8, 1)),
                eq(LocalDate.of(2026, 8, 31)),
                any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(group)));

        SearchDto.Request request = SearchDto.Request.builder()
                .keyword("서울")
                .destination("서울")
                .travelStyle("맛집탐방")
                .minMembers(1)
                .maxMembers(5)
                .startDate(LocalDate.of(2026, 8, 1))
                .endDate(LocalDate.of(2026, 8, 31))
                .page(0)
                .size(20)
                .build();

        // When
        SearchDto.Result result = searchService.search(request);

        // Then
        assertThat(result.getResults()).hasSize(1);
        assertThat(result.getTotalResults()).isEqualTo(1);
        assertThat(result.getResults().get(0)).usingRecursiveComparison()
                .ignoringFields("score")
                .isEqualTo(SearchDto.GroupResult.builder()
                        .id(1L)
                        .name("서울 맛집 여행")
                        .description("성수와 을지로를 같이 돌아봅니다")
                        .destination("서울")
                        .travelStyle("FOOD")
                        .tags(List.of("서울", "FOOD", "LEISURE"))
                        .currentMembers(2)
                        .maxMembers(5)
                        .startDate(LocalDate.of(2026, 8, 1))
                        .endDate(LocalDate.of(2026, 8, 3))
                        .createdAt(LocalDateTime.of(2026, 7, 26, 10, 0))
                        .build());
        assertThat(result.getResults().get(0).getScore()).isEqualTo(1.0);
    }

    @Test
    @DisplayName("성공 - 정렬 필드는 허용 목록으로 제한")
    void search_RestrictsSortFields() {
        // Given
        when(travelGroupRepository.searchGroups(
                any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(group)));

        SearchDto.Request request = SearchDto.Request.builder()
                .sortBy("creator.password")
                .sortOrder("asc")
                .build();

        // When
        searchService.search(request);

        // Then
        ArgumentCaptor<Pageable> pageableCaptor = ArgumentCaptor.forClass(Pageable.class);
        verify(travelGroupRepository).searchGroups(
                any(), any(), any(), any(), any(), any(), any(), pageableCaptor.capture()
        );
        assertThat(pageableCaptor.getValue().getSort().toString()).contains("createdAt: ASC");
    }

    @Test
    @DisplayName("성공 - 자동완성은 이름과 목적지 prefix를 반환")
    void autocomplete_ReturnsPrefixMatches() {
        // Given
        when(travelGroupRepository.searchGroups(
                any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(group)));

        // When
        List<String> suggestions = searchService.autocomplete("서");

        // Then
        assertThat(suggestions).contains("서울 맛집 여행", "서울");
    }

    @Test
    @DisplayName("성공 - 인기 태그는 최근 그룹의 목적지/스타일/목적 기반으로 반환")
    void popularTags_ReturnsDerivedTags() {
        // Given
        when(travelGroupRepository.searchGroups(
                any(), any(), any(), any(), any(), any(), any(), any(Pageable.class)
        )).thenReturn(new PageImpl<>(List.of(group)));

        // When
        List<String> tags = searchService.popularTags();

        // Then
        assertThat(tags).containsExactly("서울", "FOOD", "LEISURE");
    }
}
