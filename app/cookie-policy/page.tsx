'use client';

import Link from 'next/link';

export default function CookiePolicyPage() {
  return (
    <div className="w-full flex-1 bg-white py-8 sm:py-12 px-2 sm:px-6 lg:px-8">
      {/* Formal Document Container (สไตล์เอกสาร Word / Plain Document) */}
      <div className="max-w-4xl mx-auto bg-white text-slate-800 leading-relaxed text-sm sm:text-[15px]">
        {/* Document Header (จัดกึ่งกลางสไตล์หัวเอกสารทางการ) */}
        <div className="text-center pb-6 sm:pb-8 border-b border-slate-300 space-y-1.5">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            นโยบายการใช้งานคุกกี้ (Cookie Policy)
          </h1>
          <p className="text-base sm:text-lg font-semibold text-slate-800">
            ห้างหุ้นส่วนจำกัด อุบลรุ่งเรืองเบฟเวอเรจ
          </p>
          <p className="text-xs sm:text-sm text-slate-500 pt-1">
            มีผลบังคับใช้: 23 กันยายน 2569 &nbsp;|&nbsp; ปรับปรุงล่าสุด: 23 กันยายน 2569
          </p>
        </div>

        {/* Document Body */}
        <div className="pt-6 sm:pt-8 space-y-6 sm:space-y-7">
          {/* Introduction */}
          <p className="text-justify leading-relaxed">
            <strong>ห้างหุ้นส่วนจำกัด อุบลรุ่งเรืองเบฟเวอเรจ</strong> (&quot;เรา&quot;) ใช้คุกกี้และเทคโนโลยีที่คล้ายกันบนเว็บไซต์นี้ เพื่อสนับสนุนการทำงานของระบบสั่งจองสินค้าออนไลน์ รักษาความปลอดภัยของเซสชันการเข้าสู่ระบบ และส่งมอบประสบการณ์การใช้งานที่ราบรื่น เอกสารฉบับนี้จัดทำขึ้นเพื่อให้ท่านเข้าใจถึงลักษณะการใช้งาน ประเภทของคุกกี้ ตลอดจนสิทธิและวิธีการจัดการคุกกี้ของท่านตามพระราชบัญญัติคุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)
          </p>

          {/* Section 1 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              1. คุกกี้ (Cookies) คืออะไร?
            </h2>
            <p className="text-justify leading-relaxed text-slate-700">
              คุกกี้ คือไฟล์ข้อความขนาดเล็กที่จัดเก็บบนอุปกรณ์คอมพิวเตอร์ แท็บเล็ต หรือสมาร์ทโฟนของท่านผ่านเว็บเบราว์เซอร์เมื่อท่านเข้าสู่เว็บไซต์ โดยคุกกี้จะบันทึกข้อมูลการตั้งค่า สถานะการยืนยันตัวตน และพฤติกรรมการใช้งาน เพื่อช่วยให้เว็บไซต์สามารถจดจำอุปกรณ์ของท่านและอำนวยความสะดวกในการใช้งานระบบได้อย่างต่อเนื่องและปลอดภัย
            </p>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              2. ประเภทของคุกกี้ที่เราใช้งาน
            </h2>
            <p className="text-slate-700">
              เราจัดหมวดหมู่คุกกี้ตามวัตถุประสงค์การใช้งานและมาตรฐานความปลอดภัย โดยมีรายละเอียดดังแสดงในตารางต่อไปนี้:
            </p>

            {/* Word-Style Table: ประเภทคุกกี้ */}
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm text-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 px-3 py-2.5 text-center font-bold w-12 sm:w-16">
                      ลำดับ
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold w-48 sm:w-56">
                      ประเภทคุกกี้
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold">
                      วัตถุประสงค์และลักษณะการทำงาน
                    </th>
                    <th className="border border-slate-400 px-3 py-2.5 text-center font-bold w-28 sm:w-36">
                      สถานะความจำเป็น
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 px-3 py-3 text-center align-top font-medium">
                      1
                    </td>
                    <td className="border border-slate-400 px-3.5 py-3 align-top font-semibold">
                      คุกกี้ที่จำเป็นอย่างยิ่ง
                      <div className="text-xs font-normal text-slate-600">
                        (Strictly Necessary Cookies)
                      </div>
                    </td>
                    <td className="border border-slate-400 px-3.5 py-3 align-top text-slate-700 leading-relaxed">
                      มีความจำเป็นต่อการทำงานพื้นฐานของระบบสั่งจองสินค้า เช่น การจัดการเซสชันผู้ใช้งานเพื่อยืนยันตัวตนในการเข้าสู่ระบบ (Session Authentication), การตรวจสอบสิทธิ์การเข้าถึงข้อมูลคำสั่งซื้อ และการรักษาความมั่นคงปลอดภัยของระบบ
                    </td>
                    <td className="border border-slate-400 px-3 py-3 text-center align-top font-semibold text-slate-900">
                      จำเป็นต่อระบบ
                      <div className="text-xs font-normal text-slate-500">
                        (ไม่สามารถปิดได้)
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-3 text-center align-top font-medium">
                      2
                    </td>
                    <td className="border border-slate-400 px-3.5 py-3 align-top font-semibold">
                      คุกกี้เพื่อการทำงานของระบบ
                      <div className="text-xs font-normal text-slate-600">
                        (Functionality Cookies)
                      </div>
                    </td>
                    <td className="border border-slate-400 px-3.5 py-3 align-top text-slate-700 leading-relaxed">
                      ช่วยจดจำการตั้งค่าและตัวเลือกของท่าน เช่น บันทึกสถานะการยอมรับข้อตกลง การแสดงผลหน้าจอ หรือการตั้งค่าตัวกรองสินค้า เพื่อให้ท่านสามารถใช้งานเว็บไซต์ได้อย่างสะดวกสบายในครั้งถัดไป
                    </td>
                    <td className="border border-slate-400 px-3 py-3 text-center align-top text-slate-700">
                      ทางเลือก
                      <div className="text-xs font-normal text-slate-500">
                        (ตั้งค่าเปิด-ปิดได้)
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-3 text-center align-top font-medium">
                      3
                    </td>
                    <td className="border border-slate-400 px-3.5 py-3 align-top font-semibold">
                      คุกกี้เพื่อการวิเคราะห์และวัดผล
                      <div className="text-xs font-normal text-slate-600">
                        (Analytics Cookies)
                      </div>
                    </td>
                    <td className="border border-slate-400 px-3.5 py-3 align-top text-slate-700 leading-relaxed">
                      ช่วยให้เราทราบสถิติปริมาณการเข้าใช้งานหน้าเว็บและประสิทธิภาพการตอบสนองของระบบ เพื่อนำข้อมูลเชิงสถิติไปปรับปรุงความเร็ว ความเสถียร และพัฒนาการให้บริการให้ดียิ่งขึ้น
                    </td>
                    <td className="border border-slate-400 px-3 py-3 text-center align-top text-slate-700">
                      ทางเลือก
                      <div className="text-xs font-normal text-slate-500">
                        (ตั้งค่าเปิด-ปิดได้)
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3 py-3 text-center align-top font-medium">
                      4
                    </td>
                    <td className="border border-slate-400 px-3.5 py-3 align-top font-semibold">
                      คุกกี้เพื่อการตลาด
                      <div className="text-xs font-normal text-slate-600">
                        (Marketing Cookies)
                      </div>
                    </td>
                    <td className="border border-slate-400 px-3.5 py-3 align-top text-slate-700 leading-relaxed">
                      ใช้สำหรับนำเสนอข่าวสาร โปรโมชันสินค้าเครื่องดื่ม หรือสิทธิประโยชน์ที่เกี่ยวข้องกับความต้องการของท่าน โดยไม่มีการเปิดเผยข้อมูลส่วนบุคคลระบุตัวตนแก่บุคคลภายนอกที่ไม่เกี่ยวข้อง
                    </td>
                    <td className="border border-slate-400 px-3 py-3 text-center align-top text-slate-700">
                      ทางเลือก
                      <div className="text-xs font-normal text-slate-500">
                        (ตั้งค่าเปิด-ปิดได้)
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              3. การจัดการและการปิดการใช้งานคุกกี้
            </h2>
            <p className="text-slate-700">
              ท่านสามารถเลือกยอมรับหรือปฏิเสธคุกกี้ที่มิใช่คุกกี้จำเป็นได้ผ่านแบนเนอร์แจ้งเตือนการใช้งานคุกกี้ หรือท่านสามารถตั้งค่า ลบ หรือปฏิเสธคุกกี้ได้โดยตรงผ่านเมนูการตั้งค่าของโปรแกรมเว็บเบราว์เซอร์ ดังนี้:
            </p>

            {/* Word-Style Table: เบราว์เซอร์ */}
            <div className="overflow-x-auto my-3">
              <table className="w-full border-collapse border border-slate-400 text-xs sm:text-sm text-slate-800">
                <thead>
                  <tr className="bg-slate-100 text-slate-900">
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold w-44 sm:w-52">
                      เว็บเบราว์เซอร์
                    </th>
                    <th className="border border-slate-400 px-3.5 py-2.5 text-left font-bold">
                      ขั้นตอนการตั้งค่าและลบคุกกี้
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      Google Chrome
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top">
                      การตั้งค่า (Settings) &gt; ความเป็นส่วนตัวและความปลอดภัย (Privacy & Security) &gt; คุกกี้และข้อมูลอื่นของไซต์ (Third-party cookies)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      Microsoft Edge
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top">
                      การตั้งค่า (Settings) &gt; คุกกี้และสิทธิ์ของไซต์ (Cookies and site permissions) &gt; จัดการและลบคุกกี้และข้อมูลไซต์
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-slate-400 px-3.5 py-2.5 font-semibold align-top">
                      Apple Safari
                    </td>
                    <td className="border border-slate-400 px-3.5 py-2.5 align-top">
                      การตั้งค่า (Preferences / Settings) &gt; ความเป็นส่วนตัว (Privacy) &gt; บล็อกคุกกี้ทั้งหมด (Block all cookies)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-xs text-slate-500 italic">
              * หมายเหตุ: หากท่านปิดการใช้งานคุกกี้ที่จำเป็นอย่างยิ่ง ระบบอาจไม่สามารถจดจำสถานะการเข้าสู่ระบบ และการสั่งจองสินค้าอาจทำงานได้อย่างไม่สมบูรณ์
            </p>
          </section>

          {/* Section 4 */}
          <section className="space-y-2">
            <h2 className="text-base sm:text-lg font-bold text-slate-900">
              4. การเชื่อมโยงกับนโยบายความเป็นส่วนตัว
            </h2>
            <p className="text-justify leading-relaxed text-slate-700">
              การเก็บรวบรวม ใช้ และประมวลผลข้อมูลส่วนบุคคลของท่านที่เกิดขึ้นผ่านการใช้งานเว็บไซต์นี้ อยู่ภายใต้ข้อกำหนดของ{' '}
              <Link
                href="/privacy-policy"
                className="text-slate-900 font-semibold underline underline-offset-2 hover:text-[#800020] transition-colors"
              >
                นโยบายความเป็นส่วนตัว (Privacy Policy)
              </Link>
              {' '}ของ ห้างหุ้นส่วนจำกัด อุบลรุ่งเรืองเบฟเวอเรจ โปรดศึกษาเพื่อรับทราบสิทธิและมาตรการคุ้มครองข้อมูลของท่านตามกฎหมาย PDPA
            </p>
          </section>

          {/* Section 5: Contact Info */}
          <section className="pt-4 border-t border-slate-300 space-y-1.5 text-xs sm:text-sm text-slate-700">
            <div className="font-bold text-slate-900 text-sm sm:text-base">
              ช่องทางการติดต่อสอบถาม
            </div>
            <p>
              หากท่านมีข้อสงสัย ข้อเสนอแนะ หรือต้องการสอบถามข้อมูลเพิ่มเติมเกี่ยวกับการใช้งานคุกกี้ กรุณาติดต่อ:
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
