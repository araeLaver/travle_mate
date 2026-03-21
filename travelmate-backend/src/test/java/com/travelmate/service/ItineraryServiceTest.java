package com.travelmate.service;

import com.travelmate.dto.itinerary.*;
import com.travelmate.entity.*;
import com.travelmate.entity.ItineraryCollaborator.CollaboratorRole;
import com.travelmate.entity.ItineraryCollaborator.InviteStatus;
import com.travelmate.entity.TravelItinerary.ItineraryVisibility;
import com.travelmate.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ItineraryService 테스트")
class ItineraryServiceTest {

    @Mock
    private TravelItineraryRepository itineraryRepository;

    @Mock
    private ItineraryItemRepository itemRepository;

    @Mock
    private ItineraryCollaboratorRepository collaboratorRepository;

    @Mock
    private ItineraryLikeRepository likeRepository;

    @Mock
    private ItineraryCommentRepository commentRepository;

    @Mock
    private UserRepository userRepository;

    @Mock
    private NotificationService notificationService;

    @InjectMocks
    private ItineraryService itineraryService;

    private User testUser;
    private User otherUser;
    private TravelItinerary testItinerary;
    private ItineraryItem testItem;
    private ItineraryCollaborator testCollaborator;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("TestUser");
        testUser.setProfileImageUrl("https://example.com/profile.jpg");

        otherUser = new User();
        otherUser.setId(2L);
        otherUser.setEmail("other@example.com");
        otherUser.setNickname("OtherUser");
        otherUser.setProfileImageUrl("https://example.com/other.jpg");

        testItinerary = TravelItinerary.builder()
                .id(1L)
                .owner(testUser)
                .title("Seoul Trip")
                .description("3-day trip to Seoul")
                .startDate(LocalDate.now().plusDays(7))
                .endDate(LocalDate.now().plusDays(10))
                .coverImage("https://example.com/cover.jpg")
                .visibility(ItineraryVisibility.PRIVATE)
                .viewCount(100)
                .likeCount(50)
                .copyCount(10)
                .build();

        testItem = ItineraryItem.builder()
                .id(1L)
                .itinerary(testItinerary)
                .dayNumber(1)
                .orderIndex(1)
                .type(ItineraryItem.ItemType.ATTRACTION)
                .title("Visit Seoul Tower")
                .description("Famous landmark")
                .placeName("N Seoul Tower")
                .placeAddress("Seoul, Yongsan")
                .latitude(37.5512)
                .longitude(126.9882)
                .startTime(LocalTime.of(10, 0))
                .endTime(LocalTime.of(12, 0))
                .durationMinutes(120)
                .build();

