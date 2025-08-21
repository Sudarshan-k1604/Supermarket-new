# 🛒 SuperMarket Point of Sale (POS) & Inventory Management System

![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18.2.0-61DAFB?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-1.0-3ECF8E?logo=supabase)
![Vite](https://img.shields.io/badge/Vite-5.0-646CFF?logo=vite)

A modern, web-based Point of Sale (POS) and Inventory Management System built for supermarkets and retail stores. It features role-based access control, offline-first capabilities, and real-time inventory & sales management, powered by **React + Supabase**.

---

## 📋 Table of Contents

- [✨ Key Features](#-key-features)
- [🛠️ Tech Stack](#️-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🔐 Roles & Permissions](#-roles--permissions)
- [📸 Screenshots](#-screenshots)
- [📦 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)

---

## ✨ Key Features

-   **🔑 Role-Based Access Control:**
    -   **Admin:** Full control to manage users, view analytics, handle inventory, sales, and expenses.
    -   **Staff:** Perform sales operations, update inventory, and view a limited operational dashboard.
    -   **Customer:** Access a personal dashboard, view order history, and create new sales orders.
-   **📊 Comprehensive Admin Dashboard:**
    -   At-a-glance overview of revenue, costs, expenses, and net profit over the last 30 days.
    -   Access to downloadable reports and detailed business insights.
-   **👥 User Management:**
    -   Admins can easily search for users by phone number.
    -   Assign or revoke roles (Admin, Staff, Customer) with a single click.
-   **🛍️ Intuitive Point of Sale (POS):**
    -   Fast product lookup and dynamic cart management.
    -   Supports both **Cash** and **UPI** payments with QR code generation.
    -   Generates professional, downloadable PDF invoices.
-   **📦 Real-Time Inventory Management:**
    -   Add, update, and track stock levels, pricing, and availability.
    -   Inventory is automatically decremented and synced with every sale.
-   **📜 Detailed Sales History:**
    -   View all transactions, intelligently grouped by customer.
    -   Admins can see which employee made the sale.
-   **🌐 Offline-First Functionality:**
    -   Continue making sales even without an internet connection.
    -   Transactions are securely stored locally and automatically synced to the cloud once connectivity is restored.

---

## 🛠️ Tech Stack

-   **Frontend:** React, React Router, Vite
-   **UI Framework:** Tailwind CSS with shadcn/ui
-   **UI Components:** `Card`, `Dialog`, `Tabs`, `Button`, `Input`, `Badge`
-   **Icons:** Lucide React
-   **Backend & Database:** Supabase (PostgreSQL, Authentication, Realtime, Auto-Generated APIs)
-   **Utilities:**
    -   **TanStack Query (React Query):** For efficient server state management and caching.
    -   **React Context API:** For global authentication state.
    -   **jsPDF & jspdf-autotable:** For client-side PDF invoice generation.
    -   **qrcode.react:** For generating UPI payment QR codes.
    -   **date-fns:** For robust date formatting.

---

## 🚀 Getting Started

### ✅ Prerequisites

-   Node.js (v18.x or later)
-   npm or yarn
-   A [Supabase](https://supabase.com/) account and a new project created.

### 📥 Installation & Setup

1.  **Clone the repository:**
    ```sh
    git clone [https://github.com/varshanth-c/supermarket.git](https://github.com/varshanth-c/supermarket.git)
    cd supermarket
    ```

2.  **Install dependencies:**
    ```sh
    npm install
    ```

3.  **Configure Environment Variables:**
    -   Create a `.env.local` file in the project root.
    -   Add your Supabase Project URL and Anon Key:
        ```env
        VITE_SUPABASE_URL="YOUR_SUPABASE_URL"
        VITE_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
        ```

4.  **Set up Supabase Database Schema:**
    -   Navigate to the **SQL Editor** in your Supabase project dashboard.
    -   Run the necessary SQL scripts to create the tables: `profiles`, `inventory`, `sales`, and `expenses`. Ensure your `profiles` table includes an `is_staff` boolean column.

5.  **Start the development server:**
    ```sh
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## 🔐 Roles & Permissions

| Feature               | Admin | Staff | Customer |
| --------------------- | :---: | :---: | :------: |
| **Full Dashboard** |   ✅   |   ➖   |    ❌     |
| **Limited Dashboard** |   ✅   |   ✅   |    ✅     |
| **User Management** |   ✅   |   ❌   |    ❌     |
| **Inventory Mgmt** |   ✅   |   ✅   |    ❌     |
| **Point of Sale** |   ✅   |   ✅   |    ✅     |
| **Expenses Mgmt** |   ✅   |   ❌   |    ❌     |
| **Reports** |   ✅   |   ❌   |    ❌     |
| **Advanced Analytics**|   ✅   |   ❌   |    ❌     |

---

## 📸 Screenshots

*(Add your screenshots here when the UI is finalized)*

| Admin Dashboard                               | Point of Sale Interface                       |
| --------------------------------------------- | --------------------------------------------- |
| *[Placeholder for Admin Dashboard Screenshot]* | *[Placeholder for POS Interface Screenshot]* |

| Inventory Management                          | PDF Invoice Example                           |
| --------------------------------------------- | --------------------------------------------- |
| *[Placeholder for Inventory Page Screenshot]* | *[Placeholder for Invoice PDF Screenshot]* |

---

## 📦 Deployment

This project is optimized for deployment on modern hosting platforms like Vercel or Netlify.

1.  Push your code to a Git repository (GitHub, GitLab).
2.  Import the repository into your hosting provider.
3.  Configure the environment variables (`VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) in the project settings on the hosting platform.
4.  Deploy!

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](<your-repository-url>/issues).

1.  **Fork** the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a **Pull Request**

---

