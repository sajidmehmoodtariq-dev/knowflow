# KnowFlow

KnowFlow is an AI-assisted question routing platform for developers, students, and educators.  
It automatically detects the topic, language, or subject of a query, cleans up grammar, and routes it to the most suitable moderator, teacher, or subject expert. If no suitable person is found, the admin is notified to manually assign it.

---

## Features

### **User Flow**

- **Sign Up with Email & Password** using Nodemailer for backend email verification.
- **Instant Signup Confirmation** – user is redirected immediately while approval happens in the background.
- **OTP or Hyperlink Verification** – handled without blocking the user experience.
- **Submit Question / Ticket** – user enters a query and a short description (can have grammatical errors).
- **AI Processing**:
  - Detects language, framework, or academic subject.
  - Cleans up the description for clarity.
  - Assigns ticket to a relevant moderator/teacher/expert.
  - If no match, routes to admin.

### **Moderator / Teacher Features**

- See assigned tickets/questions.
- Respond with plain text.
- Share optional links:
  - **Streamable** video link.
  - Any file link (only stored as text in DB).
- No AI modification of responses.

### **Admin Panel**

- View all tickets/questions.
- Filter by:
  - Date
  - Assigned moderator/teacher
  - Status (pending / completed)
- Ticket counts and summary.
- Manually assign tickets/questions.
- Create new moderators/teachers.
- See AI suggestions for ticket processing status.

---

## Tech Stack

- **Next.js** – frontend & API routes
- **Tailwind CSS** – styling
- **shadcn/ui** – components
- **Inngest** – background jobs & workflows
- **Nodemailer** – email signup verification
- **OpenAI API** (or other LLM) – for:
  - Subject / stack detection
  - Grammar correction
  - Status analysis

---

## Architecture

1. **User Signup**
   - Instant frontend confirmation.
   - Background email verification via OTP or hyperlink.
   - Admin approval process after verification.

2. **Question / Ticket Submission**
   - User enters query & description.
   - AI detects topic and skill requirements.
   - AI cleans up description.
   - AI auto-assigns to matching expert.
   - If no match → admin notified.

3. **Handling**
   - Moderator/teacher responds with text and optional links.
   - No AI interference with responses.
   - Status tracked automatically.

4. **Admin Management**
   - Ticket filtering, counting, and assignment.
   - Expert management.

---

## Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/knowflow.git
cd knowflow

# Install dependencies
npm install

# Run in development
npm run dev

```
