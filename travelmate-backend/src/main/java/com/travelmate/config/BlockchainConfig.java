package com.travelmate.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.web3j.protocol.Web3j;
import org.web3j.protocol.http.HttpService;

@Configuration
@Slf4j
public class BlockchainConfig {

    @Value("${blockchain.polygon.rpc-url:https://polygon-amoy.g.alchemy.com/v2/demo}")
    private String polygonRpcUrl;

    @Value("${blockchain.polygon.chain-id:80002}")
    private long chainId;

    @Value("${blockchain.polygon.contract-address:}")
    private String contractAddress;

    @Value("${blockchain.polygon.private-key:}")
    private String privateKey;

    @Value("${blockchain.enabled:false}")
    private boolean blockchainEnabled;

    @Bean
    @ConditionalOnProperty(name = "blockchain.enabled", havingValue = "true", matchIfMissing = false)
    public Web3j web3j() {
        log.info("Initializing Web3j with RPC URL: {}", polygonRpcUrl);
        return Web3j.build(new HttpService(polygonRpcUrl));
    }

    public String getPolygonRpcUrl() {
        return polygonRpcUrl;
    }

    public long getChainId() {
        return chainId;
    }

    public String getContractAddress() {
        return contractAddress;
    }

    public String getPrivateKey() {
        return privateKey;
    }

    public boolean isBlockchainEnabled() {
        return blockchainEnabled;
    }
}
