package com.travelmate.repository.nft;

import com.travelmate.entity.nft.NftTrait;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface NftTraitRepository extends JpaRepository<NftTrait, Long> {
    List<NftTrait> findByNftCollectionId(Long nftCollectionId);
    List<NftTrait> findByTraitType(String traitType);
    List<NftTrait> findByTraitTypeAndTraitValue(String traitType, String traitValue);
}
