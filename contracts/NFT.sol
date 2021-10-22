pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./ERC2981.sol";
import "./RoyaltiesAddon.sol";

contract NFT is RoyaltiesAddon, ERC2981, AccessControl {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIds;

    uint256 private royaltiesFees;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(string memory name, string memory symbol)
        ERC721(name, symbol)
    {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(MINTER_ROLE, msg.sender);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override(ERC721, ERC2981, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function addMinter(address minterAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        _setupRole(MINTER_ROLE, minterAddress);
    }

    function removeMinter(address minterAddress)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        revokeRole(MINTER_ROLE, minterAddress);
    }

    function mint(address receiver, string memory metadata)
        public
        onlyRole(MINTER_ROLE)
        returns (uint256)
    {
        _tokenIds.increment();
        uint256 newItemId = _tokenIds.current();
        _mint(receiver, newItemId);
        _setTokenURI(newItemId, metadata);
        return newItemId;
    }

    /// @dev sets royalties address
    /// for royalties addon
    /// for 2981
    function setRoyaltiesAddress(address _royaltiesAddress)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        super._setRoyaltiesAddress(_royaltiesAddress);
    }

    /// @dev sets royalties fees
    function setRoyaltiesFees(uint256 _royaltiesFees)
        public
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        royaltiesFees = _royaltiesFees;
    }

    /// @inheritdoc	IERC2981
    function royaltyInfo(uint256 tokenId, uint256 value)
        external
        view
        override
        returns (address receiver, uint256 royaltyAmount)
    {
        return (royaltiesAddress, value * royaltiesFees / 100);
    }
}
