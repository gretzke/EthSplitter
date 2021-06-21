// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.4;

import "./EthSplitter.sol";

contract EthSplitterFactory {
    mapping(address => address) public splitters;

    event SplitterCreated(address indexed splitter);

    /// @notice creates a new splitter contract
    /// @dev sender is set as owner in the new contract
    /// @dev only one splitter contract can exist per user
    function createSplitter() external {
        require(
            splitters[msg.sender] == address(0),
            "every user can only create one splitter"
        );
        address splitter = address(new EthSplitter(msg.sender));
        splitters[msg.sender] = splitter;
        emit SplitterCreated(splitter);
    }
}
