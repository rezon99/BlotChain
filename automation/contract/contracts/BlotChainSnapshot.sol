// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract BlotChainSnapshot is ERC721URIStorage, ERC2981, Ownable {
    uint256 private _nextTokenId;

    // Configurable mint price in MATIC (or native currency, which is MATIC on Polygon)
    uint256 public mintPrice = 0.01 ether; // default e.g. 0.01 MATIC, can make it configurable or fixed

    // Event emitted upon minting a snapshot
    event SnapshotMinted(uint256 indexed tokenId, string tokenURI, address indexed recipient, uint256 timestamp);

    constructor(
        address initialOwner,
        address royaltyReceiver,
        uint96 royaltyFeeNumerator
    ) ERC721("BlotChainSnapshot", "BCS") Ownable(initialOwner) {
        // Set default royalty of 5% (500 basis points) or whatever is passed
        _setDefaultRoyalty(royaltyReceiver, royaltyFeeNumerator);
    }

    /**
     * @dev Mint snapshot - owner-only, used by the bot.
     */
    function mintSnapshot(address to, string memory _tokenURI) external onlyOwner returns (uint256) {
        uint256 tokenId = _nextTokenId++;
        _safeMint(to, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit SnapshotMinted(tokenId, _tokenURI, to, block.timestamp);
        return tokenId;
    }

    /**
     * @dev Public mint - anyone can call, small fixed price in MATIC.
     */
    function publicMint(string memory _tokenURI) external payable returns (uint256) {
        require(msg.value >= mintPrice, "Insufficient payment");

        uint256 tokenId = _nextTokenId++;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, _tokenURI);

        emit SnapshotMinted(tokenId, _tokenURI, msg.sender, block.timestamp);
        return tokenId;
    }

    /**
     * @dev Set a new mint price. Only owner.
     */
    function setMintPrice(uint256 newPrice) external onlyOwner {
        mintPrice = newPrice;
    }

    /**
     * @dev Update royalty settings. Only owner.
     */
    function setDefaultRoyalty(address receiver, uint96 feeNumerator) external onlyOwner {
        _setDefaultRoyalty(receiver, feeNumerator);
    }

    /**
     * @dev Withdraw contract funds. Only owner.
     */
    function withdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // Required overrides
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721URIStorage, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }
}
