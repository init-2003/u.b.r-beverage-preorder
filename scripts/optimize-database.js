const { getDbPool } = require('../lib/db.ts');

const INDEX_SCRIPTS = [
  {
    name: 'IX_Trade_Type_Name',
    table: 'Trade',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Trade_Type_Name' AND object_id = OBJECT_ID('Trade'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Trade_Type_Name
        ON Trade (Type_Name, Trade_Name)
        INCLUDE (Trade_Id, Sale_Price1, Trade_deposit, Unit_Name, Trade_Part_Image, Trade_Province, Trade_Note, Trade_NameEN);
        PRINT 'Created index IX_Trade_Type_Name on Trade';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Trade_Type_Name already exists';
      END
    `
  },
  {
    name: 'IX_Trade_Trade_Id',
    table: 'Trade',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Trade_Trade_Id' AND object_id = OBJECT_ID('Trade'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Trade_Trade_Id
        ON Trade (Trade_Id)
        INCLUDE (Trade_Name, Unit_Name, Sale_Price1, Trade_deposit, Trade_Part_Image);
        PRINT 'Created index IX_Trade_Trade_Id on Trade';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Trade_Trade_Id already exists';
      END
    `
  },
  {
    name: 'IX_Fnt_Detail_online_Cart',
    table: 'Fnt_Detail_online',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Fnt_Detail_online_Cart' AND object_id = OBJECT_ID('Fnt_Detail_online'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Fnt_Detail_online_Cart
        ON Fnt_Detail_online (Branch_Id, Fn_Doc_No, Customer_Id)
        INCLUDE (Trade_Id, Qty, Unit_Name, Sale_Price, fn_deposit_D);
        PRINT 'Created index IX_Fnt_Detail_online_Cart on Fnt_Detail_online';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Fnt_Detail_online_Cart already exists';
      END
    `
  },
  {
    name: 'IX_Fnt_Detail_online_Trade_Id',
    table: 'Fnt_Detail_online',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Fnt_Detail_online_Trade_Id' AND object_id = OBJECT_ID('Fnt_Detail_online'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Fnt_Detail_online_Trade_Id
        ON Fnt_Detail_online (Trade_Id);
        PRINT 'Created index IX_Fnt_Detail_online_Trade_Id on Fnt_Detail_online';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Fnt_Detail_online_Trade_Id already exists';
      END
    `
  },
  {
    name: 'IX_Fnt_Header_online_Customer_Date',
    table: 'Fnt_Header_online',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Fnt_Header_online_Customer_Date' AND object_id = OBJECT_ID('Fnt_Header_online'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Fnt_Header_online_Customer_Date
        ON Fnt_Header_online (Customer_Id, Fn_Doc_Date DESC)
        INCLUDE (Branch_Id, Fn_Doc_No, Doc_Sts, Fn_Total, fn_deposit_H, money_sts, FILE_NAME_PIC, Fn_Remark, fn_type_sale);
        PRINT 'Created index IX_Fnt_Header_online_Customer_Date on Fnt_Header_online';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Fnt_Header_online_Customer_Date already exists';
      END
    `
  },
  {
    name: 'IX_Fnt_Header_online_DocNo',
    table: 'Fnt_Header_online',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Fnt_Header_online_DocNo' AND object_id = OBJECT_ID('Fnt_Header_online'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Fnt_Header_online_DocNo
        ON Fnt_Header_online (Branch_Id, Fn_Doc_No)
        INCLUDE (Doc_Sts, Customer_Id, Fn_Total, fn_deposit_H, money_sts, FILE_NAME_PIC, Fn_Doc_Date);
        PRINT 'Created index IX_Fnt_Header_online_DocNo on Fnt_Header_online';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Fnt_Header_online_DocNo already exists';
      END
    `
  },
  {
    name: 'IX_Customer_online_DocNo',
    table: 'Customer_online',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Customer_online_DocNo' AND object_id = OBJECT_ID('Customer_online'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Customer_online_DocNo
        ON Customer_online (Fn_Doc_No)
        INCLUDE (Customer_Id, Customer_Name, Customer_Tel, Customer_Address, Customer_Zip);
        PRINT 'Created index IX_Customer_online_DocNo on Customer_online';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Customer_online_DocNo already exists';
      END
    `
  },
  {
    name: 'IX_Customer_online_Customer_Id',
    table: 'Customer_online',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Customer_online_Customer_Id' AND object_id = OBJECT_ID('Customer_online'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Customer_online_Customer_Id
        ON Customer_online (Customer_Id);
        PRINT 'Created index IX_Customer_online_Customer_Id on Customer_online';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Customer_online_Customer_Id already exists';
      END
    `
  },
  {
    name: 'IX_Customer_Cus_User',
    table: 'Customer',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Customer_Cus_User' AND object_id = OBJECT_ID('Customer'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Customer_Cus_User
        ON Customer (Cus_User)
        INCLUDE (Cus_SPass, Customer_Id);
        PRINT 'Created index IX_Customer_Cus_User on Customer';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Customer_Cus_User already exists';
      END
    `
  },
  {
    name: 'IX_Web_Carousel_Sort',
    table: 'Web_Carousel',
    sql: `
      IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE name = 'IX_Web_Carousel_Sort' AND object_id = OBJECT_ID('Web_Carousel'))
      BEGIN
        CREATE NONCLUSTERED INDEX IX_Web_Carousel_Sort
        ON Web_Carousel (Is_Active, Sort_Order, Carousel_Id);
        PRINT 'Created index IX_Web_Carousel_Sort on Web_Carousel';
      END
      ELSE
      BEGIN
        PRINT 'Index IX_Web_Carousel_Sort already exists';
      END
    `
  }
];

async function main() {
  console.log('--- Applying Database Indexes Optimization ---');
  const pool = await getDbPool();
  for (const item of INDEX_SCRIPTS) {
    try {
      process.stdout.write(`Processing ${item.name} on ${item.table}... `);
      await pool.request().query(item.sql);
      console.log('SUCCESS');
    } catch (err) {
      console.log('FAILED');
      console.error(`  Error creating ${item.name}:`, err.message);
    }
  }
  console.log('--- Database Index Optimization Complete ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
