import { kMaxLength } from 'buffer';
import chai, { expect } from 'chai';
import { LoCInstance } from '../typechain/LoCInstance';
import { LoCDataBase } from '../typechain/LoCDataBase';
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/dist/src/signers';

// @ts-ignore
const { ethers } = require("hardhat");

describe("LoC Factory", function () {
  let Admin: SignerWithAddress;
  let Importer: SignerWithAddress;
  let Exporter: SignerWithAddress;
  let ImporterBank: SignerWithAddress;
  let ExporterBank: SignerWithAddress;
  let LoCInstanceAddress: SignerWithAddress;

  let LoCDataBaseAddress,LoCDataBaseContract, LoCRegistryAddress;
  let LoCDataBaseInstance: LoCDataBase;
  
  let LoCInstanceImporterBank, LoCInstanceExporterBank, LoCInstanceContract;
  let LoCInstance: LoCInstance;

  let eventFilter, eventFilter1, eventFilter2;
  let events, events1, events2;
  let LoCFactory;
  let LoCF;
  let Stat;
  let A: string;

  beforeEach(async function () {
    /* Defining the LoC Players*/
    [Admin,Importer,Exporter,ImporterBank,ExporterBank] = await ethers.getSigners();

    /* Deploy LoC Factory*/
    LoCFactory = await ethers.getContractFactory('LoCFactory');
    LoCF = await LoCFactory.deploy();

    /* Deploy LoC Registry*/
    await LoCF.deployRegistry({from: Admin.address});   

    eventFilter = LoCF.filters.eRegistryCreated();
    events = await LoCF.queryFilter(eventFilter, "latest");
    LoCRegistryAddress = events[0].args[0];

    /* Deploy LoC DataBase*/
    await LoCF.deployLoCDataBase({from: Admin.address});    

    eventFilter1 = LoCF.filters.eLoCDataBaseCreated();
    events1 = await LoCF.queryFilter(eventFilter1, "latest");
    LoCDataBaseAddress = events1[0].args[0];
    LoCDataBaseContract = await ethers.getContractFactory('LoCDataBase');
    
    /*Dummy byte2 code*/
    A = '0x4c6f434442000000000000000000000000000000000000000000000000000000';

    /* Deploy LoC Instance*/
    await LoCF.createLoCInstance(LoCRegistryAddress, LoCDataBaseAddress);

    eventFilter2 = LoCF.filters.eLoCInstanceCreated();
    events2 = await LoCF.queryFilter(eventFilter2, "latest");
    LoCInstanceAddress = events2[0].args[0];
    LoCInstanceContract = await ethers.getContractFactory('LoCInstance');    
      
    /* Intiating the LoC Instance*/   
    LoCDataBaseInstance = await LoCDataBaseContract.attach(LoCDataBaseAddress);
    LoCInstance = await LoCInstanceContract.attach(LoCInstanceAddress);
      
    /* Add Importer & Exporter to LoC DataBase*/
    await LoCDataBaseInstance.addCompany(Importer.address, "Importer-1", ImporterBank.address);
    await LoCDataBaseInstance.addCompany(Exporter.address, "Exporter-1", ExporterBank.address);

    /* Get Importer & Exporter bank details from LoC DataBase*/
    LoCInstanceImporterBank = await LoCDataBaseInstance.getBank(Importer.address);
    LoCInstanceExporterBank = await LoCDataBaseInstance.getBank(Exporter.address);

    /* Starting the LoC*/          
    await LoCInstance.startLoC(LoCDataBaseInstance.address,
      Importer.address,
      Exporter.address,
      1000,
      A);
  });

  /*LoC Contract Begin - Is purchase contract initiated*/
  it("LoC Contract Begin - Is purchase contract initiated", async function () {
    const Stat = await LoCInstance.getLoCStatus();
    if(Stat==0){
      console.log("LoCInstance Intial Status is : PURCHASE_CONTRACT_INITIATED ("+Stat+")");
      expect(Stat).to.equal(0);
    }
  });

  /*LoC Contract Contd.. - confirm purchase contract*/
  it("LoC Contract Contd.. - Is purchas contract confirmed", async function () {
    await LoCInstance.connect(Importer).confirmPurchaseContract({value: 1000});
    const Status = await LoCInstance.getLoCStatus(); 
    if(Status==1){
      expect(Status).to.equal(1);
      console.log("LoCInstance Status after 'PURCHANSE_CONTRACT_INITIATED' is : PURCHANSE_CONTRACT_CONFIRMED ("+Status+")");
    }
  });

  /*LoC Contract Contd.. - grant LoC*/
  it("LoC Contract Contd.. - grant LoC", async function () {
    await LoCInstance.connect(Importer).confirmPurchaseContract({value: 1000});
    await LoCInstance.connect(ImporterBank).grantLoC();
    const Status = await LoCInstance.getLoCStatus();
    if(Status==2){
      console.log("LoCInstance Status after 'PURCHANSE_CONTRACT_CONFIRMED'  is : LOC_INITIATED ("+Status+")");
      expect(Status).to.equal(2);
    }
  });

  /*LoC Contract Contd.. - verify LoC*/
  it("LoC Contract Contd.. - verify LoC", async function () {
    await LoCInstance.connect(Importer).confirmPurchaseContract({value: 1000});
    await LoCInstance.connect(ImporterBank).grantLoC();
    await LoCInstance.connect(ExporterBank).verifyLoC();
    const Status = await LoCInstance.getLoCStatus();    
    if(Status==3){
      console.log("LoCInstance Status after 'LOC_INITIATED'  is : LOC_VERIFIED ("+Status+")");
      expect(Status).to.equal(3);
    }
  });

  /*LoC Contract Contd.. - products shipped*/
  it("LoC Contract Contd.. - products shipped", async function () {
    await LoCInstance.connect(Importer).confirmPurchaseContract({value: 1000});
    await LoCInstance.connect(ImporterBank).grantLoC();
    await LoCInstance.connect(ExporterBank).verifyLoC();
    await LoCInstance.connect(Exporter).productsShipped();
    const Status = await LoCInstance.getLoCStatus();    
    if(Status==4){
      console.log("LoCInstance Status after 'LOC_VERIFIED'  is : PRODUCTS_SHIPPED ("+Status+")");
      expect(Status).to.equal(4);
    }
  });

  /*LoC Contract Contd.. - add documents*/
  it("LoC Contract Contd.. - add documents", async function () {
    await LoCInstance.connect(Importer).confirmPurchaseContract({value: 1000});
    await LoCInstance.connect(ImporterBank).grantLoC();
    await LoCInstance.connect(ExporterBank).verifyLoC();
    await LoCInstance.connect(Exporter).productsShipped();
    await LoCInstance.connect(ExporterBank).addDocuments(A,A);
    const Status = await LoCInstance.getLoCStatus();    
    if(Status==5){
      expect(Status).to.equal(5);
      console.log("LoCInstance Status after 'PRODUCTS_SHIPPED'  is : DOCS_SUBMITTED ("+Status+")");
    }
  });

  /*LoC Contract Contd.. - approve documents*/
  it("LoC Contract Contd.. - approve documents", async function () {
    await LoCInstance.connect(Importer).confirmPurchaseContract({value: 1000});
    await LoCInstance.connect(ImporterBank).grantLoC();
    await LoCInstance.connect(ExporterBank).verifyLoC();
    await LoCInstance.connect(Exporter).productsShipped();
    await LoCInstance.connect(ExporterBank).addDocuments(A,A);
    await LoCInstance.connect(Importer).approveDocuments();
    const Status = await LoCInstance.getLoCStatus();    
    if(Status==6){
      expect(Status).to.equal(6);
      console.log("LoCInstance Status after 'DOCS_SUBMITTED'  is : DOCS_VERIFIED ("+Status+")");
    }
  });

  /*LoC Contract Contd.. - approve & pay*/
  it("LoC Contract Contd.. - approve & pay", async function () {
    await LoCInstance.connect(Importer).confirmPurchaseContract({value: 1000});
    await LoCInstance.connect(ImporterBank).grantLoC();
    await LoCInstance.connect(ExporterBank).verifyLoC();
    await LoCInstance.connect(Exporter).productsShipped();
    await LoCInstance.connect(ExporterBank).addDocuments(A,A);
    await LoCInstance.connect(Importer).approveDocuments();
    await LoCInstance.connect(ImporterBank).approveAndPay();
    const Status = await LoCInstance.getLoCStatus();    
    if(Status==7){
      expect(Status).to.equal(7);
      console.log("LoCInstance Status after 'DOCS_VERIFIED'  is : DEAL_CLOSED ("+Status+")");
    }
  });

  describe('LoC Factory - Testing with Admin', function () {
    /*LoC Contract Life Cycle Testing With Admin*/
    it("LoC Contract Life Cycle Testing With Admin", async function () {
      await LoCInstance.connect(Admin).confirmPurchaseContract({value: 1000});
      await LoCInstance.connect(Admin).grantLoC();
      await LoCInstance.connect(Admin).verifyLoC();
      await LoCInstance.connect(Admin).productsShipped();
      await LoCInstance.connect(Admin).addDocuments(A,A);
      await LoCInstance.connect(Admin).approveDocuments();
      await LoCInstance.connect(Admin).approveAndPay();
      const Status = await LoCInstance.getLoCStatus();    
      if(Status==7){
        expect(Status).to.equal(7);
        console.log("LoCInstance Status With Admin after approve & pay  is : DEAL_CLOSED ("+Status+")");
        }
      });
  });

  describe('LoC Life-Cycle Cancel Test with Admin', function () {
    /*LoC Life-Cycle - Cancel Test with Admin*/
    it("Cancel(By Admin) the LoC after verify status", async function () {
      await LoCInstance.connect(Admin).confirmPurchaseContract({value: 1000});
      await LoCInstance.connect(Admin).grantLoC();
      await LoCInstance.connect(Admin).verifyLoC();
      await LoCInstance.connect(Admin).CancelLoC();
      const Status= await LoCInstance.getLoCStatus();    
      if(Status==8){
        expect(Status).to.equal(8);
        console.log("LoCInstance Status after 'DOCS_VERIFIED'  is : DEAL_CLOSED ("+Status+")");
        }
      });
  });

  describe('LoC funds transfer testing', function () {
    /* LoC Contract - funds transfer testing*/
        
    it("LoC funds transfered from Importer to Contract", async function () {
      const ImporterBalance = await ethers.provider.getBalance(Importer.address);
      const ContractBalance = await ethers.provider.getBalance(LoCInstanceAddress);
      console.log("Before confirming the Purchase Contract: Balance of the Importer is :" + ImporterBalance );
      console.log("Before confirming the Purchase Contract: Balance of the Contract is :" + ContractBalance );
      expect(ContractBalance).to.equal(0);
        
      await LoCInstance.connect(Admin).confirmPurchaseContract({value: 1000});

      const ImporterBalance1 = await ethers.provider.getBalance(Importer.address);
      const ContractBalance1 = await ethers.provider.getBalance(LoCInstanceAddress);
      console.log("After confirming the Purchase Contract: Balance of the Importer is :" + ImporterBalance1 );
      console.log("After confirming the Purchase Contract: Balance of the Contract is :" + ContractBalance1 );
         
      expect(ContractBalance1).to.equal(1000);
    });

    it("LoC funds transfered from Contract to Exporter", async function () {

    LoCInstance.connect(Admin).confirmPurchaseContract({value: 1000});
    LoCInstance.connect(ImporterBank).grantLoC();
    LoCInstance.connect(ExporterBank).verifyLoC();
    LoCInstance.connect(Exporter).productsShipped();
    LoCInstance.connect(ExporterBank).addDocuments(A,A);
    LoCInstance.connect(Importer).approveDocuments();
    const ExporterBalance = await ethers.provider.getBalance(Exporter.address);
    const ContractBalance3 = await ethers.provider.getBalance(LoCInstanceAddress);
    console.log("Before approve & pay: Balance of the Exporter is :" + ExporterBalance );
    console.log("Before approve & pay: Balance of the Contract is :" + ContractBalance3 );

    expect(ContractBalance3).to.equal(1000);      

    await LoCInstance.connect(ImporterBank).approveAndPay();
      
    const ExporterBalance1 = await ethers.provider.getBalance(Exporter.address);
    const ContractBalance4 = await ethers.provider.getBalance(LoCInstanceAddress);
    console.log("After approve & pay: Balance of the Exporter is :" + ExporterBalance1 );
    console.log("After approve & pay: Balance of the Contract is :" + ContractBalance4 );

    expect(ContractBalance4).to.equal(0);
    });
  });
});
