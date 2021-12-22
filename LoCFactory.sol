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

import "@openzeppelin/contracts/proxy/Clones.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./LoCDataBase.sol";
import "./LoCInstance.sol";
import "./LoCRegistry.sol";

contract LoCFactory {
  event eLoCInstanceCreated(address LoCInstanceClone);
  event eRegistryCreated(address LoCRegistry);
  event eLoCDataBaseCreated(address LoCDataBase);

  address immutable LoCDataBaseImplementation;
  address immutable LoCInstanceImplementation;
  address immutable LoCRegistryImplementation;

  constructor() {
    LoCDataBaseImplementation = address(new LoCDataBase());
    LoCInstanceImplementation = address(new LoCInstance());
    LoCRegistryImplementation = address(new LoCRegistry());
  }

  function createLoCInstance(address LoCRegistryAddress, address LoCDatabaseAddress) external returns (address) {
    address LoCInstanceClone = Clones.clone(LoCInstanceImplementation);
    LoCInstance(LoCInstanceClone).initialize();

    LoCRegistry DefinedRegistry = LoCRegistry(LoCRegistryAddress);
    LoCDataBase DefinedDatabase = LoCDataBase(LoCDatabaseAddress);
    DefinedRegistry.insert(LoCInstanceClone);

    emit eLoCInstanceCreated(address(LoCInstanceClone));
    return (address(LoCInstanceClone));
  }

  function deployRegistry() external returns (address) {
    address LoCRegistryClone = Clones.clone(LoCRegistryImplementation);
    LoCRegistry(LoCRegistryClone).initialize();

    emit eRegistryCreated(address(LoCRegistryClone));

    return (address(LoCRegistryClone));
  }

  function deployLoCDataBase() external returns (address) {
    address LoCDataBaseClone = Clones.clone(LoCDataBaseImplementation);
    LoCDataBase(LoCDataBaseClone).initialize();

    emit eLoCDataBaseCreated(address(LoCDataBaseClone));

    return (address(LoCDataBaseClone));
  }
}
