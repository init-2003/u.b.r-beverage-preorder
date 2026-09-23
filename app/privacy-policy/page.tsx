'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      <div className="max-w-4xl mx-auto">

        {/* Main Document Container */}
        <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
          {/* Top Brand Accent Stripe */}
          <div className="h-1 bg-[#c81415] w-full" />

          {/* Header Section */}
          <div className="p-6 sm:p-8 md:p-10 border-b border-slate-100 bg-gradient-to-b from-slate-50/60 to-white">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 font-[Prompt] tracking-tight">
                  นโยบายความเป็นส่วนตัว
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Privacy Policy &bull; การคุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
                </p>
              </div>
              <div className="text-xs text-slate-400 sm:text-right shrink-0 space-y-0.5 pt-1">
                <div>มีผลบังคับใช้: <span className="text-slate-600 font-medium">23 กันยายน 2569</span></div>
                <div>ปรับปรุงล่าสุด: <span className="text-slate-600 font-medium">23 กันยายน 2569</span></div>
              </div>
            </div>
          </div>

          {/* Document Content */}
          <div className="p-6 sm:p-8 md:p-10 space-y-8 text-slate-700 leading-relaxed text-sm sm:text-base">
            {/* Intro */}
            <div className="bg-slate-50/70 border border-slate-100 rounded-lg p-4 sm:p-5 text-sm text-slate-700">
              <strong className="text-slate-900 font-medium">หจก. อุบลรุ่งเรืองเบฟเวอเรจ</strong> (&quot;เรา&quot;) ให้ความสำคัญอย่างยิ่งต่อการคุ้มครองข้อมูลส่วนบุคคลของท่าน
              เอกสารฉบับนี้จัดทำขึ้นเพื่อชี้แจงรายละเอียดเกี่ยวกับการเก็บรวบรวม ใช้ และเปิดเผยข้อมูลส่วนบุคคล
              ตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) สำหรับการให้บริการระบบสั่งจองสินค้าออนไลน์
            </div>

            {/* Section 1 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  1. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-[15px] pl-1">
                เราเก็บรวบรวมข้อมูลส่วนบุคคลของลูกค้าตามความจำเป็นต่อการให้บริการ ดังนี้:
              </p>
              <div className="grid sm:grid-cols-2 gap-3.5 pt-1">
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-sm mb-2 font-[Prompt]">ข้อมูลระบุตัวตน</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>รหัสลูกค้า (Customer ID)</li>
                    <li>ชื่อร้านค้า / ชื่อ-นามสกุลผู้สั่งซื้อ</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-sm mb-2 font-[Prompt]">ข้อมูลการติดต่อ</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>หมายเลขโทรศัพท์</li>
                    <li>ที่อยู่สำหรับจัดส่งสินค้า</li>
                    <li>ที่อยู่สำหรับออกเอกสารใบเสร็จ/ใบกำกับภาษี</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-sm mb-2 font-[Prompt]">ข้อมูลการทำรายการ</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>ประวัติคำสั่งจองสินค้า (Pre-Order History)</li>
                    <li>ยอดเงินมัดจำและยอดรวมการสั่งจอง</li>
                    <li>หลักฐานการชำระเงิน (สลิปโอนเงิน)</li>
                  </ul>
                </div>
                <div className="rounded-lg border border-slate-200 p-4 bg-slate-50/50">
                  <h3 className="font-bold text-slate-900 text-sm mb-2 font-[Prompt]">ข้อมูลทางเทคนิคและความปลอดภัย</h3>
                  <ul className="text-xs sm:text-sm text-slate-600 space-y-1.5 list-disc list-inside">
                    <li>ข้อมูลเซสชันการเข้าสู่ระบบ (Session Token)</li>
                    <li>บันทึกการเข้าสู่ระบบและที่อยู่ IP (IP Address)</li>
                    <li>ข้อมูลการตั้งค่าเบราว์เซอร์</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Section 2 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  2. วัตถุประสงค์และฐานทางกฎหมายในการประมวลผลข้อมูล
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-[15px] pl-1">
                เราประมวลผลข้อมูลส่วนบุคคลของท่านภายใต้ฐานกฎหมายที่กำหนดไว้ใน พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ดังนี้:
              </p>

              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-800">
                      <th className="text-left px-4 py-3 font-semibold">วัตถุประสงค์</th>
                      <th className="text-left px-4 py-3 font-semibold">ข้อมูลที่ใช้</th>
                      <th className="text-left px-4 py-3 font-semibold">ฐานทางกฎหมาย</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600">
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-800">การให้บริการและจัดส่งสินค้าสั่งจอง</td>
                      <td className="px-4 py-3 text-slate-600">ชื่อ, เบอร์โทรศัพท์, ที่อยู่, Customer ID</td>
                      <td className="px-4 py-3 text-slate-700">ฐานสัญญา (Contract)</td>
                    </tr>
                    <tr className="bg-slate-50/40">
                      <td className="px-4 py-3 font-medium text-slate-800">การจัดการบัญชีผู้ใช้และยืนยันสิทธิ์</td>
                      <td className="px-4 py-3 text-slate-600">Customer ID, ข้อมูลเซสชัน</td>
                      <td className="px-4 py-3 text-slate-700">ฐานสัญญา (Contract)</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3 font-medium text-slate-800">การออกเอกสารทางบัญชี ภาษี และใบสั่งซื้อ</td>
                      <td className="px-4 py-3 text-slate-600">ชื่อร้านค้า/ผู้สั่งซื้อ, ที่อยู่, ข้อมูลคำสั่งซื้อ</td>
                      <td className="px-4 py-3 text-slate-700">หน้าที่ตามกฎหมาย (Legal Obligation)</td>
                    </tr>
                    <tr className="bg-slate-50/40">
                      <td className="px-4 py-3 font-medium text-slate-800">ความมั่นคงปลอดภัยและการป้องกันการทุจริต</td>
                      <td className="px-4 py-3 text-slate-600">Session Token, IP Address, ประวัติการเข้าใช้</td>
                      <td className="px-4 py-3 text-slate-700">ประโยชน์โดยชอบด้วยกฎหมาย (Legitimate Interest)</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* Section 3 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  3. การรักษาความมั่นคงปลอดภัยของข้อมูล
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-[15px] pl-1">
                เราดำเนินมาตรการรักษาความปลอดภัยทางเทคนิคและการบริหารจัดการที่ได้มาตรฐาน ได้แก่:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-600 pl-1 list-disc list-inside">
                <li>การเข้ารหัสการส่งผ่านข้อมูลด้วยโปรโตคอลความปลอดภัยระดับสูง (HTTPS/TLS)</li>
                <li>การตรวจสอบความถูกต้องของเซสชันผู้ใช้ด้วยการลงนามทางดิจิทัลและโทเคนความปลอดภัย</li>
                <li>การกำหนดสิทธิ์การเข้าถึงข้อมูลตามบทบาทและความจำเป็น (Role-Based Access Control)</li>
                <li>การกำหนดคุณสมบัติด้านความปลอดภัยของคุกกี้ (HttpOnly, Secure, SameSite) เพื่อป้องกันการเข้าถึงจากสคริปต์ที่ไม่พึงประสงค์</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  4. การเปิดเผยข้อมูลแก่บุคคลภายนอก
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-[15px] pl-1">
                เราไม่มีนโยบายการจำหน่ายหรือเปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลภายนอก เว้นแต่กรณีที่จำเป็นเพื่อการปฏิบัติตามสัญญาหรือกฎหมาย:
              </p>
              <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 text-xs sm:text-sm space-y-2 text-slate-700">
                <div>
                  <strong className="text-slate-900">ผู้ให้บริการขนส่งและโลจิสติกส์:</strong> เพื่อการจัดส่งสินค้าสั่งจองตามที่อยู่ที่ท่านระบุ
                </div>
                <div>
                  <strong className="text-slate-900">หน่วยงานราชการตามกฎหมาย:</strong> เมื่อมีคำสั่งศาล หรือคำสั่งของเจ้าพนักงานที่มีอำนาจตามกฎหมาย
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  5. ระยะเวลาในการเก็บรักษาข้อมูล
                </h2>
              </div>
              <div className="space-y-2 text-xs sm:text-sm text-slate-600 pl-1">
                <div>
                  <strong className="text-slate-800">ข้อมูลบัญชีลูกค้า:</strong> จัดเก็บตลอดระยะเวลาที่ท่านยังคงมีสถานะเป็นลูกค้าหรือใช้บริการระบบ
                </div>
                <div>
                  <strong className="text-slate-800">ข้อมูลคำสั่งซื้อและเอกสารภาษี:</strong> จัดเก็บเป็นระยะเวลา 5–10 ปี ตามที่กฎหมายว่าด้วยการบัญชีและภาษีอากรกำหนด
                </div>
                <div>
                  <strong className="text-slate-800">ข้อมูลเซสชัน (Session Data):</strong> มีอายุ 30 วัน หรือสิ้นสุดลงทันทีเมื่อท่านออกจากระบบ (Log out)
                </div>
              </div>
            </section>

            {/* Section 6 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  6. สิทธิของเจ้าของข้อมูลส่วนบุคคล
                </h2>
              </div>
              <p className="text-slate-600 text-sm sm:text-[15px] pl-1">
                ภายใต้ พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ท่านมีสิทธิในการดำเนินการดังต่อไปนี้:
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 text-xs sm:text-sm text-slate-600 pl-1 list-disc list-inside">
                <li>สิทธิขอเข้าถึงและรับสำเนาข้อมูล</li>
                <li>สิทธิขอแก้ไขข้อมูลให้ถูกต้องเป็นปัจจุบัน</li>
                <li>สิทธิขอลบ ทำลาย หรือระงับการใช้ข้อมูล</li>
                <li>สิทธิคัดค้านการเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูล</li>
                <li>สิทธิขอเพิกถอนความยินยอม</li>
                <li>สิทธิยื่นเรื่องร้องเรียนต่อคณะกรรมการผู้เชี่ยวชาญ</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section className="space-y-3">
              <div className="border-l-4 border-[#c81415] pl-3 py-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 font-[Prompt]">
                  7. การเชื่อมโยงกับนโยบายคุกกี้
                </h2>
              </div>
              <p className="text-slate-600 leading-relaxed text-sm sm:text-[15px] pl-1">
                สำหรับการใช้งานคุกกี้และเทคโนโลยีติดตามบนเว็บไซต์นี้ ท่านสามารถศึกษารายละเอียดเพิ่มเติมได้ที่{' '}
                <Link
                  href="/cookie-policy"
                  className="text-[#c81415] hover:text-[#960d0e] font-semibold underline underline-offset-2 transition-colors"
                >
                  นโยบายการใช้งานคุกกี้ (Cookie Policy)
                </Link>
              </p>
            </section>

            {/* Contact / Footer Note */}
            <div className="pt-4">
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-5 sm:p-6 text-xs sm:text-sm text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 font-[Prompt] text-sm sm:text-base">
                  ช่องทางการติดต่อสอบถามหรือใช้สิทธิ
                </div>
                <p className="text-slate-600">
                  หากท่านต้องการใช้สิทธิตามกฎหมาย PDPA หรือมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ กรุณาติดต่อ:
                </p>
                <div className="text-slate-700 pt-1 space-y-0.5">
                  <div className="font-semibold text-slate-900">หจก. อุบลรุ่งเรืองเบฟเวอเรจ (สำนักงานใหญ่)</div>
                  <div>โทรศัพท์: 045-263-380</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
