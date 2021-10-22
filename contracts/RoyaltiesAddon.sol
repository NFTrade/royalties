pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Address.sol";

interface RoyaltiesInterface {
    function claimCommunity(uint256 tokenId) external;
}

abstract contract RoyaltiesAddon is ERC721URIStorage {
    address public royaltiesAddress;

    /**
     * @dev internal set royalties address
     * @param _royaltiesAddress address of the Royalties.sol
     */
    function _setRoyaltiesAddress(
        address _royaltiesAddress
    ) internal {
        royaltiesAddress = _royaltiesAddress;
    }

    /**
     * @dev See {ERC721-_beforeTokenTransfer}.
     *
     * Requirements:
     *
     * - the royalties get auto claim on transfer
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 tokenId
    ) internal virtual override {
        super._beforeTokenTransfer(from, to, tokenId);

        if (royaltiesAddress != address(0) && from != address(0) && !Address.isContract(from)) {
            RoyaltiesInterface(royaltiesAddress).claimCommunity(tokenId);
        }
    }
}
