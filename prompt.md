ได้ นี่คือ **Requirement แบบละเอียดครบชุด** สำหรับเอาไปเขียน prompt ให้เครื่องมือสร้างโปรแกรม (ที่คุณเรียก “google antigavity”) โดยยึด stack ที่คุณกำหนด: **Next.js + TypeScript + React + Tailwind CSS + Supabase + Drizzle ORM + pnpm**
(ผมจะสรุปเป็นสเปคที่ “เอาไป generate โค้ดได้” ไม่ใช่แค่แนวคิด)

---

## 1) เป้าหมายระบบ

สร้างเว็บภายในบริษัทเพื่อให้ **Sales** บันทึก “คำขอให้หลังบ้านเปิดบิล” และให้ **Back Office** เข้ามาดูคิวงาน ดึงข้อมูลไปเปิดบิลใน “ระบบบัญชีภายนอก” แล้วกลับมาอัปเดตสถานะ/เลข Invoice ในระบบนี้

**ข้อกำหนดหลัก**

* ภาษาไทย 100%
* ใช้งาน Local/Dev ก่อน
* **ไม่มีระบบ Login** (แบ่งการใช้งานด้วย URL/หน้า)
* Sales **แก้ไขคำขอหลังส่งไม่ได้**
* มี **Export Excel** โดยกรองได้ตาม **สถานะ + ช่วงวันที่**
* ระบบนี้ **ไม่เปิดบิลจริง** แค่เก็บข้อมูลเพื่อให้หลังบ้านไปทำในระบบบัญชีเอง

---

## 2) บทบาทผู้ใช้ (Roles)

> แม้ไม่มี login ก็ยังต้องกำหนด “บทบาททางตรรกะ” เพื่อกำหนดสิทธิ์ของหน้าจอและการกระทำ

### 2.1 Sales

* สร้างคำขอเปิดบิล (Submit)
* ดูผลลัพธ์การส่ง (สำเร็จ)
* (ไม่จำเป็นต้องเห็นรายการทั้งหมด ถ้าจะทำ MVP ให้เห็นเฉพาะฟอร์มก็พอ)

### 2.2 Back Office

* ดูรายการคำขอทั้งหมดเป็นคิวงาน
* ดูรายละเอียดคำขอ
* อัปเดตสถานะงานเป็น “รับเรื่องแล้ว”
* บันทึกเลข Invoice + วันที่ออก Invoice + VAT (หลังจากไปเปิดบิลจริงในระบบบัญชี)
* เปลี่ยนสถานะเป็น “เปิดบิลแล้ว”
* Export Excel ตามสถานะ + ช่วงวันที่

### 2.3 Admin (ไม่บังคับใน MVP)

* จัดการ master ลูกค้า
* แก้ไข/ยกเลิกคำขอ (กรณีพิเศษ)

> ถ้า MVP ตัด admin ได้ ให้หลังบ้านเพิ่มลูกค้าผ่านหน้าเดียว

---

## 3) ขอบเขตฟีเจอร์ (Feature Scope)

### 3.1 Master Data: ลูกค้า

* สร้าง/แก้ไข/ลบ ลูกค้า (อย่างน้อย “เพิ่ม” และ “รายการ”)
* ฟิลด์ลูกค้า:

  * ชื่อลูกค้า/บริษัท (บังคับ)
  * เลขผู้เสียภาษี (ไม่บังคับ)
  * ที่อยู่ (ไม่บังคับ)

### 3.2 Sales: ฟอร์มสร้างคำขอเปิดบิล

* ฟอร์มกรอกข้อมูลคำขอ:

  * เลขที่ใบเสนอราคา (บังคับ)
  * ลูกค้า (เลือกจากรายการลูกค้า) (บังคับ)
  * ชื่อเซลล์ (บังคับ)
  * ยอดเงินรวม (บังคับ, ตัวเลข > 0)
  * ประเภทเอกสาร (บังคับ) ตัวเลือก:

    * ใบกำกับภาษี
    * ใบเสร็จ
    * วางบิล
  * หมายเหตุ (ไม่บังคับ)
  * แนบไฟล์ (MVP: ทำได้/ไม่ทำได้ก็ได้ — ถ้าทำให้ใช้ Supabase Storage)
