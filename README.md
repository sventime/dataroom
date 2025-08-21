# Data Room: Test Assignment

👉 [Live Demo](https://harvery-dataroom.vercel.app/)

## Design Decisions

I focused on three main features of the Data Room:

1. Secure document upload and storage — only the owner can access their Data Room.  
2. File management similar to a standard file explorer (Mac/Windows).  
3. The ability to share the entire Data Room or specific folders with others.  

## UX

For authentication, I aimed for minimal friction. Users can sign in with **Google OAuth 2.0** or via **magic link email sign-in**. Accounts with the same email are automatically linked, so users can access their Data Room with either method. For email service, I used **Nodemailer** with Google’s SMTP server.  

The UI closely follows a file explorer experience. I added a few hotkeys to quickly manage the Data Room:  
- **New Folder (in current folder)**: `cmd+/`  
- **Upload Files (to current folder)**: `cmd+.`  
- **Search**: `cmd+K`  

Other UX features:  
- **Breadcrumbs** with dropdown actions: New Folder, Rename, Copy Share Link, Delete.  
- **File Table**:  
  - Double-click a folder → navigate into it.  
  - Double-click a file → open preview.  
  - Row actions include Preview, Download, Rename, Delete (for files), and Copy Share Link, Rename, Delete (for folders).  
  - Supports bulk edit.  
- **File Tree**: Works like Finder’s sidebar. Root is always the Data Room (email). Clicking a file opens and highlights it in the table.  
- **Drag & Drop**: Supports multiple files. Conflicts can be resolved via dialog. Max file size: **5MB**, format: **PDF only**.  
- **Navigation**: Breadcrumbs and URLs stay in sync; back/forward browser navigation works.  
- **Share Mode (Read-only)**: Visitors with a share link can browse, preview, and download files inside the shared folder, but cannot modify anything.  
- **Search**: Finds files and folders, shows their path, and navigates directly to the folder with the file preselected.  

## Auth & Security

Security is the most important feature of a Data Room.  

Authentication options:  
1. Magic link via email  
2. Login with Google/Apple  

I used **Prisma ORM** with **PostgreSQL** to store data. Each user has an isolated Data Room. Database stores:  
- Account info (for authentication)  
- Folder and file structure  
- Share link tokens  

Sharing security:  
- Share links are token-based, tied to `dataroomId` and folder ID.  
- File preview and access security rely on token length (resistant to brute force).  

[Schema](./prisma/schema.prod.prisma)  

## Deployment

👉 [Live Demo](https://harvery-dataroom.vercel.app/)

App is deployed on **Vercel** with:  
1. **Vercel Blob** (file storage)  
2. **Neon DB (Postgres)**  

## Look & Feel

I aimed to replicate the original Harvey look and feel. I downloaded the font, reused colors, and replicated the overall vibe. The UI is built with **Shadcn** components.  
