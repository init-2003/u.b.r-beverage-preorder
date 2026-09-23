import { NextResponse } from 'next/server';
import { getDbPool } from '@/lib/db';

export interface CompanyBankAccount {
  auto_id: number;
  bank_no: string;
  bank_name: string;
  bank_name_acc: string;
  bank_cd: string;
  Branch_ID: string;
  displayName: string;
  formattedAccountNo: string;
}

function formatBankNo(no: string): string {
  const clean = (no || '').replace(/\D/g, '');
  if (clean.length === 10) {
    return `${clean.slice(0, 3)}-${clean.slice(3, 4)}-${clean.slice(4, 9)}-${clean.slice(9)}`;
  }
  return no;
}

export async function GET() {
  try {
    const pool = await getDbPool();
    const result = await pool.request().query(`
      SELECT 
        auto_id,
        RTRIM(LTRIM(bank_no)) AS bank_no,
        RTRIM(LTRIM(bank_name)) AS bank_name,
        RTRIM(LTRIM(ISNULL(bank_name_acc, ''))) AS bank_name_acc,
        RTRIM(LTRIM(ISNULL(bank_cd, ''))) AS bank_cd,
        RTRIM(LTRIM(ISNULL(Branch_ID, ''))) AS Branch_ID
      FROM Bank_Company
      WHERE RTRIM(LTRIM(bank_Type)) = '1' AND bank_no <> '-' AND bank_no <> ''
      ORDER BY auto_id ASC
    `);

    const accounts: CompanyBankAccount[] = result.recordset.map((row: any) => {
      let displayName = row.bank_name;
      if (row.bank_cd === 'KBANK') {
        displayName = row.bank_name === 'K-Bank' ? 'ธนาคารกสิกรไทย (KBANK)' : `ธนาคารกสิกรไทย (${row.bank_name})`;
      } else if (row.bank_cd === 'BBL' || row.bank_name.includes('กรุงเทพ')) {
        displayName = 'ธนาคารกรุงเทพ (BBL)';
      }

      return {
        auto_id: row.auto_id,
        bank_no: row.bank_no,
        bank_name: row.bank_name,
        bank_name_acc: row.bank_name_acc || 'หจก. อุบลรุ่งเรืองเบฟเวอเรจ',
        bank_cd: row.bank_cd,
        Branch_ID: row.Branch_ID,
        displayName,
        formattedAccountNo: formatBankNo(row.bank_no),
      };
    });

    return NextResponse.json({
      success: true,
      accounts,
    });
  } catch (error: any) {
    console.error('Fetch bank accounts error:', error);
    return NextResponse.json(
      { success: false, message: 'เกิดข้อผิดพลาดในการโหลดข้อมูลบัญชีธนาคาร: ' + error.message },
      { status: 500 }
    );
  }
}