        testCollaborator = ItineraryCollaborator.builder()
                .id(1L)
                .itinerary(testItinerary)
                .user(otherUser)
                .role(CollaboratorRole.EDITOR)
                .status(InviteStatus.ACCEPTED)
                .invitedBy(testUser)
                .build();
    }

    @Nested
    @DisplayName("일정 CRUD 테스트")
    class ItineraryCRUDTest {

        @Test
        @DisplayName("성공 - 일정 생성")
        void createItinerary_Success() {
            // Given
            CreateItineraryRequest request = CreateItineraryRequest.builder()
                    .title("New Trip")
                    .description("Amazing trip")
                    .startDate(LocalDate.now().plusDays(1))
                    .endDate(LocalDate.now().plusDays(5))
                    .coverImage("https://example.com/image.jpg")
                    .visibility(ItineraryVisibility.PUBLIC)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(itineraryRepository.save(any(TravelItinerary.class))).thenAnswer(invocation -> {
                TravelItinerary saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });
            when(itemRepository.countByItinerary(any())).thenReturn(0L);

            // When
            ItineraryResponse result = itineraryService.createItinerary(1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("New Trip");
            assertThat(result.getVisibility()).isEqualTo(ItineraryVisibility.PUBLIC);
            assertThat(result.getShareCode()).isNotNull(); // 공개 일정이므로 공유 코드 생성
            verify(itineraryRepository).save(any(TravelItinerary.class));
        }

        @Test
        @DisplayName("성공 - 비공개 일정 생성 시 공유 코드 없음")
        void createItinerary_PrivateNoShareCode() {
            // Given
            CreateItineraryRequest request = CreateItineraryRequest.builder()
                    .title("Private Trip")
                    .startDate(LocalDate.now())
                    .endDate(LocalDate.now().plusDays(3))
                    .visibility(ItineraryVisibility.PRIVATE)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(itineraryRepository.save(any(TravelItinerary.class))).thenAnswer(invocation -> {
                TravelItinerary saved = invocation.getArgument(0);
                saved.setId(1L);
                return saved;
            });
            when(itemRepository.countByItinerary(any())).thenReturn(0L);

            // When
            ItineraryResponse result = itineraryService.createItinerary(1L, request);

            // Then
            assertThat(result.getShareCode()).isNull();
        }

        @Test
        @DisplayName("실패 - 존재하지 않는 사용자")
        void createItinerary_UserNotFound() {
            // Given
            CreateItineraryRequest request = CreateItineraryRequest.builder()
                    .title("Trip")
                    .build();

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> itineraryService.createItinerary(999L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("User not found");
        }

        @Test
        @DisplayName("성공 - 일정 수정")
        void updateItinerary_Success() {
            // Given
            UpdateItineraryRequest request = UpdateItineraryRequest.builder()
                    .title("Updated Trip")
                    .description("Updated description")
                    .visibility(ItineraryVisibility.PUBLIC)
                    .build();

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itineraryRepository.save(any(TravelItinerary.class))).thenReturn(testItinerary);
            when(itemRepository.countByItinerary(any())).thenReturn(0L);

            // When
            ItineraryResponse result = itineraryService.updateItinerary(1L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(itineraryRepository).save(any(TravelItinerary.class));
        }

        @Test
        @DisplayName("성공 - 비공개에서 공개로 변경 시 공유 코드 생성")
        void updateItinerary_GenerateShareCode() {
            // Given
            testItinerary.setShareCode(null);
            UpdateItineraryRequest request = UpdateItineraryRequest.builder()
                    .visibility(ItineraryVisibility.PUBLIC)
                    .build();

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itineraryRepository.save(any(TravelItinerary.class))).thenAnswer(invocation -> {
                TravelItinerary saved = invocation.getArgument(0);
                return saved;
            });
            when(itemRepository.countByItinerary(any())).thenReturn(0L);

            // When
            ItineraryResponse result = itineraryService.updateItinerary(1L, 1L, request);

            // Then
            assertThat(result.getShareCode()).isNotNull();
        }

        @Test
        @DisplayName("성공 - 일정 삭제")
        void deleteItinerary_Success() {
            // Given
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));

            // When
            itineraryService.deleteItinerary(1L, 1L);

            // Then
            verify(itineraryRepository).delete(testItinerary);
        }

        @Test
        @DisplayName("실패 - 소유자가 아닌 사용자의 삭제 시도")
        void deleteItinerary_NotOwner() {
            // Given
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));

            // When & Then
            assertThatThrownBy(() -> itineraryService.deleteItinerary(2L, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Owner permission required");
        }

        @Test
        @DisplayName("성공 - 일정 조회")
        void getItinerary_Success() {
            // Given
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findByItineraryOrderByDayNumberAscOrderIndexAsc(testItinerary))
                    .thenReturn(List.of(testItem));
            when(collaboratorRepository.findByItineraryAndStatus(testItinerary, InviteStatus.ACCEPTED))
                    .thenReturn(List.of());

            // When
            ItineraryResponse result = itineraryService.getItinerary(1L, 1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("Seoul Trip");
        }

        @Test
        @DisplayName("성공 - 다른 사용자 조회 시 조회수 증가")
        void getItinerary_IncrementViewCount() {
            // Given
            testItinerary.setVisibility(ItineraryVisibility.PUBLIC);
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findByItineraryOrderByDayNumberAscOrderIndexAsc(testItinerary))
                    .thenReturn(List.of());
            when(collaboratorRepository.findByItineraryAndStatus(testItinerary, InviteStatus.ACCEPTED))
                    .thenReturn(List.of());

            // When
            itineraryService.getItinerary(1L, 2L);

            // Then
            verify(itineraryRepository).incrementViewCount(1L);
        }

        @Test
        @DisplayName("실패 - 비공개 일정 접근 권한 없음")
        void getItinerary_AccessDenied() {
            // Given
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(collaboratorRepository.existsByItineraryAndUserAndStatus(testItinerary, otherUser, InviteStatus.ACCEPTED))
                    .thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> itineraryService.getItinerary(1L, 2L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Access denied");
        }

        @Test
        @DisplayName("성공 - 공유 코드로 일정 조회")
        void getItineraryByShareCode_Success() {
            // Given
            testItinerary.setShareCode("ABCD1234");
            when(itineraryRepository.findByShareCode("ABCD1234")).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findByItineraryOrderByDayNumberAscOrderIndexAsc(testItinerary))
                    .thenReturn(List.of());
            when(collaboratorRepository.findByItineraryAndStatus(testItinerary, InviteStatus.ACCEPTED))
                    .thenReturn(List.of());

            // When
            ItineraryResponse result = itineraryService.getItineraryByShareCode("ABCD1234", 1L);

            // Then
            assertThat(result).isNotNull();
            verify(itineraryRepository).incrementViewCount(1L);
        }

        @Test
        @DisplayName("성공 - 내 일정 목록 조회")
        void getMyItineraries_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<TravelItinerary> page = new PageImpl<>(List.of(testItinerary));

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(itineraryRepository.findByOwnerOrderByStartDateDesc(testUser, pageable)).thenReturn(page);
            when(itemRepository.countByItinerary(testItinerary)).thenReturn(5L);

            // When
            Page<ItineraryResponse> result = itineraryService.getMyItineraries(1L, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
            assertThat(result.getContent().get(0).getTitle()).isEqualTo("Seoul Trip");
        }

        @Test
        @DisplayName("성공 - 협업 중인 일정 조회")
        void getCollaboratingItineraries_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<TravelItinerary> page = new PageImpl<>(List.of(testItinerary));

            when(itineraryRepository.findCollaboratingItineraries(1L, pageable)).thenReturn(page);
            when(itemRepository.countByItinerary(testItinerary)).thenReturn(3L);

            // When
            Page<ItineraryResponse> result = itineraryService.getCollaboratingItineraries(1L, pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("성공 - 공개 일정 조회")
        void getPublicItineraries_Success() {
            // Given
            testItinerary.setVisibility(ItineraryVisibility.PUBLIC);
            Pageable pageable = PageRequest.of(0, 10);
            Page<TravelItinerary> page = new PageImpl<>(List.of(testItinerary));

            when(itineraryRepository.findByVisibility(ItineraryVisibility.PUBLIC, pageable)).thenReturn(page);
            when(itemRepository.countByItinerary(testItinerary)).thenReturn(2L);

            // When
            Page<ItineraryResponse> result = itineraryService.getPublicItineraries(pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("성공 - 인기 일정 조회")
        void getPopularItineraries_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<TravelItinerary> page = new PageImpl<>(List.of(testItinerary));

            when(itineraryRepository.findPopularItineraries(pageable)).thenReturn(page);
            when(itemRepository.countByItinerary(testItinerary)).thenReturn(4L);

            // When
            Page<ItineraryResponse> result = itineraryService.getPopularItineraries(pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
        }

        @Test
        @DisplayName("성공 - 일정 검색")
        void searchItineraries_Success() {
            // Given
            Pageable pageable = PageRequest.of(0, 10);
            Page<TravelItinerary> page = new PageImpl<>(List.of(testItinerary));

            when(itineraryRepository.searchPublicItineraries("Seoul", pageable)).thenReturn(page);
            when(itemRepository.countByItinerary(testItinerary)).thenReturn(3L);

            // When
            Page<ItineraryResponse> result = itineraryService.searchItineraries("Seoul", pageable);

            // Then
            assertThat(result.getContent()).hasSize(1);
        }
    }

    @Nested
    @DisplayName("아이템 CRUD 테스트")
    class ItemCRUDTest {

        @Test
        @DisplayName("성공 - 아이템 추가")
        void addItem_Success() {
            // Given
            CreateItemRequest request = CreateItemRequest.builder()
                    .dayNumber(1)
                    .orderIndex(1)
                    .type(ItineraryItem.ItemType.ATTRACTION)
                    .title("Visit Temple")
                    .placeName("Famous Temple")
                    .placeAddress("123 Temple St")
                    .latitude(37.5)
                    .longitude(127.0)
                    .startTime(LocalTime.of(9, 0))
                    .endTime(LocalTime.of(11, 0))
                    .durationMinutes(120)
                    .build();

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findMaxOrderIndex(testItinerary, 1)).thenReturn(0);
            when(itemRepository.save(any(ItineraryItem.class))).thenAnswer(invocation -> {
                ItineraryItem item = invocation.getArgument(0);
                item.setId(1L);
                return item;
            });

            // When
            ItineraryItemResponse result = itineraryService.addItem(1L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("Visit Temple");
            assertThat(result.getDayNumber()).isEqualTo(1);
        }

        @Test
        @DisplayName("성공 - orderIndex가 null일 때 최대값 + 1 사용")
        void addItem_AutoOrderIndex() {
            // Given
            CreateItemRequest request = CreateItemRequest.builder()
                    .dayNumber(1)
                    .orderIndex(null)
                    .type(ItineraryItem.ItemType.ATTRACTION)
                    .title("Auto Order")
                    .build();

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findMaxOrderIndex(testItinerary, 1)).thenReturn(5);
            when(itemRepository.save(any(ItineraryItem.class))).thenAnswer(invocation -> {
                ItineraryItem item = invocation.getArgument(0);
                item.setId(1L);
                return item;
            });

            // When
            ItineraryItemResponse result = itineraryService.addItem(1L, 1L, request);

            // Then
            assertThat(result.getOrderIndex()).isEqualTo(6);
        }

        @Test
        @DisplayName("성공 - 아이템 수정")
        void updateItem_Success() {
            // Given
            UpdateItemRequest request = UpdateItemRequest.builder()
                    .title("Updated Title")
                    .description("Updated description")
                    .durationMinutes(90)
                    .build();

            when(itemRepository.findById(1L)).thenReturn(Optional.of(testItem));
            when(itemRepository.save(any(ItineraryItem.class))).thenReturn(testItem);

            // When
            ItineraryItemResponse result = itineraryService.updateItem(1L, 1L, request);

            // Then
            assertThat(result).isNotNull();
            verify(itemRepository).save(any(ItineraryItem.class));
        }

        @Test
        @DisplayName("실패 - 편집 권한 없음")
        void updateItem_NoPermission() {
            // Given
            UpdateItemRequest request = UpdateItemRequest.builder()
                    .title("Updated Title")
                    .build();

            when(itemRepository.findById(1L)).thenReturn(Optional.of(testItem));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(collaboratorRepository.hasEditPermission(testItinerary, otherUser)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> itineraryService.updateItem(2L, 1L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Edit permission denied");
        }

        @Test
        @DisplayName("성공 - 아이템 삭제")
        void deleteItem_Success() {
            // Given
            when(itemRepository.findById(1L)).thenReturn(Optional.of(testItem));

            // When
            itineraryService.deleteItem(1L, 1L);

            // Then
            verify(itemRepository).delete(testItem);
        }

        @Test
        @DisplayName("성공 - 아이템 순서 변경")
        void reorderItems_Success() {
            // Given
            List<ReorderItemRequest> requests = List.of(
                    new ReorderItemRequest(1L, 2, 1),
                    new ReorderItemRequest(2L, 2, 2)
            );

            ItineraryItem item2 = ItineraryItem.builder()
                    .id(2L)
                    .itinerary(testItinerary)
                    .dayNumber(1)
                    .orderIndex(2)
                    .build();

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findById(1L)).thenReturn(Optional.of(testItem));
            when(itemRepository.findById(2L)).thenReturn(Optional.of(item2));
            when(itemRepository.save(any(ItineraryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));

            // When
            itineraryService.reorderItems(1L, 1L, requests);

            // Then
            verify(itemRepository, times(2)).save(any(ItineraryItem.class));
        }

        @Test
        @DisplayName("실패 - 아이템이 해당 일정에 속하지 않음")
        void reorderItems_ItemNotBelongToItinerary() {
            // Given
            TravelItinerary otherItinerary = TravelItinerary.builder()
                    .id(2L)
                    .owner(testUser)
                    .title("Other Trip")
                    .build();

            ItineraryItem otherItem = ItineraryItem.builder()
                    .id(99L)
                    .itinerary(otherItinerary)
                    .dayNumber(1)
                    .orderIndex(1)
                    .build();

            List<ReorderItemRequest> requests = List.of(
                    new ReorderItemRequest(99L, 1, 1)
            );

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findById(99L)).thenReturn(Optional.of(otherItem));

            // When & Then
            assertThatThrownBy(() -> itineraryService.reorderItems(1L, 1L, requests))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Item does not belong to this itinerary");
        }
    }

    @Nested
    @DisplayName("협업자 관리 테스트")
    class CollaboratorTest {

        @Test
        @DisplayName("성공 - 협업자 초대")
        void inviteCollaborator_Success() {
            // Given
            InviteCollaboratorRequest request = InviteCollaboratorRequest.builder()
                    .userId(2L)
                    .role(CollaboratorRole.EDITOR)
                    .build();

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collaboratorRepository.findByItineraryAndUser(testItinerary, otherUser)).thenReturn(Optional.empty());
            when(collaboratorRepository.save(any(ItineraryCollaborator.class))).thenReturn(testCollaborator);

            // When
            itineraryService.inviteCollaborator(1L, 1L, request);

            // Then
            verify(collaboratorRepository).save(any(ItineraryCollaborator.class));
            verify(notificationService).notifyItineraryCollaboratorInvite(eq(2L), eq(1L), anyString(), anyString());
        }

        @Test
        @DisplayName("실패 - 이미 협업자인 사용자 초대")
        void inviteCollaborator_AlreadyCollaborator() {
            // Given
            InviteCollaboratorRequest request = InviteCollaboratorRequest.builder()
                    .userId(2L)
                    .role(CollaboratorRole.EDITOR)
                    .build();

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(collaboratorRepository.findByItineraryAndUser(testItinerary, otherUser))
                    .thenReturn(Optional.of(testCollaborator));

            // When & Then
            assertThatThrownBy(() -> itineraryService.inviteCollaborator(1L, 1L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("User is already a collaborator");
        }

        @Test
        @DisplayName("성공 - 초대 수락")
        void respondToInvite_Accept() {
            // Given
            ItineraryCollaborator pendingCollaborator = ItineraryCollaborator.builder()
                    .id(1L)
                    .itinerary(testItinerary)
                    .user(otherUser)
                    .role(CollaboratorRole.EDITOR)
                    .status(InviteStatus.PENDING)
                    .invitedBy(testUser)
                    .build();

            when(collaboratorRepository.findById(1L)).thenReturn(Optional.of(pendingCollaborator));
            when(collaboratorRepository.save(any(ItineraryCollaborator.class))).thenReturn(pendingCollaborator);

            // When
            itineraryService.respondToInvite(2L, 1L, true);

            // Then
            verify(collaboratorRepository).save(any(ItineraryCollaborator.class));
        }

        @Test
        @DisplayName("성공 - 초대 거절")
        void respondToInvite_Decline() {
            // Given
            ItineraryCollaborator pendingCollaborator = ItineraryCollaborator.builder()
                    .id(1L)
                    .itinerary(testItinerary)
                    .user(otherUser)
                    .role(CollaboratorRole.EDITOR)
                    .status(InviteStatus.PENDING)
                    .invitedBy(testUser)
                    .build();

            when(collaboratorRepository.findById(1L)).thenReturn(Optional.of(pendingCollaborator));
            when(collaboratorRepository.save(any(ItineraryCollaborator.class))).thenReturn(pendingCollaborator);

            // When
            itineraryService.respondToInvite(2L, 1L, false);

            // Then
            verify(collaboratorRepository).save(any(ItineraryCollaborator.class));
        }

        @Test
        @DisplayName("실패 - 본인 초대가 아님")
        void respondToInvite_NotYourInvitation() {
            // Given
            ItineraryCollaborator pendingCollaborator = ItineraryCollaborator.builder()
                    .id(1L)
                    .itinerary(testItinerary)
                    .user(otherUser)
                    .role(CollaboratorRole.EDITOR)
                    .status(InviteStatus.PENDING)
                    .invitedBy(testUser)
                    .build();

            when(collaboratorRepository.findById(1L)).thenReturn(Optional.of(pendingCollaborator));

            // When & Then
            assertThatThrownBy(() -> itineraryService.respondToInvite(999L, 1L, true))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Not your invitation");
        }

        @Test
        @DisplayName("실패 - 이미 응답한 초대")
        void respondToInvite_AlreadyResponded() {
            // Given
            when(collaboratorRepository.findById(1L)).thenReturn(Optional.of(testCollaborator)); // ACCEPTED 상태

            // When & Then
            assertThatThrownBy(() -> itineraryService.respondToInvite(2L, 1L, true))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Invitation already responded");
        }

        @Test
        @DisplayName("성공 - 협업자 제거")
        void removeCollaborator_Success() {
            // Given
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));

            // When
            itineraryService.removeCollaborator(1L, 1L, 2L);

            // Then
            verify(collaboratorRepository).deleteByItineraryAndUser(testItinerary, otherUser);
        }

        @Test
        @DisplayName("성공 - 협업자 역할 변경")
        void updateCollaboratorRole_Success() {
            // Given
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(collaboratorRepository.findByItineraryAndUser(testItinerary, otherUser))
                    .thenReturn(Optional.of(testCollaborator));
            when(collaboratorRepository.save(any(ItineraryCollaborator.class))).thenReturn(testCollaborator);

            // When
            itineraryService.updateCollaboratorRole(1L, 1L, 2L, CollaboratorRole.VIEWER);

            // Then
            verify(collaboratorRepository).save(any(ItineraryCollaborator.class));
        }

        @Test
        @DisplayName("성공 - 협업자 목록 조회")
        void getCollaborators_Success() {
            // Given
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(collaboratorRepository.findByItinerary(testItinerary)).thenReturn(List.of(testCollaborator));

            // When
            List<CollaboratorResponse> result = itineraryService.getCollaborators(1L, 1L);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getUserId()).isEqualTo(2L);
        }

        @Test
        @DisplayName("성공 - 대기 중인 초대 목록 조회")
        void getPendingInvites_Success() {
            // Given
            ItineraryCollaborator pendingCollaborator = ItineraryCollaborator.builder()
                    .id(2L)
                    .itinerary(testItinerary)
                    .user(testUser)
                    .role(CollaboratorRole.EDITOR)
                    .status(InviteStatus.PENDING)
                    .invitedBy(otherUser)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collaboratorRepository.findByUserAndStatus(testUser, InviteStatus.PENDING))
                    .thenReturn(List.of(pendingCollaborator));

            // When
            List<CollaboratorResponse> result = itineraryService.getPendingInvites(1L);

            // Then
            assertThat(result).hasSize(1);
        }
    }

    @Nested
    @DisplayName("일정 복사 테스트")
    class CopyItineraryTest {

        @Test
        @DisplayName("성공 - 일정 복사")
        void copyItinerary_Success() {
            // Given
            testItinerary.setVisibility(ItineraryVisibility.PUBLIC);
            testItinerary.setItems(new ArrayList<>(List.of(testItem)));

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(itineraryRepository.save(any(TravelItinerary.class))).thenAnswer(invocation -> {
                TravelItinerary saved = invocation.getArgument(0);
                saved.setId(2L);
                return saved;
            });
            when(itemRepository.save(any(ItineraryItem.class))).thenAnswer(invocation -> invocation.getArgument(0));
            when(itemRepository.countByItinerary(any())).thenReturn(1L);

            // When
            ItineraryResponse result = itineraryService.copyItinerary(2L, 1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTitle()).isEqualTo("Seoul Trip (복사본)");
            assertThat(result.getVisibility()).isEqualTo(ItineraryVisibility.PRIVATE);
            verify(itineraryRepository).incrementCopyCount(1L);
            verify(itemRepository).save(any(ItineraryItem.class));
        }

        @Test
        @DisplayName("실패 - 접근 권한 없는 일정 복사")
        void copyItinerary_AccessDenied() {
            // Given
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(collaboratorRepository.existsByItineraryAndUserAndStatus(testItinerary, otherUser, InviteStatus.ACCEPTED))
                    .thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> itineraryService.copyItinerary(2L, 1L))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Access denied");
        }

        @Test
        @DisplayName("성공 - 협업자로 참여 중인 일정 복사")
        void copyItinerary_AsCollaborator() {
            // Given
            testItinerary.setItems(new ArrayList<>());
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(collaboratorRepository.existsByItineraryAndUserAndStatus(testItinerary, otherUser, InviteStatus.ACCEPTED))
                    .thenReturn(true);
            when(itineraryRepository.save(any(TravelItinerary.class))).thenAnswer(invocation -> {
                TravelItinerary saved = invocation.getArgument(0);
                saved.setId(2L);
                return saved;
            });
            when(itemRepository.countByItinerary(any())).thenReturn(0L);

            // When
            ItineraryResponse result = itineraryService.copyItinerary(2L, 1L);

            // Then
            assertThat(result).isNotNull();
            verify(itineraryRepository).incrementCopyCount(1L);
        }
    }

    @Nested
    @DisplayName("권한 검사 테스트")
    class PermissionTest {

        @Test
        @DisplayName("성공 - 공개 일정은 누구나 접근 가능")
        void canViewItinerary_PublicAccess() {
            // Given
            testItinerary.setVisibility(ItineraryVisibility.PUBLIC);
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findByItineraryOrderByDayNumberAscOrderIndexAsc(testItinerary))
                    .thenReturn(List.of());
            when(collaboratorRepository.findByItineraryAndStatus(testItinerary, InviteStatus.ACCEPTED))
                    .thenReturn(List.of());

            // When
            ItineraryResponse result = itineraryService.getItinerary(1L, null);

            // Then
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("성공 - LINK_ONLY 일정 접근")
        void canViewItinerary_LinkOnlyAccess() {
            // Given
            testItinerary.setVisibility(ItineraryVisibility.LINK_ONLY);
            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(itemRepository.findByItineraryOrderByDayNumberAscOrderIndexAsc(testItinerary))
                    .thenReturn(List.of());
            when(collaboratorRepository.findByItineraryAndStatus(testItinerary, InviteStatus.ACCEPTED))
                    .thenReturn(List.of());

            // When
            ItineraryResponse result = itineraryService.getItinerary(1L, 999L);

            // Then
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("성공 - 편집자 권한으로 아이템 수정")
        void checkEditPermission_EditorCanEdit() {
            // Given
            UpdateItemRequest request = UpdateItemRequest.builder()
                    .title("Updated")
                    .build();

            when(itemRepository.findById(1L)).thenReturn(Optional.of(testItem));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(collaboratorRepository.hasEditPermission(testItinerary, otherUser)).thenReturn(true);
            when(itemRepository.save(any(ItineraryItem.class))).thenReturn(testItem);

            // When
            ItineraryItemResponse result = itineraryService.updateItem(2L, 1L, request);

            // Then
            assertThat(result).isNotNull();
        }

        @Test
        @DisplayName("실패 - 관리자 권한 필요")
        void getItineraryWithAdminPermission_Denied() {
            // Given
            InviteCollaboratorRequest request = InviteCollaboratorRequest.builder()
                    .userId(3L)
                    .role(CollaboratorRole.VIEWER)
                    .build();

            when(itineraryRepository.findById(1L)).thenReturn(Optional.of(testItinerary));
            when(userRepository.findById(2L)).thenReturn(Optional.of(otherUser));
            when(collaboratorRepository.hasAdminPermission(testItinerary, otherUser)).thenReturn(false);

            // When & Then
            assertThatThrownBy(() -> itineraryService.inviteCollaborator(2L, 1L, request))
                    .isInstanceOf(IllegalArgumentException.class)
                    .hasMessage("Admin permission required");
        }
    }
}
