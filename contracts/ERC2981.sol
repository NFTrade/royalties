// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import '@openzeppelin/contracts/utils/introspection/ERC165.sol';

import './IERC2981.sol';

/// @dev This is a contract used to add ERC2981 support to ERC721 and 1155
abstract contract ERC2981 is ERC165, IERC2981 {
    bytes4 private constant _INTERFACE_ID_ERC2981 = 0x2a55205a;
    /// @inheritdoc	ERC165
    function supportsInterface(bytes4 interfaceId)
        public
        view
        virtual
        override
        returns (bool)
    {
        return
            interfaceId == _INTERFACE_ID_ERC2981 ||
            super.supportsInterface(interfaceId);
    }
}