package com.travelmate.service.nft;

import com.travelmate.entity.nft.CollectionSet;
import com.travelmate.entity.nft.CollectibleLocation;
import com.travelmate.entity.nft.UserNftCollection;
import com.travelmate.repository.nft.CollectionSetRepository;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional
@Slf4j
public class CollectionSetService {

    private final CollectionSetRepository collectionSetRepository;
    private final UserNftCollectionRepository userNftCollectionRepository;

    @Transactional(readOnly = true)
    public List<CollectionSetProgress> getUserSetProgress(Long userId) {
        List<CollectionSet> availableSets = collectionSetRepository.findAvailableSets();
        List<UserNftCollection> userCollections = userNftCollectionRepository.findByUserId(userId);

        Set<Long> collectedLocationIds = userCollections.stream()
                .map(c -> c.getLocation().getId())
                .collect(Collectors.toSet());

        return availableSets.stream()
                .map(set -> buildProgress(set, collectedLocationIds))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public CollectionSetProgress getSetProgress(Long setId, Long userId) {
        CollectionSet set = collectionSetRepository.findById(setId)
                .orElseThrow(() -> new IllegalArgumentException("컬렉션 세트를 찾을 수 없습니다."));

        List<UserNftCollection> userCollections = userNftCollectionRepository.findByUserId(userId);
        Set<Long> collectedLocationIds = userCollections.stream()
                .map(c -> c.getLocation().getId())
                .collect(Collectors.toSet());

        return buildProgress(set, collectedLocationIds);
    }

    @Transactional(readOnly = true)
    public List<CollectionSet> getAvailableSets() {
        return collectionSetRepository.findAvailableSets();
    }

    @Transactional(readOnly = true)
    public List<CollectionSet> getSetsByRegion(String region) {
        return collectionSetRepository.findActiveByRegion(region);
    }

    public List<CompletedSet> checkNewlyCompletedSets(Long userId) {
        List<CollectionSetProgress> progressList = getUserSetProgress(userId);
        return progressList.stream()
                .filter(CollectionSetProgress::isCompleted)
                .map(p -> new CompletedSet(
                        p.set().getId(),
                        p.set().getName(),
                        p.set().getBonusPoints(),
                        p.set().getBonusTitle()
                ))
                .collect(Collectors.toList());
    }

    private CollectionSetProgress buildProgress(CollectionSet set, Set<Long> collectedLocationIds) {
        List<Long> setLocationIds = set.getLocations().stream()
                .map(CollectibleLocation::getId)
                .toList();

        long collected = setLocationIds.stream()
                .filter(collectedLocationIds::contains)
                .count();

        List<Long> missingIds = setLocationIds.stream()
                .filter(id -> !collectedLocationIds.contains(id))
                .toList();

        boolean completed = collected >= set.getRequiredCount();
        double progress = setLocationIds.isEmpty() ? 0 : (double) collected / set.getRequiredCount() * 100;

        return new CollectionSetProgress(set, (int) collected, set.getRequiredCount(),
                Math.min(progress, 100), completed, missingIds);
    }

    public record CollectionSetProgress(
            CollectionSet set,
            int collected,
            int required,
            double progressPercent,
            boolean isCompleted,
            List<Long> missingLocationIds
    ) {}

    public record CompletedSet(Long setId, String name, int bonusPoints, String bonusTitle) {}
}
