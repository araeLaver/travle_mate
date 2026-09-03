package com.travelmate.service;

import com.travelmate.dto.AIRecommendationDto.*;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.LocationCategory;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.exception.BusinessException;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import com.travelmate.service.ai.AiItineraryService;
import com.travelmate.service.ai.PlaceRecommendationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.*;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AIRecommendationService 테스트")
class AIRecommendationServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserNftCollectionRepository collectionRepository;

    @Mock
    private RestTemplate restTemplate;

    @Mock
    private AiItineraryService aiItineraryService;

    @Mock
    private PlaceRecommendationService placeRecommendationService;

    @InjectMocks
    private AIRecommendationService aiRecommendationService;

    private User testUser;
    private List<UserNftCollection> testCollections;

    @BeforeEach
    void setUp() {
        testUser = new User();
        testUser.setId(1L);
        testUser.setEmail("test@example.com");
        testUser.setNickname("TestUser");
        testUser.setIsMatchingEnabled(true);

        // 테스트용 NFT 컬렉션 생성
        testCollections = new ArrayList<>();

        CollectibleLocation landmarkLocation = new CollectibleLocation();
        landmarkLocation.setCategory(LocationCategory.LANDMARK);
        landmarkLocation.setRegion("서울");

        CollectibleLocation museumLocation = new CollectibleLocation();
        museumLocation.setCategory(LocationCategory.CULTURAL_HERITAGE);
        museumLocation.setRegion("부산");

        CollectibleLocation natureLocation = new CollectibleLocation();
        natureLocation.setCategory(LocationCategory.NATURE);
        natureLocation.setRegion("제주도");

        UserNftCollection collection1 = new UserNftCollection();
        collection1.setId(1L);
        collection1.setLocation(landmarkLocation);

        UserNftCollection collection2 = new UserNftCollection();
        collection2.setId(2L);
        collection2.setLocation(museumLocation);

        UserNftCollection collection3 = new UserNftCollection();
        collection3.setId(3L);
        collection3.setLocation(natureLocation);

        testCollections.add(collection1);
        testCollections.add(collection2);
        testCollections.add(collection3);

        ReflectionTestUtils.setField(aiRecommendationService, "openaiEnabled", false);
        ReflectionTestUtils.setField(aiRecommendationService, "openaiApiKey", "");
    }

    @Nested
    @DisplayName("일정 생성 테스트")
    class GenerateItineraryTest {

        @Test
        @DisplayName("성공 - ItineraryService에 위임")
        void generateItinerary_DelegatesToItineraryService() {
            // Given
            ItineraryRequest request = ItineraryRequest.builder()
                    .destination("Seoul")
                    .startDate(java.time.LocalDate.now())
                    .endDate(java.time.LocalDate.now().plusDays(3))
                    .build();

            ItineraryResponse expectedResponse = ItineraryResponse.builder()
                    .destination("Seoul")
                    .dayPlans(List.of())
                    .build();

            when(aiItineraryService.generateItinerary(1L, request)).thenReturn(expectedResponse);

            // When
            ItineraryResponse result = aiRecommendationService.generateItinerary(1L, request);

            // Then
            assertThat(result).isEqualTo(expectedResponse);
            verify(aiItineraryService).generateItinerary(1L, request);
        }
    }

    @Nested
    @DisplayName("AI 장소 추천 테스트")
    class GetAIPlaceRecommendationsTest {

        @Test
        @DisplayName("성공 - PlaceRecommendationService에 위임")
        void getAIPlaceRecommendations_DelegatesToPlaceRecommendationService() {
            // Given
            PlaceRecommendationRequest request = PlaceRecommendationRequest.builder()
                    .latitude(37.5665)
                    .longitude(126.9780)
                    .radiusKm(5.0)
                    .build();

            List<PlaceRecommendation> expectedPlaces = List.of(
                    PlaceRecommendation.builder()
                            .name("Seoul Tower")
                            .category("LANDMARK")
                            .distance(1.5)
                            .build()
            );

            when(placeRecommendationService.getAIPlaceRecommendations(1L, request)).thenReturn(expectedPlaces);

            // When
            List<PlaceRecommendation> result = aiRecommendationService.getAIPlaceRecommendations(1L, request);

            // Then
            assertThat(result).hasSize(1);
            assertThat(result.get(0).getName()).isEqualTo("Seoul Tower");
            verify(placeRecommendationService).getAIPlaceRecommendations(1L, request);
        }
    }

    @Nested
    @DisplayName("개인화 추천 테스트")
    class GetPersonalizedRecommendationsTest {

        @Test
        @DisplayName("성공 - 개인화 추천 생성")
        void getPersonalizedRecommendations_Success() {
            // Given
            PersonalizedRequest request = PersonalizedRequest.builder()
                    .latitude(37.5665)
                    .longitude(126.9780)
                    .mood("happy")
                    .availableHours(4)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(testCollections);
            when(placeRecommendationService.getAIPlaceRecommendations(eq(1L), any())).thenReturn(List.of());

            // When
            PersonalizedResponse result = aiRecommendationService.getPersonalizedRecommendations(1L, request);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getActivities()).isNotEmpty();
            assertThat(result.getTips()).isNotEmpty();
            assertThat(result.getAiInsight()).isNotEmpty();
            assertThat(result.getConfidenceScore()).isGreaterThan(0);
        }

        @Test
        @DisplayName("실패 - 사용자 없음")
        void getPersonalizedRecommendations_UserNotFound() {
            // Given
            PersonalizedRequest request = PersonalizedRequest.builder().build();

            when(userRepository.findById(999L)).thenReturn(Optional.empty());

            // When & Then
            assertThatThrownBy(() -> aiRecommendationService.getPersonalizedRecommendations(999L, request))
                    .isInstanceOf(BusinessException.class)
                    .hasMessageContaining("사용자를 찾을 수 없습니다")
                    .satisfies(ex -> {
                        BusinessException businessException = (BusinessException) ex;
                        assertThat(businessException.getStatus().value()).isEqualTo(404);
                        assertThat(businessException.getErrorCodeStr()).isEqualTo("USER_NOT_FOUND");
                    });
        }

        @Test
        @DisplayName("성공 - 모험 성향이 높을 때 야외 활동 추천")
        void getPersonalizedRecommendations_AdventureActivity() {
            // Given
            CollectibleLocation adventureLocation = new CollectibleLocation();
            adventureLocation.setCategory(LocationCategory.NATURE);
            adventureLocation.setRegion("강원도");

            UserNftCollection adventureCollection = new UserNftCollection();
            adventureCollection.setId(4L);
            adventureCollection.setLocation(adventureLocation);

            List<UserNftCollection> adventureCollections = new ArrayList<>(testCollections);
            adventureCollections.add(adventureCollection);

            PersonalizedRequest request = PersonalizedRequest.builder()
                    .availableHours(4)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(adventureCollections);
            when(placeRecommendationService.getAIPlaceRecommendations(eq(1L), any())).thenReturn(List.of());

            // When
            PersonalizedResponse result = aiRecommendationService.getPersonalizedRecommendations(1L, request);

            // Then
            assertThat(result.getActivities()).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("사용자 분석 테스트")
    class AnalyzeUserTest {

        @Test
        @DisplayName("성공 - 사용자 분석")
        void analyzeUser_Success() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(testCollections);

            // When
            UserAnalysis result = aiRecommendationService.analyzeUser(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getUserId()).isEqualTo(1L);
            assertThat(result.getTravelPersona()).isNotEmpty();
            assertThat(result.getTopInterests()).isNotEmpty();
            assertThat(result.getPreferredDestinations()).isNotEmpty();
        }

        @Test
        @DisplayName("성공 - 빈 컬렉션으로 분석")
        void analyzeUser_EmptyCollections() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(Collections.emptyList());

            // When
            UserAnalysis result = aiRecommendationService.analyzeUser(1L);

            // Then
            assertThat(result).isNotNull();
            assertThat(result.getTravelPersona()).isEqualTo("탐험가");
            assertThat(result.getTopInterests()).isEmpty();
        }

        @Test
        @DisplayName("성공 - 매칭 비활성화 시 소셜 점수 낮음")
        void analyzeUser_MatchingDisabled() {
            // Given
            testUser.setIsMatchingEnabled(false);
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(testCollections);

            // When
            UserAnalysis result = aiRecommendationService.analyzeUser(1L);

            // Then
            assertThat(result.getSocialScore()).isLessThan(50);
        }

        @Test
        @DisplayName("성공 - 문화 탐험가 페르소나")
        void analyzeUser_CultureExplorerPersona() {
            // Given - LANDMARK category maps to "문화 탐험가" persona
            CollectibleLocation landmark1 = new CollectibleLocation();
            landmark1.setCategory(LocationCategory.LANDMARK);
            landmark1.setRegion("서울");

            CollectibleLocation landmark2 = new CollectibleLocation();
            landmark2.setCategory(LocationCategory.LANDMARK);
            landmark2.setRegion("경주");

            UserNftCollection c1 = new UserNftCollection();
            c1.setId(1L);
            c1.setLocation(landmark1);

            UserNftCollection c2 = new UserNftCollection();
            c2.setId(2L);
            c2.setLocation(landmark2);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(List.of(c1, c2));

            // When
            UserAnalysis result = aiRecommendationService.analyzeUser(1L);

            // Then
            assertThat(result.getTravelPersona()).isEqualTo("문화 탐험가");
        }

        @Test
        @DisplayName("성공 - 다음 여행지 예측")
        void analyzeUser_PredictNextDestination() {
            // Given
            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(testCollections);

            // When
            UserAnalysis result = aiRecommendationService.analyzeUser(1L);

            // Then
            assertThat(result.getPredictedNextDestination()).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("여행 팁 생성 테스트")
    class GenerateTravelTipsTest {

        @Test
        @DisplayName("성공 - 기본 여행 팁 생성")
        void generateTravelTips_BasicTips() {
            // Given
            TravelTipsRequest request = TravelTipsRequest.builder()
                    .destination("제주도")
                    .build();

            // When
            List<TravelTip> result = aiRecommendationService.generateTravelTips(request);

            // Then
            assertThat(result).isNotEmpty();
            assertThat(result).anyMatch(tip -> tip.getCategory().equals("교통"));
            assertThat(result).anyMatch(tip -> tip.getCategory().equals("안전"));
        }

        @Test
        @DisplayName("성공 - 모험 스타일 여행 팁")
        void generateTravelTips_AdventureStyle() {
            // Given
            TravelTipsRequest request = TravelTipsRequest.builder()
                    .destination("강원도")
                    .travelStyle("ADVENTURE")
                    .build();

            // When
            List<TravelTip> result = aiRecommendationService.generateTravelTips(request);

            // Then
            assertThat(result).anyMatch(tip -> tip.getCategory().equals("준비물"));
        }

        @Test
        @DisplayName("성공 - 문화 스타일 여행 팁")
        void generateTravelTips_CultureStyle() {
            // Given
            TravelTipsRequest request = TravelTipsRequest.builder()
                    .destination("경주")
                    .travelStyle("CULTURE")
                    .build();

            // When
            List<TravelTip> result = aiRecommendationService.generateTravelTips(request);

            // Then
            assertThat(result).anyMatch(tip -> tip.getCategory().equals("문화"));
        }

        @Test
        @DisplayName("성공 - 음식 스타일 여행 팁")
        void generateTravelTips_FoodStyle() {
            // Given
            TravelTipsRequest request = TravelTipsRequest.builder()
                    .destination("부산")
                    .travelStyle("FOOD")
                    .build();

            // When
            List<TravelTip> result = aiRecommendationService.generateTravelTips(request);

            // Then
            assertThat(result).anyMatch(tip -> tip.getCategory().equals("음식"));
        }

        @Test
        @DisplayName("성공 - 여름 여행 날씨 팁")
        void generateTravelTips_SummerWeather() {
            // Given
            TravelTipsRequest request = TravelTipsRequest.builder()
                    .destination("제주도")
                    .travelDate(LocalDate.of(2025, 7, 15))
                    .build();

            // When
            List<TravelTip> result = aiRecommendationService.generateTravelTips(request);

            // Then
            assertThat(result).anyMatch(tip ->
                    tip.getCategory().equals("날씨") && tip.getTitle().contains("여름"));
        }

        @Test
        @DisplayName("성공 - 겨울 여행 날씨 팁")
        void generateTravelTips_WinterWeather() {
            // Given
            TravelTipsRequest request = TravelTipsRequest.builder()
                    .destination("강원도")
                    .travelDate(LocalDate.of(2025, 1, 15))
                    .build();

            // When
            List<TravelTip> result = aiRecommendationService.generateTravelTips(request);

            // Then
            assertThat(result).anyMatch(tip ->
                    tip.getCategory().equals("날씨") && tip.getTitle().contains("겨울"));
        }
    }

    @Nested
    @DisplayName("AI 채팅 테스트")
    class ChatTest {

        @Test
        @DisplayName("성공 - 추천 관련 질문 응답")
        void chat_RecommendationQuestion() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("맛집 추천해주세요")
                    .build();

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getMessage()).isNotEmpty();
            // "추천" is checked first in rule-based response, so it returns place recommendation message
            assertThat(result.getMessage()).containsAnyOf("추천", "찾아볼");
            assertThat(result.getConversationId()).isNotEmpty();
        }

        @Test
        @DisplayName("성공 - 인사 응답")
        void chat_Greeting() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("안녕하세요")
                    .build();

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getMessage()).contains("Fryndo AI");
        }

        @Test
        @DisplayName("성공 - 날씨 질문 응답")
        void chat_WeatherQuestion() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("제주도 날씨가 어때요?")
                    .build();

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getMessage()).contains("날씨");
        }

        @Test
        @DisplayName("성공 - 일정 관련 질문 응답")
        void chat_ItineraryQuestion() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("여행 일정 짜주세요")
                    .build();

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getMessage()).contains("일정");
            assertThat(result.getSuggestedActions()).contains("일정 생성하기");
        }

        @Test
        @DisplayName("성공 - 기존 대화 ID 사용")
        void chat_ExistingConversationId() {
            // Given
            String existingConversationId = "existing-123";
            ChatRequest request = ChatRequest.builder()
                    .message("테스트")
                    .conversationId(existingConversationId)
                    .build();

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getConversationId()).isEqualTo(existingConversationId);
        }

        @Test
        @DisplayName("성공 - 감사 응답")
        void chat_ThankYouResponse() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("감사합니다")
                    .build();

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getMessage()).contains("도움");
        }

        @Test
        @DisplayName("성공 - 기본 응답")
        void chat_DefaultResponse() {
            // Given
            ChatRequest request = ChatRequest.builder()
                    .message("무작위 메시지 xyz")
                    .build();

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getMessage()).isNotEmpty();
            assertThat(result.getSuggestedActions()).isNotEmpty();
        }

        @Test
        @DisplayName("성공 - OpenAI 활성화 시 AI 응답 (실패 시 fallback)")
        void chat_OpenAIEnabledWithFallback() {
            // Given
            ReflectionTestUtils.setField(aiRecommendationService, "openaiEnabled", true);
            ReflectionTestUtils.setField(aiRecommendationService, "openaiApiKey", "test-key");

            ChatRequest request = ChatRequest.builder()
                    .message("여행 추천해주세요")
                    .context("제주도 여행 계획 중")
                    .build();

            when(restTemplate.postForObject(anyString(), any(), eq(Map.class)))
                    .thenThrow(new RuntimeException("API Error"));

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getMessage()).isNotEmpty();
        }

        @Test
        @DisplayName("성공 - OpenAI API 정상 응답")
        void chat_OpenAISuccess() {
            // Given
            ReflectionTestUtils.setField(aiRecommendationService, "openaiEnabled", true);
            ReflectionTestUtils.setField(aiRecommendationService, "openaiApiKey", "test-key");

            ChatRequest request = ChatRequest.builder()
                    .message("서울 맛집 추천")
                    .build();

            Map<String, Object> aiResponse = new LinkedHashMap<>();
            Map<String, Object> choice = new LinkedHashMap<>();
            Map<String, Object> message = new LinkedHashMap<>();
            message.put("content", "서울에서 유명한 맛집을 추천해드릴게요!");
            choice.put("message", message);
            aiResponse.put("choices", List.of(choice));

            when(restTemplate.postForObject(anyString(), any(), eq(Map.class))).thenReturn(aiResponse);

            // When
            ChatResponse result = aiRecommendationService.chat(1L, request);

            // Then
            assertThat(result.getMessage()).contains("맛집");
        }
    }

    @Nested
    @DisplayName("활동 추천 생성 테스트")
    class ActivitySuggestionTest {

        @Test
        @DisplayName("성공 - 가용 시간이 짧을 때 기본 활동만 추천")
        void generateActivitySuggestions_ShortTime() {
            // Given
            PersonalizedRequest request = PersonalizedRequest.builder()
                    .availableHours(1)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
            when(placeRecommendationService.getAIPlaceRecommendations(eq(1L), any())).thenReturn(List.of());

            // When
            PersonalizedResponse result = aiRecommendationService.getPersonalizedRecommendations(1L, request);

            // Then
            assertThat(result.getActivities()).isNotEmpty();
            // 짧은 시간이므로 명소 탐방은 제외될 수 있음
        }

        @Test
        @DisplayName("성공 - null availableHours는 기본값 4 사용")
        void generateActivitySuggestions_NullHours() {
            // Given
            PersonalizedRequest request = PersonalizedRequest.builder()
                    .availableHours(null)
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(testCollections);
            when(placeRecommendationService.getAIPlaceRecommendations(eq(1L), any())).thenReturn(List.of());

            // When
            PersonalizedResponse result = aiRecommendationService.getPersonalizedRecommendations(1L, request);

            // Then
            assertThat(result.getActivities()).isNotEmpty();
        }
    }

    @Nested
    @DisplayName("여행 페르소나 결정 테스트")
    class TravelPersonaTest {

        @Test
        @DisplayName("성공 - 자연 애호가 페르소나")
        void determineTravelPersona_NatureLover() {
            // Given
            CollectibleLocation nature1 = new CollectibleLocation();
            nature1.setCategory(LocationCategory.NATURE);
            nature1.setRegion("강원도");

            CollectibleLocation nature2 = new CollectibleLocation();
            nature2.setCategory(LocationCategory.NATURE);
            nature2.setRegion("제주도");

            UserNftCollection c1 = new UserNftCollection();
            c1.setId(1L);
            c1.setLocation(nature1);

            UserNftCollection c2 = new UserNftCollection();
            c2.setId(2L);
            c2.setLocation(nature2);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(List.of(c1, c2));

            // When
            UserAnalysis result = aiRecommendationService.analyzeUser(1L);

            // Then
            assertThat(result.getTravelPersona()).isEqualTo("자연 애호가");
        }

        @Test
        @DisplayName("성공 - null 카테고리 필터링")
        void determineTravelPersona_NullCategoryFiltered() {
            // Given
            CollectibleLocation locationWithNullCategory = new CollectibleLocation();
            locationWithNullCategory.setCategory(null);
            locationWithNullCategory.setRegion("서울");

            UserNftCollection collection = new UserNftCollection();
            collection.setId(1L);
            collection.setLocation(locationWithNullCategory);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(List.of(collection));

            // When
            UserAnalysis result = aiRecommendationService.analyzeUser(1L);

            // Then
            assertThat(result.getTravelPersona()).isEqualTo("탐험가");
        }

        @Test
        @DisplayName("성공 - null location 필터링")
        void determineTravelPersona_NullLocationFiltered() {
            // Given
            UserNftCollection collectionWithNullLocation = new UserNftCollection();
            collectionWithNullLocation.setId(1L);
            collectionWithNullLocation.setLocation(null);

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(List.of(collectionWithNullLocation));

            // When
            UserAnalysis result = aiRecommendationService.analyzeUser(1L);

            // Then
            assertThat(result.getTravelPersona()).isEqualTo("탐험가");
        }
    }

    @Nested
    @DisplayName("신뢰도 점수 계산 테스트")
    class ConfidenceScoreTest {

        @Test
        @DisplayName("성공 - 데이터 많을수록 높은 신뢰도")
        void calculateConfidenceScore_HighWithMoreData() {
            // Given
            PersonalizedRequest request = PersonalizedRequest.builder().build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(testCollections);
            when(placeRecommendationService.getAIPlaceRecommendations(eq(1L), any())).thenReturn(List.of());

            // When
            PersonalizedResponse result = aiRecommendationService.getPersonalizedRecommendations(1L, request);

            // Then
            assertThat(result.getConfidenceScore()).isGreaterThan(0.5);
        }

        @Test
        @DisplayName("성공 - 데이터 없을 때 기본 신뢰도")
        void calculateConfidenceScore_BaseWithNoData() {
            // Given
            PersonalizedRequest request = PersonalizedRequest.builder().build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(Collections.emptyList());
            when(placeRecommendationService.getAIPlaceRecommendations(eq(1L), any())).thenReturn(List.of());

            // When
            PersonalizedResponse result = aiRecommendationService.getPersonalizedRecommendations(1L, request);

            // Then
            assertThat(result.getConfidenceScore()).isEqualTo(0.5);
        }
    }

    @Nested
    @DisplayName("개인화 인사이트 생성 테스트")
    class PersonalizedInsightTest {

        @Test
        @DisplayName("성공 - 기분(mood) 포함된 인사이트")
        void generatePersonalizedInsight_WithMood() {
            // Given
            PersonalizedRequest request = PersonalizedRequest.builder()
                    .mood("excited")
                    .build();

            when(userRepository.findById(1L)).thenReturn(Optional.of(testUser));
            when(collectionRepository.findByUserId(1L)).thenReturn(testCollections);
            when(placeRecommendationService.getAIPlaceRecommendations(eq(1L), any())).thenReturn(List.of());

            // When
            PersonalizedResponse result = aiRecommendationService.getPersonalizedRecommendations(1L, request);

            // Then
            assertThat(result.getAiInsight()).contains("excited");
        }
    }
}
