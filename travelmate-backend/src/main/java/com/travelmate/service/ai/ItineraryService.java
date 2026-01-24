package com.travelmate.service.ai;

import com.travelmate.dto.AIRecommendationDto.*;
import com.travelmate.entity.User;
import com.travelmate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.*;

/**
 * AI 기반 여행 일정 생성 서비스
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class ItineraryService {

    private final UserRepository userRepository;
    private final RestTemplate restTemplate;

    @Value("${ai.openai.api-key:}")
    private String openaiApiKey;

    @Value("${ai.openai.enabled:false}")
    private boolean openaiEnabled;

    private static final String OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

    /**
     * AI 기반 여행 일정 생성
     */
    @Transactional(readOnly = true)
    public ItineraryResponse generateItinerary(Long userId, ItineraryRequest request) {
        log.info("Generating AI itinerary for user {} to {}", userId, request.getDestination());

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("사용자를 찾을 수 없습니다."));

        long days = ChronoUnit.DAYS.between(request.getStartDate(), request.getEndDate()) + 1;

        if (openaiEnabled && openaiApiKey != null && !openaiApiKey.isEmpty()) {
            try {
                return generateItineraryWithAI(user, request, (int) days);
            } catch (Exception e) {
                log.warn("AI itinerary generation failed, falling back to rule-based: {}", e.getMessage());
            }
        }

        return generateRuleBasedItinerary(user, request, (int) days);
    }

    private ItineraryResponse generateItineraryWithAI(User user, ItineraryRequest request, int days) {
        try {
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

        activities.add(Activity.builder()
                .name("아침 식사")
                .description("현지 조식 또는 호텔 조식")
                .time("08:00")
                .durationMinutes(60)
                .category("FOOD")
                .estimatedCost(15000.0)
                .build());

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

        activities.add(Activity.builder()
                .name("점심 식사")
                .description("현지 맛집에서 점심")
                .time("13:00")
                .durationMinutes(90)
                .category("FOOD")
                .estimatedCost(20000.0)
                .build());

        activities.add(Activity.builder()
                .name("오후 관광")
                .description("주변 명소 방문")
                .time("15:00")
                .durationMinutes(180)
                .category("SIGHTSEEING")
                .estimatedCost(15000.0)
                .build());

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

    public BudgetEstimate estimateBudget(ItineraryRequest request, int days) {
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
}
