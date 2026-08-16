import { expect } from "chai";
import { ethers } from "hardhat";
import { BlotChainSnapshot } from "../typechain-types";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("BlotChainSnapshot", function () {
  let blotChainSnapshot: BlotChainSnapshot;
  let owner: SignerWithAddress;
  let royaltyReceiver: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  const MINT_PRICE = ethers.parseEther("0.01"); // 0.01 MATIC
  const ROYALTY_FEE_NUMERATOR = 500n; // 5% (500 / 10000)

  beforeEach(async function () {
    [owner, royaltyReceiver, user1, user2] = await ethers.getSigners();

    const BlotChainSnapshotFactory = await ethers.getContractFactory("BlotChainSnapshot");
    blotChainSnapshot = await BlotChainSnapshotFactory.deploy(
      owner.address,
      royaltyReceiver.address,
      ROYALTY_FEE_NUMERATOR
    );
  });

  describe("Deployment", function () {
    it("should set the correct name, symbol, and owner", async function () {
      expect(await blotChainSnapshot.name()).to.equal("BlotChainSnapshot");
      expect(await blotChainSnapshot.symbol()).to.equal("BCS");
      expect(await blotChainSnapshot.owner()).to.equal(owner.address);
    });

    it("should set the correct default mint price", async function () {
      expect(await blotChainSnapshot.mintPrice()).to.equal(MINT_PRICE);
    });
  });

  describe("mintSnapshot (Owner Minting)", function () {
    const tokenURI = "ipfs://QmdBLOTCHAIN1";

    it("should allow owner to mint and set correct URI", async function () {
      const tx = await blotChainSnapshot.connect(owner).mintSnapshot(user1.address, tokenURI);

      // Verify event emission
      await expect(tx)
        .to.emit(blotChainSnapshot, "SnapshotMinted")
        .withArgs(0n, tokenURI, user1.address, () => true); // custom match to check timestamp is any value

      expect(await blotChainSnapshot.ownerOf(0n)).to.equal(user1.address);
      expect(await blotChainSnapshot.tokenURI(0n)).to.equal(tokenURI);
    });

    it("should fail if non-owner tries to mint", async function () {
      await expect(
        blotChainSnapshot.connect(user1).mintSnapshot(user2.address, tokenURI)
      ).to.be.revertedWithCustomError(blotChainSnapshot, "OwnableUnauthorizedAccount");
    });
  });

  describe("publicMint (Manual Minting)", function () {
    const tokenURI = "ipfs://QmdBLOTCHAIN2";

    it("should allow anyone to mint by paying the correct mintPrice", async function () {
      const tx = await blotChainSnapshot.connect(user1).publicMint(tokenURI, {
        value: MINT_PRICE,
      });

      // Verify event
      await expect(tx)
        .to.emit(blotChainSnapshot, "SnapshotMinted")
        .withArgs(0n, tokenURI, user1.address, () => true);

      expect(await blotChainSnapshot.ownerOf(0n)).to.equal(user1.address);
      expect(await blotChainSnapshot.tokenURI(0n)).to.equal(tokenURI);

      // Verify contract received the price
      const contractBalance = await ethers.provider.getBalance(await blotChainSnapshot.getAddress());
      expect(contractBalance).to.equal(MINT_PRICE);
    });

    it("should fail if payment is insufficient", async function () {
      const lowPrice = ethers.parseEther("0.005");
      await expect(
        blotChainSnapshot.connect(user1).publicMint(tokenURI, {
          value: lowPrice,
        })
      ).to.be.revertedWith("Insufficient payment");
    });
  });

  describe("EIP-2981 Royalty Support", function () {
    it("should return correct royalty info (5% initially)", async function () {
      const salePrice = ethers.parseEther("1.0"); // 1 ETH
      const expectedRoyaltyAmount = ethers.parseEther("0.05"); // 5% of 1 ETH is 0.05 ETH

      const [receiver, royaltyAmount] = await blotChainSnapshot.royaltyInfo(0n, salePrice);

      expect(receiver).to.equal(royaltyReceiver.address);
      expect(royaltyAmount).to.equal(expectedRoyaltyAmount);
    });

    it("should allow owner to update default royalty configuration", async function () {
      const newReceiver = user2.address;
      const newFeeNumerator = 1000n; // 10%
      const salePrice = ethers.parseEther("2.0");
      const expectedRoyaltyAmount = ethers.parseEther("0.2"); // 10% of 2 ETH

      await blotChainSnapshot.connect(owner).setDefaultRoyalty(newReceiver, newFeeNumerator);

      const [receiver, royaltyAmount] = await blotChainSnapshot.royaltyInfo(0n, salePrice);
      expect(receiver).to.equal(newReceiver);
      expect(royaltyAmount).to.equal(expectedRoyaltyAmount);
    });

    it("should fail if non-owner tries to update default royalty", async function () {
      await expect(
        blotChainSnapshot.connect(user1).setDefaultRoyalty(user1.address, 1000n)
      ).to.be.revertedWithCustomError(blotChainSnapshot, "OwnableUnauthorizedAccount");
    });
  });

  describe("Withdrawal", function () {
    beforeEach(async function () {
      // Mint a public one so the contract has balance
      await blotChainSnapshot.connect(user1).publicMint("ipfs://uri", { value: MINT_PRICE });
    });

    it("should allow owner to withdraw contract balance", async function () {
      const contractAddress = await blotChainSnapshot.getAddress();
      expect(await ethers.provider.getBalance(contractAddress)).to.equal(MINT_PRICE);

      const initialOwnerBalance = await ethers.provider.getBalance(owner.address);

      const tx = await blotChainSnapshot.connect(owner).withdraw();
      const receipt = await tx.wait();

      // Calculate gas costs
      const gasUsed = receipt ? BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice) : 0n;

      const finalOwnerBalance = await ethers.provider.getBalance(owner.address);
      expect(finalOwnerBalance).to.equal(initialOwnerBalance + MINT_PRICE - gasUsed);
      expect(await ethers.provider.getBalance(contractAddress)).to.equal(0n);
    });

    it("should fail if non-owner tries to withdraw", async function () {
      await expect(
        blotChainSnapshot.connect(user1).withdraw()
      ).to.be.revertedWithCustomError(blotChainSnapshot, "OwnableUnauthorizedAccount");
    });
  });

  describe("Admin settings", function () {
    it("should allow owner to set mint price", async function () {
      const newPrice = ethers.parseEther("0.02");
      await blotChainSnapshot.connect(owner).setMintPrice(newPrice);
      expect(await blotChainSnapshot.mintPrice()).to.equal(newPrice);
    });

    it("should fail if non-owner tries to set mint price", async function () {
      const newPrice = ethers.parseEther("0.02");
      await expect(
        blotChainSnapshot.connect(user1).setMintPrice(newPrice)
      ).to.be.revertedWithCustomError(blotChainSnapshot, "OwnableUnauthorizedAccount");
    });
  });
});
