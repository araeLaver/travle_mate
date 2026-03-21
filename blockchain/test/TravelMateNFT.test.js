const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TravelMateNFT", function () {
  let nft;
  let owner;
  let minter;
  let user1;
  let user2;

  const NAME = "Fryndo Collectibles";
  const SYMBOL = "TMCOL";

  beforeEach(async function () {
    [owner, minter, user1, user2] = await ethers.getSigners();

    const TravelMateNFT = await ethers.getContractFactory("TravelMateNFT");
    nft = await TravelMateNFT.deploy(NAME, SYMBOL, owner.address, minter.address);
    await nft.waitForDeployment();
  });

  describe("Deployment", function () {
    it("should set correct name and symbol", async function () {
      expect(await nft.name()).to.equal(NAME);
      expect(await nft.symbol()).to.equal(SYMBOL);
    });

    it("should grant admin role to owner", async function () {
      const ADMIN_ROLE = await nft.ADMIN_ROLE();
      expect(await nft.hasRole(ADMIN_ROLE, owner.address)).to.be.true;
    });

    it("should grant minter role to minter", async function () {
      const MINTER_ROLE = await nft.MINTER_ROLE();
      expect(await nft.hasRole(MINTER_ROLE, minter.address)).to.be.true;
    });

    it("should start with zero total supply", async function () {
      expect(await nft.getTotalSupply()).to.equal(0);
    });
  });

  describe("Minting", function () {
    const metadataUri = "ipfs://QmTest123";

    it("should allow minter to mint NFT", async function () {
      await nft.connect(minter).mintNFT(user1.address, metadataUri);
      expect(await nft.balanceOf(user1.address)).to.equal(1);
      expect(await nft.ownerOf(0)).to.equal(user1.address);
    });

    it("should set correct token URI", async function () {
      await nft.connect(minter).mintNFT(user1.address, metadataUri);
      expect(await nft.tokenURI(0)).to.equal(metadataUri);
    });

    it("should increment token ID", async function () {
      await nft.connect(minter).mintNFT(user1.address, metadataUri);
      await nft.connect(minter).mintNFT(user2.address, metadataUri);
      expect(await nft.getTotalSupply()).to.equal(2);
      expect(await nft.ownerOf(0)).to.equal(user1.address);
      expect(await nft.ownerOf(1)).to.equal(user2.address);
    });

    it("should not allow non-minter to mint", async function () {
      await expect(
        nft.connect(user1).mintNFT(user1.address, metadataUri)
      ).to.be.reverted;
    });

    it("should emit NFTMinted event", async function () {
      await expect(nft.connect(minter).mintNFT(user1.address, metadataUri))
        .to.emit(nft, "NFTMinted")
        .withArgs(user1.address, 0, 0, "", "");
    });
  });

  describe("Minting with Location", function () {
    const metadataUri = "ipfs://QmTest123";
    const locationId = 1;
    const locationName = "Seoul Tower";
    const rarity = "LEGENDARY";
    const latitude = 37566535; // 37.566535 * 1e6
    const longitude = 126977969; // 126.977969 * 1e6

    it("should mint NFT with location metadata", async function () {
      await nft
        .connect(minter)
        .mintNFTWithLocation(
          user1.address,
          metadataUri,
          locationId,
          locationName,
          rarity,
          latitude,
          longitude
        );

      const metadata = await nft.getLocationMetadata(0);
      expect(metadata.locationId).to.equal(locationId);
      expect(metadata.locationName).to.equal(locationName);
      expect(metadata.rarity).to.equal(rarity);
      expect(metadata.latitude).to.equal(latitude);
      expect(metadata.longitude).to.equal(longitude);
    });

    it("should increment location mint count", async function () {
      await nft
        .connect(minter)
        .mintNFTWithLocation(
          user1.address,
          metadataUri,
          locationId,
          locationName,
          rarity,
          latitude,
          longitude
        );

      expect(await nft.getLocationMintCount(locationId)).to.equal(1);

      await nft
        .connect(minter)
        .mintNFTWithLocation(
          user2.address,
          metadataUri,
          locationId,
          locationName,
          rarity,
          latitude,
          longitude
        );

      expect(await nft.getLocationMintCount(locationId)).to.equal(2);
    });

    it("should emit NFTMinted event with location info", async function () {
      await expect(
        nft
          .connect(minter)
          .mintNFTWithLocation(
            user1.address,
            metadataUri,
            locationId,
            locationName,
            rarity,
            latitude,
            longitude
          )
      )
        .to.emit(nft, "NFTMinted")
        .withArgs(user1.address, 0, locationId, locationName, rarity);
    });
  });

  describe("Location Max Supply", function () {
    const metadataUri = "ipfs://QmTest123";
    const locationId = 1;
    const locationName = "Limited Location";
    const rarity = "EPIC";
    const latitude = 0;
    const longitude = 0;

    it("should enforce max supply for location", async function () {
      await nft.connect(owner).setLocationMaxSupply(locationId, 2);

      await nft
        .connect(minter)
        .mintNFTWithLocation(
          user1.address,
          metadataUri,
          locationId,
          locationName,
          rarity,
          latitude,
          longitude
        );

      await nft
        .connect(minter)
        .mintNFTWithLocation(
          user2.address,
          metadataUri,
          locationId,
          locationName,
          rarity,
          latitude,
          longitude
        );

      await expect(
        nft
          .connect(minter)
          .mintNFTWithLocation(
            user1.address,
            metadataUri,
            locationId,
            locationName,
            rarity,
            latitude,
            longitude
          )
      ).to.be.revertedWith("Max supply reached for this location");
    });

    it("should allow unlimited minting when max supply is 0", async function () {
      expect(await nft.getLocationMaxSupply(locationId)).to.equal(0);

      for (let i = 0; i < 5; i++) {
        await nft
          .connect(minter)
          .mintNFTWithLocation(
            user1.address,
            metadataUri,
            locationId,
            locationName,
            rarity,
            latitude,
            longitude
          );
      }

      expect(await nft.getLocationMintCount(locationId)).to.equal(5);
    });

    it("should not allow setting max supply below current count", async function () {
      await nft
        .connect(minter)
        .mintNFTWithLocation(
          user1.address,
          metadataUri,
          locationId,
          locationName,
          rarity,
          latitude,
          longitude
        );

      await nft
        .connect(minter)
        .mintNFTWithLocation(
          user2.address,
          metadataUri,
          locationId,
          locationName,
          rarity,
          latitude,
          longitude
        );

      await expect(
        nft.connect(owner).setLocationMaxSupply(locationId, 1)
      ).to.be.revertedWith(
        "Max supply cannot be less than current mint count"
      );
    });
  });

  describe("Token URI Update", function () {
    const originalUri = "ipfs://QmOriginal";
    const newUri = "ipfs://QmNew";

    beforeEach(async function () {
      await nft.connect(minter).mintNFT(user1.address, originalUri);
    });

    it("should allow admin to update token URI", async function () {
      await nft.connect(owner).updateTokenURI(0, newUri);
      expect(await nft.tokenURI(0)).to.equal(newUri);
    });

    it("should not allow non-admin to update token URI", async function () {
      await expect(
        nft.connect(user1).updateTokenURI(0, newUri)
      ).to.be.reverted;
    });

    it("should emit MetadataUpdated event", async function () {
      await expect(nft.connect(owner).updateTokenURI(0, newUri))
        .to.emit(nft, "MetadataUpdated")
        .withArgs(0, newUri);
    });
  });

  describe("Enumeration", function () {
    beforeEach(async function () {
      await nft.connect(minter).mintNFT(user1.address, "ipfs://1");
      await nft.connect(minter).mintNFT(user1.address, "ipfs://2");
      await nft.connect(minter).mintNFT(user2.address, "ipfs://3");
    });

    it("should return correct tokens of owner", async function () {
      const tokens = await nft.tokensOfOwner(user1.address);
      expect(tokens.length).to.equal(2);
      expect(tokens[0]).to.equal(0);
      expect(tokens[1]).to.equal(1);
    });

    it("should return correct total supply", async function () {
      expect(await nft.getTotalSupply()).to.equal(3);
    });
  });

  describe("Pausable", function () {
    it("should allow pauser to pause", async function () {
      await nft.connect(owner).pause();
      expect(await nft.paused()).to.be.true;
    });

    it("should not allow minting when paused", async function () {
      await nft.connect(owner).pause();
      await expect(
        nft.connect(minter).mintNFT(user1.address, "ipfs://test")
      ).to.be.reverted;
    });

    it("should allow minting after unpause", async function () {
      await nft.connect(owner).pause();
      await nft.connect(owner).unpause();
      await nft.connect(minter).mintNFT(user1.address, "ipfs://test");
      expect(await nft.balanceOf(user1.address)).to.equal(1);
    });
  });

  describe("Burning", function () {
    beforeEach(async function () {
      await nft.connect(minter).mintNFT(user1.address, "ipfs://test");
    });

    it("should allow owner to burn their NFT", async function () {
      await nft.connect(user1).burn(0);
      await expect(nft.ownerOf(0)).to.be.reverted;
    });

    it("should not allow non-owner to burn NFT", async function () {
      await expect(nft.connect(user2).burn(0)).to.be.reverted;
    });
  });

  describe("Transfer", function () {
    beforeEach(async function () {
      await nft.connect(minter).mintNFT(user1.address, "ipfs://test");
    });

    it("should allow owner to transfer", async function () {
      await nft.connect(user1).transferFrom(user1.address, user2.address, 0);
      expect(await nft.ownerOf(0)).to.equal(user2.address);
    });

    it("should not allow non-owner to transfer", async function () {
      await expect(
        nft.connect(user2).transferFrom(user1.address, user2.address, 0)
      ).to.be.reverted;
    });

    it("should not allow transfer when paused", async function () {
      await nft.connect(owner).pause();
      await expect(
        nft.connect(user1).transferFrom(user1.address, user2.address, 0)
      ).to.be.reverted;
    });
  });

  describe("Access Control", function () {
    it("should allow admin to grant minter role", async function () {
      const MINTER_ROLE = await nft.MINTER_ROLE();
      await nft.connect(owner).grantRole(MINTER_ROLE, user1.address);
      expect(await nft.hasRole(MINTER_ROLE, user1.address)).to.be.true;
    });

    it("should allow admin to revoke minter role", async function () {
      const MINTER_ROLE = await nft.MINTER_ROLE();
      await nft.connect(owner).revokeRole(MINTER_ROLE, minter.address);
      expect(await nft.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });

    it("should not allow non-admin to grant roles", async function () {
      const MINTER_ROLE = await nft.MINTER_ROLE();
      await expect(
        nft.connect(user1).grantRole(MINTER_ROLE, user2.address)
      ).to.be.reverted;
    });

    it("should not allow non-pauser to pause", async function () {
      await expect(nft.connect(user1).pause()).to.be.reverted;
    });

    it("should not allow non-pauser to unpause", async function () {
      await nft.connect(owner).pause();
      await expect(nft.connect(user1).unpause()).to.be.reverted;
    });

    it("should allow role renouncement", async function () {
      const MINTER_ROLE = await nft.MINTER_ROLE();
      await nft.connect(minter).renounceRole(MINTER_ROLE, minter.address);
      expect(await nft.hasRole(MINTER_ROLE, minter.address)).to.be.false;
    });
  });

  describe("Edge Cases", function () {
    it("should revert when querying metadata for non-existent token", async function () {
      await expect(nft.getLocationMetadata(999)).to.be.revertedWith(
        "Token does not exist"
      );
    });

    it("should revert when updating URI for non-existent token", async function () {
      await expect(
        nft.connect(owner).updateTokenURI(999, "ipfs://new")
      ).to.be.revertedWith("Token does not exist");
    });

    it("should handle empty location name", async function () {
      await nft
        .connect(minter)
        .mintNFTWithLocation(user1.address, "ipfs://test", 1, "", "COMMON", 0, 0);

      const metadata = await nft.getLocationMetadata(0);
      expect(metadata.locationName).to.equal("");
    });

    it("should handle negative coordinates", async function () {
      const negLatitude = -33868820; // Sydney: -33.868820
      const negLongitude = 151209290; // Sydney: 151.209290

      await nft
        .connect(minter)
        .mintNFTWithLocation(
          user1.address,
          "ipfs://test",
          1,
          "Sydney Opera House",
          "LEGENDARY",
          negLatitude,
          negLongitude
        );

      const metadata = await nft.getLocationMetadata(0);
      expect(metadata.latitude).to.equal(negLatitude);
      expect(metadata.longitude).to.equal(negLongitude);
    });

    it("should return correct mint count for unused location", async function () {
      expect(await nft.getLocationMintCount(999)).to.equal(0);
    });

    it("should return zero max supply for unconfigured location", async function () {
      expect(await nft.getLocationMaxSupply(999)).to.equal(0);
    });
  });

  describe("ERC721 Interface", function () {
    const ERC721_INTERFACE_ID = "0x80ac58cd";
    const ERC721_ENUMERABLE_INTERFACE_ID = "0x780e9d63";
    const ERC721_METADATA_INTERFACE_ID = "0x5b5e139f";
    const ACCESS_CONTROL_INTERFACE_ID = "0x7965db0b";

    it("should support ERC721 interface", async function () {
      expect(await nft.supportsInterface(ERC721_INTERFACE_ID)).to.be.true;
    });

    it("should support ERC721Enumerable interface", async function () {
      expect(await nft.supportsInterface(ERC721_ENUMERABLE_INTERFACE_ID)).to.be.true;
    });

    it("should support ERC721Metadata interface", async function () {
      expect(await nft.supportsInterface(ERC721_METADATA_INTERFACE_ID)).to.be.true;
    });

    it("should support AccessControl interface", async function () {
      expect(await nft.supportsInterface(ACCESS_CONTROL_INTERFACE_ID)).to.be.true;
    });
  });

  describe("Approval and SafeTransfer", function () {
    beforeEach(async function () {
      await nft.connect(minter).mintNFT(user1.address, "ipfs://test");
    });

    it("should allow approval for single token", async function () {
      await nft.connect(user1).approve(user2.address, 0);
      expect(await nft.getApproved(0)).to.equal(user2.address);
    });

    it("should allow approved address to transfer", async function () {
      await nft.connect(user1).approve(user2.address, 0);
      await nft.connect(user2).transferFrom(user1.address, user2.address, 0);
      expect(await nft.ownerOf(0)).to.equal(user2.address);
    });

    it("should allow setApprovalForAll", async function () {
      await nft.connect(user1).setApprovalForAll(user2.address, true);
      expect(await nft.isApprovedForAll(user1.address, user2.address)).to.be.true;
    });

    it("should allow operator to transfer any token", async function () {
      await nft.connect(minter).mintNFT(user1.address, "ipfs://test2");
      await nft.connect(user1).setApprovalForAll(user2.address, true);

      await nft.connect(user2).transferFrom(user1.address, user2.address, 0);
      await nft.connect(user2).transferFrom(user1.address, user2.address, 1);

      expect(await nft.balanceOf(user2.address)).to.equal(2);
    });

    it("should clear approval after transfer", async function () {
      await nft.connect(user1).approve(user2.address, 0);
      await nft.connect(user1).transferFrom(user1.address, user2.address, 0);
      expect(await nft.getApproved(0)).to.equal(ethers.ZeroAddress);
    });
  });

  describe("Location Max Supply Edge Cases", function () {
    const metadataUri = "ipfs://QmTest";
    const locationId = 100;

    it("should emit LocationMaxSupplySet event", async function () {
      await expect(nft.connect(owner).setLocationMaxSupply(locationId, 10))
        .to.emit(nft, "LocationMaxSupplySet")
        .withArgs(locationId, 10);
    });

    it("should allow resetting max supply to 0 (unlimited)", async function () {
      await nft.connect(owner).setLocationMaxSupply(locationId, 5);
      await nft.connect(owner).setLocationMaxSupply(locationId, 0);
      expect(await nft.getLocationMaxSupply(locationId)).to.equal(0);
    });

    it("should allow increasing max supply", async function () {
      await nft.connect(owner).setLocationMaxSupply(locationId, 5);
      await nft.connect(owner).setLocationMaxSupply(locationId, 10);
      expect(await nft.getLocationMaxSupply(locationId)).to.equal(10);
    });

    it("should allow minting up to exact max supply", async function () {
      await nft.connect(owner).setLocationMaxSupply(locationId, 3);

      for (let i = 0; i < 3; i++) {
        await nft
          .connect(minter)
          .mintNFTWithLocation(user1.address, metadataUri, locationId, "Test", "RARE", 0, 0);
      }

      expect(await nft.getLocationMintCount(locationId)).to.equal(3);
    });
  });

  describe("Multiple Locations", function () {
    const metadataUri = "ipfs://QmTest";

    it("should track mint counts separately for different locations", async function () {
      await nft
        .connect(minter)
        .mintNFTWithLocation(user1.address, metadataUri, 1, "Location 1", "COMMON", 0, 0);
      await nft
        .connect(minter)
        .mintNFTWithLocation(user1.address, metadataUri, 1, "Location 1", "COMMON", 0, 0);
      await nft
        .connect(minter)
        .mintNFTWithLocation(user1.address, metadataUri, 2, "Location 2", "RARE", 0, 0);

      expect(await nft.getLocationMintCount(1)).to.equal(2);
      expect(await nft.getLocationMintCount(2)).to.equal(1);
    });

    it("should enforce max supply independently per location", async function () {
      await nft.connect(owner).setLocationMaxSupply(1, 1);
      await nft.connect(owner).setLocationMaxSupply(2, 2);

      await nft
        .connect(minter)
        .mintNFTWithLocation(user1.address, metadataUri, 1, "Location 1", "EPIC", 0, 0);

      await expect(
        nft.connect(minter).mintNFTWithLocation(user1.address, metadataUri, 1, "Location 1", "EPIC", 0, 0)
      ).to.be.revertedWith("Max supply reached for this location");

      // Location 2 should still allow minting
      await nft
        .connect(minter)
        .mintNFTWithLocation(user1.address, metadataUri, 2, "Location 2", "LEGENDARY", 0, 0);
      await nft
        .connect(minter)
        .mintNFTWithLocation(user1.address, metadataUri, 2, "Location 2", "LEGENDARY", 0, 0);

      expect(await nft.getLocationMintCount(2)).to.equal(2);
    });
  });

  describe("Gas Optimization Verification", function () {
    it("should mint multiple NFTs efficiently", async function () {
      const mintCount = 10;

      for (let i = 0; i < mintCount; i++) {
        await nft.connect(minter).mintNFT(user1.address, `ipfs://test${i}`);
      }

      expect(await nft.balanceOf(user1.address)).to.equal(mintCount);
      expect(await nft.getTotalSupply()).to.equal(mintCount);
    });
  });

  describe("Collected At Timestamp", function () {
    it("should record correct collection timestamp", async function () {
      const tx = await nft
        .connect(minter)
        .mintNFTWithLocation(user1.address, "ipfs://test", 1, "Test", "COMMON", 0, 0);

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt.blockNumber);

      const metadata = await nft.getLocationMetadata(0);
      expect(metadata.collectedAt).to.equal(block.timestamp);
    });
  });
});
