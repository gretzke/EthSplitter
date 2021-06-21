// SPDX-License-Identifier: AGPL-3.0-only
pragma solidity 0.8.4;

import "./Owned.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract EthSplitter is Owned, ReentrancyGuard {
    address[] public recipients;
    // indices are stored as i + 1, as 0 is the default value
    mapping(address => uint256) public indices;

    event EthSplit(uint256 amount);
    event AddedRecipient(address indexed recipient);
    event RemovedRecipient(address indexed recipient);

    constructor(address _owner) Owned(_owner) {}

    /// @notice enables smart contract to receive eth
    receive() external payable {
        // to enable automatic distribution of funds, uncomment next line
        // not recommended, if one of the transfers to the recipients fails, the transfer of ETH to the contract fails as well
        // split();
    }

    /// @notice splits balance among all recipients
    /// @dev does nothing if amount of recipients or amount to transfer is 0
    /// @dev any rest is not distributed and kept inside the contract
    function split() public nonReentrant {
        if (recipients.length == 0) {
            return;
        }
        uint256 amount = address(this).balance / recipients.length;
        if (amount == 0) {
            return;
        }
        for (uint256 i = 0; i < recipients.length; i++) {
            (bool success, ) = recipients[i].call{value: amount}("");
            require(success, "a transfer failed");
        }
        emit EthSplit(amount * recipients.length);
    }

    /// @notice adds a new recipient
    /// @dev only callable by owner
    /// @dev uses an additional mapping to keep track of the indices
    /// @param _recipient to add
    function addRecipient(address _recipient) external onlyOwner {
        require(indices[_recipient] == 0, "already recipient");
        recipients.push(_recipient);
        indices[_recipient] = recipients.length;
        emit AddedRecipient(_recipient);
    }

    /// @notice removes a recipient
    /// @dev only callable by owner
    /// @dev uses the indices mapping to avoid looping over an unbound array
    /// @param _recipient to remove
    function removeRecipient(address _recipient) external onlyOwner {
        uint256 index = indices[_recipient];
        delete indices[_recipient];
        require(index > 0, "not recipient");
        // if recipient to delete is the last element in the array, remove the last element of the array
        if (index < recipients.length) {
            index -= 1;
            // replace recipient in array with last element
            recipients[index] = recipients[recipients.length - 1];
            // update new index
            indices[recipients[index]] = index + 1;
        }
        // delete last entry from array
        recipients.pop();
        emit RemovedRecipient(_recipient);
    }

    /// @notice returns all recipients
    /// @dev helper function to retreive the entire array instead of querying by index
    /// @return list of all current recipients
    function getAllRecipients() external view returns (address[] memory) {
        return recipients;
    }
}
