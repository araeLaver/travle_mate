package com.travelmate.service.nft;

import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.CollectionSet;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.nft.CollectionSetRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CollectionSetService 테스트")
class CollectionSetServiceTest {

    @Mock private CollectionSetRepository collectionSetRepository;
    @Mock private UserNftCollectionRepository userNftCollectionRepository;

    @InjectMocks private CollectionSetService collectionSetService;

    private CollectibleLocation loc1, loc2, loc3;
    private CollectionSet set1;

    @BeforeEach
    void setUp() {
        loc1 = createLocation(1L);
        loc2 = createLocation(2L);
        loc3 = createLocation(3L);

        set1 = CollectionSet.builder()
                .name("서울 명소")
                .requiredCount(3)
                .bonusPoints(100)
                .bonusTitle("서울 마스터")
                .locations(List.of(loc1, loc2, loc3))
                .build();
        setId(set1, 10L);
    }

    @Nested
    @DisplayName("getUserSetProgress")
    class GetUserSetProgress {

        @Test
        @DisplayName("진행률 0% — 수집 없음")
        void noProgress() {
            when(collectionSetRepository.findAvailableSets()).thenReturn(List.of(set1));
            when(userNftCollectionRepository.findByUserId(1L)).thenReturn(List.of());

            var result = collectionSetService.getUserSetProgress(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).collected()).isEqualTo(0);
            assertThat(result.get(0).required()).isEqualTo(3);
            assertThat(result.get(0).isCompleted()).isFalse();
            assertThat(result.get(0).missingLocationIds()).containsExactlyInAnyOrder(1L, 2L, 3L);
        }

        @Test
        @DisplayName("진행률 66% — 2/3 수집")
        void partialProgress() {
            UserNftCollection c1 = createNftCollection(loc1);
            UserNftCollection c2 = createNftCollection(loc2);
            when(collectionSetRepository.findAvailableSets()).thenReturn(List.of(set1));
            when(userNftCollectionRepository.findByUserId(1L)).thenReturn(List.of(c1, c2));

            var result = collectionSetService.getUserSetProgress(1L);

            assertThat(result.get(0).collected()).isEqualTo(2);
            assertThat(result.get(0).progressPercent()).isCloseTo(66.67, within(0.1));
            assertThat(result.get(0).isCompleted()).isFalse();
            assertThat(result.get(0).missingLocationIds()).containsExactly(3L);
        }

        @Test
        @DisplayName("진행률 100% — 모두 수집")
        void completed() {
            UserNftCollection c1 = createNftCollection(loc1);
            UserNftCollection c2 = createNftCollection(loc2);
            UserNftCollection c3 = createNftCollection(loc3);
            when(collectionSetRepository.findAvailableSets()).thenReturn(List.of(set1));
            when(userNftCollectionRepository.findByUserId(1L)).thenReturn(List.of(c1, c2, c3));

            var result = collectionSetService.getUserSetProgress(1L);

            assertThat(result.get(0).collected()).isEqualTo(3);
            assertThat(result.get(0).progressPercent()).isEqualTo(100.0);
            assertThat(result.get(0).isCompleted()).isTrue();
            assertThat(result.get(0).missingLocationIds()).isEmpty();
        }
    }

    @Nested
    @DisplayName("getSetProgress")
    class GetSetProgress {

        @Test
        @DisplayName("특정 세트 진행률 조회")
        void specificSet() {
            when(collectionSetRepository.findById(10L)).thenReturn(Optional.of(set1));
            when(userNftCollectionRepository.findByUserId(1L)).thenReturn(List.of(createNftCollection(loc1)));

            var result = collectionSetService.getSetProgress(10L, 1L);

            assertThat(result.collected()).isEqualTo(1);
            assertThat(result.set().getName()).isEqualTo("서울 명소");
        }

        @Test
        @DisplayName("존재하지 않는 세트 조회 실패")
        void notFound() {
            when(collectionSetRepository.findById(999L)).thenReturn(Optional.empty());

            assertThatThrownBy(() -> collectionSetService.getSetProgress(999L, 1L))
                    .isInstanceOf(BusinessException.class)
                    .satisfies(ex -> assertBusinessException(ex, 404, "NOT_FOUND"));
        }
    }

    @Nested
    @DisplayName("checkNewlyCompletedSets")
    class CheckNewlyCompleted {

        @Test
        @DisplayName("완료된 세트 반환")
        void completedSets() {
            when(collectionSetRepository.findAvailableSets()).thenReturn(List.of(set1));
            when(userNftCollectionRepository.findByUserId(1L))
                    .thenReturn(List.of(createNftCollection(loc1), createNftCollection(loc2), createNftCollection(loc3)));

            var result = collectionSetService.checkNewlyCompletedSets(1L);

            assertThat(result).hasSize(1);
            assertThat(result.get(0).name()).isEqualTo("서울 명소");
            assertThat(result.get(0).bonusPoints()).isEqualTo(100);
            assertThat(result.get(0).bonusTitle()).isEqualTo("서울 마스터");
        }

        @Test
        @DisplayName("미완료 시 빈 목록")
        void noCompleted() {
            when(collectionSetRepository.findAvailableSets()).thenReturn(List.of(set1));
            when(userNftCollectionRepository.findByUserId(1L)).thenReturn(List.of());

            var result = collectionSetService.checkNewlyCompletedSets(1L);

            assertThat(result).isEmpty();
        }
    }

    @Test
    @DisplayName("getAvailableSets 위임")
    void getAvailableSets() {
        when(collectionSetRepository.findAvailableSets()).thenReturn(List.of(set1));

        var result = collectionSetService.getAvailableSets();

        assertThat(result).hasSize(1);
    }

    @Test
    @DisplayName("getSetsByRegion 위임")
    void getSetsByRegion() {
        when(collectionSetRepository.findActiveByRegion("서울")).thenReturn(List.of(set1));

        var result = collectionSetService.getSetsByRegion("서울");

        assertThat(result).hasSize(1);
    }

    // --- Helpers ---

    private CollectibleLocation createLocation(Long id) {
        CollectibleLocation loc = CollectibleLocation.builder().build();
        try {
            var f = CollectibleLocation.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(loc, id);
        } catch (Exception e) { throw new RuntimeException(e); }
        return loc;
    }

    private UserNftCollection createNftCollection(CollectibleLocation location) {
        return UserNftCollection.builder().location(location).build();
    }

    private void setId(CollectionSet set, Long id) {
        try {
            var f = CollectionSet.class.getDeclaredField("id");
            f.setAccessible(true);
            f.set(set, id);
        } catch (Exception e) { throw new RuntimeException(e); }
    }

    private void assertBusinessException(Throwable throwable, int status, String errorCode) {
        BusinessException exception = (BusinessException) throwable;
        assertThat(exception.getStatus().value()).isEqualTo(status);
        assertThat(exception.getErrorCodeStr()).isEqualTo(errorCode);
    }
}
