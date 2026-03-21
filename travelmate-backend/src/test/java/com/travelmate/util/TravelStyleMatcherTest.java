package com.travelmate.util;

import com.travelmate.entity.User.TravelStyle;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.*;

@DisplayName("TravelStyleMatcher 테스트")
class TravelStyleMatcherTest {

    @Nested
    @DisplayName("calculateCompatibilityScore 테스트")
    class CalculateCompatibilityScoreTest {

        @Test
        @DisplayName("동일한 스타일 - 최대 점수 30점")
        void perfectMatch() {
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(
                    TravelStyle.ADVENTURE, TravelStyle.ADVENTURE)).isEqualTo(30.0);
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(
                    TravelStyle.CULTURE, TravelStyle.CULTURE)).isEqualTo(30.0);
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(
                    TravelStyle.FOOD, TravelStyle.FOOD)).isEqualTo(30.0);
        }

        @ParameterizedTest(name = "{0} + {1} = {2}점")
        @MethodSource("compatibleStylesProvider")
        @DisplayName("호환되는 스타일 - 20점")
        void compatibleStyles(TravelStyle style1, TravelStyle style2, double expectedScore) {
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(style1, style2))
                    .isEqualTo(expectedScore);
        }

        static Stream<Arguments> compatibleStylesProvider() {
            return Stream.of(
                    // ADVENTURE 호환 스타일
                    Arguments.of(TravelStyle.ADVENTURE, TravelStyle.NATURE, 20.0),
                    Arguments.of(TravelStyle.ADVENTURE, TravelStyle.CULTURE, 20.0),
                    // RELAXATION 호환 스타일
                    Arguments.of(TravelStyle.RELAXATION, TravelStyle.CULTURE, 20.0),
                    Arguments.of(TravelStyle.RELAXATION, TravelStyle.NATURE, 20.0),
                    // CULTURE 호환 스타일
                    Arguments.of(TravelStyle.CULTURE, TravelStyle.RELAXATION, 20.0),
                    Arguments.of(TravelStyle.CULTURE, TravelStyle.SHOPPING, 20.0),
                    // FOOD 호환 스타일
                    Arguments.of(TravelStyle.FOOD, TravelStyle.CULTURE, 20.0),
                    Arguments.of(TravelStyle.FOOD, TravelStyle.SHOPPING, 20.0),
                    // SHOPPING 호환 스타일
                    Arguments.of(TravelStyle.SHOPPING, TravelStyle.CULTURE, 20.0),
                    Arguments.of(TravelStyle.SHOPPING, TravelStyle.FOOD, 20.0),
                    // NATURE 호환 스타일
                    Arguments.of(TravelStyle.NATURE, TravelStyle.ADVENTURE, 20.0),
                    Arguments.of(TravelStyle.NATURE, TravelStyle.RELAXATION, 20.0)
            );
        }

        @Test
        @DisplayName("호환되지 않는 스타일 - 10점")
        void weakCompatibility() {
            // ADVENTURE와 SHOPPING은 호환 목록에 없음
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(
                    TravelStyle.ADVENTURE, TravelStyle.SHOPPING)).isEqualTo(10.0);
            // FOOD와 NATURE는 호환 목록에 없음
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(
                    TravelStyle.FOOD, TravelStyle.NATURE)).isEqualTo(10.0);
        }

        @Test
        @DisplayName("null 값 - 기본 점수 15점")
        void nullStyles() {
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(null, TravelStyle.ADVENTURE))
                    .isEqualTo(15.0);
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(TravelStyle.CULTURE, null))
                    .isEqualTo(15.0);
            assertThat(TravelStyleMatcher.calculateCompatibilityScore(null, null))
                    .isEqualTo(15.0);
        }
    }

    @Nested
    @DisplayName("isCompatible 테스트")
    class IsCompatibleTest {

        @Test
        @DisplayName("동일한 스타일은 호환")
        void sameStyleIsCompatible() {
            for (TravelStyle style : TravelStyle.values()) {
                assertThat(TravelStyleMatcher.isCompatible(style, style))
                        .as("동일한 스타일 %s는 호환되어야 함", style)
                        .isTrue();
            }
        }

        @Test
        @DisplayName("ADVENTURE와 NATURE는 호환")
        void adventureAndNatureAreCompatible() {
            assertThat(TravelStyleMatcher.isCompatible(TravelStyle.ADVENTURE, TravelStyle.NATURE)).isTrue();
            assertThat(TravelStyleMatcher.isCompatible(TravelStyle.NATURE, TravelStyle.ADVENTURE)).isTrue();
        }

        @Test
        @DisplayName("CULTURE와 SHOPPING은 호환")
        void cultureAndShoppingAreCompatible() {
            assertThat(TravelStyleMatcher.isCompatible(TravelStyle.CULTURE, TravelStyle.SHOPPING)).isTrue();
            assertThat(TravelStyleMatcher.isCompatible(TravelStyle.SHOPPING, TravelStyle.CULTURE)).isTrue();
        }

        @Test
        @DisplayName("ADVENTURE와 SHOPPING은 비호환")
        void adventureAndShoppingNotCompatible() {
            assertThat(TravelStyleMatcher.isCompatible(TravelStyle.ADVENTURE, TravelStyle.SHOPPING)).isFalse();
            assertThat(TravelStyleMatcher.isCompatible(TravelStyle.SHOPPING, TravelStyle.ADVENTURE)).isFalse();
        }

        @Test
        @DisplayName("null 스타일은 비호환")
        void nullStylesNotCompatible() {
            assertThat(TravelStyleMatcher.isCompatible(null, TravelStyle.ADVENTURE)).isFalse();
            assertThat(TravelStyleMatcher.isCompatible(TravelStyle.CULTURE, null)).isFalse();
            assertThat(TravelStyleMatcher.isCompatible(null, null)).isFalse();
        }
    }

    @Nested
    @DisplayName("isActivityMatchingStyle 테스트")
    class IsActivityMatchingStyleTest {

        @Test
        @DisplayName("음식 관련 활동 - FOOD 스타일과 매칭")
        void foodActivities() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("식사", TravelStyle.FOOD)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("맛집", TravelStyle.FOOD)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("음식", TravelStyle.FOOD)).isTrue();
            // 다른 스타일과는 매칭 안됨
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("식사", TravelStyle.ADVENTURE)).isFalse();
        }

        @Test
        @DisplayName("쇼핑 관련 활동 - SHOPPING 스타일과 매칭")
        void shoppingActivities() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("쇼핑", TravelStyle.SHOPPING)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("시장", TravelStyle.SHOPPING)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("마트", TravelStyle.SHOPPING)).isTrue();
        }

        @Test
        @DisplayName("문화 관련 활동 - CULTURE 스타일과 매칭")
        void cultureActivities() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("관광", TravelStyle.CULTURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("박물관", TravelStyle.CULTURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("미술관", TravelStyle.CULTURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("역사", TravelStyle.CULTURE)).isTrue();
        }

        @Test
        @DisplayName("하이킹 - NATURE 또는 ADVENTURE와 매칭")
        void hikingActivities() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("하이킹", TravelStyle.NATURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("하이킹", TravelStyle.ADVENTURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("등산", TravelStyle.NATURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("트레킹", TravelStyle.ADVENTURE)).isTrue();
        }

        @Test
        @DisplayName("휴식 관련 활동 - RELAXATION 스타일과 매칭")
        void relaxationActivities() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("휴식", TravelStyle.RELAXATION)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("카페", TravelStyle.RELAXATION)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("스파", TravelStyle.RELAXATION)).isTrue();
        }

        @Test
        @DisplayName("자연 관련 활동 - NATURE 스타일과 매칭")
        void natureActivities() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("자연", TravelStyle.NATURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("공원", TravelStyle.NATURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("해변", TravelStyle.NATURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("산", TravelStyle.NATURE)).isTrue();
        }

        @Test
        @DisplayName("모험 관련 활동 - ADVENTURE 스타일과 매칭")
        void adventureActivities() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("모험", TravelStyle.ADVENTURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("액티비티", TravelStyle.ADVENTURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("스포츠", TravelStyle.ADVENTURE)).isTrue();
        }

        @Test
        @DisplayName("알 수 없는 활동 - 모든 스타일과 매칭")
        void unknownActivityMatchesAll() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("기타", TravelStyle.ADVENTURE)).isTrue();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("미정", TravelStyle.CULTURE)).isTrue();
        }

        @Test
        @DisplayName("null 값 - false 반환")
        void nullValues() {
            assertThat(TravelStyleMatcher.isActivityMatchingStyle(null, TravelStyle.ADVENTURE)).isFalse();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle("식사", null)).isFalse();
            assertThat(TravelStyleMatcher.isActivityMatchingStyle(null, null)).isFalse();
        }
    }

    @Nested
    @DisplayName("getActivityKeywords 테스트")
    class GetActivityKeywordsTest {

        @Test
        @DisplayName("ADVENTURE 스타일의 키워드")
        void adventureKeywords() {
            String[] keywords = TravelStyleMatcher.getActivityKeywords(TravelStyle.ADVENTURE);
            assertThat(keywords).contains("모험", "액티비티", "스포츠", "하이킹", "래프팅");
        }

        @Test
        @DisplayName("FOOD 스타일의 키워드")
        void foodKeywords() {
            String[] keywords = TravelStyleMatcher.getActivityKeywords(TravelStyle.FOOD);
            assertThat(keywords).contains("맛집", "음식", "식당", "카페", "음식투어");
        }

        @Test
        @DisplayName("RELAXATION 스타일의 키워드")
        void relaxationKeywords() {
            String[] keywords = TravelStyleMatcher.getActivityKeywords(TravelStyle.RELAXATION);
            assertThat(keywords).contains("휴식", "스파", "카페", "리조트", "힐링");
        }

        @Test
        @DisplayName("null 스타일 - 빈 배열 반환")
        void nullStyle() {
            String[] keywords = TravelStyleMatcher.getActivityKeywords(null);
            assertThat(keywords).isEmpty();
        }

        @Test
        @DisplayName("모든 스타일에 키워드 존재")
        void allStylesHaveKeywords() {
            for (TravelStyle style : TravelStyle.values()) {
                String[] keywords = TravelStyleMatcher.getActivityKeywords(style);
                assertThat(keywords)
                        .as("%s 스타일에 키워드가 있어야 함", style)
                        .isNotEmpty();
            }
        }
    }
}