* เมื่อกด Submit:

  * สร้างเรคคอร์ดคำขอ
  * ตั้งสถานะเริ่มต้นเป็น **“รอหลังบ้านตรวจสอบ”**
  * Sales **ไม่มีหน้าจอแก้ไข** (หรือถ้ามี ต้องล็อกไม่ให้แก้)

### 3.3 Back Office: Queue งาน

* หน้าแสดงรายการคำขอทั้งหมด (ตาราง)
* แสดงคอลัมน์:

  * วันที่บันทึก
  * เลขที่ใบเสนอราคา
  * ลูกค้า
  * ชื่อเซลล์
  * ยอดเงิน
  * ประเภทเอกสาร
  * สถานะ
  * เลข Invoice (ถ้ามี)
* การกรอง (UI filter):

  * สถานะ (required สำหรับ export แต่สำหรับ list จะ optional ก็ได้)
  * ช่วงวันที่ (from/to) โดยอ้างอิงวันที่บันทึกคำขอ (createdAt)
* การจัดเรียง:

  * ค่าเริ่มต้นเรียงล่าสุดก่อน
* การกระทำ:

  * กดเข้า “รายละเอียด” ของแต่ละคำขอ

### 3.4 Back Office: รายละเอียดคำขอ + อัปเดตสถานะ

* แสดงรายละเอียดทั้งหมดของคำขอ
* ปุ่ม:

  * “รับเรื่องแล้ว” → อัปเดตสถานะเป็น **รับเรื่องแล้ว**
* ฟอร์ม “บันทึกการเปิดบิล” (หลังบ้านกรอก หลังเปิดบิลจริงแล้ว):

  * เลข Invoice (บังคับ)
  * วันที่ออก Invoice (บังคับ)
  * VAT (ไม่บังคับ)
  * เมื่อบันทึกแล้ว:

    * สร้าง/อัปเดต invoice record ที่ผูกกับคำขอ
    * อัปเดตสถานะเป็น **เปิดบิลแล้ว**

### 3.5 Export Excel (Back Office)

* Endpoint/ปุ่ม Export
* Export ต้องรองรับ:

  * กรอง **สถานะ** (บังคับเลือกก่อน export)
  * กรอง **ช่วงวันที่** (from/to) (ถ้าไม่ใส่ = ทั้งหมดของสถานะนั้น)
* ไฟล์ Excel มีหัวตารางภาษาไทย:

  * วันที่บันทึก
  * เลขที่ใบเสนอราคา
  * ชื่อลูกค้า
  * ชื่อเซลล์
  * ยอดเงิน
  * ประเภทเอกสาร
  * สถานะ
  * เลข Invoice
  * วันที่ออก Invoice

---

## 4) สถานะงาน (Workflow)

ค่าที่อนุญาตเท่านั้น:

1. รอหลังบ้านตรวจสอบ (default)
2. รับเรื่องแล้ว
3. เปิดบิลแล้ว

**กติกาเปลี่ยนสถานะ**

* รอหลังบ้านตรวจสอบ → รับเรื่องแล้ว (โดย Back Office)
* รับเรื่องแล้ว → เปิดบิลแล้ว (โดย Back Office เมื่อกรอก invoice info)
* ห้าม Sales เปลี่ยนสถานะ

---

## 5) กฎธุรกิจ (Business Rules)

* คำขอทุกอันต้องมี: ลูกค้า, ใบเสนอราคา, ชื่อเซลล์, ยอดเงิน, ประเภทเอกสาร
* ยอดเงินต้องเป็น number และ > 0
* เมื่อสถานะเป็น “เปิดบิลแล้ว” ต้องมีเลข Invoice + วันที่ออก Invoice
* 1 คำขอ มี invoice record ได้สูงสุด 1 รายการ (one-to-one)
* Sales แก้ไขข้อมูลหลัง submit ไม่ได้ (ไม่มี UI และ API ต้องป้องกันไว้ด้วย)

