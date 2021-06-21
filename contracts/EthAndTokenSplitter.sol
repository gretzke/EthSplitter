// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.4;

import "./EthSplitter.sol";
import "./interfaces/IERC677TransferReceiver.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract EthAndTokenSplitter is EthSplitter, IERC677TransferReceiver {
    event TokensSplit(uint256 amount);

    constructor(address _owner) EthSplitter(_owner) {}

    /// @notice splits incoming tokens automatically
    /// @dev if a token transfer to a recipient fails, the token transfer will fail
    function tokenFallback(
        address from,
        uint256 amount,
        bytes calldata data
    ) external override returns (bool) {
        splitTokens(msg.sender);
        return true;
    }

    /// @notice splits ERC20 token balance among all recipients
    /// @dev does nothing if amount of recipients or amount to transfer is 0
    /// @dev any rest is not distributed and kept inside the contract
    /// @param _tokenContract address of the token smart contract
    function splitTokens(address _tokenContract) public nonReentrant {
        IERC20 token = IERC20(_tokenContract);
        if (recipients.length == 0) {
            return;
        }
        uint256 amount = token.balanceOf(address(this)) / recipients.length;
        if (amount == 0) {
            return;
        }
        for (uint256 i = 0; i < recipients.length; i++) {
            bool success = token.transfer(recipients[i], amount);
            require(success, "a transfer failed");
        }
        emit TokensSplit(amount * recipients.length);
    }
}
