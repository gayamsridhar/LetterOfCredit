// SPDX-License-Identifier: UNLICENSED
/**
 * Copyright (C) SettleMint NV - All Rights Reserved
 *
 * Use of this file is strictly prohibited without an active license agreement.
 * Distribution of this file, via any medium, is strictly prohibited.
 *
 * For license inquiries, contact hello@settlemint.com
 */

pragma solidity ^0.8.4;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./LoCInstance.sol";

contract LoCRegistry is Initializable, AccessControl, LoCInstance {
  event eLoCInstanceRegistered(address LoCInstance);

  function initialize() public virtual override initializer {
    address Admin = msg.sender;
    _setupRole(DEFAULT_ADMIN_ROLE, Admin);
    _setRoleAdmin(ROLE_ADMIN, DEFAULT_ADMIN_ROLE);
  }

  address[] internal _LoCInstanceIndex;

  function insert(address LoCInstance) public {
    _LoCInstanceIndex.push(LoCInstance);
    emit eLoCInstanceRegistered(LoCInstance);
  }

  function getIndexLength() public view returns (uint256 length) {
    length = _LoCInstanceIndex.length;
  }

  function getByIndex(uint256 index) public view returns (address contractAddress) {
    return (_LoCInstanceIndex[index]);
  }

  function getIndex() public view returns (address[] memory index) {
    return _LoCInstanceIndex;
  }
}