---

## 6) โครงสร้างข้อมูล (Data Model / Database Schema)

### 6.1 ตาราง `customers`

* id (uuid, pk)
* companyName (text, required)
* taxId (text, nullable)
* address (text, nullable)
* createdAt, updatedAt (timestamptz)

### 6.2 ตาราง `quotation_requests`

* id (uuid, pk)
* quotationNo (text, required)
* customerId (uuid, fk -> customers.id, required)
* salesName (text, required)
* totalAmount (numeric/decimal, required)
* requestType (enum: `ใบกำกับภาษี` | `ใบเสร็จ` | `วางบิล`, required)
* note (text, nullable)
* status (enum: `รอหลังบ้านตรวจสอบ` | `รับเรื่องแล้ว` | `เปิดบิลแล้ว`, default)
* createdAt, updatedAt

### 6.3 ตาราง `invoice_records`

* id (uuid, pk)
* quotationRequestId (uuid, fk -> quotation_requests.id, unique, required)
* invoiceNo (text, required)
* invoiceDate (date, required)
* vatAmount (numeric/decimal, nullable)
* createdAt, updatedAt

> ถ้าจะทำแนบไฟล์:

* `attachments` (optional)

  * id
  * quotationRequestId
  * filePath (supabase storage path)
  * originalName
  * createdAt

---

## 7) หน้าจอ (Pages) + Routes

> ไม่มี login → ใช้เส้นทางชัดเจน

### Public/Sales

* `/` = หน้าฟอร์ม “บันทึกคำขอเปิดบิล”
* (optional) `/sales/success` = หน้าส่งสำเร็จ

### Back Office

* `/backoffice` = ตารางคิวงาน + ฟิลเตอร์ + ปุ่ม export
* `/backoffice/[id]` = หน้ารายละเอียดคำขอ + ปุ่มรับเรื่อง + ฟอร์มกรอก invoice

### Customers (ถ้าทำ)

* `/backoffice/customers` = รายชื่อลูกค้า + เพิ่มลูกค้า

### API (Next.js Route Handlers)

* `POST /api/requests` สร้างคำขอ (Sales)
* `GET /api/requests` list (Back Office) รองรับ query: status, from, to
* `GET /api/requests/:id` รายละเอียด
* `POST /api/requests/:id/ack` เปลี่ยนสถานะเป็น “รับเรื่องแล้ว”
* `POST /api/requests/:id/invoice` บันทึก invoice + เปลี่ยนสถานะ “เปิดบิลแล้ว”
* `GET /api/export` สร้างไฟล์ Excel ตาม status + from/to

---

## 8) ข้อกำหนดด้านเทคนิค (Implementation Requirements)

### 8.1 Stack

* Next.js (App Router)
* TypeScript
* React
* Tailwind CSS
* Supabase (Postgres)
* Drizzle ORM
* pnpm

### 8.2 การเชื่อมต่อฐานข้อมูล

* ใช้ Drizzle เชื่อม Postgres (Supabase)
* ใช้ environment variables:

  * `SUPABASE_URL`
  * `SUPABASE_ANON_KEY`
  * `DATABASE_URL` (สำหรับ drizzle)

### 8.3 Export Excel

* สร้างไฟล์ xlsx ใน server route (`/api/export`)
* ตั้ง response headers ให้ browser download
* รองรับการกรอง:

  * `status` required
  * `from` optional (YYYY-MM-DD)
  * `to` optional (YYYY-MM-DD)

### 8.4 Validation

* ฝั่ง API: validate input ทุกครั้ง (เช่น zod)
* ฝั่ง UI: validate เบื้องต้นก่อน submit
* ข้อความ error เป็นภาษาไทย

### 8.5 UI/UX

