// SPDX-License-Identifier: UNLICENSED
/**
 * Copyright (C) SettleMint NV - All Rights Reserved
 *
 * Use of this file is strictly prohibited without an active license agreement.
 * Distribution of this file, via any medium, is strictly prohibited.
 *
 * For license inquiries, contcontact hello@settlemint.com
 */

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./LoCDataBase.sol";

contract LoCInstance is Initializable, AccessControl, LoCDataBase {
  address public importer;
  address public exporter;
  address public importerBank;
  address public exporterBank;
  address public AdminAddress;
  bytes purchaseRequest;
  bytes billOfLading;
  bytes invoice;
  uint256 amount;
  uint256 owed;

  enum LOCStatus {
    PURCHASE_CONTRACT_INITIATED,
    PURCHASE_CONTRACT_CONFIRMED,
    LOC_INITIATED,
    LOC_VERIFIED,
    PRODUCTS_SHIPPED,
    DOCS_SUBMITTED,
    DOCS_VERIFIED,
    DEAL_CLOSED,
    DEAL_CANCELLED
  }

  LOCStatus public LoCStatus;

  bool _purchaseInitiated;
  bool _approvedPurchase;
  bool _creditGranted;
  bool _verifyLoC;
  bool _productsShipped;
  bool _documentsAdded;
  bool _approvedDocuments;

  function initialize() public virtual override initializer {
    AdminAddress = tx.origin;
    _setRoleAdmin(ROLE_ADMIN, DEFAULT_ADMIN_ROLE);
    _setupRole(DEFAULT_ADMIN_ROLE, AdminAddress);
  }

  function startLoC(
    address _LoCDataBase,
    address _importer,
    address _exporter,
    uint256 _amount,
    bytes memory _purchaseRequest
  ) public payable onlyAdmin {
    _purchaseInitiated = true;
    importer = _importer;
    exporter = _exporter;
    importerBank = LoCDataBase(_LoCDataBase).getBank(_importer);
    exporterBank = LoCDataBase(_LoCDataBase).getBank(_exporter);
    purchaseRequest = _purchaseRequest;
    amount = _amount;
    LoCStatus = LOCStatus.PURCHASE_CONTRACT_INITIATED;
    LoCDataBase(_LoCDataBase).createLoC(importer, exporter, amount, purchaseRequest, address(this));
  }

  modifier onlyImporter() {
    require(msg.sender == importer || msg.sender == AdminAddress, "not a importer or admin");
    _;
  }

  modifier onlyExporter() {
    require(msg.sender == exporter || msg.sender == AdminAddress, "not a exporter or admin");
    _;
  }

  modifier onlyImporterBank() {
    require(msg.sender == importerBank || msg.sender == AdminAddress, "not a importer bank or admin");
    _;
  }

  modifier onlyExporterBank() {
    require(msg.sender == exporterBank || msg.sender == AdminAddress, "not a exporter bank or admin");
    _;
  }

  modifier onlyAdmin() {
    require(msg.sender == AdminAddress, "not an admin");
    _;
  }

  function confirmPurchaseContract() public payable onlyImporter {
    require(_purchaseInitiated, "purchase contract not initated by exporter");
    require(!_approvedPurchase, "purchase contract already confirmed");
    require(LoCStatus != LOCStatus.DEAL_CANCELLED, "LoC is already cancelled");
    LoCStatus = LOCStatus.PURCHASE_CONTRACT_CONFIRMED;
    _approvedPurchase = true;
  }

  function grantLoC() public onlyImporterBank {
    require(LoCStatus != LOCStatus.DEAL_CANCELLED, "LoC is already cancelled");
    require(_approvedPurchase, "purchase not approved by importer");
    require(!_creditGranted, "LoC already granted");

    uint256 balaceOfContract = address(this).balance;
    if (balaceOfContract < amount) {
      _approvedPurchase = false;
      require(balaceOfContract >= amount, "@grantLoC - please transfer contract amount");
    }
    LoCStatus = LOCStatus.LOC_INITIATED;
    _creditGranted = true;
  }

  function verifyLoC() public onlyExporterBank {
    require(LoCStatus != LOCStatus.DEAL_CANCELLED, "LoC is already cancelled");
    require(_creditGranted, "LoC not granted by importer bank");
    require(!_verifyLoC, "LoC already verified");
    LoCStatus = LOCStatus.LOC_VERIFIED;
    _verifyLoC = true;
  }

  function productsShipped() public onlyExporter {
    require(LoCStatus != LOCStatus.DEAL_CANCELLED, "LoC is already cancelled");
    require(_verifyLoC, "LoC not verified by exporter bank");
    require(!_productsShipped, "Products are already shipped");
    LoCStatus = LOCStatus.PRODUCTS_SHIPPED;
    _productsShipped = true;
  }

  function addDocuments(bytes memory _bol, bytes memory _invoice) public onlyExporterBank {
    require(LoCStatus != LOCStatus.DEAL_CANCELLED, "LoC is already cancelled");
    require(_productsShipped, "products not shipped by exporter");
    require(!_documentsAdded, "Documents are already added");
    billOfLading = _bol;
    invoice = _invoice;
    LoCStatus = LOCStatus.DOCS_SUBMITTED;
    _documentsAdded = true;
  }

  function approveDocuments() public onlyImporter {
    require(LoCStatus != LOCStatus.DEAL_CANCELLED, "LoC is already cancelled");
    require(_documentsAdded, "documents not sent by exporter bank");
    require(!_approvedDocuments, "documents are already approved");
    LoCStatus = LOCStatus.DOCS_VERIFIED;
    _approvedDocuments = true;
  }

  function approveAndPay() public onlyImporterBank {
    require(LoCStatus != LOCStatus.DEAL_CANCELLED, "LoC is already cancelled");
    require(_approvedDocuments, "documents not approved by importer");
    require(LoCStatus != LOCStatus.DEAL_CLOSED, "LoC is already closed");
    (payable(exporter)).transfer(amount);
    LoCStatus = LOCStatus.DEAL_CLOSED;
  }

  function getLoCStatus() public view returns (LOCStatus) {
    return LoCStatus;
  }

  function CancelLoC() public onlyAdmin {
    require(LoCStatus != LOCStatus.DEAL_CLOSED, "LoC is already closed");
    LoCStatus = LOCStatus.DEAL_CANCELLED;
  }
}
