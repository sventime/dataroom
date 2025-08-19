# Data Room MVP - Folder Structure

```
src/
├── app/                                    # Next.js 13+ App Router
│   ├── globals.css                        # Global styles
│   ├── layout.tsx                         # Root layout
│   ├── page.tsx                           # Landing/Dashboard page
│   └── dataroom/
│       ├── page.tsx                       # Datarooms list page
│       ├── [id]/
│       │   ├── page.tsx                   # Individual dataroom view
│       │   └── folder/
│       │       └── [...path]/
│       │           └── page.tsx           # Deep folder navigation
│
├── components/                            # React Components
│   ├── ui/                               # Shadcn UI components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── dialog.tsx
│   │   ├── table.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── context-menu.tsx
│   │   └── ...
│   │
│   ├── dataroom/                         # Data Room specific components
│   │   ├── DataroomLayout.tsx           # Main 3-panel layout
│   │   ├── SearchBar.tsx                # Top search functionality
│   │   ├── FolderSidebar/               # Left sidebar components
│   │   │   ├── index.tsx
│   │   │   ├── FolderTree.tsx
│   │   │   ├── FolderNode.tsx
│   │   │   └── CreateFolderDialog.tsx
│   │   ├── FileTable/                   # Main content area
│   │   │   ├── index.tsx
│   │   │   ├── FileTableRow.tsx
│   │   │   ├── FileTableHeader.tsx
│   │   │   └── FileActions.tsx
│   │   ├── FilePreview/                 # File preview components
│   │   │   ├── index.tsx
│   │   │   ├── PDFPreview.tsx
│   │   │   └── FileMetadata.tsx
│   │   ├── FileUpload/                  # Upload functionality
│   │   │   ├── index.tsx
│   │   │   ├── DropZone.tsx
│   │   │   └── UploadProgress.tsx
│   │   └── Dialogs/                     # Modal dialogs
│   │       ├── CreateDataroomDialog.tsx
│   │       ├── RenameDialog.tsx
│   │       ├── DeleteConfirmDialog.tsx
│   │       └── ShareDialog.tsx
│   │
│   ├── common/                          # Reusable common components
│   │   ├── Loading.tsx
│   │   ├── ErrorBoundary.tsx
│   │   ├── Breadcrumbs.tsx
│   │   └── ContextMenu.tsx
│   │
│   └── forms/                           # Form-specific components
│       ├── CreateDataroomForm.tsx
│       ├── UploadFileForm.tsx
│       └── RenameForm.tsx
│
├── hooks/                               # Custom React hooks
│   ├── useDataroom.ts                  # Dataroom CRUD operations
│   ├── useFolder.ts                    # Folder operations
│   ├── useFile.ts                      # File operations  
│   ├── useSearch.ts                    # Search functionality
│   ├── useLocalStorage.ts              # Local storage persistence
│   └── useUpload.ts                    # File upload logic
│
├── lib/                                # Core utilities and configurations
│   ├── utils.ts                        # General utility functions
│   ├── validations.ts                  # Zod validation schemas
│   ├── constants.ts                    # App constants
│   └── mock-data.ts                    # Mock data for development
│
├── store/                              # State management
│   ├── dataroom-store.ts              # Zustand store for dataroom state
│   ├── file-store.ts                  # File management state
│   └── ui-store.ts                    # UI state (sidebar, modals, etc.)
│
├── types/                              # TypeScript definitions
│   ├── dataroom.ts                    # Dataroom related types
│   ├── file.ts                        # File and folder types
│   ├── user.ts                        # User types (future auth)
│   └── api.ts                         # API response types
│
├── utils/                              # Utility functions
│   ├── file-utils.ts                  # File handling utilities
│   ├── path-utils.ts                  # Path manipulation
│   ├── date-utils.ts                  # Date formatting
│   └── search-utils.ts                # Search/filter logic
│
└── data/                              # Mock data and persistence
    ├── mock-datarooms.json           # Sample dataroom data
    └── storage.ts                    # Browser storage abstraction
```

## Key Design Decisions:

### 1. **App Router Structure**
- Using Next.js 13+ App Router for modern routing
- Dynamic routes for datarooms and nested folder navigation
- Catch-all routes for deep folder structures

### 2. **Component Organization**
- **ui/**: Pure Shadcn components
- **dataroom/**: Feature-specific components  
- **common/**: Reusable across features
- **forms/**: Form-specific logic

### 3. **State Management**
- Zustand stores for different concerns
- Custom hooks for data operations
- Local storage for persistence

### 4. **Type Safety**
- Dedicated types folder for all TypeScript definitions
- Validation schemas with Zod

### 5. **Utility Organization**  
- Feature-specific utilities
- Mock data for development
- Storage abstraction for future backend integration

This structure supports:
- ✅ Nested folder creation and navigation
- ✅ File upload and management
- ✅ Search functionality
- ✅ CRUD operations
- ✅ Scalable component architecture
- ✅ Type safety throughout
- ✅ Easy testing and maintenance