* เรียบง่าย ใช้ Tailwind
* ตารางอ่านง่าย
* ฟิลเตอร์อยู่ด้านบน
* ปุ่ม Export ชัดเจน
* รองรับภาษาไทยเต็ม (ฟอนต์ระบบได้)

---

## 9) Non-Functional Requirements (สำคัญแต่ไม่เยอะ)

* ข้อมูลต้องถูกต้องและตรวจย้อนหลังได้ (อย่างน้อย `createdAt/updatedAt`)
* ป้องกันข้อมูลเพี้ยนด้วย constraint:

  * invoice record one-to-one
  * required fields
* รองรับข้อมูลอย่างน้อย 10,000 records โดย list ใช้ pagination (ถ้าทำทันใน MVP)

  > ถ้า MVP เอาแค่ limit 200 + filter ก่อนก็ยังพอ

---

## 10) Prompt Template สำหรับสร้างโปรแกรม (คุณเอาไปวางได้เลย)

เอาอันนี้ไปใช้เป็น prompt หลัก (แก้ชื่อโปรเจกต์ได้):

* สร้างเว็บแอปภายในบริษัท ภาษาไทย 100% สำหรับ “บันทึกคำขอเปิดบิล”
* Stack: Next.js (App Router) + TypeScript + React + Tailwind CSS
* Database: Supabase Postgres ใช้ Drizzle ORM
* Package manager: pnpm
* ไม่ต้องมีระบบ Login
* มี 2 ส่วน:

  1. Sales หน้า `/` กรอกฟอร์มสร้างคำขอ: เลขที่ใบเสนอราคา, ลูกค้า(เลือกจาก master), ชื่อเซลล์, ยอดเงิน, ประเภทเอกสาร(ใบกำกับภาษี/ใบเสร็จ/วางบิล), หมายเหตุ
  2. Back Office หน้า `/backoffice` แสดงตารางคิวงานทั้งหมด พร้อม filter สถานะ + ช่วงวันที่ และลิงก์ไปหน้า `/backoffice/[id]`
* สถานะงาน: รอหลังบ้านตรวจสอบ (default) → รับเรื่องแล้ว → เปิดบิลแล้ว
* Sales แก้ไขหลัง submit ไม่ได้ (ไม่มี UI และ API ต้องไม่อนุญาต update)
* หน้า `/backoffice/[id]` มีปุ่ม “รับเรื่องแล้ว” และฟอร์มกรอกเลข Invoice, วันที่ออก Invoice, VAT เพื่อเปลี่ยนเป็น “เปิดบิลแล้ว” และบันทึก invoice record (one-to-one)
* ทำฟีเจอร์ Export Excel ที่ `/api/export` และปุ่มบนหน้า `/backoffice` โดยต้องเลือก “สถานะ” และเลือกช่วงวันที่ได้ (from/to optional) ส่งออกหัวตารางไทย: วันที่บันทึก, เลขใบเสนอราคา, ลูกค้า, เซลล์, ยอด, ประเภท, สถานะ, เลข Invoice, วันที่ออก Invoice
* สร้าง schema Drizzle สำหรับตาราง customers, quotation_requests, invoice_records พร้อม relations และ migrations
* สร้าง route handlers /api/requests, /api/requests/:id, /api/requests/:id/ack, /api/requests/:id/invoice, /api/export
* เพิ่ม seed ตัวอย่างลูกค้า 3 ราย
* UI ใช้ Tailwind เรียบง่าย พร้อมข้อความ error ไทย และหน้า success หลัง submit

---

ถ้าคุณอยากให้ผม “ปรับสเปคให้เข้ากับการ generate ของเครื่องมือนั้น” แบบให้โอกาสออกมาถูกที่สุด:
บอกผมเพิ่มแค่อย่างเดียวว่า **คุณต้องการให้ Back Office เพิ่มลูกค้าได้ในเว็บเลยไหม** (มี/ไม่มี) — ผมจะปรับ prompt ให้คมขึ้นอีกขั้นโดยไม่เพิ่ม scope เกินจำเป็น.
# --------- todo fix proccess sent notification---------