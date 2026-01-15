const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("TravelMateNFT", function () {
  let nft;
  let owner;
  let minter;
  let user1;
  let user2;

  const NAME = "TravelMate Collectibles";
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
  });
});
