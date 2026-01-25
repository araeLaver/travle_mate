package com.travelmate.service;

import com.travelmate.dto.AIRecommendationDto;
import com.travelmate.dto.AIRecommendationDto.*;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import com.travelmate.service.ai.AiItineraryService;
import com.travelmate.service.ai.PlaceRecommendationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.util.*;
import java.util.stream.Collectors;

/**
 * AI 기반 추천 서비스 (Facade)
 * 일정 생성, 장소 추천은 각각 ItineraryService, PlaceRecommendationService에 위임
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIRecommendationService {

    private final UserRepository userRepository;
    private final UserNftCollectionRepository collectionRepository;
    private final RestTemplate restTemplate;
    private final AiItineraryService aiItineraryService;
    private final PlaceRecommendationService placeRecommendationService;

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${ai.openai.enabled:false}")
    private boolean openaiEnabled;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    /**
     * AI 기반 여행 일정 생성 (ItineraryService에 위임)
     */
    @Transactional(readOnly = true)
    public ItineraryResponse generateItinerary(Long userId, ItineraryRequest request) {
        return aiItineraryService.generateItinerary(userId, request);
    }

    /**
     * AI 기반 장소 추천 (PlaceRecommendationService에 위임)
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "aiPlaceRecommendations", key = "#userId + '_' + #request.latitude + '_' + #request.longitude")
    public List<PlaceRecommendation> getAIPlaceRecommendations(Long userId, PlaceRecommendationRequest request) {
        return placeRecommendationService.getAIPlaceRecommendations(userId, request);
    }

    /**
     * 개인화 추천
     */
    @Transactional(readOnly = true)
    public PersonalizedResponse getPersonalizedRecommendations(Long userId, PersonalizedRequest request) {
        log.info("Getting personalized recommendations for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        UserAnalysis analysis = analyzeUser(userId);

        PlaceRecommendationRequest placeRequest = PlaceRecommendationRequest.builder()
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .radiusKm(10.0)
                .build();
        List<PlaceRecommendation> places = placeRecommendationService.getAIPlaceRecommendations(userId, placeRequest);

        List<ActivitySuggestion> activities = generateActivitySuggestions(user, request, analysis);
        String aiInsight = generatePersonalizedInsight(user, analysis, request);
        List<String> tips = generateContextualTips(user, request);

        return PersonalizedResponse.builder()
                .places(places)
                .activities(activities)
                .tips(tips)
                .aiInsight(aiInsight)
                .confidenceScore(calculateConfidenceScore(analysis))
                .build();
    }

    /**
     * 사용자 분석
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "userAnalysis", key = "#userId")
    public UserAnalysis analyzeUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        List<UserNftCollection> collections = collectionRepository.findByUserId(userId);

        Map<String, Long> categoryCount = collections.stream()
                .filter(c -> c.getLocation() != null && c.getLocation().getCategory() != null)
                .collect(Collectors.groupingBy(
                        c -> c.getLocation().getCategory().name(),
                        Collectors.counting()));

        Map<String, Long> regionCount = collections.stream()
                .filter(c -> c.getLocation() != null && c.getLocation().getRegion() != null)
                .collect(Collectors.groupingBy(
                        c -> c.getLocation().getRegion(),
                        Collectors.counting()));

        List<String> topInterests = categoryCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        List<String> preferredDestinations = regionCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        String travelPersona = determineTravelPersona(user, categoryCount);

        double totalCollections = collections.size();
        double adventureScore = calculateCategoryScore(categoryCount, "NATURE", "ADVENTURE") / Math.max(1, totalCollections);
        double cultureScore = calculateCategoryScore(categoryCount, "MUSEUM", "LANDMARK", "HISTORICAL") / Math.max(1, totalCollections);
        double relaxationScore = calculateCategoryScore(categoryCount, "BEACH", "SPA", "PARK") / Math.max(1, totalCollections);
        double socialScore = user.getIsMatchingEnabled() != null && user.getIsMatchingEnabled() ? 0.8 : 0.4;

        return UserAnalysis.builder()
                .userId(userId)
                .travelPersona(travelPersona)
                .topInterests(topInterests)
                .preferredDestinations(preferredDestinations)
                .predictedNextDestination(predictNextDestination(regionCount, preferredDestinations))
                .adventureScore(Math.min(1.0, adventureScore * 100))
                .cultureScore(Math.min(1.0, cultureScore * 100))
                .relaxationScore(Math.min(1.0, relaxationScore * 100))
                .socialScore(socialScore * 100)
                .build();
    }

    /**
     * AI 여행 팁 생성
     */
    @Transactional(readOnly = true)
    public List<TravelTip> generateTravelTips(TravelTipsRequest request) {
        log.info("Generating travel tips for {}", request.getDestination());

        List<TravelTip> tips = new ArrayList<>();

        tips.add(TravelTip.builder()
                .category("교통")
                .title("현지 교통 이용")
                .content(request.getDestination() + " 방문 시 현지 교통카드를 구입하면 편리합니다.")
                .importance("HIGH")
                .relatedPlaces(Arrays.asList("공항", "기차역"))
                .build());

        tips.add(TravelTip.builder()
                .category("안전")
                .title("여행자 보험")
                .content("해외여행 시 여행자 보험 가입을 권장합니다.")
                .importance("HIGH")
                .relatedPlaces(Collections.emptyList())
                .build());

        if (request.getTravelStyle() != null) {
            switch (request.getTravelStyle().toUpperCase()) {
                case "ADVENTURE" -> tips.add(TravelTip.builder()
                        .category("준비물")
                        .title("모험 여행 장비")
                        .content("편한 운동화, 방수 재킷, 선크림을 준비하세요.")
                        .importance("MEDIUM")
                        .relatedPlaces(Arrays.asList("등산로", "해변"))
                        .build());
                case "CULTURE" -> tips.add(TravelTip.builder()
                        .category("문화")
                        .title("현지 예절")
                        .content("현지 문화와 에티켓을 미리 학습하면 좋습니다.")
                        .importance("MEDIUM")
                        .relatedPlaces(Arrays.asList("사원", "박물관"))
                        .build());
                case "FOOD" -> tips.add(TravelTip.builder()
                        .category("음식")
                        .title("로컬 맛집")
                        .content("관광지보다 현지인이 자주 가는 식당을 찾아보세요.")
                        .importance("MEDIUM")
                        .relatedPlaces(Arrays.asList("시장", "골목"))
                        .build());
            }
        }

        if (request.getTravelDate() != null) {
            int month = request.getTravelDate().getMonthValue();
            if (month >= 6 && month <= 8) {
                tips.add(TravelTip.builder()
                        .category("날씨")
                        .title("여름 여행 준비")
                        .content("더운 날씨에 대비해 수분 보충과 그늘 휴식을 취하세요.")
                        .importance("HIGH")
                        .relatedPlaces(Collections.emptyList())
                        .build());
            } else if (month >= 12 || month <= 2) {
                tips.add(TravelTip.builder()
                        .category("날씨")
                        .title("겨울 여행 준비")
                        .content("따뜻한 옷과 핫팩을 챙기세요.")
                        .importance("HIGH")
                        .relatedPlaces(Collections.emptyList())
                        .build());
            }
        }

        return tips;
    }

    /**
     * AI 채팅 (여행 어시스턴트)
     */
    public ChatResponse chat(Long userId, ChatRequest request) {
        log.info("AI chat for user {}: {}", userId, request.getMessage());

        List<PlaceRecommendation> relatedPlaces = new ArrayList<>();
        List<String> suggestedActions = new ArrayList<>();
        String conversationId = request.getConversationId() != null ?
                request.getConversationId() : UUID.randomUUID().toString();

        if (openaiEnabled && openaiApiKey != null && !openaiApiKey.isEmpty()) {
            try {
                String aiResponse = generateChatResponseWithAI(userId, request);
                suggestedActions.addAll(extractSuggestedActions(aiResponse, request.getMessage()));

                return ChatResponse.builder()
                        .message(aiResponse)
                        .conversationId(conversationId)
                        .relatedPlaces(relatedPlaces)
                        .suggestedActions(suggestedActions)
                        .build();
            } catch (Exception e) {
                log.warn("AI chat failed, falling back to rule-based: {}", e.getMessage());
            }
        }

        String response = generateRuleBasedChatResponse(request.getMessage());
        suggestedActions.addAll(generateDefaultSuggestions(request.getMessage()));

        return ChatResponse.builder()
                .message(response)
                .conversationId(conversationId)
                .relatedPlaces(relatedPlaces)
                .suggestedActions(suggestedActions)
                .build();
    }

    private String generateChatResponseWithAI(Long userId, ChatRequest request) {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(openaiApiKey);

        Map<String, Object> requestBody = new LinkedHashMap<>();
        requestBody.put("model", "gpt-4o-mini");
        requestBody.put("max_tokens", 1000);
        requestBody.put("temperature", 0.7);

        List<Map<String, String>> messages = new ArrayList<>();
        messages.add(Map.of(
            "role", "system",
            "content", "You are Fryndo AI, a friendly and helpful Korean travel assistant. " +
                      "Always respond in Korean. Be concise but informative."
        ));

        if (request.getContext() != null && !request.getContext().isEmpty()) {
            messages.add(Map.of("role", "system", "content", "Context: " + request.getContext()));
        }

        messages.add(Map.of("role", "user", "content", request.getMessage()));
        requestBody.put("messages", messages);

        HttpEntity<Map<String, Object>> entity = new HttpEntity<>(requestBody, headers);

        @SuppressWarnings("unchecked")
        Map<String, Object> response = restTemplate.postForObject(OPENAI_API_URL, entity, Map.class);

        if (response != null && response.containsKey("choices")) {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> choices = (List<Map<String, Object>>) response.get("choices");
            if (!choices.isEmpty()) {
                @SuppressWarnings("unchecked")
                Map<String, Object> message = (Map<String, Object>) choices.get(0).get("message");
                return (String) message.get("content");
            }
        }

        throw new RuntimeException("Failed to get AI response");
    }

    private String generateRuleBasedChatResponse(String userMessage) {
        String message = userMessage.toLowerCase();

        if (message.contains("추천") || message.contains("어디")) {
            return "주변에 방문할 만한 곳을 찾아볼게요! 현재 위치를 공유해주시면 더 정확한 추천을 해드릴 수 있어요.";
        } else if (message.contains("날씨") || message.contains("기후")) {
            return "여행지의 날씨가 궁금하시군요! 어떤 지역의 날씨를 알려드릴까요?";
        } else if (message.contains("맛집") || message.contains("음식")) {
            return "맛있는 음식을 찾고 계시군요! 현지 음식점 정보를 찾아볼게요.";
        } else if (message.contains("일정") || message.contains("계획")) {
            return "여행 일정을 도와드릴게요! 목적지와 여행 기간을 알려주세요.";
        } else if (message.contains("안녕") || message.contains("hello") || message.contains("hi")) {
            return "안녕하세요! Fryndo AI입니다. 여행 계획, 장소 추천, 현지 정보 등 무엇이든 물어보세요!";
        } else if (message.contains("고마") || message.contains("감사")) {
            return "도움이 되었다니 기뻐요! 더 궁금한 점이 있으시면 언제든 말씀해주세요.";
        }
        return "무엇을 도와드릴까요? 여행 추천, 일정 계획, 맛집 찾기 등 다양하게 도와드릴 수 있어요!";
    }

    private List<String> extractSuggestedActions(String aiResponse, String userMessage) {
        List<String> actions = new ArrayList<>();
        String message = userMessage.toLowerCase();

        if (message.contains("추천") || aiResponse.contains("추천")) {
            actions.add("주변 장소 보기");
        }
        if (message.contains("일정") || aiResponse.contains("일정")) {
            actions.add("AI 일정 생성하기");
        }
        if (message.contains("맛집") || aiResponse.contains("음식")) {
            actions.add("맛집 검색");
        }
        if (actions.isEmpty()) {
            actions.add("여행지 추천받기");
            actions.add("일정 생성하기");
        }

        return actions;
    }

    private List<String> generateDefaultSuggestions(String message) {
        List<String> suggestions = new ArrayList<>();
        String lowerMessage = message.toLowerCase();

        if (lowerMessage.contains("추천") || lowerMessage.contains("어디")) {
            suggestions.add("위치 공유하기");
            suggestions.add("관심사 설정하기");
        } else if (lowerMessage.contains("날씨") || lowerMessage.contains("기후")) {
            suggestions.add("목적지 검색");
        } else if (lowerMessage.contains("맛집") || lowerMessage.contains("음식")) {
            suggestions.add("음식 카테고리 선택");
            suggestions.add("예산 설정");
        } else if (lowerMessage.contains("일정") || lowerMessage.contains("계획")) {
            suggestions.add("일정 생성하기");
        } else {
            suggestions.add("여행지 추천받기");
            suggestions.add("일정 생성하기");
            suggestions.add("주변 탐색하기");
        }

        return suggestions;
    }

    private List<ActivitySuggestion> generateActivitySuggestions(User user, PersonalizedRequest request, UserAnalysis analysis) {
        List<ActivitySuggestion> suggestions = new ArrayList<>();

        int hours = request.getAvailableHours() != null ? request.getAvailableHours() : 4;

        if (hours >= 2) {
            suggestions.add(ActivitySuggestion.builder()
                    .title("근처 명소 탐방")
                    .description("가까운 관광 명소를 방문해보세요")
                    .category("SIGHTSEEING")
                    .durationMinutes(120)
                    .difficulty("EASY")
                    .estimatedCost(15000.0)
                    .requirements(Arrays.asList("편한 신발"))
                    .aiScore(85.0)
                    .reason("인기있는 활동입니다")
                    .build());
        }

        if (hours >= 3 && analysis.getAdventureScore() > 50) {
            suggestions.add(ActivitySuggestion.builder()
                    .title("야외 액티비티")
                    .description("자연 속에서 활동적인 시간을 보내세요")
                    .category("ADVENTURE")
                    .durationMinutes(180)
                    .difficulty("MEDIUM")
                    .estimatedCost(30000.0)
                    .requirements(Arrays.asList("운동복", "물"))
                    .aiScore(80.0)
                    .reason("모험적인 성향에 맞는 활동입니다")
                    .build());
        }

        if (analysis.getCultureScore() > 50) {
            suggestions.add(ActivitySuggestion.builder()
                    .title("문화 체험")
                    .description("현지 문화를 경험해보세요")
                    .category("CULTURE")
                    .durationMinutes(150)
                    .difficulty("EASY")
                    .estimatedCost(25000.0)
                    .requirements(Collections.emptyList())
                    .aiScore(78.0)
                    .reason("문화에 관심이 많으시네요")
                    .build());
        }

        suggestions.add(ActivitySuggestion.builder()
                .title("맛집 탐방")
                .description("현지 맛집을 방문해보세요")
                .category("FOOD")
                .durationMinutes(90)
                .difficulty("EASY")
                .estimatedCost(35000.0)
                .requirements(Collections.emptyList())
                .aiScore(75.0)
                .reason("식사 시간에 적합합니다")
                .build());

        return suggestions;
    }

    private String generatePersonalizedInsight(User user, UserAnalysis analysis, PersonalizedRequest request) {
        StringBuilder insight = new StringBuilder();

        insight.append("회원님은 '").append(analysis.getTravelPersona()).append("' 유형의 여행자입니다. ");

        if (!analysis.getTopInterests().isEmpty()) {
            insight.append(String.join(", ", analysis.getTopInterests())).append(" 분야에 관심이 많으시네요. ");
        }

        if (request.getMood() != null) {
            insight.append("오늘 ").append(request.getMood()).append(" 기분이시군요. ");
        }

        insight.append("오늘 하루도 즐거운 여행 되세요!");

        return insight.toString();
    }

    private List<String> generateContextualTips(User user, PersonalizedRequest request) {
        List<String> tips = new ArrayList<>();
        tips.add("사진을 많이 남겨두세요");
        tips.add("현지인에게 추천을 물어보세요");
        tips.add("NFT 수집을 잊지 마세요!");
        return tips;
    }

    private double calculateConfidenceScore(UserAnalysis analysis) {
        double baseScore = 0.5;
        if (!analysis.getTopInterests().isEmpty()) baseScore += 0.15;
        if (!analysis.getPreferredDestinations().isEmpty()) baseScore += 0.15;
        if (analysis.getAdventureScore() > 0 || analysis.getCultureScore() > 0) baseScore += 0.2;
        return Math.min(1.0, baseScore);
    }

    private String determineTravelPersona(User user, Map<String, Long> categoryCount) {
        if (categoryCount.isEmpty()) {
            return "탐험가";
        }

        String topCategory = categoryCount.entrySet().stream()
                .max(Map.Entry.comparingByValue())
                .map(Map.Entry::getKey)
                .orElse("OTHER");

        return switch (topCategory) {
            case "MUSEUM", "LANDMARK", "HISTORICAL" -> "문화 탐험가";
            case "NATURE", "PARK" -> "자연 애호가";
            case "RESTAURANT", "CAFE" -> "미식가";
            case "ADVENTURE" -> "모험가";
            case "SHOPPING" -> "쇼핑 마니아";
            default -> "다재다능 여행가";
        };
    }

    private double calculateCategoryScore(Map<String, Long> categoryCount, String... categories) {
        double score = 0;
        for (String cat : categories) {
            score += categoryCount.getOrDefault(cat, 0L);
        }
        return score;
    }

    private String predictNextDestination(Map<String, Long> regionCount, List<String> preferredDestinations) {
        List<String> popularRegions = Arrays.asList("서울", "부산", "제주도", "경주", "강릉");

        for (String region : popularRegions) {
            if (!preferredDestinations.contains(region)) {
                return region;
            }
        }

        return preferredDestinations.isEmpty() ? "제주도" : preferredDestinations.get(0);
    }
}
