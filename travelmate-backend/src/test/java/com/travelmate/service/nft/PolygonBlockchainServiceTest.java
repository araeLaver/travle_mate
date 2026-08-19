package com.travelmate.service.nft;

import com.travelmate.config.BlockchainConfig;
import com.travelmate.repository.nft.UserNftCollectionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("PolygonBlockchainService 테스트")
class PolygonBlockchainServiceTest {

    @Mock
    private UserNftCollectionRepository nftCollectionRepository;

    private BlockchainConfig blockchainConfig;
    private PolygonBlockchainService polygonBlockchainService;

    @BeforeEach
    void setUp() {
        blockchainConfig = new BlockchainConfig();
        ReflectionTestUtils.setField(blockchainConfig, "blockchainEnabled", false);
        polygonBlockchainService = new PolygonBlockchainService(blockchainConfig, nftCollectionRepository);
        ReflectionTestUtils.setField(polygonBlockchainService, "activeProfiles", "");
    }

    @Test
    @DisplayName("실패 - prod에서 blockchain.enabled=false 사용")
    void validateProductionConfiguration_BlockchainDisabledInProd() {
        // Given
        ReflectionTestUtils.setField(polygonBlockchainService, "activeProfiles", "prod");

        // When & Then
        assertThatThrownBy(() -> polygonBlockchainService.validateProductionConfiguration())
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("blockchain.enabled=true");
    }

    @Test
    @DisplayName("성공 - prod가 아니면 로컬 민팅 모드 허용")
    void validateProductionConfiguration_BlockchainDisabledOutsideProd() {
        // When & Then
        assertThatCode(() -> polygonBlockchainService.validateProductionConfiguration())
                .doesNotThrowAnyException();
    }
}
