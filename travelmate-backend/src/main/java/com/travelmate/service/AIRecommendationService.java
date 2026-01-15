package com.travelmate.service;

import com.travelmate.dto.AIRecommendationDto;
import com.travelmate.dto.AIRecommendationDto.*;
import com.travelmate.entity.User;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.repository.UserRepository;
import com.travelmate.repository.nft.CollectibleLocationRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI 기반 추천 서비스
 * OpenAI API 또는 내부 알고리즘을 사용한 지능형 추천
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AIRecommendationService {

    private final UserRepository userRepository;
    private final CollectibleLocationRepository locationRepository;
    private final UserNftCollectionRepository collectionRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${ai.openai.enabled:false}")
    private boolean openaiEnabled;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    // 장소 카테고리별 추천 점수 가중치
    private static final Map<String, Double> CATEGORY_WEIGHTS = Map.of(
        "LANDMARK", 1.2,
        "MUSEUM", 1.1,
        "RESTAURANT", 1.0,
        "NATURE", 1.15,
        "SHOPPING", 0.9,
        "ENTERTAINMENT", 1.0
    );

    /**
     * AI 기반 여행 일정 생성
     */
    @Transactional(readOnly = true)
    public ItineraryResponse generateItinerary(Long userId, ItineraryRequest request) {
        log.info("Generating AI itinerary for user {} to {}", userId, request.getDestination());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 여행 일수 계산
        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;

        // OpenAI API 사용 가능 시 AI 생성
        if (openaiEnabled && openaiApiKey != null && !openaiApiKey.isEmpty()) {
            try {
                return generateItineraryWithAI(user, request, (int) days);
            } catch (Exception e) {
                log.warn("AI itinerary generation failed, falling back to rule-based: {}", e.getMessage());
            }
        }

        // 규칙 기반 일정 생성
        return generateRuleBasedItinerary(user, request, (int) days);
    }

    /**
     * AI 기반 장소 추천
     */
    @Transactional(readOnly = true)
    @Cacheable(value = "aiPlaceRecommendations", key = "#userId + '_' + #request.latitude + '_' + #request.longitude")
    public List<PlaceRecommendation> getAIPlaceRecommendations(Long userId, PlaceRecommendationRequest request) {
        log.info("Getting AI place recommendations for user {} at ({}, {})",
                userId, request.getLatitude(), request.getLongitude());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 사용자가 이미 방문한 장소 조회
        List<Long> visitedLocationIds = collectionRepository.findCollectedLocationIdsByUserId(userId);

        // 근처 장소 조회
        Double radiusKm = request.getRadiusKm() != null ? request.getRadiusKm() : 5.0;
        List<CollectibleLocation> nearbyLocations = locationRepository.findNearbyActiveLocations(
                request.getLatitude(), request.getLongitude(), radiusKm);

        // 방문하지 않은 장소만 필터링
        List<CollectibleLocation> unvisitedLocations = nearbyLocations.stream()
                .filter(loc -> !visitedLocationIds.contains(loc.getId()))
                .collect(Collectors.toList());

        // AI 점수 계산 및 추천
        return unvisitedLocations.stream()
                .map(location -> calculatePlaceRecommendation(user, location, request))
                .sorted((a, b) -> Double.compare(b.getAiScore(), a.getAiScore()))
                .limit(10)
                .collect(Collectors.toList());
    }

    /**
     * 개인화 추천
     */
    @Transactional(readOnly = true)
    public PersonalizedResponse getPersonalizedRecommendations(Long userId, PersonalizedRequest request) {
        log.info("Getting personalized recommendations for user {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        // 사용자 분석
        UserAnalysis analysis = analyzeUser(userId);

        // 장소 추천
        PlaceRecommendationRequest placeRequest = PlaceRecommendationRequest.builder()
                .latitude(request.getLatitude())
                .longitude(request.getLongitude())
                .radiusKm(10.0)
                .build();
        List<PlaceRecommendation> places = getAIPlaceRecommendations(userId, placeRequest);

        // 활동 제안
        List<ActivitySuggestion> activities = generateActivitySuggestions(user, request, analysis);

        // AI 인사이트 생성
        String aiInsight = generatePersonalizedInsight(user, analysis, request);

        // 팁 생성
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

        // 사용자의 NFT 수집 이력 분석
        List<UserNftCollection> collections = collectionRepository.findByUserId(userId);

        // 카테고리별 수집 분석
        Map<String, Long> categoryCount = collections.stream()
                .filter(c -> c.getLocation() != null && c.getLocation().getCategory() != null)
                .collect(Collectors.groupingBy(
                        c -> c.getLocation().getCategory().name(),
                        Collectors.counting()));

        // 지역별 수집 분석
        Map<String, Long> regionCount = collections.stream()
                .filter(c -> c.getLocation() != null && c.getLocation().getRegion() != null)
                .collect(Collectors.groupingBy(
                        c -> c.getLocation().getRegion(),
                        Collectors.counting()));

        // 상위 관심사
        List<String> topInterests = categoryCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // 선호 지역
        List<String> preferredDestinations = regionCount.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(3)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());

        // 여행 페르소나 결정
        String travelPersona = determineTravelPersona(user, categoryCount);

        // 점수 계산
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

        // 목적지별 기본 팁
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

        // 여행 스타일별 팁
        if (request.getTravelStyle() != null) {
            switch (request.getTravelStyle().toUpperCase()) {
                case "ADVENTURE":
                    tips.add(TravelTip.builder()
                            .category("준비물")
                            .title("모험 여행 장비")
                            .content("편한 운동화, 방수 재킷, 선크림을 준비하세요.")
                            .importance("MEDIUM")
                            .relatedPlaces(Arrays.asList("등산로", "해변"))
                            .build());
                    break;
                case "CULTURE":
                    tips.add(TravelTip.builder()
                            .category("문화")
                            .title("현지 예절")
                            .content("현지 문화와 에티켓을 미리 학습하면 좋습니다.")
                            .importance("MEDIUM")
                            .relatedPlaces(Arrays.asList("사원", "박물관"))
                            .build());
                    break;
                case "FOOD":
                    tips.add(TravelTip.builder()
                            .category("음식")
                            .title("로컬 맛집")
                            .content("관광지보다 현지인이 자주 가는 식당을 찾아보세요.")
                            .importance("MEDIUM")
                            .relatedPlaces(Arrays.asList("시장", "골목"))
                            .build());
                    break;
            }
        }

        // 계절별 팁
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

        // OpenAI API 사용 가능 시 AI 응답 생성
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

        // 규칙 기반 응답 (폴백)
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
            "content", "You are TravelMate AI, a friendly and helpful Korean travel assistant. " +
                      "Always respond in Korean. Be concise but informative. " +
                      "Help users with travel planning, destination recommendations, local tips, and itinerary suggestions. " +
                      "If you don't have specific information, suggest general travel tips or ask clarifying questions."
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
            return "안녕하세요! TravelMate AI입니다. 여행 계획, 장소 추천, 현지 정보 등 무엇이든 물어보세요!";
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

    // ===== Private Helper Methods =====

    private ItineraryResponse generateItineraryWithAI(User user, ItineraryRequest request, int days) {
        try {
            // OpenAI API 요청 구성
            String prompt = buildItineraryPrompt(user, request, days);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(openaiApiKey);

            Map<String, Object> requestBody = new LinkedHashMap<>();
            requestBody.put("model", "gpt-4o-mini");
            requestBody.put("max_tokens", 4000);
            requestBody.put("temperature", 0.7);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of(
                "role", "system",
                "content", "You are an expert travel planner. Create detailed travel itineraries in JSON format. " +
                          "Always respond with valid JSON that can be parsed. Include realistic activities, " +
                          "estimated costs in KRW, and practical tips."
            ));
            messages.add(Map.of("role", "user", "content", prompt));
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
                    String content = (String) message.get("content");
                    return parseAIItineraryResponse(content, request, days);
                }
            }

            // API 응답 파싱 실패 시 규칙 기반으로 폴백
            log.warn("Failed to parse OpenAI response, falling back to rule-based");
            return generateRuleBasedItinerary(user, request, days);

        } catch (Exception e) {
            log.error("OpenAI API call failed: {}", e.getMessage());
            throw e;
        }
    }

    private String buildItineraryPrompt(User user, ItineraryRequest request, int days) {
        StringBuilder prompt = new StringBuilder();
        prompt.append(String.format("Create a detailed %d-day travel itinerary for %s.\n", days, request.getDestination()));
        prompt.append(String.format("Travel dates: %s to %s\n", request.getStartDate(), request.getEndDate()));

        if (request.getTravelStyle() != null) {
            prompt.append(String.format("Travel style: %s\n", request.getTravelStyle()));
        }
        if (request.getBudgetRange() != null) {
            prompt.append(String.format("Budget level: %s\n", request.getBudgetRange()));
        }
        if (request.getInterests() != null && !request.getInterests().isEmpty()) {
            prompt.append(String.format("Interests: %s\n", String.join(", ", request.getInterests())));
        }
        if (request.getGroupSize() != null) {
            prompt.append(String.format("Group size: %d people\n", request.getGroupSize()));
        }

        prompt.append("\nRespond in JSON format with this structure:\n");
        prompt.append("{\n");
        prompt.append("  \"summary\": \"Brief trip summary in Korean\",\n");
        prompt.append("  \"dayPlans\": [\n");
        prompt.append("    {\n");
        prompt.append("      \"dayNumber\": 1,\n");
        prompt.append("      \"theme\": \"Day theme in Korean\",\n");
        prompt.append("      \"activities\": [\n");
        prompt.append("        {\n");
        prompt.append("          \"name\": \"Activity name in Korean\",\n");
        prompt.append("          \"description\": \"Description in Korean\",\n");
        prompt.append("          \"time\": \"09:00\",\n");
        prompt.append("          \"durationMinutes\": 120,\n");
        prompt.append("          \"category\": \"FOOD|CULTURE|NATURE|SIGHTSEEING|SHOPPING\",\n");
        prompt.append("          \"estimatedCost\": 30000\n");
        prompt.append("        }\n");
        prompt.append("      ],\n");
        prompt.append("      \"notes\": \"Day notes in Korean\"\n");
        prompt.append("    }\n");
        prompt.append("  ],\n");
        prompt.append("  \"tips\": [\"Tip 1 in Korean\", \"Tip 2 in Korean\"]\n");
        prompt.append("}\n");

        return prompt.toString();
    }

    @SuppressWarnings("unchecked")
    private ItineraryResponse parseAIItineraryResponse(String content, ItineraryRequest request, int days) {
        try {
            // JSON 부분만 추출
            int jsonStart = content.indexOf("{");
            int jsonEnd = content.lastIndexOf("}") + 1;
            if (jsonStart < 0 || jsonEnd <= jsonStart) {
                throw new RuntimeException("No valid JSON found in response");
            }
            String jsonContent = content.substring(jsonStart, jsonEnd);

            com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
            Map<String, Object> parsed = mapper.readValue(jsonContent, Map.class);

            String summary = (String) parsed.getOrDefault("summary",
                String.format("%s %d일 여행 일정입니다.", request.getDestination(), days));

            List<DayPlan> dayPlans = new ArrayList<>();
            List<Map<String, Object>> dayPlansData = (List<Map<String, Object>>) parsed.get("dayPlans");

            if (dayPlansData != null) {
                for (int i = 0; i < dayPlansData.size(); i++) {
                    Map<String, Object> dayData = dayPlansData.get(i);
                    LocalDate date = request.getStartDate().plusDays(i);

                    List<Activity> activities = new ArrayList<>();
                    List<Map<String, Object>> activitiesData = (List<Map<String, Object>>) dayData.get("activities");

                    if (activitiesData != null) {
                        for (Map<String, Object> actData : activitiesData) {
                            activities.add(Activity.builder()
                                .name((String) actData.getOrDefault("name", "활동"))
                                .description((String) actData.getOrDefault("description", ""))
                                .time((String) actData.getOrDefault("time", "09:00"))
                                .durationMinutes(actData.get("durationMinutes") != null ?
                                    ((Number) actData.get("durationMinutes")).intValue() : 60)
                                .category((String) actData.getOrDefault("category", "SIGHTSEEING"))
                                .estimatedCost(actData.get("estimatedCost") != null ?
                                    ((Number) actData.get("estimatedCost")).doubleValue() : 20000.0)
                                .build());
                        }
                    }

                    dayPlans.add(DayPlan.builder()
                        .dayNumber(i + 1)
                        .date(date)
                        .theme((String) dayData.getOrDefault("theme", "자유 일정"))
                        .activities(activities)
                        .notes((String) dayData.get("notes"))
                        .build());
                }
            }

            List<String> tips = (List<String>) parsed.getOrDefault("tips",
                Arrays.asList("즐거운 여행 되세요!", "현지 문화를 존중해주세요."));

            return ItineraryResponse.builder()
                .destination(request.getDestination())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .dayPlans(dayPlans)
                .tips(tips)
                .budgetEstimate(estimateBudget(request, days))
                .summary(summary)
                .build();

        } catch (Exception e) {
            log.error("Failed to parse AI response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }

    private ItineraryResponse generateRuleBasedItinerary(User user, ItineraryRequest request, int days) {
        List<DayPlan> dayPlans = new ArrayList<>();

        String[] themes = {"도착 및 탐험", "문화 체험", "자연 탐방", "미식 여행", "자유 시간", "쇼핑 및 휴식", "마무리"};

        for (int i = 0; i < days; i++) {
            LocalDate date = request.getStartDate().plusDays(i);
            String theme = themes[i % themes.length];

            List<Activity> activities = generateDayActivities(theme, request, i + 1);

            dayPlans.add(DayPlan.builder()
                    .dayNumber(i + 1)
                    .date(date)
                    .theme(theme)
                    .activities(activities)
                    .notes(generateDayNotes(theme))
                    .build());
        }

        return ItineraryResponse.builder()
                .destination(request.getDestination())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .dayPlans(dayPlans)
                .tips(generateGeneralTips(request))
                .budgetEstimate(estimateBudget(request, days))
                .summary(String.format("%s에서의 %d일 여행 일정입니다. %s 스타일로 구성했습니다.",
                        request.getDestination(), days, request.getTravelStyle()))
                .build();
    }

    private List<Activity> generateDayActivities(String theme, ItineraryRequest request, int dayNumber) {
        List<Activity> activities = new ArrayList<>();

        // 아침 활동
        activities.add(Activity.builder()
                .name("아침 식사")
                .description("현지 조식 또는 호텔 조식")
                .time("08:00")
                .durationMinutes(60)
                .category("FOOD")
                .estimatedCost(15000.0)
                .build());

        // 테마별 주요 활동
        switch (theme) {
            case "문화 체험":
                activities.add(Activity.builder()
                        .name("박물관 또는 유적지 방문")
                        .description("현지 문화와 역사를 체험합니다")
                        .time("10:00")
                        .durationMinutes(180)
                        .category("CULTURE")
                        .estimatedCost(20000.0)
                        .build());
                break;
            case "자연 탐방":
                activities.add(Activity.builder()
                        .name("자연 명소 탐방")
                        .description("아름다운 자연 경관을 감상합니다")
                        .time("10:00")
                        .durationMinutes(240)
                        .category("NATURE")
                        .estimatedCost(10000.0)
                        .build());
                break;
            case "미식 여행":
                activities.add(Activity.builder()
                        .name("현지 시장 탐방")
                        .description("현지 음식과 문화를 체험합니다")
                        .time("10:00")
                        .durationMinutes(180)
                        .category("FOOD")
                        .estimatedCost(30000.0)
                        .build());
                break;
            default:
                activities.add(Activity.builder()
                        .name("자유 관광")
                        .description("개인 일정에 따라 자유롭게 관광합니다")
                        .time("10:00")
                        .durationMinutes(180)
                        .category("SIGHTSEEING")
                        .estimatedCost(20000.0)
                        .build());
        }

        // 점심
        activities.add(Activity.builder()
                .name("점심 식사")
                .description("현지 맛집에서 점심")
                .time("13:00")
                .durationMinutes(90)
                .category("FOOD")
                .estimatedCost(20000.0)
                .build());

        // 오후 활동
        activities.add(Activity.builder()
                .name("오후 관광")
                .description("주변 명소 방문")
                .time("15:00")
                .durationMinutes(180)
                .category("SIGHTSEEING")
                .estimatedCost(15000.0)
                .build());

        // 저녁
        activities.add(Activity.builder()
                .name("저녁 식사")
                .description("특별한 저녁 식사")
                .time("19:00")
                .durationMinutes(120)
                .category("FOOD")
                .estimatedCost(40000.0)
                .build());

        return activities;
    }

    private String generateDayNotes(String theme) {
        return switch (theme) {
            case "도착 및 탐험" -> "도착 후 충분한 휴식을 취하세요.";
            case "문화 체험" -> "편한 신발을 신고 충분한 시간을 확보하세요.";
            case "자연 탐방" -> "날씨를 확인하고 필요한 장비를 준비하세요.";
            case "미식 여행" -> "현지인 추천 맛집을 미리 조사해두세요.";
            default -> "여유롭게 즐기세요!";
        };
    }

    private List<String> generateGeneralTips(ItineraryRequest request) {
        List<String> tips = new ArrayList<>();
        tips.add("현지 화폐를 미리 환전해두세요");
        tips.add("여행자 보험에 가입하세요");
        tips.add("중요한 연락처를 저장해두세요");
        tips.add("현지 SIM 카드나 로밍 서비스를 준비하세요");
        return tips;
    }

    private BudgetEstimate estimateBudget(ItineraryRequest request, int days) {
        double accommodationPerDay = switch (request.getBudgetRange() != null ? request.getBudgetRange().toUpperCase() : "MEDIUM") {
            case "LOW" -> 50000;
            case "HIGH" -> 200000;
            case "LUXURY" -> 400000;
            default -> 100000;
        };

        double foodPerDay = switch (request.getBudgetRange() != null ? request.getBudgetRange().toUpperCase() : "MEDIUM") {
            case "LOW" -> 30000;
            case "HIGH" -> 100000;
            case "LUXURY" -> 200000;
            default -> 60000;
        };

        double transportationPerDay = 30000;
        double activitiesPerDay = 50000;

        Map<String, Double> breakdown = new LinkedHashMap<>();
        breakdown.put("숙박", accommodationPerDay * days);
        breakdown.put("식비", foodPerDay * days);
        breakdown.put("교통", transportationPerDay * days);
        breakdown.put("활동", activitiesPerDay * days);

        return BudgetEstimate.builder()
                .totalEstimate(breakdown.values().stream().mapToDouble(Double::doubleValue).sum())
                .accommodationEstimate(accommodationPerDay * days)
                .foodEstimate(foodPerDay * days)
                .transportationEstimate(transportationPerDay * days)
                .activitiesEstimate(activitiesPerDay * days)
                .currency("KRW")
                .breakdown(breakdown)
                .build();
    }

    private PlaceRecommendation calculatePlaceRecommendation(User user, CollectibleLocation location, PlaceRecommendationRequest request) {
        double baseScore = 50.0;

        // 카테고리 가중치
        String category = location.getCategory() != null ? location.getCategory().name() : "OTHER";
        double categoryWeight = CATEGORY_WEIGHTS.getOrDefault(category, 1.0);
        baseScore *= categoryWeight;

        // 희귀도 보너스
        if (location.getRarity() != null) {
            baseScore += switch (location.getRarity()) {
                case LEGENDARY -> 30;
                case EPIC -> 20;
                case RARE -> 10;
                default -> 0;
            };
        }

        // 평점 보너스
        if (location.getAverageRating() != null && location.getAverageRating() > 0) {
            baseScore += location.getAverageRating() * 5;
        }

        // 거리 패널티
        double distance = calculateDistance(
                request.getLatitude(), request.getLongitude(),
                location.getLatitude(), location.getLongitude());
        baseScore -= Math.min(20, distance * 2);

        // 추천 이유 생성
        List<String> reasons = generatePlaceReasons(location, user);

        return PlaceRecommendation.builder()
                .placeId(location.getId())
                .name(location.getName())
                .description(location.getDescription())
                .category(category)
                .latitude(location.getLatitude())
                .longitude(location.getLongitude())
                .distance(distance)
                .rating(location.getAverageRating())
                .reviewCount(location.getReviewCount())
                .imageUrl(location.getImageUrl())
                .aiScore(Math.min(100, Math.max(0, baseScore)))
                .reasons(reasons)
                .bestTimeToVisit(determineBestTime(location))
                .estimatedDuration(estimateDuration(location))
                .build();
    }

    private List<String> generatePlaceReasons(CollectibleLocation location, User user) {
        List<String> reasons = new ArrayList<>();

        if (location.getRarity() != null) {
            switch (location.getRarity()) {
                case LEGENDARY -> reasons.add("희귀한 전설적 장소입니다!");
                case EPIC -> reasons.add("에픽 등급의 특별한 장소입니다");
                case RARE -> reasons.add("레어한 장소입니다");
            }
        }

        if (location.getAverageRating() != null && location.getAverageRating() >= 4.5) {
            reasons.add("방문자들의 평점이 매우 높습니다");
        }

        if (user.getTravelStyle() != null) {
            String style = user.getTravelStyle().name();
            String category = location.getCategory() != null ? location.getCategory().name() : "";

            if ((style.equals("CULTURE") && (category.contains("MUSEUM") || category.contains("LANDMARK"))) ||
                (style.equals("NATURE") && category.contains("NATURE")) ||
                (style.equals("FOOD") && category.contains("RESTAURANT"))) {
                reasons.add("회원님의 여행 스타일과 잘 맞습니다");
            }
        }

        if (reasons.isEmpty()) {
            reasons.add("근처의 추천 장소입니다");
        }

        return reasons;
    }

    private String determineBestTime(CollectibleLocation location) {
        String category = location.getCategory() != null ? location.getCategory().name() : "";
        return switch (category) {
            case "RESTAURANT" -> "점심 또는 저녁 시간";
            case "MUSEUM" -> "오전 10시 이후";
            case "NATURE" -> "이른 아침 또는 석양 무렵";
            case "LANDMARK" -> "오전 또는 야경 시간";
            default -> "언제든지";
        };
    }

    private String estimateDuration(CollectibleLocation location) {
        String category = location.getCategory() != null ? location.getCategory().name() : "";
        return switch (category) {
            case "RESTAURANT" -> "1-2시간";
            case "MUSEUM" -> "2-3시간";
            case "NATURE" -> "3-4시간";
            case "LANDMARK" -> "1-2시간";
            case "SHOPPING" -> "2-3시간";
            default -> "1-2시간";
        };
    }

    private List<ActivitySuggestion> generateActivitySuggestions(User user, PersonalizedRequest request, UserAnalysis analysis) {
        List<ActivitySuggestion> suggestions = new ArrayList<>();

        // 시간대별 제안
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
        // 수집 데이터가 많을수록 신뢰도 증가
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
        // 아직 방문하지 않은 인기 지역 추천
        List<String> popularRegions = Arrays.asList("서울", "부산", "제주도", "경주", "강릉");

        for (String region : popularRegions) {
            if (!preferredDestinations.contains(region)) {
                return region;
            }
        }

        return preferredDestinations.isEmpty() ? "제주도" : preferredDestinations.get(0);
    }

    private double calculateDistance(Double lat1, Double lon1, Double lat2, Double lon2) {
        if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
            return 999;
        }

        final int R = 6371; // 지구 반지름 (km)
        double latDistance = Math.toRadians(lat2 - lat1);
        double lonDistance = Math.toRadians(lon2 - lon1);
        double a = Math.sin(latDistance / 2) * Math.sin(latDistance / 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2))
                * Math.sin(lonDistance / 2) * Math.sin(lonDistance / 2);
        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
}
