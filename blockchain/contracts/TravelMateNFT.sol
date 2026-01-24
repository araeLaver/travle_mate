// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Pausable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Burnable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TravelMateNFT
 * @dev NFT contract for Fryndo location-based collectibles
 * @notice This contract manages location-based NFTs that users collect by visiting places
 */
contract TravelMateNFT is
    ERC721,
    ERC721URIStorage,
    ERC721Enumerable,
    ERC721Pausable,
    ERC721Burnable,
    AccessControl,
    ReentrancyGuard
{
    // Roles
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");

    // Token counter
    uint256 private _tokenIdCounter;

    // Location data structure
    struct LocationMetadata {
        uint256 locationId;
        string locationName;
        string rarity;
        uint256 collectedAt;
        int256 latitude;
        int256 longitude;
    }

    // Mapping from tokenId to location metadata
    mapping(uint256 => LocationMetadata) private _locationMetadata;

    // Mapping from locationId to total minted count
    mapping(uint256 => uint256) private _locationMintCount;

    // Maximum supply per location (0 = unlimited)
    mapping(uint256 => uint256) private _locationMaxSupply;

    // Events
    event NFTMinted(
        address indexed to,
        uint256 indexed tokenId,
        uint256 indexed locationId,
        string locationName,
        string rarity
    );

    event LocationMaxSupplySet(uint256 indexed locationId, uint256 maxSupply);
    event MetadataUpdated(uint256 indexed tokenId, string newUri);

    constructor(
        string memory name,
        string memory symbol,
        address defaultAdmin,
        address minter
    ) ERC721(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, defaultAdmin);
        _grantRole(ADMIN_ROLE, defaultAdmin);
        _grantRole(MINTER_ROLE, minter);
        _grantRole(PAUSER_ROLE, defaultAdmin);
    }

    /**
     * @dev Mint a new NFT
     * @param to Recipient address
     * @param uri Metadata URI (IPFS)
     * @return tokenId The minted token ID
     */
    function mintNFT(
        address to,
        string memory uri
    ) public onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256) {
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        emit NFTMinted(to, tokenId, 0, "", "");

        return tokenId;
    }

    /**
     * @dev Mint a new NFT with location metadata
     * @param to Recipient address
     * @param uri Metadata URI (IPFS)
     * @param locationId Location identifier
     * @param locationName Name of the location
     * @param rarity Rarity level (COMMON, UNCOMMON, RARE, EPIC, LEGENDARY)
     * @param latitude Location latitude (multiplied by 1e6)
     * @param longitude Location longitude (multiplied by 1e6)
     * @return tokenId The minted token ID
     */
    function mintNFTWithLocation(
        address to,
        string memory uri,
        uint256 locationId,
        string memory locationName,
        string memory rarity,
        int256 latitude,
        int256 longitude
    ) public onlyRole(MINTER_ROLE) whenNotPaused nonReentrant returns (uint256) {
        // Check max supply if set
        if (_locationMaxSupply[locationId] > 0) {
            require(
                _locationMintCount[locationId] < _locationMaxSupply[locationId],
                "Max supply reached for this location"
            );
        }

        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, uri);

        // Store location metadata
        _locationMetadata[tokenId] = LocationMetadata({
            locationId: locationId,
            locationName: locationName,
            rarity: rarity,
            collectedAt: block.timestamp,
            latitude: latitude,
            longitude: longitude
        });

        // Increment location mint count
        _locationMintCount[locationId]++;

        emit NFTMinted(to, tokenId, locationId, locationName, rarity);

        return tokenId;
    }

    /**
     * @dev Set maximum supply for a location
     * @param locationId Location identifier
     * @param maxSupply Maximum number of NFTs that can be minted for this location
     */
    function setLocationMaxSupply(
        uint256 locationId,
        uint256 maxSupply
    ) external onlyRole(ADMIN_ROLE) {
        require(
            maxSupply == 0 || maxSupply >= _locationMintCount[locationId],
            "Max supply cannot be less than current mint count"
        );
        _locationMaxSupply[locationId] = maxSupply;
        emit LocationMaxSupplySet(locationId, maxSupply);
    }

    /**
     * @dev Update token URI (for metadata updates)
     * @param tokenId Token ID
     * @param newUri New metadata URI
     */
    function updateTokenURI(
        uint256 tokenId,
        string memory newUri
    ) external onlyRole(ADMIN_ROLE) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        _setTokenURI(tokenId, newUri);
        emit MetadataUpdated(tokenId, newUri);
    }

    /**
     * @dev Get location metadata for a token
     * @param tokenId Token ID
     * @return LocationMetadata struct
     */
    function getLocationMetadata(uint256 tokenId)
        external
        view
        returns (LocationMetadata memory)
    {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return _locationMetadata[tokenId];
    }

    /**
     * @dev Get mint count for a location
     * @param locationId Location identifier
     * @return count Number of NFTs minted for this location
     */
    function getLocationMintCount(uint256 locationId)
        external
        view
        returns (uint256)
    {
        return _locationMintCount[locationId];
    }

    /**
     * @dev Get max supply for a location
     * @param locationId Location identifier
     * @return maxSupply Maximum supply (0 = unlimited)
     */
    function getLocationMaxSupply(uint256 locationId)
        external
        view
        returns (uint256)
    {
        return _locationMaxSupply[locationId];
    }

    /**
     * @dev Get tokens owned by an address
     * @param owner Address to query
     * @return tokenIds Array of token IDs
     */
    function tokensOfOwner(address owner)
        external
        view
        returns (uint256[] memory)
    {
        uint256 balance = balanceOf(owner);
        uint256[] memory tokenIds = new uint256[](balance);

        for (uint256 i = 0; i < balance; i++) {
            tokenIds[i] = tokenOfOwnerByIndex(owner, i);
        }

        return tokenIds;
    }

    /**
     * @dev Get total supply
     * @return Total number of minted NFTs
     */
    function getTotalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Pause contract
     */
    function pause() external onlyRole(PAUSER_ROLE) {
        _pause();
    }

    /**
     * @dev Unpause contract
     */
    function unpause() external onlyRole(PAUSER_ROLE) {
        _unpause();
    }

    // Required overrides
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override(ERC721, ERC721Enumerable, ERC721Pausable) returns (address) {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(
        address account,
        uint128 value
    ) internal override(ERC721, ERC721Enumerable) {
        super._increaseBalance(account, value);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721Enumerable, ERC721URIStorage, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
