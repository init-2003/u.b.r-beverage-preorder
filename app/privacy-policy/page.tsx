'use client';

import Link from 'next/link';

export default function PrivacyPolicyPage() {
  return (
    <div className="w-full flex-1 bg-white py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Formal Document Container (สไตล์เอกสาร Word / Plain Document) */}
      <div className="max-w-4xl mx-auto bg-white text-slate-800 leading-relaxed text-sm sm:text-[15px]">
        {/* Document Header (จัดกึ่งกลางสไตล์หัวเอกสารทางการ) */}
        <div className="text-center pb-6 sm:pb-8 border-b border-slate-300 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            นโยบายความเป็นส่วนตัว (Privacy Policy)
          </h1>
          <p className="text-base sm:text-lg font-semibold text-slate-800">
            ห้างหุ้นส่วนจำกัด อุบลรุ่งเรืองเบฟเวอเรจ
          </p>
          <p className="text-xs sm:text-sm text-slate-500 pt-1">
            การคุ้มครองข้อมูลส่วนบุคคลตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)<br />
            มีผลบังคับใช้: 23 กันยายน 2569 &nbsp;|&nbsp; ปรับปรุงล่าสุด: 23 กันยายน 2569
          </p>
        </div>

        {/* Document Body */}
        <div className="pt-6 sm:pt-8 space-y-6 sm:space-y-7">
          {/* Introduction */}
          <p className="text-justify leading-relaxed">
            <strong>ห้างหุ้นส่วนจำกัด อุบลรุ่งเรืองเบฟเวอเรจ</strong> (&quot;เรา&quot;) ให้ความสำคัญอย่างยิ่งต่อการคุ้มครองข้อมูลส่วนบุคคลและความเป็นส่วนตัวของลูกค้าทุกท่าน เอกสารฉบับนี้จัดทำขึ้นเพื่อชี้แจงรายละเอียดเกี่ยวกับการเก็บรวบรวม ใช้ เปิดเผย และคุ้มครองข้อมูลส่วนบุคคลของผู้ใช้บริการระบบสั่งจองสินค้าออนไลน์ ให้สอดคล้องตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          </p>

          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              1. ข้อมูลส่วนบุคคลที่เราเก็บรวบรวม
            </h2>
            <p className="text-slate-700">
              ในการให้บริการระบบสั่งจองสินค้าออนไลน์ เรามีความจำเป็นต้องเก็บรวบรวมข้อมูลส่วนบุคคลของท่านตามขอบเขตและวัตถุประสงค์การใช้งาน ดังแสดงในตารางต่อไปนี้:
            </p>

            {/* Word-Style Table: ข้อมูลที่เก็บรวบรวม */}
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm text-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 px-3 py-2.5 text-center font-bold w-12 sm:w-16">
                      ลำดับ
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold w-48 sm:w-56">
                      หมวดหมู่ข้อมูล
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold">
                      รายการข้อมูลส่วนบุคคลที่จัดเก็บ
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2.5 text-center align-top font-medium">
                      1
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ข้อมูลระบุตัวตน
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      รหัสลูกค้า (Customer ID), ชื่อร้านค้า หรือชื่อ-นามสกุลของผู้สั่งจองสินค้า
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2.5 text-center align-top font-medium">
                      2
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ข้อมูลการติดต่อและการจัดส่ง
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      หมายเลขโทรศัพท์, ที่อยู่สำหรับจัดส่งสินค้า, ที่อยู่สำหรับออกเอกสารใบสั่งซื้อ ใบเสร็จรับเงิน หรือใบกำกับภาษี
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2.5 text-center align-top font-medium">
                      3
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ข้อมูลการทำรายการและการชำระเงิน
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      ประวัติคำสั่งจองสินค้า (Pre-Order History), ข้อมูลรายการสินค้า, ยอดเงินมัดจำ, ยอดรวมคำสั่งซื้อ, วันเวลาที่ทำรายการ และหลักฐานการโอนเงิน (สลิปโอนเงิน)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2.5 text-center align-top font-medium">
                      4
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ข้อมูลทางเทคนิคและความปลอดภัย
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      ข้อมูลเซสชันการเข้าสู่ระบบ (Session Token), ประวัติการเข้าสู่ระบบ, หมายเลขไอพี (IP Address) และข้อมูลการตั้งค่าเบราว์เซอร์
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              2. วัตถุประสงค์และฐานทางกฎหมายในการประมวลผลข้อมูล
            </h2>
            <p className="text-slate-700">
              เราประมวลผลข้อมูลส่วนบุคคลของท่านภายใต้ฐานกฎหมายที่กำหนดไว้ใน พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ดังแสดงในตารางต่อไปนี้:
            </p>

            {/* Word-Style Table: ฐานทางกฎหมาย */}
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm text-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 px-3 py-2.5 text-center font-bold w-12 sm:w-16">
                      ลำดับ
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold w-52 sm:w-60">
                      วัตถุประสงค์ในการประมวลผล
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold">
                      ข้อมูลส่วนบุคคลที่ใช้
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold w-48 sm:w-56">
                      ฐานทางกฎหมาย (Legal Basis)
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2.5 text-center align-top font-medium">
                      1
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      การให้บริการ รับคำสั่งซื้อ และจัดส่งสินค้า
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      ชื่อ-นามสกุล, เบอร์โทรศัพท์, ที่อยู่จัดส่ง, Customer ID, รายการสินค้า
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top font-medium text-slate-900">
                      ฐานสัญญา (Contract)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2.5 text-center align-top font-medium">
                      2
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      การจัดการบัญชีผู้ใช้และยืนยันสิทธิ์เข้าใช้ระบบ
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      Customer ID, รหัสผ่าน, ข้อมูลเซสชันการเข้าสู่ระบบ
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top font-medium text-slate-900">
                      ฐานสัญญา (Contract)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2.5 text-center align-top font-medium">
                      3
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      การออกเอกสารทางบัญชี ภาษี และใบสั่งซื้อ
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      ชื่อร้านค้า/ผู้สั่งซื้อ, ที่อยู่ออกเอกสาร, ข้อมูลคำสั่งซื้อ, ยอดเงิน
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top font-medium text-slate-900">
                      หน้าที่ตามกฎหมาย (Legal Obligation)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-2.5 text-center align-top font-medium">
                      4
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ความมั่นคงปลอดภัยและการป้องกันการทุจริต
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      Session Token, IP Address, ประวัติและบันทึกการทำรายการ
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top font-medium text-slate-900">
                      ประโยชน์โดยชอบด้วยกฎหมาย (Legitimate Interest)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              3. การรักษาความมั่นคงปลอดภัยของข้อมูลส่วนบุคคล
            </h2>
            <p className="text-justify leading-relaxed text-slate-700">
              เราดำเนินมาตรการรักษาความปลอดภัยทางเทคนิคและการบริหารจัดการที่เข้มงวดตามมาตรฐานสากล เพื่อป้องกันการสูญหาย การเข้าถึง ทำลาย ใช้ ดัดแปลง แก้ไข หรือเปิดเผยข้อมูลส่วนบุคคลโดยปราศจากอำนาจหรือโดยมิชอบ ดังนี้:
            </p>
            <ul className="list-disc list-inside space-y-1.5 pl-2 text-slate-700">
              <li>การเข้ารหัสข้อมูลทุกช่องทางการส่งผ่านเครือข่ายด้วยโปรโตคอลความปลอดภัยระดับสูง (HTTPS/TLS)</li>
              <li>การควบคุมสิทธิ์การเข้าถึงข้อมูลตามบทบาทและความจำเป็นในการปฏิบัติงาน (Role-Based Access Control)</li>
              <li>การจัดเก็บข้อมูลในระบบฐานข้อมูลที่มีการป้องกันและตรวจสอบความถูกต้องอย่างสม่ำเสมอ</li>
              <li>การกำหนดคุณสมบัติด้านความปลอดภัยของคุกกี้ (HttpOnly, Secure, SameSite) เพื่อป้องกันภัยคุกคามทางไซเบอร์</li>
            </ul>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              4. การเปิดเผยข้อมูลส่วนบุคคลแก่บุคคลภายนอก
            </h2>
            <p className="text-justify leading-relaxed text-slate-700">
              เราไม่มีนโยบายการจำหน่าย แลกเปลี่ยน หรือเปิดเผยข้อมูลส่วนบุคคลของท่านแก่บุคคลภายนอก เว้นแต่กรณีที่มีความจำเป็นเพื่อการปฏิบัติตามสัญญา การให้บริการ หรือการปฏิบัติตามกฎหมาย ดังต่อไปนี้:
            </p>

            {/* Word-Style Table: บุคคลภายนอก */}
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm text-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold w-52 sm:w-60">
                      ผู้รับข้อมูลภายนอก
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold">
                      วัตถุประสงค์และความจำเป็นในการเปิดเผยข้อมูล
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ผู้ให้บริการขนส่งและโลจิสติกส์
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      เพื่อการจัดส่งสินค้าสั่งจองไปยังที่อยู่ปลายทางตามที่ท่านระบุไว้ในคำสั่งซื้อ
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      หน่วยงานราชการหรือเจ้าหน้าที่ผู้มีอำนาจ
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      เมื่อมีหมายศาล คำสั่งทางกฎหมาย หรือหนังสือราชการที่มีอำนาจตามบทบัญญัติแห่งกฎหมาย
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              5. ระยะเวลาในการเก็บรักษาข้อมูลส่วนบุคคล
            </h2>
            <p className="text-slate-700">
              เราจะจัดเก็บรักษาข้อมูลส่วนบุคคลของท่านไว้ตามระยะเวลาที่จำเป็นต่อการบรรลุวัตถุประสงค์ในการประมวลผลข้อมูล ดังนี้:
            </p>

            {/* Word-Style Table: ระยะเวลาจัดเก็บ */}
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm text-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold w-52 sm:w-60">
                      ประเภทข้อมูล
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold w-40 sm:w-48">
                      ระยะเวลาจัดเก็บ
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold">
                      เหตุผลและความจำเป็น
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ข้อมูลบัญชีลูกค้า
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      ตลอดระยะเวลาที่เป็นลูกค้า
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      เพื่อการยืนยันตัวตนและการให้บริการสั่งจองสินค้าอย่างต่อเนื่อง
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ข้อมูลคำสั่งซื้อและเอกสารภาษี
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      5 – 10 ปี
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      ตามที่กฎหมายว่าด้วยการบัญชีและประมวลรัษฎากรกำหนด
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      ข้อมูลเซสชัน (Session Data)
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      30 วัน หรือเมื่อออกจากระบบ
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top text-slate-700">
                      เพื่อความปลอดภัยในการยืนยันตัวตนของผู้ใช้งาน
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              6. สิทธิของเจ้าของข้อมูลส่วนบุคคล (PDPA Rights)
            </h2>
            <p className="text-slate-700">
              ภายใต้พระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 ท่านมีสิทธิในการดำเนินการดังต่อไปนี้:
            </p>
            <ol className="list-decimal list-inside space-y-1 pl-2 text-slate-700">
              <li><strong>สิทธิขอเข้าถึงและรับสำเนาข้อมูล:</strong> ขอรับสำเนาข้อมูลส่วนบุคคลที่เกี่ยวกับท่าน หรือขอให้เปิดเผยถึงการได้มาซึ่งข้อมูลที่ท่านไม่ได้ให้ความยินยอม</li>
              <li><strong>สิทธิขอแก้ไขข้อมูลให้ถูกต้อง:</strong> ขอให้ดำเนินการแก้ไขข้อมูลส่วนบุคคลให้ถูกต้อง เป็นปัจจุบัน สมบูรณ์ และไม่ก่อให้เกิดความเข้าใจผิด</li>
              <li><strong>สิทธิขอลบหรือทำลายข้อมูล:</strong> ขอให้ลบ ทำลาย หรือทำให้ข้อมูลส่วนบุคคลเป็นข้อมูลที่ไม่สามารถระบุตัวบุคคลได้ตามเงื่อนไขที่กฎหมายกำหนด</li>
              <li><strong>สิทธิขอให้ระงับการใช้ข้อมูล:</strong> ขอให้ระงับการใช้ข้อมูลส่วนบุคคลในกรณีที่มีการตรวจสอบความถูกต้อง หรือเมื่อหมดความจำเป็น</li>
              <li><strong>สิทธิคัดค้านการประมวลผลข้อมูล:</strong> คัดค้านการเก็บรวบรวม ใช้ หรือเปิดเผยข้อมูลส่วนบุคคลที่เกี่ยวกับท่าน</li>
              <li><strong>สิทธิขอเพิกถอนความยินยอม:</strong> เพิกถอนความยินยอมที่ท่านได้เคยให้ไว้ตลอดระยะเวลาที่ข้อมูลส่วนบุคคลของท่านอยู่กับเรา</li>
              <li><strong>สิทธิยื่นเรื่องร้องเรียน:</strong> ยื่นเรื่องร้องเรียนต่อคณะกรรมการผู้เชี่ยวชาญตามกฎหมาย PDPA หากพบว่ามีการกระทำที่ฝ่าฝืนหรือไม่ปฏิบัติตามกฎหมาย</li>
            </ol>
          </section>

          {/* Section 7 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              7. การเชื่อมโยงกับนโยบายการใช้งานคุกกี้
            </h2>
            <p className="text-justify leading-relaxed text-slate-700">
              สำหรับการใช้งานคุกกี้และเทคโนโลยีการติดตามบนเว็บไซต์นี้ ท่านสามารถศึกษารายละเอียด วัตถุประสงค์ และวิธีการตั้งค่าเปิด-ปิดคุกกี้ได้ที่{' '}
              <Link
                href="/cookie-policy"
                className="text-slate-900 font-semibold underline underline-offset-2 hover:text-[#800020] transition-colors"
              >
                นโยบายการใช้งานคุกกี้ (Cookie Policy)
              </Link>
            </p>
          </section>

          {/* Section 8: Contact Info */}
          <section className="pt-4 border-t border-slate-300 space-y-1.5 text-xs sm:text-sm text-slate-700">
            <div className="font-bold text-slate-900 text-sm sm:text-base">
              ช่องทางการติดต่อสอบถามหรือใช้สิทธิ
            </div>
            <p>
              หากท่านต้องการใช้สิทธิตามกฎหมาย PDPA หรือมีข้อสงสัยเกี่ยวกับนโยบายความเป็นส่วนตัวนี้ กรุณาติดต่อ:
            </p>
            <div className="pt-1 text-slate-800">
              <div className="font-semibold">ห้างหุ้นส่วนจำกัด อุบลรุ่งเรืองเบฟเวอเรจ (สำนักงานใหญ่)</div>
              <div>โทรศัพท์: 045-263-380</div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
