// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.4;

import "./EthSplitterFactory.sol";
import "@openzeppelin/contracts/proxy/Clones.sol";

interface IEthSplitterClonable {
    function initialize(address _owner) external;
}

/// @notice uses EIP-1167 to use a minimal proxy to lower gas fees on deployment
/// @dev decreases gas cost for new deployments by 78%
contract EthSplitterFactoryV2 is EthSplitterFactory {
    address immutable implementation;

    constructor(address _implementation) {
        implementation = _implementation;
    }

    /// @notice creates a new splitter contract clone
    /// @dev sender is set as owner in the new contract
    /// @dev only one splitter contract can exist per user
    function createSplitter() external override {
        require(
            splitters[msg.sender] == address(0),
            "every user can only create one splitter"
        );
        address splitter = Clones.clone(implementation);
        IEthSplitterClonable(splitter).initialize(msg.sender);
        splitters[msg.sender] = splitter;
        emit SplitterCreated(splitter);
    }
}
