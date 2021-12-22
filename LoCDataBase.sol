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

contract LoCDataBase is Initializable, AccessControl {
  event ePurchaseRequestCreated(
    address _importer,
    address _exporter,
    uint256 _amount,
    bytes _purchaseReqest,
    address contractAddress
  );

  bytes32 public constant ROLE_ADMIN = "ROLE_ADMIN";

  function initialize() public virtual initializer {
    address Admin = msg.sender;
    _setupRole(DEFAULT_ADMIN_ROLE, Admin);
    _setRoleAdmin(ROLE_ADMIN, DEFAULT_ADMIN_ROLE);
  }

  struct company {
    string companyName;
    address userBank;
    CompanyStatus companyStatus;
    mapping(address => address) LoCInstance;
  }

  mapping(address => company) public Companies;
  enum CompanyStatus {
    ACTIVE,
    INACTIVE
  }

  function addCompany(
    address _companyAddress,
    string memory _companyName,
    address _userBank
  ) public {
    Companies[_companyAddress].companyName = _companyName;
    Companies[_companyAddress].userBank = _userBank;
    Companies[_companyAddress].companyStatus = CompanyStatus.ACTIVE;
  }

  function createLoC(
    address _importer,
    address _exporter,
    uint256 _amount,
    bytes memory _purchaseRequest,
    address _currentContract
  ) public {
    Companies[_importer].LoCInstance[_currentContract] = _exporter;
    Companies[_exporter].LoCInstance[_currentContract] = _importer;
    emit ePurchaseRequestCreated(_importer, _exporter, _amount, _purchaseRequest, _currentContract);
  }

  function getBank(address _user) external view returns (address bank) {
    return Companies[_user].userBank;
  }

  function getLoCExporterDetails(address _importer, address LoCInstance) external view returns (address exporter) {
    return Companies[_importer].LoCInstance[LoCInstance];
  }
}
