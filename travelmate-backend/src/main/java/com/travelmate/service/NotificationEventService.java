package com.travelmate.service;

import com.travelmate.dto.PushNotificationDto;
import com.travelmate.entity.nft.CollectibleLocation;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service for sending push notifications on various events
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationEventService {

    private final FcmService fcmService;

    /**
     * Send notification when someone follows a user
     */
    @Async
    public void onFollow(Long targetUserId, String followerNickname, Long followerId) {
        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title("새 팔로워")
                .body(followerNickname + "님이 팔로우했습니다.")
                .icon("/icons/follow.png")
                .clickAction("/profile/" + followerId)
                .data(Map.of(
                        "type", "FOLLOW",
                        "followerId", String.valueOf(followerId),
                        "followerNickname", followerNickname
                ))
                .build();

        fcmService.sendToUser(targetUserId, payload);
        log.debug("Follow notification sent to user {}", targetUserId);
    }

    /**
     * Send notification when NFT is collected
     */
    @Async
    public void onNftCollected(Long userId, CollectibleLocation location, Long collectionId) {
        String rarityEmoji = getRarityEmoji(location.getRarity().name());

        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title(rarityEmoji + " NFT 수집 완료!")
                .body(location.getName() + " NFT를 수집했습니다.")
                .imageUrl(location.getImageUrl())
                .icon("/icons/nft.png")
                .clickAction("/nft/collection/" + collectionId)
                .data(Map.of(
                        "type", "NFT_COLLECTED",
                        "collectionId", String.valueOf(collectionId),
                        "locationName", location.getName(),
                        "rarity", location.getRarity().name()
                ))
                .build();

        fcmService.sendToUser(userId, payload);
        log.debug("NFT collected notification sent to user {}", userId);
    }

    /**
     * Send notification when NFT minting is complete
     */
    @Async
    public void onMintingComplete(Long userId, String locationName, String tokenId, String transactionHash) {
        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title("민팅 완료!")
                .body(locationName + " NFT가 블록체인에 민팅되었습니다.")
                .icon("/icons/minting.png")
                .clickAction("/nft/collection")
                .data(Map.of(
                        "type", "MINTING_COMPLETE",
                        "locationName", locationName,
                        "tokenId", tokenId,
                        "transactionHash", transactionHash
                ))
                .build();

        fcmService.sendToUser(userId, payload);
        log.debug("Minting complete notification sent to user {}", userId);
    }

    /**
     * Send notification when minting fails
     */
    @Async
    public void onMintingFailed(Long userId, String locationName, String errorMessage) {
        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title("민팅 실패")
                .body(locationName + " NFT 민팅에 실패했습니다. 다시 시도해주세요.")
                .icon("/icons/error.png")
                .clickAction("/nft/collection")
                .data(Map.of(
                        "type", "MINTING_FAILED",
                        "locationName", locationName,
                        "error", errorMessage
                ))
                .build();

        fcmService.sendToUser(userId, payload);
        log.debug("Minting failed notification sent to user {}", userId);
    }

    /**
     * Send notification when user receives a chat message
     */
    @Async
    public void onChatMessage(Long recipientId, String senderNickname, String messagePreview, Long chatRoomId) {
        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title(senderNickname)
                .body(messagePreview.length() > 50 ? messagePreview.substring(0, 47) + "..." : messagePreview)
                .icon("/icons/chat.png")
                .clickAction("/chat/" + chatRoomId)
                .data(Map.of(
                        "type", "MESSAGE",
                        "chatRoomId", String.valueOf(chatRoomId),
                        "senderNickname", senderNickname
                ))
                .build();

        fcmService.sendToUser(recipientId, payload);
        log.debug("Chat message notification sent to user {}", recipientId);
    }

    /**
     * Send notification when user is invited to a group
     */
    @Async
    public void onGroupInvite(Long userId, String groupName, Long groupId, String inviterNickname) {
        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title("그룹 초대")
                .body(inviterNickname + "님이 '" + groupName + "' 그룹에 초대했습니다.")
                .icon("/icons/group.png")
                .clickAction("/groups/" + groupId)
                .data(Map.of(
                        "type", "GROUP_INVITE",
                        "groupId", String.valueOf(groupId),
                        "groupName", groupName,
                        "inviterNickname", inviterNickname
                ))
                .build();

        fcmService.sendToUser(userId, payload);
        log.debug("Group invite notification sent to user {}", userId);
    }

    /**
     * Send notification when user's review is marked helpful
     */
    @Async
    public void onReviewHelpful(Long reviewOwnerId, String locationName, int helpfulCount) {
        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title("리뷰 반응")
                .body(locationName + " 리뷰가 도움이 됐어요! (" + helpfulCount + "명)")
                .icon("/icons/helpful.png")
                .clickAction("/reviews")
                .data(Map.of(
                        "type", "REVIEW_HELPFUL",
                        "locationName", locationName,
                        "helpfulCount", String.valueOf(helpfulCount)
                ))
                .build();

        fcmService.sendToUser(reviewOwnerId, payload);
        log.debug("Review helpful notification sent to user {}", reviewOwnerId);
    }

    /**
     * Send notification to group members
     */
    @Async
    public void onGroupAnnouncement(List<Long> memberIds, String groupName, String message, Long groupId) {
        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title(groupName)
                .body(message)
                .icon("/icons/announcement.png")
                .clickAction("/groups/" + groupId)
                .data(Map.of(
                        "type", "GROUP_ANNOUNCEMENT",
                        "groupId", String.valueOf(groupId),
                        "groupName", groupName
                ))
                .build();

        fcmService.sendToUsers(memberIds, payload);
        log.debug("Group announcement sent to {} members", memberIds.size());
    }

    /**
     * Send notification when nearby NFT is available
     */
    @Async
    public void onNearbyNft(Long userId, String locationName, String rarity, double distance) {
        String distanceText = distance < 1000
                ? String.format("%.0fm", distance)
                : String.format("%.1fkm", distance / 1000);

        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title("근처에 NFT 발견!")
                .body(locationName + " (" + rarity + ") - " + distanceText + " 거리")
                .icon("/icons/location.png")
                .clickAction("/nft/map")
                .data(Map.of(
                        "type", "NEARBY_NFT",
                        "locationName", locationName,
                        "rarity", rarity,
                        "distance", String.valueOf(distance)
                ))
                .build();

        fcmService.sendToUser(userId, payload);
        log.debug("Nearby NFT notification sent to user {}", userId);
    }

    /**
     * Send leaderboard rank change notification
     */
    @Async
    public void onRankChange(Long userId, int oldRank, int newRank) {
        boolean improved = newRank < oldRank;
        String title = improved ? "순위 상승!" : "순위 변동";
        String body = improved
                ? String.format("%d위에서 %d위로 올라갔습니다!", oldRank, newRank)
                : String.format("현재 순위: %d위", newRank);

        PushNotificationDto.NotificationPayload payload = PushNotificationDto.NotificationPayload.builder()
                .title(title)
                .body(body)
                .icon("/icons/leaderboard.png")
                .clickAction("/leaderboard")
                .data(Map.of(
                        "type", "RANK_CHANGE",
                        "oldRank", String.valueOf(oldRank),
                        "newRank", String.valueOf(newRank)
                ))
                .build();

        fcmService.sendToUser(userId, payload);
        log.debug("Rank change notification sent to user {}", userId);
    }

    private String getRarityEmoji(String rarity) {
        return switch (rarity) {
            case "LEGENDARY" -> "\uD83D\uDC8E"; // 💎
            case "EPIC" -> "\uD83D\uDC9C"; // 💜
            case "RARE" -> "\uD83D\uDC99"; // 💙
            default -> "\uD83D\uDC9A"; // 💚
        };
    }
}
